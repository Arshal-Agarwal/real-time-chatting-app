const { mysqlPool } = require('../db/connectDB');
const Conversation = require('../models/ConversationModel');
const mongoose = require('mongoose')
const cloudinary = require('../config/cloudinary')
const Message = require('../models/MessageModel');

const updateConversation = async (req, res) => {
  const userUuid = req.user?.userUuid;
  const { groupName, groupPicture, conversationId, description } = req.body;

  if (!userUuid || !conversationId) {
    return res.status(400).json({ error: 'Missing user or conversation ID.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found.' });
    if (!conversation.isGroup) return res.status(400).json({ error: 'Only group conversations can be updated.' });
    if (conversation.admin !== userUuid) return res.status(403).json({ error: 'Only the group admin can update this conversation.' });

    // Only update group name if provided and not empty
    if (groupName !== undefined && groupName.trim() !== "") {
      conversation.groupName = groupName.trim();
    }

    // Only update description if provided (can be empty)
    if (description !== undefined) {
      conversation.description = description;
    }

    // Handle group picture
    if (groupPicture !== undefined) {
      if (groupPicture.startsWith('http')) {
        conversation.groupPicture = groupPicture;
      } else if (groupPicture.trim() !== "") {
        const uploadRes = await cloudinary.uploader.upload(groupPicture, {
          folder: 'chat-groups',
          public_id: `group_${conversationId}`,
        });
        conversation.groupPicture = uploadRes.secure_url;
      } else {
        return res.status(400).json({ error: "Invalid group picture." });
      }
    }

    // Fallbacks to satisfy schema pre-save hook
    if (!conversation.admin) conversation.admin = userUuid;
    if (!conversation.groupName) {
      return res.status(400).json({ error: "Group must have a valid name." });
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

    await Message.deleteMany({ conversationId });
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
    const conversations = await Conversation.find({
      participants: userUuid,
    }).sort({ updatedAt: -1 });

    const allUuids = [...new Set(conversations.flatMap(c => c.participants))];

    const [rows] = await mysqlPool.execute(
      `SELECT uuid, username, profile_picture FROM users WHERE uuid IN (${allUuids.map(() => '?').join(',')})`,
      allUuids
    );

    const uuidMap = {};
    rows.forEach(row => {
      uuidMap[row.uuid] = {
        username: row.username,
        profile_picture: row.profile_picture
      };
    });

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
  const { participantUuids, isGroup = false, groupName = null, groupPicture = null, description = null } = req.body;

  if (!creatorUuid || !Array.isArray(participantUuids) || participantUuids.length === 0) {
    return res.status(400).json({ error: 'Invalid input.' });
  }

  const allParticipants = Array.from(new Set([...participantUuids, creatorUuid]));

  try {
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
      description: isGroup ? description : null,
    });

    const saved = await conversation.save();

    return res.status(201).json({ conversation: saved });
  } catch (err) {
    console.error('❌ Error creating conversation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const fetchGroupById = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid group ID.' });
  }

  try {
    const group = await Conversation.findById(id);

    if (!group || !group.isGroup) {
      return res.status(404).json({ error: 'Group not found.' });
    }

    const participantUuids = group.participants;

    const [rows] = await mysqlPool.execute(
      `SELECT uuid, username, profile_picture FROM users WHERE uuid IN (${participantUuids.map(() => '?').join(',')})`,
      participantUuids
    );

    const uuidMap = {};
    rows.forEach(row => {
      uuidMap[row.uuid] = {
        username: row.username,
        profile_picture: row.profile_picture,
      };
    });

    const participants = participantUuids.map(uuid => ({
      uuid,
      username: uuidMap[uuid]?.username || 'Unknown',
      profile_picture: uuidMap[uuid]?.profile_picture || null,
    }));

    const groupInfo = {
      _id: group._id,
      groupName: group.groupName,
      groupPicture: group.groupPicture,
      description: group.description || '',
      createdAt: group.createdAt,
      participants,
      admins: [group.admin],
    };

    return res.status(200).json({ group: groupInfo });
  } catch (err) {
    console.error('❌ Error fetching group by ID:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const leaveGroup = async (req, res) => {
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

    if (!conversation.isGroup) {
      return res.status(400).json({ error: 'Not a group conversation.' });
    }

    const isParticipant = conversation.participants.includes(userUuid);
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not a participant of this group.' });
    }

    if (conversation.admin === userUuid) {
      return res.status(403).json({ error: 'Group admin cannot leave. Transfer admin or delete group.' });
    }

    conversation.participants = conversation.participants.filter(uuid => uuid !== userUuid);
    await conversation.save();

    return res.status(200).json({ message: 'Successfully left the group.' });
  } catch (err) {
    console.error('❌ Error leaving group:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const kickMember = async (req, res) => {
  const adminUuid = req.user?.userUuid;
  const { conversationId, targetUuid } = req.body;

  if (!adminUuid || !conversationId || !targetUuid) {
    return res.status(400).json({ error: 'Missing admin, conversation ID, or target UUID.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ error: 'Only group conversations allow kicking members.' });
    }

    if (conversation.admin !== adminUuid) {
      return res.status(403).json({ error: 'Only the group admin can kick members.' });
    }

    if (!conversation.participants.includes(targetUuid)) {
      return res.status(400).json({ error: 'Target user is not a participant of the group.' });
    }

    if (targetUuid === adminUuid) {
      return res.status(400).json({ error: 'Admin cannot kick themselves.' });
    }

    conversation.participants = conversation.participants.filter(uuid => uuid !== targetUuid);
    await conversation.save();

    return res.status(200).json({ message: 'User has been removed from the group.' });
  } catch (err) {
    console.error('❌ Error kicking member:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const makeAdmin = async (req, res) => {
  const currentAdminUuid = req.user?.userUuid;
  const { conversationId, newAdminUuid } = req.body;

  if (!currentAdminUuid || !conversationId || !newAdminUuid) {
    return res.status(400).json({ error: 'Missing data: conversationId or newAdminUuid.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({ error: 'Only group conversations allow admin change.' });
    }

    if (conversation.admin !== currentAdminUuid) {
      return res.status(403).json({ error: 'Only the current group admin can assign a new admin.' });
    }

    if (!conversation.participants.includes(newAdminUuid)) {
      return res.status(400).json({ error: 'The new admin must be a participant in the group.' });
    }

    conversation.admin = newAdminUuid;
    await conversation.save();

    return res.status(200).json({ message: 'Admin rights transferred.', newAdminUuid });
  } catch (err) {
    console.error('❌ Error making new admin:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  fetchUserConversations,
  createConversation,
  deleteConversation,
  updateConversation,
  fetchGroupById,
  leaveGroup,
  kickMember,
  makeAdmin
};