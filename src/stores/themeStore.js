import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode:
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches,

      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
    }),
    {
      name: "gemini-theme-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
