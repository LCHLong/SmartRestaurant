import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';

/**
 * ReservationManagement.jsx — Quản lý đặt bàn (Admin)
 * Hiển thị danh sách đặt bàn theo ngày, filter theo status,
 * xem đầy đủ thông tin khách (PII), check-in, đổi bàn 1-click
 */
const ReservationManagement = () => {
    const socket = useSocket();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    // Chế độ lọc thời gian: 'today' | 'week' | 'month' | 'single' | 'custom' | 'all'
    const [dateFilterType, setDateFilterType] = useState('today');
    const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
    const [reallocatingId, setReallocatingId] = useState(null);
    const [checkingInId, setCheckingInId] = useState(null);
    const [selectedResv, setSelectedResv] = useState(null);
    const [escalations, setEscalations] = useState([]);
    const [escalationsLoading, setEscalationsLoading] = useState(false);

    const fetchEscalations = useCallback(async () => {
        try {
            setEscalationsLoading(true);
            const res = await api.get('/api/reservations/escalations');
            setEscalations(res.data.data || []);
        } catch (_) {
        } finally {
            setEscalationsLoading(false);
        }
    }, []);

    const getDateRangeParams = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const now = new Date();

        if (dateFilterType === 'today') {
            return { date: todayStr };
        }
        if (dateFilterType === 'single') {
            return { date: singleDate || todayStr };
        }
        if (dateFilterType === 'week') {
            // 7 ngày qua hoặc tuần này: từ đầu tuần đến cuối tuần
            const dayOfWeek = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
            const mon = new Date(now);
            mon.setDate(now.getDate() - dayOfWeek + 1);
            const sun = new Date(mon);
            sun.setDate(mon.getDate() + 6);
            return {
                from_date: mon.toISOString().split('T')[0],
                to_date: sun.toISOString().split('T')[0],
            };
        }
        if (dateFilterType === 'month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            return { from_date: firstDay, to_date: lastDay };
        }
        if (dateFilterType === 'custom') {
            const p = {};
            if (fromDate) p.from_date = fromDate;
            if (toDate) p.to_date = toDate;
            return p;
        }
        return {}; // 'all': không lọc ngày
    }, [dateFilterType, singleDate, fromDate, toDate]);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        try {
            const dateParams = getDateRangeParams();
            const params = { ...dateParams, page, limit: 20 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/api/reservations', { params });
            setReservations(res.data.data || []);
            setPagination(res.data.pagination || { total: 0, totalPages: 1 });
        } catch (_) {
            toast.error('Không thể tải danh sách đặt bàn');
        } finally {
            setLoading(false);
        }
    }, [getDateRangeParams, statusFilter, page]);

    useEffect(() => {
        fetchReservations();
        fetchEscalations();
    }, [fetchReservations, fetchEscalations]);

    // Socket real-time: new_reservation, ai_handoff_alert & large_group_escalation
    useEffect(() => {
        if (!socket) return;
        socket.emit('join_room', 'admin');

        const onNewRes = () => {
            fetchReservations();
            fetchEscalations();
            toast('📋 Có lượt đặt bàn mới!', { icon: '🔔' });
        };

        const onHandoff = (payload) => {
            const summary = payload?.summary || 'Khách hàng cần hỗ trợ đặc biệt qua trợ lý Aria';
            toast(`🛎️ [Aria Handoff] ${summary}`, { duration: 7000 });
            fetchReservations();
            fetchEscalations();
        };

        const onEscalation = (payload) => {
            toast.success(`🛎️ [Đặt bàn đoàn] ${payload?.customer_name || 'Khách'} (${payload?.customer_phone || ''}) - ${payload?.guest_count || 15} người`, { duration: 8000 });
            fetchReservations();
            fetchEscalations();
        };

        socket.on('new_reservation', onNewRes);
        socket.on('ai_handoff_alert', onHandoff);
        socket.on('large_group_escalation', onEscalation);

        return () => {
            socket.off('new_reservation', onNewRes);
            socket.off('ai_handoff_alert', onHandoff);
            socket.off('large_group_escalation', onEscalation);
        };
    }, [socket, fetchReservations, fetchEscalations]);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.patch(`/api/reservations/${id}/status`, { status });
            toast.success(`Đã cập nhật trạng thái → ${getStatusVN(status)}`);
            fetchReservations();
            fetchEscalations();
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
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-lg">calendar_month</span>
                    <select
                        value={dateFilterType}
                        onChange={(e) => { setDateFilterType(e.target.value); setPage(1); }}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-gray-700 bg-gray-50/50"
                    >
                        <option value="today">Hôm nay</option>
                        <option value="single">Chọn một ngày</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="custom">Khoảng ngày tùy chỉnh</option>
                        <option value="all">Tất cả thời gian</option>
                    </select>
                </div>

                {dateFilterType === 'single' && (
                    <input
                        type="date"
                        value={singleDate}
                        onChange={(e) => { setSingleDate(e.target.value); setPage(1); }}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                )}

                {dateFilterType === 'custom' && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-medium">Từ</span>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                        <span className="text-xs text-gray-500 font-medium">Đến</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                    </div>
                )}

                <div className="flex items-center gap-2 ml-auto">
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium text-gray-700 bg-gray-50/50"
                    >
                        {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <button
                        onClick={fetchReservations}
                        className="px-3.5 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700 inline-flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Tổng số lượt', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50', icon: 'calendar_today', iconColor: 'text-gray-500' },
                    { label: 'Chờ xác nhận', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50/50', icon: 'hourglass_empty', iconColor: 'text-amber-500' },
                    { label: 'Đã xác nhận', value: stats.confirmed, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: 'check_circle', iconColor: 'text-blue-500' },
                    { label: 'Đang ngồi', value: stats.seated, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: 'table_restaurant', iconColor: 'text-emerald-500' },
                ].map((s) => (
                    <div key={s.label} className={`border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between ${s.bg}`}>
                        <div>
                            <p className="text-xs font-medium text-gray-500">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                        <span className={`material-symbols-outlined text-2xl ${s.iconColor}`}>{s.icon}</span>
                    </div>
                ))}
            </div>

            {/* ─── LEAD CARDS: YÊU CẦU ĐẶT BÀN ĐOÀN (ARIA ESCALATIONS) ─── */}
            {escalations.length > 0 && (
                <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-600">groups</span>
                                Yêu cầu đặt bàn đoàn chờ tư vấn (Aria Escalations)
                            </h2>
                            <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                                {escalations.length} yêu cầu
                            </span>
                        </div>
                        <button
                            onClick={fetchEscalations}
                            disabled={escalationsLoading}
                            className="text-xs font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition-colors"
                        >
                            <span className={`material-symbols-outlined text-sm ${escalationsLoading ? 'animate-spin' : ''}`}>refresh</span>
                            Làm mới
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {escalations.map((lead) => (
                            <div key={lead.id} className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">group</span>
                                            {lead.guest_count} khách
                                        </span>
                                        <span className="font-mono text-xs text-gray-400 font-semibold">{lead.booking_code}</span>
                                    </div>

                                    <div className="font-bold text-gray-800 text-base">{lead.customer_name}</div>
                                    
                                    <div className="mt-2 space-y-1.5 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5 font-medium text-emerald-700">
                                            <span className="material-symbols-outlined text-sm text-emerald-600">call</span>
                                            <a href={`tel:${lead.customer_phone}`} className="hover:underline font-bold">
                                                {lead.customer_phone}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-600">
                                            <span className="material-symbols-outlined text-sm text-gray-400">schedule</span>
                                            <span>{lead.reservation_time} ngày {lead.reservation_date}</span>
                                        </div>
                                        {lead.customer_email && (
                                            <div className="flex items-center gap-1.5 text-gray-500 truncate">
                                                <span className="material-symbols-outlined text-sm text-gray-400">mail</span>
                                                <span className="truncate">{lead.customer_email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {lead.special_requests && (
                                        <div className="mt-3 bg-amber-50/70 border border-amber-100 rounded-lg p-2.5 text-xs text-amber-900">
                                            <div className="font-semibold text-amber-800 flex items-center gap-1 mb-0.5">
                                                <span className="material-symbols-outlined text-xs">chat</span>
                                                Ghi chú từ Aria:
                                            </div>
                                            <p className="italic line-clamp-3">{lead.special_requests}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                                    <a
                                        href={`tel:${lead.customer_phone}`}
                                        className="flex-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xs">call</span>
                                        Gọi ngay
                                    </a>
                                    <button
                                        onClick={async () => {
                                            await handleUpdateStatus(lead.id, 'confirmed');
                                        }}
                                        className="flex-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xs">check</span>
                                        Đã chốt bàn
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm(`Hủy yêu cầu đặt bàn của ${lead.customer_name}?`)) {
                                                await handleUpdateStatus(lead.id, 'cancelled');
                                            }
                                        }}
                                        className="p-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors"
                                        title="Từ chối / Hủy"
                                    >
                                        <span className="material-symbols-outlined text-xs">close</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                </div>
            ) : reservations.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <span className="material-symbols-outlined text-5xl mb-3 text-gray-300">event_busy</span>
                    <p className="font-medium text-gray-600">Không có đặt bàn nào trong khoảng thời gian đã chọn</p>
                    <p className="text-xs text-gray-400 mt-1">Hãy thử chọn mốc thời gian khác hoặc làm mới danh sách</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
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
                                                <span className="material-symbols-outlined text-xs text-gray-400">edit_note</span>
                                                <span className="truncate">{r.special_requests}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-semibold flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs text-gray-400">schedule</span>
                                            <span>{r.reservation_time}</span>
                                        </div>
                                        <div className="text-xs text-gray-400 ml-4">→ {r.end_time}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-semibold">{r.guest_count}</span> người
                                        {r.deposit_amount > 0 && (
                                            <div className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined text-xs text-amber-500">payments</span>
                                                <span>Cọc: {r.deposit_amount?.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {r.tables ? (
                                            <div>
                                                <div className="font-semibold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-emerald-600">table_restaurant</span>
                                                    <span>Bàn {r.tables.table_number}</span>
                                                </div>
                                                <div className="text-xs text-gray-400 ml-4">{r.tables.location}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Chưa gán</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs text-gray-400">call</span>
                                            <span>{r.customer_phone}</span>
                                        </div>
                                        {r.customer_email && (
                                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-xs text-gray-400">mail</span>
                                                <span>{r.customer_email}</span>
                                            </div>
                                        )}
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
                                                    className="px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 inline-flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xs">check</span>
                                                    Xác nhận
                                                </button>
                                            )}
                                            {r.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'seated')}
                                                    className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 inline-flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xs">table_restaurant</span>
                                                    Check-in
                                                </button>
                                            )}
                                            {r.status === 'seated' && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'completed')}
                                                    className="px-2.5 py-1 bg-gray-600 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 inline-flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                                    Xong
                                                </button>
                                            )}
                                            {r.status === 'confirmed' && (
                                                <button
                                                    onClick={() => handleReallocate(r.id, r.customer_name)}
                                                    disabled={reallocatingId === r.id}
                                                    className="px-2.5 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 disabled:opacity-60 inline-flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    {reallocatingId === r.id ? (
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                            Đang đổi...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <span className="material-symbols-outlined text-xs">sync_alt</span>
                                                            Đổi bàn
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                            {['pending', 'confirmed'].includes(r.status) && (
                                                <button
                                                    onClick={() => handleUpdateStatus(r.id, 'cancelled')}
                                                    className="px-2.5 py-1 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 inline-flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xs">close</span>
                                                    Hủy
                                                </button>
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
                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50 inline-flex items-center gap-1 font-medium transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">chevron_left</span>
                                Trước
                            </button>
                            <span className="text-sm text-gray-500 font-medium">Trang {page} / {pagination.totalPages}</span>
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm disabled:opacity-50 hover:bg-gray-50 inline-flex items-center gap-1 font-medium transition-colors"
                            >
                                Sau
                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReservationManagement;
