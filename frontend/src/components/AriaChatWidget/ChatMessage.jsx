/**
 * ChatMessage.jsx
 * Render 1 tin nhắn trong Aria chat:
 * - User message: bubble phải
 * - Assistant message: bubble trái + streaming cursor + mini card món
 */

import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useAiChat } from '../../contexts/AiChatContext';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';
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

// Trích xuất món ăn từ văn bản phản hồi nếu suggestedItems bị rỗng (SPEC-MOD-02)
function extractDishesFromText(text) {
  if (!text) return [];

  let catalog = [];
  try {
    const raw = localStorage.getItem('cached_menu_catalog');
    if (raw) catalog = JSON.parse(raw);
  } catch (_) {}

  const items = [];
  const seenNames = new Set();

  // Pattern 1: [Tên món] · [Giá] hoặc **[Tên món]** · [Giá]
  const regex = /(?:gợi\s*ý\s+|thử\s+(?:thêm\s+)?|\*\*\[?)(.*?)(?:\]?\*\*|\s*)\s*[·•\-]\s*([\d\.,]+)\s*(?:đ|₫|vnd|vnđ)/gi;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let name = match[1]
      .replace(/^\*+|\*+$/g, '')
      .replace(/^\[+|\]+$/g, '')
      .replace(/^(dạ,?\s*)?(aria\s*xin\s*gợi\s*ý\s*|aria\s*gợi\s*ý\s*)/i, '')
      .trim();
    let priceStr = match[2].replace(/[,\.]/g, '');
    let price = parseInt(priceStr, 10);
    if (name && price > 0 && !name.toLowerCase().includes('aria') && !seenNames.has(name.toLowerCase())) {
      seenNames.add(name.toLowerCase());
      const found = catalog.find(c =>
        c.name && (c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()))
      );
      items.push({
        id: found?.id || `item-${name}`,
        name: found?.name || name,
        price: found?.price || price,
        image_url: found?.image_url || (Array.isArray(found?.images) ? found.images[0] : ''),
        description: found?.description || ''
      });
    }
  }

  // Pattern 2: Dạng **[Tên món]**
  if (items.length === 0) {
    const boldMatches = [...text.matchAll(/\*\*([^*]+)\*\*/g)];
    for (const m of boldMatches) {
      let name = m[1].replace(/^\[+|\]+$/g, '').trim();
      if (
        name &&
        !name.includes('Aria') &&
        !name.includes('Lưu ý') &&
        !name.includes('Bàn') &&
        !seenNames.has(name.toLowerCase())
      ) {
        const found = catalog.find(c =>
          c.name && (c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()))
        );
        if (found) {
          seenNames.add(name.toLowerCase());
          items.push({
            id: found.id,
            name: found.name,
            price: found.price || 0,
            image_url: found.image_url || (Array.isArray(found.images) ? found.images[0] : ''),
            description: found.description || ''
          });
        }
      }
    }
  }

  return items;
}

// Thẻ Món Ăn Tương Tác Trong Chat (Interactive Product Card - SPEC-MOD-02 & FR-CHAT-06)
function FoodCard({ item, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  const fallbackImg = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";

  const handleDecrease = (e) => {
    e.stopPropagation();
    setQuantity(prev => Math.max(1, prev - 1));
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    setQuantity(prev => prev + 1);
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd(item, quantity);
  };

  return (
    <div
      data-testid="interactive-product-card"
      data-food-card="true"
      className="food-card interactive-product-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/95 border border-orange-100 hover:border-orange-200 rounded-2xl p-3 mt-2 shadow-xs hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Ảnh chụp món ăn sắc nét */}
        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-orange-50 flex-shrink-0 border border-orange-100/60 shadow-2xs">
          <img
            src={(!imgError && item.image_url) ? item.image_url : fallbackImg}
            alt={item.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>

        {/* Thông tin món ăn: Tên in đậm & Giá tiền định dạng chuẩn VNĐ */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{item.name}</p>
          {item.description && (
            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>
          )}
          <p className="text-xs font-bold text-orange-600 mt-1">{formatPrice(item.price)}</p>
        </div>
      </div>

      {/* Bộ điều khiển số lượng Stepper [-] [1] [+] & Nút [+ Thêm vào giỏ] */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-orange-50">
        {/* Stepper [-] [1] [+] */}
        <div
          data-testid="quantity-stepper"
          className="flex items-center bg-orange-50/80 border border-orange-200 rounded-lg p-0.5 shadow-2xs"
        >
          <button
            type="button"
            data-testid="btn-decrease"
            onClick={handleDecrease}
            className="w-6 h-6 flex items-center justify-center rounded text-orange-700 hover:bg-white active:scale-95 text-xs font-bold transition-all cursor-pointer"
            aria-label="Giảm số lượng"
          >
            -
          </button>
          <span
            data-testid="quantity-value"
            className="w-7 text-center text-xs font-bold text-gray-800 select-none"
          >
            {quantity}
          </span>
          <button
            type="button"
            data-testid="btn-increase"
            onClick={handleIncrease}
            className="w-6 h-6 flex items-center justify-center rounded text-orange-700 hover:bg-white active:scale-95 text-xs font-bold transition-all cursor-pointer"
            aria-label="Tăng số lượng"
          >
            +
          </button>
        </div>

        {/* Nút bấm [+ Thêm vào giỏ] */}
        <button
          type="button"
          data-testid="add-to-cart-btn"
          onClick={handleAdd}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
          aria-label={`Thêm ${item.name} vào giỏ`}
        >
          <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
          <span>+ Thêm vào giỏ</span>
        </button>
      </div>
    </div>
  );
}

const SuggestedItemCard = FoodCard;

// Thẻ Giỏ Hàng Thu Nhỏ (Mini Cart Card) trực quan (SPEC-MOD-02)
function MiniCartCard({ cartAction }) {
  if (!cartAction) return null;

  const isAdd = cartAction.type === 'add_to_cart';
  const isView = cartAction.type === 'view_cart';
  const isRemove = cartAction.type === 'remove_from_cart';
  const items = cartAction.items || [];

  const title = isAdd
    ? 'Đã thêm vào giỏ hàng'
    : isRemove
    ? 'Đã bớt món khỏi giỏ'
    : 'Giỏ hàng của bạn';

  const badgeColor = isAdd
    ? 'bg-emerald-100 text-emerald-800'
    : isRemove
    ? 'bg-rose-100 text-rose-800'
    : 'bg-orange-100 text-orange-800';

  const icon = isAdd ? 'shopping_bag' : isRemove ? 'remove_shopping_cart' : 'shopping_cart';

  return (
    <div
      data-testid="mini-cart-card"
      className="mini-cart-card mt-2.5 bg-gradient-to-br from-emerald-50 via-white to-green-50 border border-emerald-200 rounded-2xl p-3 shadow-xs max-w-[95%]"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-100">
        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
          <span className="material-symbols-outlined text-sm text-emerald-600">{icon}</span>
          {title}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${badgeColor}`}>
          {items.length} món
        </span>
      </div>

      {items.length > 0 ? (
        <div className="space-y-1.5 mb-2.5">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 text-xs bg-white/80 p-2 rounded-lg border border-emerald-100">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">
                  <span className="text-emerald-700 font-bold mr-1">{it.quantity || 1}x</span>
                  {it.name}
                </p>
                {it.modifiers && it.modifiers.length > 0 && (
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">
                    {it.modifiers.map(m => m.name).join(', ')}
                  </p>
                )}
                {it.notes && (
                  <p className="text-[10px] text-amber-600 italic truncate mt-0.5">
                    Ghi chú: {it.notes}
                  </p>
                )}
              </div>
              {it.price ? (
                <span className="font-bold text-emerald-700 shrink-0">
                  {formatPrice(Number(it.price) * (it.quantity || 1))}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 py-1 text-center">Giỏ hàng đang trống</p>
      )}

      {cartAction.total ? (
        <div className="flex items-center justify-between text-xs font-bold text-gray-800 pt-1 border-t border-emerald-100 mb-2">
          <span>Tổng tạm tính:</span>
          <span className="text-emerald-600 text-sm">{formatPrice(cartAction.total)}</span>
        </div>
      ) : null}

      <a
        href="/cart"
        className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
      >
        <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>
        <span>Mở Giỏ Hàng & Đặt Món</span>
      </a>
    </div>
  );
}

// Card xác nhận đặt bàn trực quan cho khách
function BookingConfirmationCard({ reservation }) {
  const [copied, setCopied] = useState(false);
  if (!reservation) return null;

  const rawCode = reservation.booking_code || '';
  const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

  const copyCode = () => {
    navigator.clipboard?.writeText(rawCode);
    setCopied(true);
    toast.success('Đã sao chép mã đặt bàn!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    window.location.href = `/reservations/lookup?code=${encodeURIComponent(rawCode)}`;
  };

  const handleCancel = () => {
    window.location.href = `/reservations/lookup?code=${encodeURIComponent(rawCode)}&action=cancel`;
  };

  return (
    <div
      data-testid="booking-card"
      className="booking-card reservation-card mt-2.5 bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-orange-200 rounded-2xl p-3.5 shadow-sm max-w-[95%]"
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-orange-100">
        <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
          Đặt bàn thành công
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase">
          {reservation.status === 'confirmed' ? 'Đã xác nhận giữ chỗ ✓' : (reservation.status || 'Chờ xác nhận')}
        </span>
      </div>

      <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-orange-100 mb-2.5">
        <div>
          <div className="text-[10px] text-gray-500 font-medium">Mã đặt bàn</div>
          <div className="text-base font-extrabold text-orange-600 tracking-wide">
            {displayCode}
          </div>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold rounded-lg transition-colors cursor-pointer"
          title="Sao chép mã"
        >
          <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
          <span>{copied ? 'Đã chép' : 'Chép mã'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-orange-500">calendar_month</span>
          <span>{reservation.reservation_date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-orange-500">schedule</span>
          <span>{reservation.reservation_time}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm text-orange-500">group</span>
          <span>{reservation.guest_count} khách</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <span className="material-symbols-outlined text-sm text-orange-500">person</span>
          <span className="truncate">{reservation.customer_name}</span>
        </div>
      </div>

      {reservation.requires_deposit && (
        <div className="mt-2 text-[11px] bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-2 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-sm text-amber-600 shrink-0">info</span>
          <span>
            Nhóm ≥ 6 người: Cọc <strong>{Number(reservation.deposit_amount).toLocaleString('vi-VN')}đ</strong>. Nhân viên sẽ liên hệ để xác nhận giữ chỗ.
          </span>
        </div>
      )}

      {/* Thao tác nhanh: Chỉnh sửa thông tin & Hủy giữ chỗ */}
      <div className="mt-3 pt-2.5 border-t border-orange-100 flex items-center justify-between gap-2">
        <button
          onClick={handleEdit}
          className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Chỉnh sửa thông tin đặt bàn"
        >
          <span className="material-symbols-outlined text-xs">edit</span>
          <span>Chỉnh sửa thông tin</span>
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
          title="Hủy giữ chỗ"
        >
          <span className="material-symbols-outlined text-xs">cancel</span>
          <span>Hủy giữ chỗ</span>
        </button>
      </div>
    </div>
  );
}

// Khay Gọi Nhân Viên Bàn & Chọn Nhanh Lý Do (SPEC-MOD-05: TC-SUP-06..08)
function CallStaffCard({ message }) {
  const socket = useSocket();
  const [cooldown, setCooldown] = useState(() => {
    try {
      const saved = sessionStorage.getItem('staff_call_cooldown');
      if (saved) {
        const remaining = Math.ceil((parseInt(saved, 10) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
    } catch (_) {}
    return 0;
  });

  const [showReasons, setShowReasons] = useState(() => cooldown > 0);
  const [selectedReason, setSelectedReason] = useState(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          try {
            sessionStorage.removeItem('staff_call_cooldown');
          } catch (_) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const triggerCallStaff = (reason = 'Gọi nhân viên bàn') => {
    if (cooldown > 0) {
      toast(`Vui lòng đợi ${cooldown}s trước khi gửi yêu cầu tiếp theo! ⏳`, { id: 'call-staff-cooldown' });
      return;
    }

    // 1. Kích hoạt bộ đếm ngược Cooldown 45s (SPEC-MOD-05 / FR-CHAT-15)
    const targetTime = Date.now() + 45 * 1000;
    try {
      sessionStorage.setItem('staff_call_cooldown', targetTime.toString());
    } catch (_) {}
    setCooldown(45);

    // 2. Mở khay chọn nhanh lý do (SPEC-MOD-05 / FR-CHAT-14)
    setShowReasons(true);
    setSelectedReason(reason !== 'Gọi nhân viên bàn' ? reason : null);

    // 3. Hiển thị Toast thông báo chuẩn theo kỳ vọng (SPEC-MOD-05 / FR-CHAT-13)
    toast.success('Đã gửi tín hiệu tới nhân viên phụ trách bàn của bạn!', {
      id: 'call-staff-toast',
      duration: 4000
    });

    // 4. Phát tín hiệu qua Socket & API
    const tableId = localStorage.getItem('qr_table_number') || localStorage.getItem('qr_table_id') || 'T01';
    if (socket) {
      socket.emit('call_staff', {
        tableId,
        reason,
        timestamp: new Date().toISOString()
      });
    }

    api.post('/api/ai/call-staff', { tableId, reason }).catch(() => {});
  };

  const handleReasonClick = (reasonLabel) => {
    setSelectedReason(reasonLabel);
    toast.success('Đã gửi tín hiệu tới nhân viên phụ trách bàn của bạn!', {
      id: 'call-staff-toast',
      duration: 4000
    });

    const tableId = localStorage.getItem('qr_table_number') || localStorage.getItem('qr_table_id') || 'T01';
    if (socket) {
      socket.emit('call_staff', {
        tableId,
        reason: reasonLabel,
        timestamp: new Date().toISOString()
      });
    }

    api.post('/api/ai/call-staff', { tableId, reason: reasonLabel }).catch(() => {});
  };

  const isTrayOpen = showReasons || cooldown > 0;

  const reasons = [
    { id: 'ice', label: 'Xin đá', icon: 'ac_unit' },
    { id: 'dishes', label: 'Chén đĩa', icon: 'restaurant' },
    { id: 'payment', label: 'Thanh toán', icon: 'receipt_long' },
    { id: 'more_ice', label: 'Xin thêm đá', icon: 'local_drink' }
  ];

  return (
    <div
      data-testid="call-staff-container"
      className="relative z-20 pointer-events-auto mt-2.5 bg-gradient-to-br from-rose-50/90 via-white to-amber-50/80 border border-rose-200 rounded-2xl p-3 shadow-xs max-w-[95%]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
          <span className="material-symbols-outlined text-sm text-rose-600">room_service</span>
          <span>Hỗ Trợ Tại Bàn (SPEC-MOD-05)</span>
        </div>
        {cooldown > 0 ? (
          <span
            data-testid="cooldown-timer"
            className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse"
          >
            Đợi {cooldown}s
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Sẵn sàng hỗ trợ
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {/* Nút bấm Gọi nhân viên bàn (FR-CHAT-13) */}
        <button
          type="button"
          data-testid="call-staff-btn"
          onClick={() => triggerCallStaff('Gọi nhân viên bàn')}
          disabled={cooldown > 0}
          className={`call-staff-btn relative z-20 pointer-events-auto w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer select-none active:scale-95 ${
            cooldown > 0
              ? 'bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed opacity-80'
              : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white border border-rose-400'
          }`}
          aria-label="Gọi nhân viên bàn"
        >
          <span className="text-sm">🛎️</span>
          <span>
            {cooldown > 0 ? `🛎️ Gọi nhân viên bàn (${cooldown}s)` : '🛎️ Gọi nhân viên bàn'}
          </span>
        </button>

        {/* Khay chọn nhanh lý do (Quick Reason Tags - FR-CHAT-14) */}
        {isTrayOpen && (
          <div
            data-testid="quick-reason-tags-tray"
            className="mt-1 pt-2 border-t border-rose-100 animate-fadeIn"
          >
            <p className="text-[11px] font-semibold text-gray-600 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-orange-500">label</span>
                <span>Chọn nhanh lý do cần phục vụ:</span>
              </span>
              {cooldown > 0 && (
                <span className="text-[10px] text-amber-600 font-medium">
                  Đang đếm ngược ({cooldown}s)
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  data-testid={`tag-${r.id}`}
                  onClick={() => handleReasonClick(r.label)}
                  className={`relative z-20 pointer-events-auto py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-95 ${
                    selectedReason === r.label
                      ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold shadow-2xs'
                      : 'bg-white hover:bg-orange-50 border-orange-200 text-gray-700 hover:text-orange-700'
                  }`}
                  aria-label={r.label}
                >
                  <span className="material-symbols-outlined text-[13px] text-orange-500">{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
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

  const displaySuggestedItems = (message.suggestedItems && message.suggestedItems.length > 0)
    ? message.suggestedItems
    : extractDishesFromText(message.content);

  const isCallStaff = Boolean(
    !message.isStreaming &&
    (
      message.isHandoff ||
      message.handoffPayload?.reason === 'CUSTOMER_REQUESTED' ||
      message.content?.includes('🔔') ||
      message.content?.toLowerCase().includes('gọi nhân viên') ||
      message.content?.toLowerCase().includes('gặp nhân viên') ||
      message.content?.toLowerCase().includes('nhân viên đến bàn') ||
      message.content?.toLowerCase().includes('gọi phục vụ')
    ) &&
    !(
      message.handoffPayload?.severity === 'RED_ALERT' ||
      message.handoffPayload?.severity === 'PRIORITY_ALERT' ||
      message.handoffPayload?.reason === 'MANAGER_ESCALATION' ||
      message.content?.includes('Quản lý sẽ tới bàn')
    )
  );

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

  const handleAddToCart = (item, quantity = 1) => {
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
        description: item.description,
      },
      quantity
    );
    toast.success(`Đã thêm ${quantity > 1 ? `${quantity}x ` : ''}"${item.name}" vào giỏ! 🛒`, { duration: 2000 });
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

        {/* Booking Confirmation Card khi đặt bàn thành công */}
        {!message.isStreaming && message.reservation && (
          <BookingConfirmationCard reservation={message.reservation} />
        )}

        {/* Thẻ Giỏ Hàng Thu Nhỏ (Mini Cart Card) khi có tương tác giỏ hàng */}
        {!message.isStreaming && message.cartAction && (
          <MiniCartCard cartAction={message.cartAction} />
        )}

        {/* Thẻ Món Ăn Tương Tác Trong Chat (Interactive Food Cards - SPEC-MOD-02 & FR-CHAT-06) */}
        {!message.isStreaming && displaySuggestedItems?.length > 0 && (
          <div data-testid="interactive-product-cards-container" className="mt-2 space-y-2 max-w-[95%]">
            {displaySuggestedItems.map(item => (
              <FoodCard
                key={item.id || item.name}
                item={item}
                onAdd={handleAddToCart}
              />
            ))}
          </div>
        )}

        {/* Thẻ Cảnh Báo Đỏ (Red Alert / Priority Alert) Quản Lý Ca Trực (SPEC-MOD-05 & SPEC-MOD-06) */}
        {!message.isStreaming && (
          message.handoffPayload?.severity === 'RED_ALERT' ||
          message.handoffPayload?.severity === 'PRIORITY_ALERT' ||
          message.handoffPayload?.reason === 'MANAGER_ESCALATION' ||
          message.content?.includes('Red Alert') ||
          message.content?.includes('Priority Alert') ||
          message.content?.includes('cảnh báo đỏ') ||
          message.content?.includes('Quản lý nhà hàng') ||
          message.content?.includes('Quản lý sẽ tới bàn')
        ) && (
          <div data-testid="manager-escalation-card" className="mt-2.5 bg-rose-50 border border-rose-300 rounded-2xl p-3 shadow-xs max-w-[95%]">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs pb-1.5 border-b border-rose-200">
              <span className="material-symbols-outlined text-rose-600 text-base animate-pulse">crisis_alert</span>
              <span>Cảnh Báo Đỏ / Khẩn Cấp (Priority Alert) — Quản Lý Đang Đến Bàn</span>
            </div>
            <p className="text-[11px] text-rose-700 mt-1.5 leading-relaxed">
              Thông báo ưu tiên đặc biệt (Priority Alert) đã được gửi tới thiết bị cầm tay của Quản lý ca trực. Quản lý sẽ tới bàn của bạn trong ít phút để kiểm tra và xử lý ngay lập tức!
            </p>
          </div>
        )}

        {/* Khay Gọi Nhân Viên & Chọn Nhanh Lý Do (SPEC-MOD-05: TC-SUP-06..08) */}
        {isCallStaff && (
          <CallStaffCard message={message} />
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
              <span className="material-symbols-outlined text-sm">thumb_up</span>
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
              <span className="material-symbols-outlined text-sm">thumb_down</span>
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
