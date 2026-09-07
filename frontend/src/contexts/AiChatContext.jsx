/**
 * AiChatContext.jsx
 * Context quản lý toàn bộ state AI chat cho Aria:
 * - Session ID (UUID, persistent per browser tab)
 * - Socket.io listeners (ai_stream_token, ai_response, ai_error)
 * - Message history (display)
 * - sendMessage() — POST /api/ai/consult
 * - isOpen / toggle widget
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { useSocket } from './SocketContext';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';

// Dùng crypto.randomUUID() có sẵn trong browser thay vì import uuid
const uuidv4 = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);


const AiChatContext = createContext();

export const useAiChat = () => {
  const ctx = useContext(AiChatContext);
  if (!ctx) throw new Error('useAiChat must be used within AiChatProvider');
  return ctx;
};

export const AiChatProvider = ({ children }) => {
  const socket = useSocket();
  const { cart } = useCart();
  const { user } = useAuth();

  // ---- State ----
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { id, role, content, suggestedItems, isStreaming }
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [sessionId] = useState(() => {
    // Tái sử dụng session trong cùng tab nếu có
    const saved = sessionStorage.getItem('aria_session_id');
    if (saved) return saved;
    const newId = uuidv4();
    sessionStorage.setItem('aria_session_id', newId);
    return newId;
  });

  // Ref cho streaming message đang build
  const streamingMsgIdRef = useRef(null);

  // Lấy tableId từ localStorage (set sau khi scan QR)
  const getTableId = () =>
    localStorage.getItem('qr_table_number') ||
    localStorage.getItem('qr_table_id') ||
    'unknown';

  // ---- Socket listeners ----
  useEffect(() => {
    if (!socket) return;

    // Nhận từng token streaming
    const onToken = ({ sessionId: sid, token }) => {
      if (sid !== sessionId) return;

      setMessages(prev => {
        const streamingId = streamingMsgIdRef.current;
        if (!streamingId) {
          // Tạo message mới đang streaming
          const newId = uuidv4();
          streamingMsgIdRef.current = newId;
          return [
            ...prev,
            { id: newId, role: 'assistant', content: token, suggestedItems: [], isStreaming: true }
          ];
        }
        // Append token vào message đang streaming
        return prev.map(m =>
          m.id === streamingId
            ? { ...m, content: m.content + token }
            : m
        );
      });
    };

    // Nhận final response với suggestedItems
    const onResponse = ({ sessionId: sid, content, suggestedItems }) => {
      if (sid !== sessionId) return;
      setIsLoading(false);

      setMessages(prev => {
        const streamingId = streamingMsgIdRef.current;
        streamingMsgIdRef.current = null;

        if (streamingId) {
          // Cập nhật message streaming → done
          return prev.map(m =>
            m.id === streamingId
              ? { ...m, content, suggestedItems: suggestedItems || [], isStreaming: false }
              : m
          );
        }
        // Không có streaming — thêm message mới (fallback)
        return [
          ...prev,
          { id: uuidv4(), role: 'assistant', content, suggestedItems: suggestedItems || [], isStreaming: false }
        ];
      });

      // Badge unread nếu widget đang đóng
      if (!isOpen) setHasUnread(true);
    };

    // Nhận lỗi
    const onError = ({ sessionId: sid, message }) => {
      if (sid !== sessionId) return;
      setIsLoading(false);
      streamingMsgIdRef.current = null;

      setMessages(prev => [
        ...prev,
        {
          id: uuidv4(),
          role: 'assistant',
          content: message || 'Aria gặp sự cố. Vui lòng thử lại.',
          suggestedItems: [],
          isStreaming: false,
          isError: true
        }
      ]);
    };

    socket.on('ai_stream_token', onToken);
    socket.on('ai_response', onResponse);
    socket.on('ai_error', onError);

    // Join table room để nhận events AI
    const tableId = getTableId();
    if (tableId !== 'unknown') {
      socket.emit('join_room', `table_${tableId}`);
    }

    return () => {
      socket.off('ai_stream_token', onToken);
      socket.off('ai_response', onResponse);
      socket.off('ai_error', onError);
    };
  }, [socket, sessionId, isOpen]);

  // ---- Auto-greeting (sau 5 giây lần đầu vào trang) ----
  const hasGreeted = useRef(false);
  const triggerAutoGreet = useCallback(async () => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

    const tableNumber = getTableId();
    await sendMessage(`Xin chào! Tôi vừa ngồi vào bàn ${tableNumber}.`, { isAutoGreet: true });
  }, []); // eslint-disable-line

  // ---- sendMessage ----
  const sendMessage = useCallback(async (text, opts = {}) => {
    if (!text?.trim() || isLoading) return;

    const tableId = getTableId();

    // Thêm message của user vào history (trừ auto-greet ẩn)
    if (!opts.isAutoGreet) {
      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'user', content: text.trim(), suggestedItems: [], isStreaming: false }
      ]);
    }

    setIsLoading(true);
    streamingMsgIdRef.current = null;

    try {
      await api.post('/api/ai/consult', {
        tableId,
        sessionId,
        message: text.trim(),
        cartItems: cart.map(c => ({
          id: c.id,
          name: c.name,
          price: Number(c.price),
          quantity: c.quantity
        })),
        ...(user?.id && { userId: user.id })
      });
      // Kết quả trả về qua Socket.io (ai_stream_token / ai_response)
    } catch (err) {
      setIsLoading(false);
      const status = err?.response?.status;
      let errMsg = 'Không thể kết nối với Aria. Vui lòng thử lại.';
      if (status === 429) errMsg = 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng chờ 1 phút.';
      if (status === 400) errMsg = 'Tin nhắn không hợp lệ.';

      setMessages(prev => [
        ...prev,
        { id: uuidv4(), role: 'assistant', content: errMsg, suggestedItems: [], isStreaming: false, isError: true }
      ]);
    }
  }, [isLoading, cart, sessionId, user]);

  // ---- Toggle widget ----
  const openChat = useCallback(() => {
    setIsOpen(true);
    setHasUnread(false);
  }, []);

  const closeChat = useCallback(() => setIsOpen(false), []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => {
      if (!prev) setHasUnread(false);
      return !prev;
    });
  }, []);

  // ---- Clear session khi rời trang (cleanup) ----
  useEffect(() => {
    return () => {
      api.delete(`/api/ai/session/${sessionId}`).catch(() => {});
    };
  }, [sessionId]);

  return (
    <AiChatContext.Provider value={{
      isOpen,
      openChat,
      closeChat,
      toggleChat,
      messages,
      isLoading,
      hasUnread,
      sendMessage,
      triggerAutoGreet,
      sessionId,
    }}>
      {children}
    </AiChatContext.Provider>
  );
};
