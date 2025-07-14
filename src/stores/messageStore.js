import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export const useMessageStore = create(
  persist(
    (set, get) => ({
      messages: {},
      MESSAGES_PER_PAGE: 20, 

      addMessage: (chatroomId, message) => {
        set((state) => {
          const updatedMessages = { ...state.messages };
          if (!updatedMessages[chatroomId]) {
            updatedMessages[chatroomId] = [];
          }
          updatedMessages[chatroomId] = [
            ...updatedMessages[chatroomId],
            message,
          ];
          return { messages: updatedMessages };
        });
      },

      fetchMessages: (chatroomId) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(get().messages[chatroomId] || []);
          }, 500);
        });
      },

      initializeChatroomMessages: (chatroomId) => {
        if (!get().messages[chatroomId]) {
          const initialMessages = [];
          for (let i = 0; i < 25; i++) {
            initialMessages.push({
              id: uuidv4(),
              text: `This is an older message ${i + 1}.`,
              sender: i % 2 === 0 ? "Gemini" : "user",
              timestamp: Date.now() - (25 - i) * 10000, // Older timestamps
            });
          }
          initialMessages.push({
            id: uuidv4(),
            text: "Hello! How can I help you today?",
            sender: "Gemini",
            timestamp: Date.now(),
          });

          set((state) => ({
            messages: {
              ...state.messages,
              [chatroomId]: initialMessages,
            },
          }));
        }
      },
    }),
    {
      name: "gemini-messages-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
