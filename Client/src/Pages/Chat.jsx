import React, { useState, useCallback, useEffect } from 'react';
import API from '../API/axios';
import ChatHistory from '../Components/ChatComponents/ChatHistory';
import MessageInput from '../Components/ChatComponents/MessageInput';
import Sidebar from '../Components/ChatComponents/Sidebar';
import { useParams, useNavigate } from 'react-router-dom';

const Chat = () => {
  const { ct_id } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(ct_id ? Number(ct_id) : 1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ctId, setCtId] = useState(ct_id ? Number(ct_id) : null);
  const [topics, setTopics] = useState([]);

  // Fetch chat topics for sidebar
  useEffect(() => {
    API.get('/llm/chat/topics')
      .then(res => setTopics(res.data))
      .catch(() => setTopics([]));
  }, []);

  // If ct_id param changes, update state and fetch history
  useEffect(() => {
    if (ct_id) {
      setCurrentChatId(Number(ct_id));
      setCtId(Number(ct_id));
      fetchChatHistory(Number(ct_id));
    }
    // eslint-disable-next-line
  }, [ct_id]);

  // Generate unique ID for messages
  const generateId = () => Date.now() + Math.random();

  // Fetch chat history for a given chat topic id
  const fetchChatHistory = async (chatTopicId) => {
    setIsLoading(true);
    try {
      const response = await API.get('/llm/chat/history', { params: { ct_id: chatTopicId.toString() } });
      const historyMessages = (response.data || []).map(item => [
        {
          id: `user-${item.ch_id}`,
          text: item.user_msg,
          isUser: true,
          timestamp: item.user_msg_time
            ? new Date(item.user_msg_time).toLocaleString()
            : '',
        },
        {
          id: `ai-${item.ch_id}`,
          text: item.api_response,
          isUser: false,
          timestamp: item.api_response_time
            ? new Date(item.api_response_time).toLocaleString()
            : '',
        }
      ]).flat();
      setMessages(historyMessages);
      setCtId(chatTopicId);
    } catch {
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to backend and get response
  const sendMessageToBackend = useCallback(async (userMessage, currentCtId, contextAware = false) => {
    setIsLoading(true);
    try {
      const endpoint = contextAware ? '/llm/context-aware-chat' : '/llm/chat';
      const response = await API.post(endpoint, {
        message: userMessage,
        ct_id: currentCtId
      });
      if (response.data.ct_id) {
        setCtId(response.data.ct_id);
        if (!ct_id || Number(ct_id) !== response.data.ct_id) {
          navigate(`/chat/${response.data.ct_id}`, { replace: true });
        }
      }
      // Update the user message timestamp if backend provides user_msg_time
      setMessages(prev => {
        const updated = [...prev];
        // Find the last user message without a timestamp and update it
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].isUser && !updated[i].timestamp && response.data.user_msg_time) {
            updated[i] = {
              ...updated[i],
              timestamp: response.data.user_msg_time
                ? new Date(response.data.user_msg_time).toLocaleString()
                : ''
            };
            break;
          }
        }
        // Add AI message with backend timestamp
        return [
          ...updated,
          {
            id: generateId(),
            text: response.data.message || response.data.response || 'No response from server',
            isUser: false,
            timestamp: response.data.api_response_time
              ? new Date(response.data.api_response_time).toLocaleString()
              : ''
          }
        ];
      });
    } catch {
      const errorMessage = {
        id: generateId(),
        text: 'Sorry, there was an error connecting to the server. Please try again.',
        isUser: false,
        timestamp: '',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, ct_id]);

  const handleSendMessage = useCallback(async (messageText, contextAware = false) => {
    const userMessage = {
      id: generateId(),
      text: messageText,
      isUser: true,
      timestamp: '', // Leave blank, will be set from backend response
    };
    setMessages(prev => [...prev, userMessage]);
    await sendMessageToBackend(messageText, ctId, contextAware);
  }, [sendMessageToBackend, ctId]);

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId);
    setCtId(chatId);
    navigate(`/chat/${chatId}`);
    // fetchChatHistory will be triggered by useEffect on ct_id change
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(Date.now());
    setCtId(null);
    navigate('/chat');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="chat-page flex h-screen max-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden fixed inset-0">
      {/* Sidebar */}
      <Sidebar
        chatHistories={topics.map(t => ({
          id: t.ct_id,
          title: t.chat_topic,
          lastMessage: '',
          timestamp: '',
        }))}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        isCollapsed={sidebarCollapsed}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 bg-gray-800/50 backdrop-blur-sm overflow-hidden max-h-screen">
        {/* Header */}
        <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-md font-semibold text-white">Nexara Chat</h1>
                <p className="text-xs text-gray-300">AI Assistant</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {messages.length > 0 && (
                <button
                  onClick={handleNewChat}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors duration-200"
                >
                  Clear Chat
                </button>
              )}
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-300">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0 h-full">
          <ChatHistory messages={messages} isLoading={isLoading} />

          {/* Input Area */}
          <div className="flex-shrink-0">
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              disabled={false}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="flex-shrink-0 bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 px-3 py-1">
          <div className="text-center text-xs text-gray-400 max-w-4xl mx-auto">
            Nexara AI Chat v1.0 - Powered by advanced AI technology
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Chat;