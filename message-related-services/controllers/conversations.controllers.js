const { mysqlPool } = require('../db/connectDB');
const Conversation = require('../models/ConversationModel');

const Message = require('../models/MessageModel'); // Import the Message model

const updateConversation = async (req, res) => {
  const userUuid = req.user?.userUuid; 
  const { groupName, groupPicture, conversationId } = req.body;

  if (!userUuid || !conversationId) {
    return res.status(400).json({ error: 'Missing user or conversation ID.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ error: 'Only group conversations can be updated.' });
    }

    if (conversation.admin !== userUuid) {
      return res.status(403).json({ error: 'Only the group admin can update this conversation.' });
    }

    if (groupName !== undefined) {
      conversation.groupName = groupName;
    }

    if (groupPicture !== undefined) {
      conversation.groupPicture = groupPicture;
    }

    const updated = await conversation.save();

    return res.status(200).json({ message: 'Conversation updated successfully.', conversation: updated });
  } catch (err) {
    console.error('❌ Error updating conversation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteConversation = async (req, res) => {
  const userUuid = req.user?.userUuid;
  const { conversationId } = req.body;

  if (!userUuid || !conversationId) {
    return res.status(400).json({ error: 'Missing user or conversation ID.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const isParticipant = conversation.participants.includes(userUuid);

    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant of this conversation.' });
    }

    if (conversation.isGroup && conversation.admin !== userUuid) {
      return res.status(403).json({ error: 'Only the group admin can delete this conversation.' });
    }

    // ✅ Delete all messages related to this conversation
    await Message.deleteMany({ conversationId });

    // ✅ Delete the conversation itself
    await Conversation.deleteOne({ _id: conversationId });

    return res.status(200).json({ message: 'Conversation and messages deleted successfully.' });
  } catch (err) {
    console.error('❌ Error deleting conversation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const fetchUserConversations = async (req, res) => {
  const userUuid = req.user?.userUuid;

  if (!userUuid) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Step 1: Fetch all conversations where the user is a participant
    const conversations = await Conversation.find({
      participants: userUuid,
    }).sort({ updatedAt: -1 });

    // Step 2: Extract all unique UUIDs from all participants
    const allUuids = [...new Set(conversations.flatMap(c => c.participants))];

    // Step 3: Fetch usernames & profile pictures from MySQL
    const [rows] = await mysqlPool.execute(
      `SELECT uuid, username, profile_picture FROM users WHERE uuid IN (${allUuids.map(() => '?').join(',')})`,
      allUuids
    );

    // Step 4: Build a UUID -> user object map
    const uuidMap = {};
    rows.forEach(row => {
      uuidMap[row.uuid] = {
        username: row.username,
        profile_picture: row.profile_picture
      };
    });

    // Step 5: Populate the conversations with user data
    const populatedConversations = conversations.map(c => ({
      ...c.toObject(),
      participants: c.participants.map(uuid => ({
        uuid,
        username: uuidMap[uuid]?.username || 'Unknown',
        profile_picture: uuidMap[uuid]?.profile_picture || null
      }))
    }));

    return res.status(200).json({ conversations: populatedConversations });
  } catch (err) {
    console.error("❌ Error fetching conversations:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createConversation = async (req, res) => {
  const creatorUuid = req.user?.userUuid;
  const { participantUuids, isGroup = false, groupName = null, groupPicture = null } = req.body;

  if (!creatorUuid || !Array.isArray(participantUuids) || participantUuids.length === 0) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  const allParticipants = Array.from(new Set([...participantUuids, creatorUuid]));

  try {
    // For 1-on-1 chats: Check if conversation already exists
    if (!isGroup && allParticipants.length === 2) {
      const existing = await Conversation.findOne({
        isGroup: false,
        participants: { $all: allParticipants, $size: 2 },
      });

      if (existing) {
        return res.status(200).json({ conversation: existing, message: 'Conversation already exists.' });
      }
    }

    const conversation = new Conversation({
      participants: allParticipants,
      isGroup,
      admin: isGroup ? creatorUuid : null,
      groupName: isGroup ? groupName : null,
      groupPicture: isGroup ? groupPicture : null,
    });

    const saved = await conversation.save();

    return res.status(201).json({ conversation: saved });
  } catch (err) {
    console.error('❌ Error creating conversation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  fetchUserConversations,
  createConversation,
  deleteConversation,
  updateConversation
};
