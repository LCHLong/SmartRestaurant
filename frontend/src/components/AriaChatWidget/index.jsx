/**
 * AriaChatWidget/index.jsx
 * Floating bubble + slide-up chat panel cho AI Consultant "Aria"
 *
 * - Floating bubble góc dưới phải, glassmorphism style
 * - Slide-up animation khi mở
 * - Header: tên Aria + nút close
 * - Messages list (auto-scroll)
 * - Input bar + send button
 * - Badge unread khi đóng
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAiChat } from '../../contexts/AiChatContext';
import ChatMessage from './ChatMessage';

export default function AriaChatWidget({ autoGreetDelay = 5000 }) {
  const {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    messages,
    isLoading,
    hasUnread,
    sendMessage,
    triggerAutoGreet,
  } = useAiChat();

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const autoGreetTimer = useRef(null);

  // Auto-scroll khi có message mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Auto-greet sau N giây
  useEffect(() => {
    autoGreetTimer.current = setTimeout(() => {
      triggerAutoGreet();
    }, autoGreetDelay);

    return () => clearTimeout(autoGreetTimer.current);
  }, []); // eslint-disable-line

  // Focus input khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, isLoading, sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* ======= CHAT PANEL ======= */}
      <div
        className={`
          fixed bottom-24 right-4 z-50
          w-[360px] max-w-[calc(100vw-2rem)]
          flex flex-col
          bg-white/95 backdrop-blur-md
          border border-white/40
          rounded-2xl shadow-2xl
          transition-all duration-300 ease-out
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
          }
        `}
        style={{ height: '480px' }}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-pink-500 rounded-t-2xl">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shadow">
            🤖
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Aria</p>
            <p className="text-white/80 text-xs mt-0.5">Trợ lý tư vấn món ăn</p>
          </div>
          {/* Dot online */}
          <span className="w-2 h-2 rounded-full bg-green-300 shadow" />
          <button
            onClick={closeChat}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Đóng chat"
          >
            <span className="material-symbols-outlined text-xl">expand_more</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scroll-smooth">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 px-6">
              <span className="text-4xl mb-3">🍽️</span>
              <p className="text-sm font-medium text-gray-500">Xin chào! Aria đang chào bạn...</p>
              <p className="text-xs mt-1">Bạn muốn ăn gì hôm nay?</p>
            </div>
          )}

          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Loading indicator khi chờ server phản hồi */}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                A
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="px-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {['Gợi ý món hôm nay 🍜', 'Món không cay 🥗', 'Đồ uống ngon 🥤'].map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="flex-shrink-0 text-xs bg-orange-50 border border-orange-200 text-orange-600 rounded-full px-3 py-1.5 hover:bg-orange-100 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-100">
          <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-200 transition-all">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi cho Aria..."
              rows={1}
              disabled={isLoading}
              className="flex-1 text-sm bg-transparent resize-none outline-none text-gray-800 placeholder-gray-400 max-h-24 disabled:opacity-60"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white flex items-center justify-center transition-all active:scale-95"
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">send</span>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-1.5">Aria • AI Consultant</p>
        </div>
      </div>

      {/* ======= FLOATING BUBBLE ======= */}
      <button
        onClick={toggleChat}
        className={`
          fixed bottom-5 right-4 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-orange-500 to-pink-500
          text-white shadow-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-12' : 'rotate-0'}
        `}
        aria-label={isOpen ? 'Đóng Aria chat' : 'Mở Aria chat'}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-2xl">close</span>
        ) : (
          <span className="text-2xl select-none">🤖</span>
        )}

        {/* Badge unread */}
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}

        {/* Pulse ring khi idle */}
        {!isOpen && !hasUnread && (
          <span className="absolute inset-0 rounded-full bg-orange-400 opacity-30 animate-ping" />
        )}
      </button>
    </>
  );
}
