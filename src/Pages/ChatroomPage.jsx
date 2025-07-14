// src/pages/ChatroomPage.jsx (Updated)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useChatroomStore } from '../stores/chatroomStore';
import { useMessageStore } from '../stores/messageStore';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

// Helper function to format timestamps
const formatTime = (timestamp) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ChatroomPage = () => {
  const { id: chatroomId } = useParams();
  const navigate = useNavigate();
  const { getChatroom } = useChatroomStore();
  const { addMessage, initializeChatroomMessages, fetchMessages, MESSAGES_PER_PAGE } = useMessageStore();
  
  const [inputMessage, setInputMessage] = useState('');
  const [displayMessages, setDisplayMessages] = useState([]); // Messages currently displayed in the UI
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);

  const chatroom = getChatroom(chatroomId);
  const chatEndRef = useRef(null);
  const loadMoreRef = useRef(null); // Reference for the infinite scroll trigger element
  const chatContainerRef = useRef(null); // Reference for the scrollable div
  const previousScrollHeightRef = useRef(0); // For maintaining scroll position after loading history

  // Fetch all messages from the store state (Reactively updated)
  const allStoredMessages = useMessageStore(state => state.messages[chatroomId] || []);

  // --- Initialization and Validation ---
  useEffect(() => {
    if (!chatroom) {
      navigate('/dashboard');
      toast.error('Chatroom not found.');
      return;
    }
    
    // Initialize messages if not done (e.g., first time visiting)
    initializeChatroomMessages(chatroomId);

    // Reset pagination and load initial messages when chatroomId changes
    setCurrentPage(1);
    setIsLoadingHistory(false);
    setHasMoreHistory(true);
    
  }, [chatroomId, chatroom, navigate, initializeChatroomMessages]);

  // --- Load Initial Messages and Handle Pagination ---
  const loadMessages = useCallback(async (page, initialLoad = false) => {
    if (isLoadingHistory || !hasMoreHistory) return;

    setIsLoadingHistory(true);
    
    // Check if we have loaded all available messages
    if (page * MESSAGES_PER_PAGE >= allStoredMessages.length && !initialLoad) {
      setHasMoreHistory(false);
      setIsLoadingHistory(false);
      return;
    }

    try {
      // Simulate fetching older messages
      const newMessages = await fetchMessages(chatroomId, page);

      if (newMessages.length === 0) {
        setHasMoreHistory(false);
      }
      
      setDisplayMessages(prevMessages => {
        // Prepend new messages to the display list (reverse infinite scroll)
        return [...newMessages, ...prevMessages];
      });

      // If this is the initial load, set `hasMoreHistory` based on initial message count
      if (initialLoad) {
        setHasMoreHistory(newMessages.length === MESSAGES_PER_PAGE);
      }
      
      setCurrentPage(page + 1);

    } catch (error) {
      console.error("Error loading chat history:", error);
      toast.error("Failed to load chat history.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreHistory, fetchMessages, chatroomId, allStoredMessages.length, MESSAGES_PER_PAGE]);
  
  // Initial load of messages when the component mounts or chatroom changes
  useEffect(() => {
    // Clear display messages and load page 1 when chatroom ID changes
    setDisplayMessages([]); 
    loadMessages(1, true); 
  }, [loadMessages]);

  // --- Auto-Scroll to Latest Message (Only if messages added at the bottom) ---
  useEffect(() => {
    // Only auto-scroll to the bottom if the new message count is greater 
    // than the previous (meaning a new message was added, not history loaded)
    const storedMessagesCount = allStoredMessages.length;
    if (storedMessagesCount > displayMessages.length && chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    
    // Update display messages to match the store state for reactive updates
    // We update the state here to reflect new messages added by the input or AI
    setDisplayMessages(allStoredMessages); 
  }, [allStoredMessages]);


  // --- Intersection Observer for Infinite Scroll ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If the loadMoreRef (top of the chat) is intersecting and we are not already loading
        if (entries[0].isIntersecting && !isLoadingHistory && hasMoreHistory) {
          // Store the current scroll height before loading more history
          if (chatContainerRef.current) {
            previousScrollHeightRef.current = chatContainerRef.current.scrollHeight;
          }
          loadMessages(currentPage);
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loadMessages, currentPage, isLoadingHistory, hasMoreHistory]);

  // --- Maintain Scroll Position after Loading History ---
  useEffect(() => {
    // When `displayMessages` updates due to loading history, adjust scroll position
    if (chatContainerRef.current && isLoadingHistory === false && previousScrollHeightRef.current > 0) {
      const currentScrollHeight = chatContainerRef.current.scrollHeight;
      const newScrollTop = currentScrollHeight - previousScrollHeightRef.current;
      chatContainerRef.current.scrollTop = newScrollTop;
      previousScrollHeightRef.current = 0; // Reset
    }
  }, [displayMessages, isLoadingHistory]);


  // --- Simulated AI Response and Throttling (Remains the same) ---
  const simulateAIResponse = useCallback(() => {
    setIsTyping(true);
    const thinkingDelay = Math.random() * 1500 + 1000;
    
    setTimeout(() => {
      setIsTyping(false);
      const aiMessage = {
        id: uuidv4(),
        text: "I received your message. How else can I assist you?",
        sender: 'Gemini',
        timestamp: Date.now(),
        type: 'text'
      };
      addMessage(chatroomId, aiMessage);
    }, thinkingDelay);
  }, [addMessage, chatroomId]);

  // --- Handle Message Sending (User) and Image Uploads (Remains the same) ---
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    const userMessage = {
      id: uuidv4(),
      text: inputMessage,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text',
    };
    addMessage(chatroomId, userMessage);
    setInputMessage('');
    setIsSending(false);
    simulateAIResponse();
  };

  const handleImageUpload = (e) => {
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
    e.target.value = null;
    simulateAIResponse();
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
        <div ref={loadMoreRef} className="py-2 text-center text-gray-500 dark:text-gray-400">
          {isLoadingHistory ? 'Loading history...' : hasMoreHistory && 'Scroll up to load older messages'}
          {!hasMoreHistory && 'End of chat history'}
        </div>

        {/* Display Messages */}
        {displayMessages.map((msg, index) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-xl p-4 rounded-xl shadow-md relative group 
                ${msg.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                }`}
            >
              {/* Message Content */}
              {msg.type === 'text' && <p>{msg.text}</p>}
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
            disabled={isTyping}
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