// src/stores/chatroomStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; 

export const useChatroomStore = create(
  persist(
    (set, get) => ({
      // Dummy data for initial display
      chatrooms: [
        { id: uuidv4(), title: 'General Chat', createdAt: Date.now() - 3600000 },
        { id: uuidv4(), title: 'AI Research', createdAt: Date.now() - 7200000 },
      ],
      
      // Function to create a new chatroom
      createChatroom: (title) => {
        const newChatroom = {
          id: uuidv4(),
          title: title,
          createdAt: Date.now(),
        };
        // Add the new chatroom to the beginning of the array
        set((state) => ({ 
          chatrooms: [newChatroom, ...state.chatrooms]
        }));
        return newChatroom;
      },
      
      // Function to delete a chatroom
      deleteChatroom: (id) => {
        set((state) => ({
          chatrooms: state.chatrooms.filter((chatroom) => chatroom.id !== id),
        }));
      },
      
      // Function to get a specific chatroom
      getChatroom: (id) => {
        return get().chatrooms.find(chatroom => chatroom.id === id);
      },
    }),
    {
      name: 'gemini-chatrooms-storage', // Key for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);