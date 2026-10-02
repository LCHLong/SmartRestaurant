import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';

/**
 * ReservationCancelPage.jsx — Hủy đặt bàn qua link email (Signed JWT Token)
 * Khách click link trong email → trang này verify token và hủy đặt bàn
 */
const ReservationCancelPage = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState('loading'); // 'loading' | 'confirm' | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Link hủy không hợp lệ hoặc thiếu token.');
        } else {
            setStatus('confirm'); // Hiển thị màn hình xác nhận trước khi hủy
        }
    }, [token]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            const res = await api.post('/api/reservations/cancel-by-token', { token });
            setStatus('success');
            setMessage(res.data.message || 'Đặt bàn đã được hủy thành công.');
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.error?.message || 'Hủy đặt bàn thất bại. Link có thể đã hết hạn (24h) hoặc không hợp lệ.');
        } finally {
            setCancelling(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
                {status === 'confirm' && (
                    <>
                        <div className="text-5xl mb-4">⚠️</div>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Xác nhận hủy đặt bàn</h1>
                        <p className="text-gray-500 text-sm mb-6">
                            Bạn có chắc chắn muốn hủy lượt đặt bàn này không?<br />
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex gap-3">
                            <Link
                                to="/reservations/lookup"
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
                            >
                                Không, quay lại
                            </Link>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 text-sm"
                            >
                                {cancelling ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang hủy...
                                    </span>
                                ) : (
                                    '❌ Xác nhận hủy'
                                )}
                            </button>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-5xl mb-4">✅</div>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Hủy thành công</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <Link
                            to="/reservations"
                            className="inline-block px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm"
                        >
                            Đặt bàn mới
                        </Link>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-5xl mb-4">❌</div>
                        <h1 className="text-xl font-bold text-gray-800 mb-2">Không thể hủy</h1>
                        <p className="text-gray-500 text-sm mb-6">{message}</p>
                        <div className="flex flex-col gap-3">
                            <Link
                                to="/reservations/lookup"
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm"
                            >
                                Tra cứu đặt bàn
                            </Link>
                            <Link to="/reservations" className="text-gray-400 text-sm hover:underline">
                                Đặt bàn mới
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReservationCancelPage;
