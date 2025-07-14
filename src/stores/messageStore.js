// src/stores/messageStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

// We will store messages indexed by chatroom ID
export const useMessageStore = create(
  persist(
    (set, get) => ({
      // messages is an object where keys are chatroom IDs and values are arrays of messages
      messages: {}, 
      
      // Constants for pagination
      MESSAGES_PER_PAGE: 20,
      
      // Function to add a new message to a specific chatroom
      addMessage: (chatroomId, message) => {
        set((state) => {
          const updatedMessages = { ...state.messages };
          if (!updatedMessages[chatroomId]) {
            updatedMessages[chatroomId] = [];
          }
          // Add the new message to the end of the array
          updatedMessages[chatroomId] = [...updatedMessages[chatroomId], message];
          
          return { messages: updatedMessages };
        });
      },
      
      // Function to simulate fetching messages with pagination
      // This is a simplified simulation; in a real app, it would fetch from a backend
      fetchMessages: (chatroomId, page) => {
        const allMessages = get().messages[chatroomId] || [];
        const start = allMessages.length - (page * get().MESSAGES_PER_PAGE);
        const end = allMessages.length - ((page - 1) * get().MESSAGES_PER_PAGE);

        // Simulate a delay for fetching messages (e.g., 500ms)
        return new Promise(resolve => {
          setTimeout(() => {
            // Return messages in reverse order (oldest first) for infinite scroll display
            const paginatedMessages = allMessages.slice(Math.max(0, start), end).reverse(); 
            resolve(paginatedMessages);
          }, 500);
        });
      },

      // Helper function to initialize messages for a chatroom if it doesn't exist
      initializeChatroomMessages: (chatroomId) => {
        if (!get().messages[chatroomId]) {
          set((state) => ({
            messages: {
              ...state.messages,
              [chatroomId]: [
                // Initial welcome message for a new chatroom
                { id: uuidv4(), text: 'Hello! How can I help you today?', sender: 'Gemini', timestamp: Date.now(), type: 'text' }
              ]
            }
          }));
        }
      }
    }),
    {
      name: 'gemini-messages-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);