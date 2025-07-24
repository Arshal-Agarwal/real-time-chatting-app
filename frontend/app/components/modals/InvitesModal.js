// app/components/modals/InvitesModal.js
"use client";
import { X } from "lucide-react";

export default function InvitesModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 max-w-md w-full relative border dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-600"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-center text-indigo-700 dark:text-indigo-300">
          Invites Coming Soon 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-4 text-center">
          This feature is under development.
        </p>
      </div>
    </div>
  );
}
