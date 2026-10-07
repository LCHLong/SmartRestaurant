import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ReservationPage.jsx — Giao diện Đặt bàn trước cho Khách hàng
 * Phase 5 - Hiển thị form chọn ngày/giờ/số người, preview bàn trống,
 * xác nhận thành công với mã QR đặt chỗ
 */
const ReservationPage = () => {
    const [step, setStep] = useState(1); // 1: Form, 2: Confirm, 3: Success
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);

    // Form data
    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        guest_count: 2,
        reservation_date: '',
        reservation_time: '',
        special_requests: '',
    });

    // Available slots data
    const [availableInfo, setAvailableInfo] = useState(null);
    const [bookingResult, setBookingResult] = useState(null);

    // Tính ngày tối thiểu (hôm nay)
    const today = new Date().toISOString().split('T')[0];

    // Danh sách giờ để chọn (7:00 - 21:30, step 30 phút)
    const timeSlots = [];
    for (let h = 7; h <= 21; h++) {
        timeSlots.push(`${String(h).padStart(2, '0')}:00`);
        if (h < 21) timeSlots.push(`${String(h).padStart(2, '0')}:30`);
    }
    timeSlots.push('21:30');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Reset available info khi thay đổi ngày/giờ/số khách
        if (['reservation_date', 'reservation_time', 'guest_count'].includes(name)) {
            setAvailableInfo(null);
        }
    };

    // Kiểm tra bàn trống
    const checkAvailability = async () => {
        if (!form.reservation_date || !form.reservation_time || !form.guest_count) {
            toast.error('Vui lòng chọn ngày, giờ và số lượng khách');
            return;
        }
        setChecking(true);
        try {
            const res = await api.get('/api/reservations/available-slots', {
                params: {
                    date: form.reservation_date,
                    time: form.reservation_time,
                    guest_count: form.guest_count,
                },
            });
            setAvailableInfo(res.data.data);
        } catch (err) {
            toast.error('Không thể kiểm tra bàn trống. Vui lòng thử lại.');
        } finally {
            setChecking(false);
        }
    };

    // Tiến sang bước 2 (xác nhận)
    const goToConfirm = () => {
        // Validate
        if (!form.customer_name.trim()) return toast.error('Vui lòng nhập họ tên');
        if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(form.customer_phone)) {
            return toast.error('Số điện thoại không hợp lệ (VD: 0912345678)');
        }
        if (!form.reservation_date) return toast.error('Vui lòng chọn ngày');
        if (!form.reservation_time) return toast.error('Vui lòng chọn giờ');
        if (!availableInfo || availableInfo.available_tables === 0) {
            return toast.error('Vui lòng kiểm tra bàn trống trước');
        }
        setStep(2);
    };

    // Gửi đặt bàn
    const submitReservation = async () => {
        setLoading(true);
        // Tạo Idempotency-Key để chống đặt trùng khi click đúp
        const idempotencyKey = crypto.randomUUID();
        try {
            const res = await api.post(
                '/api/reservations',
                {
                    customer_name: form.customer_name.trim(),
                    customer_phone: form.customer_phone.trim(),
                    customer_email: form.customer_email.trim() || undefined,
                    guest_count: parseInt(form.guest_count),
                    reservation_date: form.reservation_date,
                    reservation_time: form.reservation_time,
                    special_requests: form.special_requests.trim() || undefined,
                },
                {
                    headers: { 'Idempotency-Key': idempotencyKey },
                }
            );
            setBookingResult(res.data.data);
            setStep(3);
            toast.success('Đặt bàn thành công!');
        } catch (err) {
            const errMsg = err.response?.data?.error?.message || 'Đặt bàn thất bại. Vui lòng thử lại.';
            toast.error(errMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // ─── Step 3: Thành công ───────────────────────────────────────────────
    if (step === 3 && bookingResult) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-10 text-center">
                        <div className="mb-3">
                            <span className="material-symbols-outlined text-6xl text-white">celebration</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Đặt bàn thành công!</h1>
                        <p className="text-emerald-100 mt-1 text-sm">Nhà hàng sẽ xác nhận sớm nhất</p>
                    </div>

                    <div className="px-8 py-6">
                        {/* Booking code */}
                        <div className="text-center mb-6">
                            <p className="text-gray-500 text-sm mb-1">Mã đặt bàn của bạn</p>
                            <div className="inline-block bg-emerald-50 border-2 border-emerald-300 rounded-xl px-6 py-3">
                                <span className="text-3xl font-bold text-emerald-700 tracking-widest">
                                    {bookingResult.booking_code}
                                </span>
                            </div>
                        </div>

                        {/* QR Code */}
                        {bookingResult.qr_image && (
                            <div className="flex flex-col items-center mb-6">
                                <p className="text-gray-500 text-sm mb-2">Quét QR khi đến nhà hàng</p>
                                <img
                                    src={bookingResult.qr_image}
                                    alt={`QR Code ${bookingResult.booking_code}`}
                                    className="w-40 h-40 border-4 border-emerald-200 rounded-xl p-1"
                                />
                            </div>
                        )}

                        {/* Thông tin */}
                        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ngày</span>
                                <span className="font-semibold">{formatDate(bookingResult.reservation_date || form.reservation_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Giờ</span>
                                <span className="font-semibold">{bookingResult.reservation_time || form.reservation_time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Số khách</span>
                                <span className="font-semibold">{bookingResult.guest_count || form.guest_count} người</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Trạng thái</span>
                                <span className="font-semibold text-amber-600">Chờ xác nhận</span>
                            </div>
                        </div>

                        {/* Cọc */}
                        {bookingResult.requires_deposit && (
                            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                                <p className="font-bold text-amber-700 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-amber-600">warning</span>
                                    Yêu cầu đặt cọc (Nhóm ≥ 6 người)
                                </p>
                                <p className="text-amber-600 mt-1">
                                    Số tiền cọc: <strong>{bookingResult.deposit_amount?.toLocaleString('vi-VN')}đ</strong>
                                </p>
                                {bookingResult.deposit_paid ? (
                                    <div className="mt-2 text-emerald-700 font-bold bg-emerald-100 rounded-lg p-2 text-center flex items-center justify-center gap-1.5">
                                        <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                                        Đã thanh toán cọc thành công!
                                    </div>
                                ) : (
                                    <div className="mt-3">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await api.post(`/api/reservations/${bookingResult.id}/mock-deposit`);
                                                    toast.success('Thanh toán cọc thành công!');
                                                    setBookingResult((prev) => ({ ...prev, deposit_paid: true }));
                                                } catch (err) {
                                                    toast.error('Thanh toán cọc thất bại');
                                                }
                                            }}
                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors shadow-sm text-sm flex items-center justify-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-base">credit_card</span>
                                            Thanh toán cọc ngay ({bookingResult.deposit_amount?.toLocaleString('vi-VN')}đ)
                                        </button>
                                        <p className="text-amber-600 text-xs mt-1 text-center">Hỗ trợ thẻ ATM / Visa / QR Code</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Email notice */}
                        {form.customer_email && (
                            <p className="text-center text-gray-400 text-xs mt-4 flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-sm">mail</span>
                                Email xác nhận đã được gửi tới {form.customer_email}
                            </p>
                        )}

                        <button
                            onClick={() => { setStep(1); setForm({ customer_name: '', customer_phone: '', customer_email: '', guest_count: 2, reservation_date: '', reservation_time: '', special_requests: '' }); setAvailableInfo(null); setBookingResult(null); }}
                            className="w-full mt-6 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                        >
                            Đặt bàn khác
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Step 2: Xác nhận ────────────────────────────────────────────────
    if (step === 2) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
                    <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-6 text-center rounded-t-3xl">
                        <h1 className="text-xl font-bold text-white">Xác nhận đặt bàn</h1>
                    </div>

                    <div className="px-8 py-6 space-y-4">
                        <div className="bg-gray-50 rounded-2xl p-5 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Họ tên</span>
                                <span className="font-semibold">{form.customer_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Điện thoại</span>
                                <span className="font-semibold">{form.customer_phone}</span>
                            </div>
                            {form.customer_email && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-semibold">{form.customer_email}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ngày</span>
                                <span className="font-semibold">{formatDate(form.reservation_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Giờ đến</span>
                                <span className="font-semibold">{form.reservation_time}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Số khách</span>
                                <span className="font-semibold">{form.guest_count} người</span>
                            </div>
                            {form.special_requests && (
                                <div>
                                    <span className="text-gray-500">Ghi chú: </span>
                                    <span>{form.special_requests}</span>
                                </div>
                            )}
                        </div>

                        {parseInt(form.guest_count) >= 6 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                                <p className="text-amber-700 font-semibold flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-amber-600">warning</span>
                                    Nhóm ≥ 6 người yêu cầu đặt cọc
                                </p>
                                <p className="text-amber-600 mt-1">Ước tính: <strong>{(parseInt(form.guest_count) * 50000).toLocaleString('vi-VN')}đ</strong></p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-semibold hover:border-gray-300 transition-colors"
                            >
                                Quay lại
                            </button>
                            <button
                                onClick={submitReservation}
                                disabled={loading}
                                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-1.5">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>
                                        Xác nhận đặt bàn
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Step 1: Form đặt bàn ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-8 text-center rounded-t-3xl">
                    <div className="mb-2">
                        <span className="material-symbols-outlined text-4xl text-white">event_seat</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Đặt bàn trước</h1>
                    <p className="text-emerald-100 text-sm mt-1">Đảm bảo có chỗ khi bạn đến</p>
                </div>

                <div className="px-8 py-6 space-y-5">
                    {/* Thông tin cá nhân */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin liên hệ</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên *</label>
                                <input
                                    type="text"
                                    name="customer_name"
                                    value={form.customer_name}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                                <input
                                    type="tel"
                                    name="customer_phone"
                                    value={form.customer_phone}
                                    onChange={handleChange}
                                    placeholder="0912345678"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (để nhận xác nhận)</label>
                                <input
                                    type="email"
                                    name="customer_email"
                                    value={form.customer_email}
                                    onChange={handleChange}
                                    placeholder="email@example.com"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin đặt bàn */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Thông tin đặt chỗ</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày *</label>
                                <input
                                    type="date"
                                    name="reservation_date"
                                    value={form.reservation_date}
                                    min={today}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ đến *</label>
                                <select
                                    name="reservation_time"
                                    value={form.reservation_time}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                                >
                                    <option value="">-- Chọn giờ --</option>
                                    {timeSlots.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng khách *</label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, guest_count: Math.max(1, p.guest_count - 1) }))}
                                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                                >
                                    −
                                </button>
                                <span className="text-2xl font-bold text-gray-800 w-12 text-center">{form.guest_count}</span>
                                <button
                                    type="button"
                                    onClick={() => setForm((p) => ({ ...p, guest_count: Math.min(50, p.guest_count + 1) }))}
                                    className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                                >
                                    +
                                </button>
                                <span className="text-sm text-gray-400">người</span>
                                {parseInt(form.guest_count) >= 6 && (
                                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs">warning</span>
                                        Cần đặt cọc
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Kiểm tra bàn trống */}
                    <div>
                        <button
                            type="button"
                            onClick={checkAvailability}
                            disabled={checking || !form.reservation_date || !form.reservation_time}
                            className="w-full border-2 border-emerald-500 text-emerald-600 py-2.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                            {checking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    Đang kiểm tra...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-lg">search</span>
                                    Kiểm tra bàn trống
                                </span>
                            )}
                        </button>

                        {availableInfo && (
                            <div className={`mt-3 rounded-xl p-4 text-sm ${
                                availableInfo.available_tables > 0
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                                {availableInfo.available_tables > 0 ? (
                                    <div>
                                        <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">check_circle</span>
                                            Còn {availableInfo.available_tables} bàn phù hợp cho {form.guest_count} người!
                                        </p>
                                        <p className="text-emerald-600 text-xs mt-1">
                                            Khung giờ {form.reservation_time} ngày {form.reservation_date} — Sẵn sàng đặt bàn.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-red-700 font-semibold flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-base">cancel</span>
                                            Không còn bàn trống trong khung giờ này
                                        </p>
                                        <p className="text-red-600 text-xs mt-1">Vui lòng chọn giờ khác hoặc liên hệ nhà hàng.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Ghi chú */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đặc biệt</label>
                        <textarea
                            name="special_requests"
                            value={form.special_requests}
                            onChange={handleChange}
                            placeholder="VD: Sinh nhật, dị ứng thực phẩm, ghế trẻ em..."
                            rows={3}
                            maxLength={500}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent resize-none"
                        />
                        <p className="text-xs text-gray-400 text-right">{form.special_requests.length}/500</p>
                    </div>

                    {/* Submit */}
                    <button
                        type="button"
                        onClick={goToConfirm}
                        disabled={!availableInfo || availableInfo.available_tables === 0}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-base hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Tiếp tục xác nhận →
                    </button>

                    {/* Buffer warning note */}
                    <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                        <span className="material-symbols-outlined text-xs">info</span>
                        Hệ thống giữ chỗ theo khung 90 phút. Mỗi bàn cần trả trước giờ hẹn của khách tiếp theo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReservationPage;
