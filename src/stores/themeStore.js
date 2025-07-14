// src/stores/themeStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      // Default to the user's system preference or 'light'
      isDarkMode: 
        window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
      
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
    }),
    {
      name: 'gemini-theme-storage', // key for localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);