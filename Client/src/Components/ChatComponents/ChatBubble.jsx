import React from 'react';
import MessageFormatter from './MessageFormatter';

const ChatBubble = ({ message, isUser, timestamp }) => {
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex ${isUser ? 'max-w-[75%]' : 'max-w-[85%]'} ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${
          isUser ? 'bg-blue-500' : 'bg-green-500'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`rounded-lg px-3 py-2 max-w-full break-words ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-sm' 
              : 'bg-gray-700 text-gray-100 rounded-bl-sm border border-gray-600 shadow-sm'
          }`}>
            <div className="text-sm leading-relaxed">
              <MessageFormatter text={message} isUser={isUser} />
            </div>
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <span className="text-xs text-gray-400 mt-1 px-1">
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;