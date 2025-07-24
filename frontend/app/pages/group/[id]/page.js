"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import moment from "moment";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  UserMinus,
  UserPlus,
  LogOut,
  ShieldCheck, // 🛡️ add this
} from "lucide-react";


import Sidebar from "@/app/components/layout/Sidebar";

export default function GroupDescriptionPage() {
  const { id } = useParams();
  const router = useRouter();

  const [group, setGroup] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupPicture, setEditGroupPicture] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);


  useEffect(() => {
    (async () => {
      const [groupRes, userRes, friendsRes] = await Promise.all([
        fetch(`http://localhost:4000/messages/conversation/fetchGroupById/${id}`, {
          credentials: "include",
        }),
        fetch("http://localhost:4000/users/crud/fetchUserDetails", {
          credentials: "include",
        }),
        fetch("http://localhost:4000/friends/manage/getFriends", {
          credentials: "include",
        }),
      ]);

      if (!groupRes.ok) {
        toast.error("Group not found");
        return router.push("/");
      }

      const groupData = await groupRes.json();
      const userData = await userRes.json();
      const friendsData = await friendsRes.json();

      setGroup(groupData.group);
      setCurrentUser(userData.user);
      setFriends(friendsData.friends || []);
      setLoading(false);
    })();
  }, [id]);

  const isAdmin = group?.admins?.includes(currentUser?.uuid);

  const handleMakeAdmin = (uuid, username) => {
    toast((t) => (
      <div className="p-4">
        <p className="text-sm text-gray-800 dark:text-white font-medium">
          Make {username} the new admin?
        </p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch("http://localhost:4000/messages/conversation/makeAdmin", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    conversationId: group._id,
                    newAdminUuid: uuid,
                  }),
                });

                if (res.ok) {
                  toast.success(`${username} is now the admin.`);
                  setGroup((prev) => ({
                    ...prev,
                    admins: [uuid], // Update local group state
                  }));
                } else {
                  const err = await res.json();
                  toast.error(err.error || "Failed to make user admin.");
                }
              } catch (error) {
                console.error("Make admin error:", error);
                toast.error("An unexpected error occurred.");
              }
            }}
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded"
          >
            Confirm
          </button>
        </div>
      </div>
    ));
  };


  const handleDeleteGroup = () => {
    toast((t) => (
      <div className="p-4">
        <p className="text-sm text-gray-800 dark:text-white font-medium">Delete this group?</p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              const res = await fetch("http://localhost:4000/messages/conversation/deleteConversation", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId: group._id }),
              });

              if (res.ok) {
                toast.success("Group deleted.");
                router.push("/");
              } else {
                toast.error("Failed to delete group.");
              }
            }}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Leave
          </button>
        </div>
      </div>
    ));
  };

  // = async () => {
  //   if (!confirm("Are you sure you want to delete this group?")) return;

  //   const res = await fetch("http://localhost:4000/messages/conversation/deleteConversation", {
  //     method: "DELETE",
  //     credentials: "include",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ conversationId: group._id }),
  //   });

  //   if (res.ok) {
  //     toast.success("Group deleted.");
  //     router.push("/");
  //   } else {
  //     toast.error("Failed to delete group.");
  //   }
  // };

  const handleLeaveGroup = () => {
    toast((t) => (
      <div className="p-4">
        <p className="text-sm text-gray-800 dark:text-white font-medium">Leave this group?</p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch("http://localhost:4000/messages/conversation/leaveGroup", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ conversationId: group._id }),
                });

                if (res.ok) {
                  toast.success("You have left the group.");
                  router.push("/");
                } else {
                  const err = await res.json();
                  toast.error(err.error || "Failed to leave group.");
                }
              } catch (error) {
                console.error("Leave group error:", error);
                toast.error("An unexpected error occurred.");
              }
            }}
            className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded"
          >
            Leave
          </button>
        </div>
      </div>
    ));
  };

  const handleKick = (uuid, username) => {
    toast((t) => (
      <div className="p-4">
        <p className="text-sm text-gray-800 dark:text-white font-medium">
          Kick {username} from the group?
        </p>
        <div className="mt-3 flex justify-end gap-3">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch("http://localhost:4000/messages/conversation/kickMember", {
                  method: "POST",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    conversationId: group._id,
                    targetUuid: uuid,
                  }),
                });

                if (res.ok) {
                  toast.success(`${username} has been kicked from the group.`);

                  // Update local state
                  setGroup((prev) => ({
                    ...prev,
                    participants: prev.participants.filter((p) => p.uuid !== uuid),
                  }));
                } else {
                  const err = await res.json();
                  toast.error(err.error || "Failed to kick user.");
                }
              } catch (error) {
                console.error("Kick user error:", error);
                toast.error("An unexpected error occurred.");
              }
            }}
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
          >
            Kick
          </button>
        </div>
      </div>
    ));
  };


  const handleInvite = () => {
    toast("Invite functionality coming soon");
  };

  const handleGroupImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;

      // Show loading toast with spinner
      const toastId = toast.loading("Uploading group picture...");

      try {
        const res = await fetch("http://localhost:4000/messages/conversation/updateConversation", {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: group._id,
            groupPicture: base64Image,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setGroup((prev) => ({
            ...prev,
            groupPicture: data.conversation.groupPicture,
          }));
          toast.success("Group picture updated successfully", { id: toastId });
        } else {
          const err = await res.json();
          toast.error(err.error || "Failed to update picture.", { id: toastId });
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Unexpected error while uploading image", { id: toastId });
      }
    };

    reader.readAsDataURL(file); // Converts file to base64
  };



  const handleUpdateGroup = async () => {
    const body = {
      conversationId: group._id,
      groupName: editGroupName,
      description: editDescription,
    };

    // Only include groupPicture if it has a non-empty value
    if (editGroupPicture.trim() !== "") {
      body.groupPicture = editGroupPicture;
    }

    const res = await fetch("http://localhost:4000/messages/conversation/updateConversation", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      setGroup((prev) => ({
        ...prev,
        groupName: data.conversation.groupName,
        groupPicture: data.conversation.groupPicture,
        description: data.conversation.description,
      }));
      toast.success("Group updated successfully");
      setEditModalOpen(false);
      setIsEditingDescription(false);
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to update group.");
    }
  };



  if (loading) return <div className="p-6 text-gray-600 dark:text-gray-300">Loading...</div>;
  if (!group || !currentUser) return null;

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#111827]">
      <Sidebar friends={friends} />

      <main className="flex-1 ml-[280px] px-6 md:px-12 py-10 bg-white dark:bg-[#111827] overflow-auto">
        <button
          onClick={() => router.push("/")}
          className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Home
        </button>

        <div className="max-w-3xl mx-auto flex flex-col space-y-8">

          {/* Group Header */}
          <div className="w-full bg-gray-50 dark:bg-[#1f2937] p-6 rounded-xl shadow-lg relative">
            <div className="relative w-fit mx-auto">
              <img
                src={group.groupPicture || "/vercel.svg"}
                alt="group"
                className="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-md"
              />

              {isAdmin && (
                <>
                  <label htmlFor="group-image-upload" className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 p-1 rounded-full shadow-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <Pencil size={18} className="text-indigo-600" />
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    id="group-image-upload"
                    onChange={handleGroupImageChange}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div className="text-center mt-4">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{group.groupName}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Created {moment(group.createdAt).format("MMMM YYYY")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group.participants?.length} members
              </p>
            </div>
          </div>


          {/* Group Description */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">About This Group</h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditDescription(group.description || "");
                    setIsEditingDescription(true);
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:text-white"
                  placeholder="Enter group description"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingDescription(false)}
                    className="px-4 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateGroup}
                    className="px-4 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-line text-gray-800 dark:text-gray-200">
                {group.description || "No group description available."}
              </p>
            )}
          </div>


          {/* Participants */}
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-300 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">Participants</h2>
              <button
                onClick={handleInvite}
                className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
              >
                <UserPlus size={16} /> Invite
              </button>
            </div>
            <div className="space-y-3">
              {group.participants.map((p) => (
                <div
                  key={p.uuid}
                  // onClick={() => { router.push(`/pages/profile/${p.username}`) }}
                  className="flex hover:border-blue-500 hover:cursor-pointer justify-between items-center px-4 py-3 bg-white dark:bg-[#1f2937] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition duration-200"
                >
                  <div className="flex items-center gap-4" onClick={() => { router.push(`/pages/profile/${p.username}`) }}>
                    <img
                      src={p.profile_picture || "/circle-user.png"}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover border border-indigo-500"
                    />
                    <div className="flex flex-col" onClick={() => { router.push(`/pages/profile/${p.username}`) }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {p.username}
                        </span>
                        {group.admins?.includes(p.uuid) && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500 text-white font-semibold tracking-wide">
                            Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && p.uuid !== currentUser.uuid && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleMakeAdmin(p.uuid, p.username)}
                        className="text-indigo-600 hover:text-indigo-700 transition"
                        title="Make Admin"
                      >
                        <ShieldCheck size={20} />
                      </button>
                      <button
                        onClick={() => handleKick(p.uuid, p.username)}
                        className="text-red-500 hover:text-red-600 transition"
                        title="Kick User"
                      >
                        <UserMinus size={20} />
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
            {isAdmin ? (
              <button
                onClick={handleDeleteGroup}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                <Trash2 size={18} />
                Delete Group
              </button>
            ) : (
              <button
                onClick={handleLeaveGroup}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                <LogOut size={18} />
                Leave Group
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Group</h2>

            <input
              type="text"
              placeholder="Group Name"
              value={editGroupName}
              onChange={(e) => setEditGroupName(e.target.value)}
              className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:text-white"
            />

            <input
              type="text"
              placeholder="Group Picture URL"
              value={editGroupPicture}
              onChange={(e) => setEditGroupPicture(e.target.value)}
              className="w-full px-3 py-2 rounded border dark:bg-gray-900 dark:text-white"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateGroup}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
