"use client";

import {
  LogOut,
  UserPlus,
  Users,
  MailOpen,
  Settings,
  Gift,
} from "lucide-react";
import FriendList from "../FriendsList";
import AddFriendModal from "../modals/AddFriendModal";
import FriendRequestsModal from "../modals/FriendRequestsModal";
import InvitesModal from "../modals/InvitesModal"; // 🆕 Import this modal
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Sidebar({ friends }) {
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showInvites, setShowInvites] = useState(false); // 🆕 Invites modal state

  const router = useRouter();

  const handleLogout = () => {
    fetch("http://localhost:4000/users/auth/logout", {
      method: "POST",
      credentials: "include",
    }).then(() => {
      localStorage.clear();
      router.push("/pages/auth/sign-in");
    });
  };

  return (
    <>
      <aside className="w-[280px] fixed inset-y-0 left-0 flex flex-col bg-gradient-to-b from-[#fdfcfb] to-[#e2d1c3] dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700 px-6 py-6 shadow-2xl dark:shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-[#6b5b95] to-[#feb47b] bg-clip-text text-transparent tracking-wide">
            ChatNearby
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
            title="Logout"
          >
            <LogOut
              className="text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              size={20}
            />
          </button>
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar mb-6">
          <h2 className="text-md font-semibold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Users size={20} /> Friends
          </h2>
          <div className="space-y-3">
            <FriendList friends={friends} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setShowAddFriend(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-green-400 to-teal-500 text-white hover:shadow-md transition"
          >
            <UserPlus size={18} />
            Add Friend
          </button>

          <button
            onClick={() => setShowRequests(true)}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg border border-teal-200 text-teal-700 bg-white dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-gray-800 transition"
          >
            <MailOpen size={18} />
            Friend Requests
          </button>

          <button
            onClick={() => setShowInvites(true)} // 🆕 Trigger invites modal
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-100 dark:bg-indigo-800 hover:bg-indigo-200 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-200 transition"
          >
            <Gift size={18} />
            Invites
          </button>

          <button
            onClick={() => router.push("/pages/settings")}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 transition"
          >
            <Settings size={18} />
            Settings
          </button>
        </div>
      </aside>

      {/* Modals */}
      {showAddFriend && <AddFriendModal onClose={() => setShowAddFriend(false)} />}
      {showRequests && <FriendRequestsModal onClose={() => setShowRequests(false)} />}
      {showInvites && <InvitesModal onClose={() => setShowInvites(false)} />} {/* 🆕 */}
    </>
  );
}
