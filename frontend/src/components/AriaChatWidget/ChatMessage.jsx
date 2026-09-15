/**
 * ChatMessage.jsx
 * Render 1 tin nhắn trong Aria chat:
 * - User message: bubble phải
 * - Assistant message: bubble trái + streaming cursor + mini card món
 */

import { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAiChat } from '../../contexts/AiChatContext';
import toast from 'react-hot-toast';

function formatPrice(price) {
  if (!price && price !== 0) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Trích xuất tên món từ định dạng markdown **[Tên món]**
function extractDishesFromMarkdown(text) {
  if (!text) return [];
  const matches = [...text.matchAll(/\*\*([^*]+)\*\*/g)];
  return matches
    .map(m => m[1].trim())
    .filter(name => !name.includes('Aria') && !name.includes('Lưu ý') && !name.includes('Bàn'));
}

// Mini card cho món được gợi ý
function SuggestedItemCard({ item, onAdd }) {
  return (
    <div className="flex items-center gap-2 bg-white/80 border border-orange-100 rounded-xl p-2 mt-2 shadow-sm">
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
        {item.description && (
          <p className="text-xs text-gray-500 truncate">{item.description}</p>
        )}
        <p className="text-xs font-bold text-orange-500 mt-0.5">{formatPrice(item.price)}</p>
      </div>
      <button
        onClick={() => onAdd(item)}
        className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white rounded-lg px-2 py-1.5 text-xs font-semibold transition-all duration-150 flex items-center gap-1"
        aria-label={`Thêm ${item.name} vào giỏ`}
      >
        <span className="material-symbols-outlined text-sm">add</span>
      </button>
    </div>
  );
}

// Render markdown-light: **bold** và dòng mới
function renderText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Render xuống dòng
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>
        {line}
        {j < part.split('\n').length - 1 && <br />}
      </span>
    ));
  });
}

export default function ChatMessage({ message }) {
  const { addToCart } = useCart();
  const { sendFeedback } = useAiChat();
  const [feedbackPending, setFeedbackPending] = useState(false);
  const isUser = message.role === 'user';

  const handleFeedback = async (feedbackType) => {
    if (feedbackPending || message.userFeedback) return;
    setFeedbackPending(true);

    const dislikedItems = message.suggestedItems?.length > 0
      ? message.suggestedItems.map(i => i.name)
      : extractDishesFromMarkdown(message.content);

    const contextIds = message.suggestedItems?.map(i => i.id) || [];

    if (sendFeedback) {
      await sendFeedback({
        messageId: message.id,
        answer: message.content,
        feedbackType,
        rejectedItems: feedbackType === 'thumbs_down' ? dislikedItems : [],
        contextIds
      });
    }

    setFeedbackPending(false);
    if (feedbackType === 'thumbs_up') {
      toast.success('Cảm ơn bạn đã đánh giá! 😊', { duration: 1500 });
    } else {
      toast('Aria đang tìm món khác phù hợp hơn với bạn... 🍜', { icon: '🔄', duration: 2500 });
    }
  };

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      description: item.description,
    });
    toast.success(`Đã thêm "${item.name}" vào giỏ! 🛒`, { duration: 2000 });
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="bg-orange-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-3">
      {/* Avatar Aria */}
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow">
        A
      </div>

      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div
          className={`bg-white border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[90%] shadow-sm ${
            message.isError ? 'border-red-200 bg-red-50' : 'border-gray-100'
          }`}
        >
          {/* Typing indicator khi chưa có content */}
          {message.isStreaming && !message.content ? (
            <div className="flex gap-1 py-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <p className="text-sm text-gray-800 leading-relaxed">
              {renderText(message.content)}
              {/* Con trỏ nhấp nháy khi đang stream */}
              {message.isStreaming && (
                <span className="inline-block w-0.5 h-4 bg-orange-400 ml-0.5 animate-pulse align-middle" />
              )}
            </p>
          )}
        </div>

        {/* Mini cards gợi ý món */}
        {!message.isStreaming && message.suggestedItems?.length > 0 && (
          <div className="mt-1 max-w-[90%]">
            {message.suggestedItems.map(item => (
              <SuggestedItemCard
                key={item.id}
                item={item}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Nút gọi nhân viên (human handoff) */}
        {message.content?.includes('🔔') && !message.isStreaming && (
          <button
            className="mt-2 flex items-center gap-1.5 text-xs text-orange-600 border border-orange-300 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors"
            onClick={() => toast('Nhân viên đang được thông báo! 🔔', { icon: '🛎️' })}
          >
            <span className="material-symbols-outlined text-sm">notifications</span>
            Gọi nhân viên bàn
          </button>
        )}

        {/* Thanh nút đánh giá Thumbs Up / Down (Bước 4.3 Kế Hoạch 05) */}
        {!message.isStreaming && !message.isError && message.id !== 'aria-welcome-msg' && (
          <div className="flex items-center gap-1.5 mt-2 ml-1">
            <span className="text-[10px] text-gray-400 font-medium">Gợi ý này có hữu ích?</span>
            <button
              onClick={() => handleFeedback('thumbs_up')}
              disabled={feedbackPending || !!message.userFeedback}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
                message.userFeedback === 'thumbs_up'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                  : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200'
              }`}
              title="Thích gợi ý này"
              aria-label="Thích gợi ý này"
            >
              <span>👍</span>
              {message.userFeedback === 'thumbs_up' ? (
                <span className="text-[10px] text-emerald-800 font-bold">Hài lòng</span>
              ) : null}
            </button>

            <button
              onClick={() => handleFeedback('thumbs_down')}
              disabled={feedbackPending || !!message.userFeedback}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95 ${
                message.userFeedback === 'thumbs_down'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                  : 'text-gray-500 hover:text-rose-700 hover:bg-rose-50 border border-gray-200'
              }`}
              title="Đổi món khác"
              aria-label="Đổi món khác"
            >
              <span>👎</span>
              {message.userFeedback === 'thumbs_down' ? (
                <span className="text-[10px] text-amber-900 font-bold">Đang tìm món khác...</span>
              ) : (
                <span className="text-[10px] font-medium text-gray-600">Đổi món</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
