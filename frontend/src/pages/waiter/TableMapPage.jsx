import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../services/api';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

/**
 * TableMapPage.jsx — Sơ đồ bàn thông minh (Waiter/Admin)
 * Phase 5 Nâng cấp:
 * - Hiển thị nhãn vàng "Sắp có khách đặt (19:00)" trước 90 phút (Buffer Flag)
 * - Viền đỏ chớp nháy cảnh báo Overstay khi còn < 15 phút
 * - Popup cảnh báo khi xếp khách vãng lai vào bàn sắp có lịch hẹn
 * - Nút bấm nhanh [Đổi bàn cho khách] 1-Click Reallocate
 * - Tab "Lịch Đặt Bàn" xem timeline các lượt đặt trong ngày
 */
const TableMapPage = () => {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState('map'); // 'map' | 'reservations'
    const [bufferFlags, setBufferFlags] = useState({}); // { table_id: { reservation_time, customer_name, minutes_until } }
    const [overstayAlerts, setOverstayAlerts] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [resvLoading, setResvLoading] = useState(false);
    const [resvDate, setResvDate] = useState(new Date().toISOString().split('T')[0]);
    const [reallocatingId, setReallocatingId] = useState(null);
    const [assignPopup, setAssignPopup] = useState(null); // { tableId, reservationInfo }
    const itemsPerPage = 20;

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001');

    // ─── Data Fetching ──────────────────────────────────────────────────────

    const fetchTables = useCallback(async (page = currentPage) => {
        try {
            const res = await api.get(`/api/admin/tables?page=${page}&limit=${itemsPerPage}`);
            setTables(res.data.data || []);
            setTotalPages(res.data.pagination?.totalPages || 1);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    }, [currentPage]);

    const fetchBufferFlags = useCallback(async () => {
        try {
            const res = await api.get('/api/reservations/buffer-flags');
            const flagMap = {};
            (res.data.data || []).forEach((flag) => {
                flagMap[flag.table_id] = flag;
            });
            setBufferFlags(flagMap);
        } catch (_) {}
    }, []);

    const fetchOverstayAlerts = useCallback(async () => {
        try {
            const res = await api.get('/api/reservations/overstay-alerts');
            setOverstayAlerts(res.data.data || []);
        } catch (_) {}
    }, []);

    const fetchReservations = useCallback(async () => {
        setResvLoading(true);
        try {
            const res = await api.get(`/api/reservations?date=${resvDate}&limit=50`);
            setReservations(res.data.data || []);
        } catch (_) {}
        finally { setResvLoading(false); }
    }, [resvDate]);

    // ─── Socket & Polling ───────────────────────────────────────────────────

    useEffect(() => {
        fetchTables(currentPage);
        fetchBufferFlags();
        fetchOverstayAlerts();

        const socket = io(API_URL, { auth: { token: localStorage.getItem('token') } });
        socket.on('connect', () => socket.emit('join_room', 'waiter'));
        socket.on('new_order', () => fetchTables(currentPage));
        socket.on('order_status_updated', () => fetchTables(currentPage));
        socket.on('item_status_update', () => fetchTables(currentPage));
        socket.on('table_updated', (updatedTable) => {
            setTables((prev) => prev.map((t) => t.id === updatedTable.id ? { ...t, ...updatedTable } : t));
        });
        socket.on('new_reservation', () => {
            fetchBufferFlags();
            fetchOverstayAlerts();
            toast('📋 Có lượt đặt bàn mới!', { icon: '🔔' });
        });
        socket.on('reservation_reallocated', (data) => {
            toast.success(`✅ Đã đổi bàn cho ${data.customer_name} sang bàn ${data.new_table_number}`);
            fetchTables(currentPage);
            fetchBufferFlags();
        });

        // Poll buffer flags & overstay alerts mỗi 60s
        const interval = setInterval(() => {
            fetchTables(currentPage);
            fetchBufferFlags();
            fetchOverstayAlerts();
        }, 60000);

        return () => { socket.close(); clearInterval(interval); };
    }, [currentPage]);

    useEffect(() => {
        if (activeTab === 'reservations') fetchReservations();
    }, [activeTab, resvDate]);

    // ─── 1-Click Reallocate ─────────────────────────────────────────────────

    const handleReallocate = async (reservationId, customerName) => {
        setReallocatingId(reservationId);
        try {
            await api.post(`/api/reservations/${reservationId}/reallocate`);
            toast.success(`Đã đổi bàn cho ${customerName} thành công!`);
            fetchTables(currentPage);
            fetchBufferFlags();
            fetchOverstayAlerts();
        } catch (err) {
            const msg = err.response?.data?.error?.message || 'Không thể đổi bàn. Không còn bàn trống tương đương.';
            toast.error(msg);
        } finally {
            setReallocatingId(null);
        }
    };

    // Cập nhật trạng thái reservation
    const handleUpdateStatus = async (reservationId, status) => {
        try {
            await api.patch(`/api/reservations/${reservationId}/status`, { status });
            toast.success('Đã cập nhật trạng thái');
            fetchReservations();
        } catch (_) {
            toast.error('Cập nhật thất bại');
        }
    };

    // ─── Màu sắc & Style ────────────────────────────────────────────────────

    const getTableCardStyle = (table) => {
        if (!table.is_active) {
            return 'bg-gray-100 border-gray-300 text-gray-500 opacity-50 cursor-not-allowed';
        }
        const isOverstay = overstayAlerts.some((a) => a.table_id === table.id);
        if (isOverstay) {
            return 'bg-red-50 border-red-500 text-red-700 animate-pulse';
        }
        const hasBuffer = bufferFlags[table.id];
        if (hasBuffer && table.status !== 'occupied') {
            return 'bg-amber-50 border-amber-400 text-amber-800';
        }
        switch (table.status) {
            case 'available': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'occupied': return 'bg-rose-50 border-rose-200 text-rose-700';
            case 'reserved': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'dirty': return 'bg-gray-100 border-gray-300 text-gray-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-600';
        }
    };

    const getStatusLabel = (table) => {
        if (!table.is_active) return <span className="text-red-500">• Không hoạt động</span>;
        const isOverstay = overstayAlerts.some((a) => a.table_id === table.id);
        if (isOverstay) return <span className="text-red-600 font-bold animate-pulse">⚠️ Nguy cơ trễ giờ</span>;
        const statusMap = {
            available: '✅ Trống',
            occupied: '🍽️ Đang dùng',
            reserved: '📋 Đã đặt',
            dirty: '🧹 Đang dọn',
        };
        return statusMap[table.status] || table.status;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'bg-amber-100 text-amber-700',
            confirmed: 'bg-blue-100 text-blue-700',
            seated: 'bg-emerald-100 text-emerald-700',
            completed: 'bg-gray-100 text-gray-700',
            cancelled: 'bg-red-100 text-red-700',
            no_show: 'bg-red-200 text-red-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-600';
    };

    const getStatusVN = (status) => {
        const map = {
            pending: 'Chờ xác nhận',
            confirmed: 'Đã xác nhận',
            seated: 'Đang ngồi',
            completed: 'Hoàn thành',
            cancelled: 'Đã hủy',
            no_show: 'Không đến',
        };
        return map[status] || status;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            <span className="ml-3 text-gray-500">Đang tải sơ đồ bàn...</span>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                        {activeTab === 'map' ? '🗺️ Sơ đồ bàn thông minh' : '📋 Lịch Đặt Bàn'}
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">Cập nhật tự động theo thời gian thực</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 animate-pulse">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-xs font-bold uppercase tracking-wider">Live</span>
                    </div>
                    {/* Tabs */}
                    <div className="flex rounded-xl overflow-hidden border border-gray-200">
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'map' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Sơ đồ
                        </button>
                        <button
                            onClick={() => setActiveTab('reservations')}
                            className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'reservations' ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            Đặt bàn
                        </button>
                    </div>
                </div>
            </div>

            {/* Overstay Alert Banner */}
            {overstayAlerts.length > 0 && (
                <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-600 text-xl animate-bounce">⚠️</span>
                        <h3 className="font-bold text-red-700">Cảnh báo Overstay — Cần hành động ngay!</h3>
                    </div>
                    <div className="space-y-2">
                        {overstayAlerts.map((alert) => (
                            <div key={alert.reservation_id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 shadow-sm">
                                <div>
                                    <span className="font-semibold text-red-700">Bàn {alert.table_number}</span>
                                    <span className="text-gray-500 text-sm ml-2">
                                        — Khách <strong>{alert.customer_name}</strong> ({alert.guest_count} người) đặt lúc {alert.reservation_time}
                                        {' '}(còn <strong className="text-red-600">{alert.minutes_until} phút</strong>)
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleReallocate(alert.reservation_id, alert.customer_name)}
                                    disabled={reallocatingId === alert.reservation_id}
                                    className="ml-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 whitespace-nowrap"
                                >
                                    {reallocatingId === alert.reservation_id
                                        ? <span className="flex items-center gap-1"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Đang đổi...</span>
                                        : '🔀 Đổi bàn ngay'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB: SƠ ĐỒ BÀN ─── */}
            {activeTab === 'map' && (
                <>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mb-5 text-xs">
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Trống
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 rounded-full text-rose-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Đang dùng
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Sắp có đặt bàn
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-50 border-2 border-red-400 rounded-full text-red-700">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Nguy cơ Overstay
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {tables.map((table) => {
                            const bufferInfo = bufferFlags[table.id];
                            const overstayAlert = overstayAlerts.find((a) => a.table_id === table.id);

                            return (
                                <div
                                    key={table.id}
                                    className={`
                                        h-36 rounded-2xl flex flex-col items-center justify-center border-2 shadow-sm
                                        transition-all relative overflow-hidden group cursor-pointer
                                        ${getTableCardStyle(table)}
                                        ${overstayAlert ? 'ring-2 ring-red-400 ring-offset-1' : ''}
                                    `}
                                >
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity" />
                                    <span className="text-3xl font-bold">{table.table_number}</span>
                                    <span className="text-xs font-semibold mt-1 text-center px-2">
                                        {getStatusLabel(table)}
                                    </span>

                                    {/* Buffer Flag: Nhãn "Sắp có khách đặt" */}
                                    {bufferInfo && !overstayAlert && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-amber-500 text-white text-[10px] font-bold text-center py-1 px-2 truncate">
                                            📋 Đặt lúc {bufferInfo.reservation_time} ({bufferInfo.minutes_until}p)
                                        </div>
                                    )}

                                    {/* Capacity badge */}
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-10 rounded-full px-2 py-0.5 text-[10px] font-bold opacity-70">
                                        {table.capacity}👤
                                    </div>

                                    {/* 1-Click Reallocate button nếu có overstay alert */}
                                    {overstayAlert && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleReallocate(overstayAlert.reservation_id, overstayAlert.customer_name); }}
                                            disabled={reallocatingId === overstayAlert.reservation_id}
                                            className="absolute bottom-1 left-1 right-1 bg-red-600 text-white text-[10px] font-bold py-1 rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            {reallocatingId === overstayAlert.reservation_id ? '...' : '🔀 Đổi bàn'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`p-3 rounded-xl border-2 transition-all ${currentPage === 1 ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-500'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <span className="text-gray-500 font-medium">Trang {currentPage} / {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`p-3 rounded-xl border-2 transition-all ${currentPage === totalPages ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:border-emerald-500 hover:text-emerald-500'}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ─── TAB: LỊCH ĐẶT BÀN ─── */}
            {activeTab === 'reservations' && (
                <div>
                    {/* Date picker */}
                    <div className="flex items-center gap-3 mb-5">
                        <label className="text-sm font-semibold text-gray-600">Ngày:</label>
                        <input
                            type="date"
                            value={resvDate}
                            onChange={(e) => setResvDate(e.target.value)}
                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <button
                            onClick={fetchReservations}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700"
                        >
                            Tải lại
                        </button>
                    </div>

                    {resvLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                        </div>
                    ) : reservations.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="text-5xl mb-3">📅</div>
                            <p>Không có đặt bàn nào trong ngày {resvDate}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {reservations.map((r) => (
                                <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-bold text-gray-800">{r.customer_name}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(r.status)}`}>
                                                    {getStatusVN(r.status)}
                                                </span>
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{r.booking_code}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                <span>🕐 <strong>{r.reservation_time}</strong> – {r.end_time}</span>
                                                <span>👥 <strong>{r.guest_count}</strong> người</span>
                                                <span>📞 {r.customer_phone}</span>
                                                {r.tables && <span>🪑 Bàn <strong>{r.tables.table_number}</strong> ({r.tables.location})</span>}
                                            </div>
                                            {r.special_requests && (
                                                <p className="text-sm text-gray-500 mt-1 italic">📝 {r.special_requests}</p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col gap-2 min-w-fit">
                                            {r.status === 'pending' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'confirmed')}
                                                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                                                >
                                                    ✓ Xác nhận
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(r.status) && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'seated')}
                                                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                                                >
                                                    🪑 Check-in
                                                </button>
                                            )}
                                            {r.status === 'seated' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'completed')}
                                                    className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700"
                                                >
                                                    ✅ Hoàn thành
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(r.status) && (
                                                <>
                                                    <button
                                                        onClick={() => handleReallocate(r.id, r.customer_name)}
                                                        disabled={reallocatingId === r.id}
                                                        className="px-3 py-1.5 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60"
                                                    >
                                                        {reallocatingId === r.id ? '...' : '🔀 Đổi bàn'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                                                        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50"
                                                    >
                                                        ✕ Hủy
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TableMapPage;
