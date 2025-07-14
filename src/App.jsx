// src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { useAuthStore } from "./stores/authStore";
import { Toaster } from "react-hot-toast"; // Ensure Toaster is imported here or in LoginPage
import LoginPage from "./Pages/LoginPage";
import DashboardPage from "./Pages/DashboardPage";
import ChatroomPage from "./Pages/ChatroomPage";
import { useThemeStore } from "./stores/themeStore";
const PrivateRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  // Apply 'dark' class to the html element based on Zustand state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chatroom/:id"
          element={
            <PrivateRoute>
              <ChatroomPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
