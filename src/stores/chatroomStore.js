import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export const useChatroomStore = create(
  persist(
    (set, get) => ({
      chatrooms: [
        {
          id: uuidv4(),
          title: "General Chat",
          createdAt: Date.now() - 3600000,
        },
        { id: uuidv4(), title: "AI Research", createdAt: Date.now() - 7200000 },
      ],

      createChatroom: (title) => {
        const newChatroom = {
          id: uuidv4(),
          title: title,
          createdAt: Date.now(),
        };
        set((state) => ({
          chatrooms: [newChatroom, ...state.chatrooms],
        }));
        return newChatroom;
      },

      deleteChatroom: (id) => {
        set((state) => ({
          chatrooms: state.chatrooms.filter((chatroom) => chatroom.id !== id),
        }));
      },

      getChatroom: (id) => {
        return get().chatrooms.find((chatroom) => chatroom.id === id);
      },
    }),
    {
      name: "gemini-chatrooms-storage", 
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
