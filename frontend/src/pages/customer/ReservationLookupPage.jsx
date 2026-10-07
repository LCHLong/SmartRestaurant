import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import QRCode from 'react-qr-code';

/**
 * ReservationLookupPage.jsx — Tra cứu đặt bàn công khai (Chống IDOR)
 * Khách hàng nhập mã đặt bàn + 4 số cuối điện thoại để xem thông tin
 */
const ReservationLookupPage = () => {
    const [form, setForm] = useState({ booking_code: '', phone_last4: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!form.booking_code.trim() || form.phone_last4.length !== 4) {
            return toast.error('Vui lòng nhập mã đặt bàn và 4 số cuối điện thoại');
        }
        setLoading(true);
        setNotFound(false);
        setResult(null);
        try {
            const res = await api.get('/api/reservations/lookup', {
                params: {
                    booking_code: form.booking_code.trim().toUpperCase(),
                    phone_last4: form.phone_last4.trim(),
                },
            });
            setResult(res.data.data);
        } catch (err) {
            const code = err.response?.data?.error?.code;
            if (code === 'NOT_FOUND' || code === 'PHONE_MISMATCH') {
                setNotFound(true);
                toast.error(err.response.data.error.message);
            } else {
                toast.error('Lỗi tra cứu. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const m = {
            pending: 'bg-amber-100 text-amber-700 border-amber-200',
            confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
            seated: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            completed: 'bg-gray-100 text-gray-600 border-gray-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200',
            no_show: 'bg-red-200 text-red-800 border-red-300',
        };
        return m[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    };

    const getStatusVN = (status) => {
        const m = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            seated: 'Đang ngồi',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
            no_show: 'Không đến',
        };
        return m[status] || status;
    };

    const getStatusIcon = (status) => {
        const m = {
            pending: 'hourglass_empty',
            confirmed: 'check_circle',
            seated: 'table_restaurant',
            completed: 'task_alt',
            cancelled: 'cancel',
            no_show: 'block',
        };
        return m[status] || 'info';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mb-3">
                        <span className="material-symbols-outlined text-5xl text-emerald-600">search</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Tra cứu đặt bàn</h1>
                    <p className="text-gray-500 text-sm mt-2">Nhập mã đặt bàn và số điện thoại để xem thông tin</p>
                </div>

                {/* Search form */}
                <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
                    <form onSubmit={handleLookup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mã đặt bàn</label>
                            <input
                                type="text"
                                value={form.booking_code}
                                onChange={(e) => setForm((p) => ({ ...p, booking_code: e.target.value.toUpperCase() }))}
                                placeholder="VD: SR-AB12CD34"
                                maxLength={12}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">4 số cuối điện thoại đặt bàn</label>
                            <input
                                type="text"
                                value={form.phone_last4}
                                onChange={(e) => setForm((p) => ({ ...p, phone_last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                placeholder="VD: 5678"
                                maxLength={4}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang tra cứu...
                                </span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">search</span>
                                    Tra cứu
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Not found */}
                {notFound && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                        <div className="mb-2">
                            <span className="material-symbols-outlined text-4xl text-red-400">search_off</span>
                        </div>
                        <p className="text-red-700 font-semibold">Không tìm thấy đặt bàn</p>
                        <p className="text-red-500 text-sm mt-1">Vui lòng kiểm tra lại mã đặt bàn và số điện thoại.</p>
                    </div>
                )}

                {/* Result Modal Popup */}
                {result && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                            {/* Status header with close button */}
                            <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-inherit z-10 ${getStatusColor(result.status)}`}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-2xl">{getStatusIcon(result.status)}</span>
                                    <div>
                                        <span className="font-bold text-lg block leading-tight">{getStatusVN(result.status)}</span>
                                        <span className="font-mono text-xs opacity-80">{result.booking_code}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-gray-700 flex items-center justify-center transition-colors"
                                    title="Đóng popup"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* QR Code for easy Check-in */}
                                <div className="flex flex-col items-center justify-center py-2 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <p className="text-gray-600 text-xs font-medium mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-emerald-600">qr_code_scanner</span>
                                        Mã QR Check-in khi đến nhà hàng
                                    </p>
                                    <div className="p-3 bg-white border-2 border-emerald-300 rounded-2xl shadow-sm">
                                        {result.qr_image ? (
                                            <img
                                                src={result.qr_image}
                                                alt={`QR Code ${result.booking_code}`}
                                                className="w-36 h-36 object-contain"
                                            />
                                        ) : (
                                            <QRCode
                                                value={JSON.stringify({
                                                    booking_code: result.booking_code,
                                                    phone_last4: form.phone_last4,
                                                })}
                                                size={144}
                                            />
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2 font-mono">Mã: {result.booking_code}</p>
                                </div>

                                {/* Customer info */}
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Khách hàng</p>
                                    <p className="font-semibold text-gray-800 text-lg">{result.customer_name}</p>
                                    <p className="text-gray-500 text-sm font-mono">{result.customer_phone}</p>
                                </div>

                                {/* Booking info */}
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-2.5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-base">calendar_today</span>
                                            Ngày
                                        </span>
                                        <span className="font-semibold text-gray-800">{formatDate(result.reservation_date)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-base">schedule</span>
                                            Giờ đến
                                        </span>
                                        <span className="font-semibold text-gray-800">{result.reservation_time}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-base">group</span>
                                            Số khách
                                        </span>
                                        <span className="font-semibold text-gray-800">{result.guest_count} người</span>
                                    </div>
                                    {result.tables && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-base">table_restaurant</span>
                                                Bàn
                                            </span>
                                            <span className="font-semibold text-gray-800">
                                                Bàn {result.tables.table_number} ({result.tables.location})
                                            </span>
                                        </div>
                                    )}
                                    {result.special_requests && (
                                        <div className="pt-2 border-t border-gray-200">
                                            <p className="text-xs text-gray-400">Ghi chú đặc biệt</p>
                                            <p className="text-sm text-gray-600 mt-0.5 italic">{result.special_requests}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Deposit info */}
                                {result.deposit_amount > 0 && (
                                    <div className={`rounded-xl p-4 text-sm ${result.deposit_status === 'paid' ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                                        <p className={`font-semibold flex items-center gap-1.5 ${result.deposit_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            <span className="material-symbols-outlined text-base">payments</span>
                                            Đặt cọc: {result.deposit_amount?.toLocaleString('vi-VN')}đ
                                            {result.deposit_status === 'paid' ? ' (Đã thanh toán)' : ' (Chưa thanh toán)'}
                                        </p>
                                    </div>
                                )}

                                {/* Created at */}
                                <p className="text-xs text-gray-400 text-center">
                                    Đặt bàn lúc {new Date(result.created_at).toLocaleString('vi-VN')}
                                </p>

                                {/* Action buttons */}
                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                    Đóng popup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Link to new booking */}
                <div className="text-center mt-6">
                    <a href="/reservations" className="text-emerald-600 text-sm font-semibold hover:underline">
                        + Đặt bàn mới
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ReservationLookupPage;
