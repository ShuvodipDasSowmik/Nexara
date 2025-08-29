import React, { useState, useEffect } from 'react';
import API from '../../API/axios';
import SummaryModal from './SummaryModal'; // import the new modal

const Sidebar = ({ chatHistories, currentChatId, onSelectChat, onNewChat, isCollapsed, onToggleSidebar }) => {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [topics, setTopics] = useState([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryChatId, setSummaryChatId] = useState(null);
  const [summaryLength, setSummaryLength] = useState('moderate'); // default

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

  const openSummaryModal = (ct_id) => {
    setSummaryChatId(ct_id);
    setShowSummaryModal(true);
    setSummaryText('');
    setSummaryLength('moderate');
  };

  const handleSummarize = async () => {
    if (!summaryChatId) return;
    setIsSummarizing(true);
    setSummaryText('Loading summary...');
    try {
      const res = await API.get('/openai/summarize', { params: { ct_id: summaryChatId, length: summaryLength } });
      setSummaryText(res.data);
    } catch (err) {
      const errorMsg = err?.response?.data
        ? typeof err.response.data === 'string'
          ? err.response.data
          : (err.response.data.message || 'Failed to fetch summary.')
        : 'Failed to fetch summary.';
      setSummaryText(errorMsg);
    } finally {
      setIsSummarizing(false);
    }
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
            className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center"
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
            className="w-full mt-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 rounded-md text-sm transition-colors flex items-center gap-2 font-semibold"
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
                    <button
                      className="ml-2 p-2 rounded-md bg-blue-700 hover:bg-blue-800 text-white transition-colors flex items-center justify-center"
                      onClick={e => {
                        e.stopPropagation();
                        openSummaryModal(chat.id);
                      }}
                      title="Summarize with AI"
                      disabled={isSummarizing}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2M12 12v.01M12 16h.01M8 12h.01M16 12h.01M12 8v.01" />
                      </svg>
                    </button>
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
      {/* Summary Modal */}
      {showSummaryModal && (
        <SummaryModal
          show={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          summaryText={summaryText}
          isSummarizing={isSummarizing}
          summaryLength={summaryLength}
          setSummaryLength={setSummaryLength}
          handleSummarize={handleSummarize}
          setShowSummaryModal={setShowSummaryModal}
        />
      )}
    </div>
  );
};

export default Sidebar;
