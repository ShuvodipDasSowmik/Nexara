import React, { useState, useEffect } from 'react';
import API from '../../API/axios';

const Sidebar = ({ chatHistories, currentChatId, onSelectChat, onNewChat, isCollapsed, onToggleSidebar }) => {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    API.get('/llm/chat/topics')
      .then(res => setTopics(res.data))
      .catch(err => {
        // Optionally handle error
      });
  }, []);

  // Use fetched topics or fallback to chatHistories prop if provided
  const chatList = topics.length > 0
    ? topics.map(t => ({
        id: t.ct_id,
        title: t.chat_topic,
        lastMessage: '',
        timestamp: '',
      }))
    : (chatHistories || []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-12' : 'w-64'
    }`}>
      {/* Sidebar Header */}
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-sm font-semibold text-gray-200">Chat History</h2>
          )}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-md hover:bg-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCollapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>
        
        {!isCollapsed && (
          <button
            onClick={onNewChat}
            className="w-full mt-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        )}
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto">
        {!isCollapsed ? (
          <div className="p-2 space-y-1">
            {chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                onMouseEnter={() => setHoveredChat(chat.id)}
                onMouseLeave={() => setHoveredChat(null)}
                className={`p-2 rounded-md cursor-pointer transition-colors relative group ${
                  currentChatId === chat.id 
                    ? 'bg-gray-700 border-l-2 border-blue-400' 
                    : 'hover:bg-gray-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {chat.lastMessage}
                    </p>
                    <span className="text-xs text-gray-500 mt-1 block">
                      {chat.timestamp ? formatTime(chat.timestamp) : ''}
                    </span>
                  </div>
                  
                  {hoveredChat === chat.id && (
                    <div className="flex space-x-1">
                      <button className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-white">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="p-1 rounded hover:bg-gray-600 text-gray-400 hover:text-red-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Collapsed view - just show dots or icons
          <div className="p-2 space-y-2">
            {chatList.slice(0, 5).map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                className={`w-8 h-8 rounded-md cursor-pointer transition-colors flex items-center justify-center ${
                  currentChatId === chat.id 
                    ? 'bg-gray-700 border border-blue-400' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                title={chat.title}
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
