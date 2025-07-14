# Gemini Clone

A React application mimicking the core functionalities and user experience of the Gemini interface, including chatroom management, simulated AI interactions, and key UX features.

## Project Overview

This project is a single-page application (SPA) built using React. It simulates a chat interface where users can manage chat sessions, interact with a simulated AI, and upload images. All data (user authentication state, chatrooms, and messages) is managed client-side using Zustand and persisted in `localStorage`.

## Features

* **User Authentication:** Simulated phone number login via OTP.
* **Dashboard Management:**
    * Create, delete, and filter chatrooms.
    * User login status persistence.
* **Chat Interface:**
    * Display of user and simulated AI messages.
    * Text input and simulated image upload with previews.
    * AI "typing..." indicator and delayed responses.
    * Auto-scroll to the latest message.
    * Copy-to-clipboard functionality on chat messages.
* **User Experience (UX):**
    * Global Dark Mode toggle.
    * Simulated infinite scroll for loading older messages in a chatroom.
    * Responsive design using Tailwind CSS.
* **Data Handling:** Client-side state management using Zustand with `localStorage` persistence.

## Technologies Used

* **React 18+**
* **Vite:** Fast build tool and development server.
* **Tailwind CSS:** Utility-first CSS framework for styling and dark mode implementation.
* **Zustand:** Lightweight state management library.
* **React Router DOM:** For navigation.
* **React Hook Form & Zod:** For robust form validation.
* **React Hot Toast:** For notifications and alerts.
* **UUID:** For generating unique IDs for chatrooms and messages.

## Setup and Installation

### Prerequisites

* Node.js (LTS recommended)
* npm (or yarn/pnpm)

### Steps

1.  **Clone the repository:**

    ```bash
    git clone (https://github.com/VIVEKGOWDA03/Chat-Roomhttps://github.com/your-username/gemini-clone.git)
    cd gemini-clone
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

## Running the Project

1.  **Start the development server:**

    ```bash
    npm run dev
    ```

2.  The application will be accessible at `http://localhost:5173/` (or the port specified by Vite).

## Usage Notes

### Authentication

The login process uses simulated OTP verification:

* Enter any valid phone number format.
* The simulated OTP will be displayed in the toast notification (defaulting to `123456`).
* Enter the provided OTP to log in and access the dashboard.

### Simulated AI Responses

AI responses and typing indicators are simulated using client-side `setTimeout` functions for demonstration purposes.

## Deployment

The project can be deployed on static hosting providers such as Vercel, Netlify, or GitHub Pages. Since it is a client-side application, no specific backend configuration is required.

---