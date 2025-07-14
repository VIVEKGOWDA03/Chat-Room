// src/pages/ChatroomPage.jsx (Updated for UI and Scroll Fixes)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChatroomStore } from '../stores/chatroomStore';
import { useMessageStore } from '../stores/messageStore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


const GEMINI_API_KEY = "AIzaSyDsYO1ZUk1PI4lq3-4Wc7x5vn0S1Ew_9e4"; 
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const ChatroomPage = () => {
  const { id: chatroomId } = useParams();
  const navigate = useNavigate();
  const { getChatroom } = useChatroomStore();
  const { addMessage, initializeChatroomMessages, MESSAGES_PER_PAGE } = useMessageStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Indicates API call in progress
  const [isSending, setIsSending] = useState(false); // Indicates user message is being sent
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [loadedMessageCount, setLoadedMessageCount] = useState(MESSAGES_PER_PAGE); // How many messages to display from history
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const chatroom = getChatroom(chatroomId);
  const chatEndRef = useRef(null); // Ref for the very bottom of the chat
  const loadMoreRef = useRef(null); // Ref for the element that triggers loading more history
  const chatContainerRef = useRef(null); // Ref for the main scrollable chat div
  const previousScrollHeightRef = useRef(0); // To maintain scroll position when loading more history

  // Get all messages for the current chatroom from the store (reactive)
  const allStoredMessages = useMessageStore(state => state.messages[chatroomId] || []);

  // Derive the messages to display based on loadedMessageCount
  const messagesToDisplay = useMemo(() => {
    // Slice from the end to get the most recent 'loadedMessageCount' messages
    return allStoredMessages.slice(Math.max(0, allStoredMessages.length - loadedMessageCount));
  }, [allStoredMessages, loadedMessageCount]);

  // --- Initialization and Validation ---
  useEffect(() => {
    if (!chatroom) {
      navigate('/dashboard');
      toast.error('Chatroom not found.');
      return;
    }
    
    // Initialize messages for this chatroom in the store if it's new
    initializeChatroomMessages(chatroomId);

    // Reset pagination states when chatroomId changes
    setLoadedMessageCount(MESSAGES_PER_PAGE); // Start with the first page of messages
    setHasMoreHistory(true); // Assume there's more history initially
    setIsLoadingHistory(false); // Reset loading state
    
  }, [chatroomId, chatroom, navigate, initializeChatroomMessages, MESSAGES_PER_PAGE]);

  // --- Auto-Scroll to Latest Message (when new messages are added) ---
  useEffect(() => {
    // Only auto-scroll if a new message was added (total message count increased)
    // or if the user is already near the bottom (within a buffer)
    if (chatEndRef.current && chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px buffer

      // If the total number of messages has increased (new message added)
      // OR if the user is already near the bottom, then scroll to the end.
      if (allStoredMessages.length > messagesToDisplay.length || isAtBottom) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [allStoredMessages.length, messagesToDisplay.length]); // Trigger when total messages or displayed messages count changes


  // --- Load More History (Infinite Scroll Up) ---
  const loadMoreHistory = useCallback(async () => {
    if (isLoadingHistory || !hasMoreHistory || !chatContainerRef.current) {
      return;
    }

    setIsLoadingHistory(true);
    previousScrollHeightRef.current = chatContainerRef.current.scrollHeight; // Store current scroll height

    // Calculate the new total number of messages to load
    const newLoadedCount = loadedMessageCount + MESSAGES_PER_PAGE;
    
    // Simulate a network delay for fetching older messages
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update the loaded message count, capping it at the total available messages
    setLoadedMessageCount(Math.min(newLoadedCount, allStoredMessages.length));

    // Determine if there's still more history to load
    if (newLoadedCount >= allStoredMessages.length) {
      setHasMoreHistory(false);
    }
    
    setIsLoadingHistory(false);
  }, [isLoadingHistory, hasMoreHistory, loadedMessageCount, allStoredMessages.length, MESSAGES_PER_PAGE]);

  // --- Intersection Observer for Infinite Scroll Trigger ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the loadMoreRef (element at the top of chat) is intersecting
        // and we are not already loading history and there is more history to load
        if (entries[0].isIntersecting && !isLoadingHistory && hasMoreHistory) {
          loadMoreHistory();
        }
      },
      { threshold: 0.1 } // Trigger when 10% of the element is visible
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMoreHistory, isLoadingHistory, hasMoreHistory]);


  // --- Maintain Scroll Position after Loading History ---
  useEffect(() => {
    if (chatContainerRef.current && isLoadingHistory === false && previousScrollHeightRef.current > 0) {
      const currentScrollHeight = chatContainerRef.current.scrollHeight;
      const newScrollTop = currentScrollHeight - previousScrollHeightRef.current;
      chatContainerRef.current.scrollTop = newScrollTop;
      previousScrollHeightRef.current = 0; // Reset after adjustment
    }
  }, [messagesToDisplay, isLoadingHistory]); // Trigger when displayed messages change or loading finishes


  // --- Call Gemini API for Response ---
  const getGeminiResponse = useCallback(async (userPrompt) => {
    setIsTyping(true); // Show "Gemini is typing..."
    
    try {
      // Prepare chat history for Gemini API
      // Gemini API expects alternating 'user' and 'model' roles.
      // Filter out image messages for text-only API call for simplicity.
      // Include the latest user prompt in the history for context.
      const chatHistory = allStoredMessages
        .filter(msg => msg.type === 'text')
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        }));
      
      // Add the current user's message to the history for the API call context
      chatHistory.push({ role: 'user', parts: [{ text: userPrompt }] });

      const payload = { contents: chatHistory };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      let geminiText = "Could not get a response from Gemini.";
      if (result.candidates && result.candidates.length > 0 &&
          result.candidates[0].content && result.candidates[0].content.parts &&
          result.candidates[0].content.parts.length > 0) {
        geminiText = result.candidates[0].content.parts[0].text;
      }

      const aiMessage = {
        id: uuidv4(),
        text: geminiText,
        sender: 'Gemini',
        timestamp: Date.now(),
        type: 'text'
      };
      addMessage(chatroomId, aiMessage);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast.error(`Gemini API error: ${error.message}`);
      // Add a fallback message if API fails
      addMessage(chatroomId, {
        id: uuidv4(),
        text: "Sorry, I'm having trouble connecting to Gemini right now. Please try again later.",
        sender: 'Gemini',
        timestamp: Date.now(),
        type: 'text'
      });
    } finally {
      setIsTyping(false); // Hide "Gemini is typing..."
    }
  }, [addMessage, chatroomId, allStoredMessages]); // Depend on allStoredMessages to send full context


  // --- Handle Message Sending (User) ---
  const handleSendMessage = async (e) => { 
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const messageToSend = inputMessage.trim();

    // Create user message object
    const userMessage = {
      id: uuidv4(),
      text: messageToSend,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text',
    };

    // Add user message to the store first
    addMessage(chatroomId, userMessage);
    
    // Clear input
    setInputMessage('');
    setIsSending(false);

    // Now, call Gemini API for response with the user's message
    await getGeminiResponse(messageToSend); 
  };

  // --- Handle Image Uploads ---
  const handleImageUpload = async (e) => { 
    const file = e.target.files[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    
    const imageMessage = {
      id: uuidv4(),
      url: imageUrl,
      sender: 'user',
      timestamp: Date.now(),
      type: 'image',
    };

    addMessage(chatroomId, imageMessage);
    e.target.value = null; // Reset file input

    // For simplicity, Gemini API will respond with text even for image uploads.
    // Full image understanding would require converting image to base64 and sending it to API.
    await getGeminiResponse("User uploaded an image."); // Send a generic prompt for image upload
  };
  
  // --- Copy-to-Clipboard Feature ---
  const handleCopyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Message copied to clipboard!");
  }

  if (!chatroom) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
        <Link to="/dashboard" className="text-blue-500 hover:text-blue-700 mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold truncate">{chatroom.title}</h1>
      </header>
      
      {/* Chat Messages Area - Scrollable Container */}
      <div 
        className="flex-grow overflow-y-auto p-6 space-y-4" 
        style={{ display: 'flex', flexDirection: 'column' }}
        ref={chatContainerRef}
      >
        
        {/* Infinite Scroll Load Trigger (placed at the top) */}
        {hasMoreHistory && (
          <div ref={loadMoreRef} className="py-2 text-center text-gray-500 dark:text-gray-400">
            {isLoadingHistory ? 'Loading history...' : 'Scroll up to load older messages'}
          </div>
        )}
        {!hasMoreHistory && allStoredMessages.length > 0 && (
          <div className="py-2 text-center text-gray-500 dark:text-gray-400 text-sm">
            End of chat history
          </div>
        )}
        {allStoredMessages.length === 0 && (
          <div className="py-2 text-center text-gray-500 dark:text-gray-400 text-sm">
            Start your conversation with Gemini!
          </div>
        )}

        {/* Display Messages */}
        {messagesToDisplay.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xl p-4 rounded-xl shadow-md relative group 
                ${msg.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
            >
              {/* Message Content */}
              {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.text}</p>} {/* Added whitespace-pre-wrap */}
              {msg.type === 'image' && (
                <img 
                  src={msg.url} 
                  alt="Uploaded" 
                  className="max-w-full rounded-lg" 
                  style={{ maxHeight: '300px' }}
                />
              )}

              {/* Timestamp */}
              <div className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatTime(msg.timestamp)}
              </div>
              
              {/* Copy-to-Clipboard Button (only for text messages) */}
              {msg.type === 'text' && (
                <button
                  onClick={() => handleCopyMessage(msg.text)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Copy message"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 000 2h3a1 1 0 100-2H8z" />
                    <path d="M3 8a2 2 0 012-2h3.5a1 1 0 011 1v1.5H15a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1v-4H3a1 1 0 01-1-1V8z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
        
        {/* Gemini Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 p-4 rounded-xl rounded-bl-none max-w-sm shadow-md">
              <p className="text-gray-600 dark:text-gray-300 italic">Gemini is typing...</p>
            </div>
          </div>
        )}
        
        {/* Auto-scroll reference point */}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input and Image Upload Area */}
      <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
          
          {/* Image Upload Button */}
          <label htmlFor="image-upload" className="cursor-pointer text-gray-500 hover:text-blue-600 transition duration-150">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Message Input Field */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Message Gemini..."
            className="flex-grow px-4 py-3 rounded-full bg-gray-200 dark:bg-gray-700 border border-transparent focus:outline-none focus:border-blue-500 transition duration-200"
            disabled={isTyping || isSending} // Disable input while sending or typing
          />

          {/* Send Button */}
          <button
            type="submit"
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-200 disabled:bg-gray-500"
            disabled={!inputMessage.trim() || isTyping || isSending}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatroomPage;