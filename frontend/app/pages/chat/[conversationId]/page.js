"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import MessageBubble from "../../../components/MessageBubbles";
import { ArrowLeft } from "lucide-react";
import Sidebar from "@/app/components/layout/Sidebar";

let socket;

export default function ConversationPage() {
  const { conversationId } = useParams();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userUuid, setUserUuid] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const messagesEndRef = useRef(null);

  const router = useRouter();

  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    socket = io("http://localhost:5003", { withCredentials: true });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("http://localhost:4000/users/crud/fetchUserDetails", {
          credentials: "include",
        });
        const userData = await userRes.json();
        setUserUuid(userData.user.uuid);

        const convoRes = await fetch("http://localhost:4000/messages/conversation/fetchAllConversations", {
          credentials: "include",
        });
        const convoData = await convoRes.json();
        const thisConvo = convoData.conversations.find((c) => c._id === conversationId);
        setConversation(thisConvo);

        const msgRes = await fetch("http://localhost:4000/messages/msgs/fetchMessagesByConversationId", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ conversationId }),
        });
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);

        socket.emit("join_conversation", conversationId);
      } catch (err) {
        console.error("❌ Failed to load chat data:", err);
      }
    };

    if (conversationId) fetchData();
  }, [conversationId]);

  useEffect(() => {
    socket.on("receive_message", (message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("message_read", ({ messageId, readerUuid, readAt }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, read: true, readAt, readerUuid } : msg
        )
      );
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_read");
    };
  }, [conversationId]);

  useEffect(() => {
    if (!messages.length || !userUuid) return;
    const unread = messages.filter((m) => !m.read && m.senderUuid !== userUuid);
    unread.forEach((msg) => {
      socket.emit("mark_as_read", {
        messageId: msg._id,
        readerUuid: userUuid,
      });
    });
  }, [messages, userUuid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socket.emit("send_message", {
      conversationId,
      senderUuid: userUuid,
      text: newMessage.trim(),
    });
    setNewMessage("");
  };

  const getTitle = () => {
    if (!conversation) return "Loading...";
    if (conversation.isGroup) return conversation.groupName || "Unnamed Group";
    const other = conversation.participants.find((p) => p.uuid !== userUuid);
    return other?.username || "Unknown User";
  };

  const getImage = () => {
    if (!conversation) return "";
    if (conversation.isGroup) return conversation.groupPicture;
    const other = conversation.participants.find((p) => p.uuid !== userUuid);
    return other?.profile_picture;
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111827] transition-colors duration-200">
      {/* Header */}
      <header
        onClick={() => {
          if (!conversation) return;

          if (conversation.isGroup) {
            router.push(`/pages/group/${conversation._id}`);
          } else {
            const other = conversation.participants.find(p => p.uuid !== userUuid);
            if (other?.username) {
              router.push(`/pages/profile/${other.username}`);
            }
          }
        }}
        className="cursor-pointer sticky top-0 z-30 bg-white/80 dark:bg-[#1f2937]/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm flex items-center gap-4"
      >
        {/* Back Arrow - Prevents trigger of onClick above */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.back();
          }}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <ArrowLeft className="text-gray-700 dark:text-gray-200" size={20} />
        </button>

        

        <img
          src={getImage() || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
          alt="avatar"
          className="w-11 h-11 rounded-full object-cover border border-gray-300 dark:border-gray-600"
        />
        <div className="flex-1 overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {getTitle()}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {conversation?.isGroup
              ? `${conversation?.participants.length} members`
              : "Direct chat"}
          </p>
        </div>

        {/* Search Input stays as-is */}
        <div className="relative hidden sm:block">
          <input
            type="text"
            value={searchTerm}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages"
            className="pl-10 pr-4 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1f2937] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <svg
            className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
            />
          </svg>
        </div>
      </header>



      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-5 bg-gray-50 dark:bg-[#111827] space-y-4">
        {filteredMessages.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">No messages found.</p>
        ) : (
          filteredMessages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.senderUuid === userUuid}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Bar */}
      <footer className="sticky bottom-0 z-10 bg-white dark:bg-[#1f2937] border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-2 items-center">
        <input
          type="text"
          value={newMessage}
          placeholder="Type your message..."
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-[#111827] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <button
          onClick={handleSendMessage}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full transition shadow"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
