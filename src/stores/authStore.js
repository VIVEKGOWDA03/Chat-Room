// src/stores/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      
      login: (userData) => set({ 
        isAuthenticated: true, 
        user: userData 
      }),
      
      logout: () => set({ 
        isAuthenticated: false, 
        user: null 
      }),
      
      // Simulate sending OTP via setTimeout
      simulateOtp: async (phoneNumber) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            console.log(`Simulating OTP sent to ${phoneNumber}`);
            // Return a simulated OTP (e.g., '123456')
            resolve('123456'); 
          }, 1000);
        });
      },
      
      // Simulate OTP verification via setTimeout
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
      name: 'gemini-auth-storage', // unique name
      storage: createJSONStorage(() => localStorage),
    }
  )
);