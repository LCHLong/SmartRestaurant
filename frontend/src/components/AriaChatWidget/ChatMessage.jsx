/**
 * ChatMessage.jsx
 * Render 1 tin nhắn trong Aria chat:
 * - User message: bubble phải
 * - Assistant message: bubble trái + streaming cursor + mini card món
 */

import { useCart } from '../../contexts/CartContext';
import toast from 'react-hot-toast';

function formatPrice(price) {
  if (!price && price !== 0) return '';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
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
  const isUser = message.role === 'user';

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
      </div>
    </div>
  );
}
