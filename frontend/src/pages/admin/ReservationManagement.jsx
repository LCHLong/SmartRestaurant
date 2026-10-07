import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ReservationManagement.jsx — Quản lý đặt bàn (Admin)
 * Hiển thị danh sách đặt bàn theo ngày, filter theo status,
 * xem đầy đủ thông tin khách (PII), check-in, đổi bàn 1-click
 */
const ReservationManagement = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [reallocatingId, setReallocatingId] = useState(null);
    const [checkingInId, setCheckingInId] = useState(null);
    const [selectedResv, setSelectedResv] = useState(null);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        try {
            const params = { date, page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/api/reservations', { params });
            setReservations(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        } catch (_) {
            toast.error('Không thể tải danh sách đặt bàn');
        } finally {
            setLoading(false);
        }
    }, [date, statusFilter, page]);

    useEffect(() => { fetchReservations(); }, [fetchReservations]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/api/reservations/${id}/status`, { status });
            toast.success(`Đã cập nhật trạng thái → ${getStatusVN(status)}`);
            fetchReservations();
            if (selectedResv?.id === id) setSelectedResv(null);
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Cập nhật thất bại');
        }
    };

    const handleReallocate = async (id, customerName) => {
        setReallocatingId(id);
        try {
            const res = await api.post(`/api/reservations/${id}/reallocate`);
            toast.success(`Đã đổi bàn cho ${customerName} sang bàn ${res.data.data?.new_table?.table_number}`);
            fetchReservations();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Không còn bàn trống tương đương');
        } finally {
            setReallocatingId(null);
        }
    };

    const getStatusColor = (status) => {
        const c = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', seated: 'bg-emerald-100 text-emerald-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700', no_show: 'bg-red-200 text-red-800' };
        return c[status] || 'bg-gray-100 text-gray-600';
    };

    const getStatusVN = (status) => {
        const m = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', seated: 'Đang ngồi', completed: 'Hoàn thành', cancelled: 'Đã hủy', no_show: 'Không đến' };
        return m[status] || status;
    };

    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'pending', label: 'Chờ xác nhận' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'seated', label: 'Đang ngồi' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
        { value: 'no_show', label: 'Không đến' },
    ];

    // Stats
    const stats = {
        total: pagination.total,
        pending: reservations.filter((r) => r.status === 'pending').length,
        confirmed: reservations.filter((r) => r.status === 'confirmed').length,
        seated: reservations.filter((r) => r.status === 'seated').length,
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-emerald-600">event_seat</span>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Đặt bàn</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Xem và xử lý tất cả đặt bàn trước</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="date"
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setPage(1); }}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                    {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                    onClick={fetchReservations}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700 inline-flex items-center gap-1.5"
                >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    Tải lại
                </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Tổng hôm nay', value: stats.total, color: 'text-gray-700' },
                    { label: 'Chờ xác nhận', value: stats.pending, color: 'text-amber-600' },
                    { label: 'Đã xác nhận', value: stats.confirmed, color: 'text-blue-600' },
                    { label: 'Đang ngồi', value: stats.seated, color: 'text-emerald-600' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-xs text-gray-500">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                </div>
            ) : reservations.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <span className="material-symbols-outlined text-5xl mb-3 text-gray-300">event_busy</span>
                    <p>Không có đặt bàn nào trong ngày {date}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Mã / Khách hàng</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Giờ</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Số khách</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Bàn</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Liên hệ</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reservations.map((r) => (
                                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-semibold text-gray-800">{r.customer_name}</div>
                                        <div className="text-xs font-mono text-gray-400 mt-0.5">{r.booking_code}</div>
                                        {r.special_requests && (
                                            <div className="text-xs text-gray-400 mt-0.5 italic truncate max-w-[160px] flex items-center gap-1" title={r.special_requests}>
                                                <span className="material-symbols-outlined text-[13px] text-gray-400">edit_note</span>
                                                <span className="truncate">{r.special_requests}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold">{r.reservation_time}</div>
                                        <div className="text-xs text-gray-400">→ {r.end_time}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold">{r.guest_count}</span> người
                                        {r.deposit_amount > 0 && (
                                            <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-0.5">
                                                <span className="material-symbols-outlined text-[13px] text-amber-500">payments</span>
                                                <span>Cọc: {r.deposit_amount?.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.tables ? (
                                            <div>
                                                <div className="font-semibold">Bàn {r.tables.table_number}</div>
                                                <div className="text-xs text-gray-400">{r.tables.location}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Chưa gán</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>{r.customer_phone}</div>
                                        {r.customer_email && <div className="text-xs text-gray-400">{r.customer_email}</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                                            {getStatusVN(r.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1.5">
                                            {r.status === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'confirmed')}
                                                    className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-xs">check</span>
                                                    Xác nhận
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(r.status) && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'seated')}
                                                    className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 inline-flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-xs">table_restaurant</span>
                                                    Check-in
                                                </button>
                                            )}
                                            {r.status === 'seated' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'completed')}
                                                    className="px-2.5 py-1 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 inline-flex items-center justify-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    Xong
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(r.status) && (
                                                <>
                                                    <button
                                                        onClick={() => handleReallocate(r.id, r.customer_name)}
                                                        disabled={reallocatingId === r.id}
                                                        className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 inline-flex items-center justify-center gap-1"
                                                    >
                                                        {reallocatingId === r.id ? '...' : (
                                                            <>
                                                                <span className="material-symbols-outlined text-xs">sync_alt</span>
                                                                Đổi bàn
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                                                        className="px-2.5 py-1 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 inline-flex items-center justify-center gap-1"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">close</span>
                                                        Hủy
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                ← Trước
                            </button>
                            <span className="text-sm text-gray-500">Trang {page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Sau →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReservationManagement;
