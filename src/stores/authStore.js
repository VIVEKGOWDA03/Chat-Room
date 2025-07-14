import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (userData) =>
        set({
          isAuthenticated: true,
          user: userData,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
        }),

      simulateOtp: async (phoneNumber) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(`Simulating OTP sent to ${phoneNumber}`);
            resolve("123456");
          }, 1000);
        });
      },

      verifyOtp: async (enteredOtp, actualOtp) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            if (enteredOtp === actualOtp) {
              resolve(true);
            } else {
              reject(new Error("Invalid OTP"));
            }
          }, 500);
        });
      },
    }),
    {
      name: "gemini-auth-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
