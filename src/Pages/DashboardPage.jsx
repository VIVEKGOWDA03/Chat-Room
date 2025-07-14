// src/pages/DashboardPage.jsx
import React, { useState, useMemo } from "react";
import { useAuthStore } from "../stores/authStore";
import { useChatroomStore } from "../stores/chatroomStore";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useThemeStore } from "../stores/themeStore";
import Switch from "../components/UI/Switch";

const DashboardPage = () => {
  const { user, logout } = useAuthStore();
  const { chatrooms, createChatroom, deleteChatroom } = useChatroomStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  // Form validation for creating a chatroom
  const chatroomSchema = z.object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(50, "Title is too long"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(chatroomSchema),
  });

  // Handle chatroom creation submission
  const handleCreateSubmit = (data) => {
    const newChatroom = createChatroom(data.title);
    toast.success(`Chatroom '${newChatroom.title}' created!`);
    setIsModalOpen(false);
    reset(); // Reset form fields after successful creation
  };

  // Handle chatroom deletion
  const handleDelete = (id, title) => {
    // Replaced window.confirm with a custom modal for better UX and consistency
    // For this example, we'll use a simple toast confirm, but a full modal would be better.
    toast(
      (t) => (
        <div className="flex flex-col items-center p-2">
          <p className="text-center mb-3">
            Are you sure you want to delete{" "}
            <span className="font-bold">"{title}"</span>?
          </p>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              onClick={() => {
                deleteChatroom(id);
                toast.success(`Chatroom '${title}' deleted.`);
                toast.dismiss(t.id);
              }}
            >
              Delete
            </button>
            <button
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
              onClick={() => toast.dismiss(t.id)}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    ); // Make toast persistent until user acts
  };

  // Filter chatrooms based on search term
  const filteredChatrooms = useMemo(() => {
    if (!searchTerm) {
      return chatrooms;
    }
    return chatrooms.filter((room) =>
      room.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chatrooms, searchTerm]);

  return (
    <div className="flex flex-col sm:flex-row min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Toaster />

      {/* Sidebar - Chatroom Navigation and User Actions */}
      {/* Added responsive widths (w-full on mobile, sm:w-64 on larger screens) */}
      <div className="w-full sm:w-64 bg-white dark:bg-gray-800 shadow-lg p-6 flex flex-col h-auto sm:h-screen overflow-y-auto">
        <div className="flex-grow">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-6">
            Gemini Clone
          </h1>

          <h2 className="text-lg font-semibold mb-4">Chatrooms</h2>

          {/* Button to open Create Chatroom Modal */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full mb-4 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
          >
            + Create New Chat
          </button>

          {/* Search bar for filtering chatrooms */}
          <input
            type="text"
            placeholder="Filter chatrooms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-6 px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Chatroom List */}
          {/* Adjusted height for better mobile scrolling within sidebar */}
          <ul className="space-y-3 max-h-60 sm:max-h-full overflow-y-auto pb-4">
            {filteredChatrooms.length > 0 ? (
              filteredChatrooms.map((room) => (
                <li
                  key={room.id}
                  className="group flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-600 transition duration-150"
                >
                  {/* Link to the chatroom page */}
                  <Link
                    to={`/chatroom/${room.id}`}
                    className="flex-grow truncate font-medium text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-50"
                  >
                    {room.title}
                  </Link>
                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(room.id, room.title);
                    }}
                    className="text-red-500 hover:text-red-700 ml-4 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity" // Always visible on mobile
                    aria-label={`Delete chatroom ${room.title}`}
                  >
                    {/* Delete Icon (Trash) */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </li>
              ))
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {searchTerm ? "No results found." : "No chatrooms created yet."}
              </p>
            )}
          </ul>
        </div>

        {/* User Info and Logout Section */}
        <div className="mt-8 border-t pt-4 border-gray-300 dark:border-gray-600">
          {/* Dark Mode Toggle */}

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDarkMode ?"Dark Mode":"Light Mode"}
            </span>
            {/* Use the custom Switch component here */}
            <Switch isOn={isDarkMode} toggle={toggleDarkMode} />
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Logged in as:{" "}
            <span className="font-semibold">{user?.phone || "User"}</span>
          </p>
          <button
            onClick={() => {
              logout();
              toast.success("Logged out successfully.");
            }}
            className="w-full py-2 px-4 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area (Default View) */}
      {/* Ensures main content takes full width on mobile */}
      <div className="flex-grow w-full p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            Welcome to Gemini Clone
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Select a chatroom from the sidebar or create a new one to begin.
          </p>
        </div>
      </div>

      {/* Create Chatroom Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
          {" "}
          {/* Added p-4 for mobile padding */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
              Create New Chatroom
            </h3>
            <form onSubmit={handleSubmit(handleCreateSubmit)}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Chatroom Title
                </label>
                <input
                  id="title"
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700"
                  {...register("title")}
                  placeholder="e.g., Project Discussion"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="py-2 px-4 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
