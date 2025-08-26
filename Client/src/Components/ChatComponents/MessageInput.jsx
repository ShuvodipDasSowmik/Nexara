import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, isLoading, disabled }) => {
  const [message, setMessage] = useState('');
  const [contextAware, setContextAware] = useState(false); // new toggle state
  const textareaRef = useRef(null);

  const handleSend = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim(), contextAware); // pass contextAware flag
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div className="border-t border-gray-700 bg-gray-800/80 backdrop-blur-sm px-3 py-3">
      {/* Eye-catching Context-Aware switch (now above the input) */}
      <div className="max-w-4xl mx-auto mb-3 flex justify-center">
        <div
          role="switch"
          aria-pressed={contextAware}
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setContextAware(!contextAware); } }}
          onClick={() => setContextAware(!contextAware)}
          className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-pointer select-none transition-all duration-200 ${
            contextAware
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl ring-2 ring-blue-600/30'
              : 'bg-gray-700 text-gray-200'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">Context Aware</span>
            <span className="text-xs opacity-80">Use document context for smarter replies</span>
          </div>

          <div className="ml-3">
            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${contextAware ? 'bg-white/30' : 'bg-gray-600/80'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${contextAware ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* outer row: input area */}
      <div className="flex items-end space-x-2 max-w-4xl mx-auto">
        {/* Message Input (takes remaining width) */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={disabled || isLoading}
            className="w-full resize-none rounded-lg border border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed min-h-[40px] max-h-[100px]"
            rows={1}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading || disabled}
            className="absolute right-2 bottom-2 p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            aria-label="Send message"
          >
            {isLoading ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-400 text-center mt-1.5 max-w-4xl mx-auto">
        Press Enter to send, Shift + Enter for new line
      </div>
    </div>
  );
};

export default MessageInput;
