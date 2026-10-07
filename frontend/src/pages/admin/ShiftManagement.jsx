import { useState, useEffect, useCallback } from 'react';
import QRCode from 'react-qr-code';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * ShiftManagement.jsx — Quản lý ca làm việc (Admin)
 * Phase 5:
 * - Tab "Ca làm việc": CRUD shifts
 * - Tab "Phân ca tuần": Bảng lưới 7 ngày × các ca, gán nhân viên
 * - Tab "Điểm danh": Xem báo cáo điểm danh theo ngày
 * - Tab "Đổi ca": Duyệt yêu cầu đổi ca của nhân viên
 */
const ShiftManagement = () => {
    const [activeTab, setActiveTab] = useState('shifts');
    const [shifts, setShifts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [roster, setRoster] = useState({});
    const [attendance, setAttendance] = useState([]);
    const [swapRequests, setSwapRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [qrToken, setQrToken] = useState(null);
    const [qrCountdown, setQrCountdown] = useState(0);

    // Form states
    const [shiftForm, setShiftForm] = useState({ name: '', start_time: '', end_time: '', min_staff: { waiter: 2, kitchen: 2, admin: 1 } });
    const [editingShift, setEditingShift] = useState(null);
    const [showShiftForm, setShowShiftForm] = useState(false);

    // Helper định dạng ngày YYYY-MM-DD theo giờ địa phương (tránh lỗi timezone lệch ngày)
    const formatLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Week navigation - tính ngày Thứ 2 của tuần chứa date
    const getWeekStart = (date = new Date()) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
        const diff = day === 0 ? -6 : 1 - day; // Nếu là CN lùi 6 ngày, còn lại (1 - day) ngày
        d.setDate(d.getDate() + diff);
        return formatLocalDate(d);
    };
    const [weekStart, setWeekStart] = useState(getWeekStart());

    const getWeekDays = (start) => {
        const days = [];
        const [y, m, dNum] = start.split('-').map(Number);
        for (let i = 0; i < 7; i++) {
            const dayObj = new Date(y, m - 1, dNum + i);
            days.push(formatLocalDate(dayObj));
        }
        return days;
    };
    const weekDays = getWeekDays(weekStart);
    const weekEnd = weekDays[6];

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [assignForm, setAssignForm] = useState({ shift_id: '', user_id: '', shift_date: '' });

    // ─── Fetch Data ─────────────────────────────────────────────────────────

    const fetchShifts = useCallback(async () => {
        try {
            const res = await api.get('/api/shifts/admin/shifts');
            setShifts(res.data.data || []);
        } catch (_) { toast.error('Không thể tải danh sách ca'); }
    }, []);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/staff');
            setStaff(res.data.data || []);
        } catch (_) {}
    }, []);

    const fetchRoster = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/shifts/admin/rosters', { params: { week_start: weekStart, week_end: weekEnd } });
            setRoster(res.data.data || {});
        } catch (_) { toast.error('Không thể tải lịch trực'); }
        finally { setLoading(false); }
    }, [weekStart, weekEnd]);

    const fetchAttendance = useCallback(async () => {
        try {
            const res = await api.get('/api/shifts/admin/attendance', { params: { date: attendanceDate } });
            setAttendance(res.data.data || []);
        } catch (_) {}
    }, [attendanceDate]);

    const fetchSwapRequests = useCallback(async () => {
        try {
            const res = await api.get('/api/shifts/swap-requests');
            setSwapRequests(res.data.data || []);
        } catch (_) {}
    }, []);

    useEffect(() => { fetchShifts(); fetchStaff(); }, []);
    useEffect(() => { if (activeTab === 'roster') fetchRoster(); }, [activeTab, weekStart]);
    useEffect(() => { if (activeTab === 'attendance') fetchAttendance(); }, [activeTab, attendanceDate]);
    useEffect(() => { if (activeTab === 'swap') fetchSwapRequests(); }, [activeTab]);

    // ─── QR Token cho điểm danh (tự refresh 30s) ────────────────────────────

    const refreshQRToken = useCallback(async () => {
        try {
            const res = await api.get('/api/shifts/attendance/qr-token');
            setQrToken(res.data.data.token);
            setQrCountdown(30);
        } catch (_) {}
    }, []);

    useEffect(() => {
        if (activeTab !== 'attendance') return;
        refreshQRToken();
        const tokenInterval = setInterval(refreshQRToken, 30000);
        const countdownInterval = setInterval(() => setQrCountdown((c) => Math.max(0, c - 1)), 1000);
        return () => { clearInterval(tokenInterval); clearInterval(countdownInterval); };
    }, [activeTab]);

    // ─── Shift CRUD ─────────────────────────────────────────────────────────

    const handleSaveShift = async () => {
        try {
            if (editingShift) {
                await api.put(`/api/shifts/admin/shifts/${editingShift.id}`, shiftForm);
                toast.success('Đã cập nhật ca làm việc');
            } else {
                await api.post('/api/shifts/admin/shifts', shiftForm);
                toast.success('Đã tạo ca làm việc mới');
            }
            setShowShiftForm(false);
            setEditingShift(null);
            setShiftForm({ name: '', start_time: '', end_time: '', min_staff: { waiter: 2, kitchen: 2, admin: 1 } });
            fetchShifts();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Lưu thất bại');
        }
    };

    const handleDeleteShift = async (id, name) => {
        if (!confirm(`Vô hiệu hóa ca "${name}"?`)) return;
        try {
            await api.delete(`/api/shifts/admin/shifts/${id}`);
            toast.success('Đã vô hiệu hóa ca');
            fetchShifts();
        } catch (_) { toast.error('Xóa thất bại'); }
    };

    // ─── Roster ─────────────────────────────────────────────────────────────

    const handleAssignShift = async () => {
        if (!assignForm.shift_id || !assignForm.user_id || !assignForm.shift_date) {
            return toast.error('Vui lòng điền đầy đủ thông tin phân ca');
        }
        try {
            await api.post('/api/shifts/admin/rosters/assign', assignForm);
            toast.success('Đã phân ca thành công');
            setAssignForm({ shift_id: '', user_id: '', shift_date: '' });
            fetchRoster();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Phân ca thất bại');
        }
    };

    const handleRemoveAssignment = async (id) => {
        try {
            await api.delete(`/api/shifts/admin/rosters/${id}`);
            toast.success('Đã hủy phân công');
            fetchRoster();
        } catch (_) { toast.error('Hủy thất bại'); }
    };

    // ─── Swap Requests ───────────────────────────────────────────────────────

    const handleApproveSwap = async (id) => {
        try {
            await api.patch(`/api/shifts/admin/swap-requests/${id}/approve`);
            toast.success('Đã duyệt và thực hiện đổi ca');
            fetchSwapRequests();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Duyệt thất bại');
        }
    };

    const getSwapStatusColor = (status) => {
        const m = { pending: 'bg-amber-100 text-amber-700', accepted_by_peer: 'bg-blue-100 text-blue-700', approved_by_admin: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600' };
        return m[status] || 'bg-gray-100 text-gray-600';
    };

    const getStatusColor = (status) => {
        const m = { scheduled: 'bg-blue-100 text-blue-700', checked_in: 'bg-emerald-100 text-emerald-700', checked_out: 'bg-gray-100 text-gray-600', absent: 'bg-red-100 text-red-700', swapped: 'bg-purple-100 text-purple-700' };
        return m[status] || 'bg-gray-100';
    };

    const tabs = [
        { id: 'shifts', label: 'Ca làm việc', icon: 'schedule' },
        { id: 'roster', label: 'Phân ca tuần', icon: 'calendar_month' },
        { id: 'attendance', label: 'Điểm danh', icon: 'fact_check' },
        { id: 'swap', label: 'Đổi ca', icon: 'swap_horiz' },
    ];

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl text-emerald-600">groups</span>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Ca làm việc</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Xếp lịch, điểm danh và quản lý đổi ca nhân viên</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-colors ${
                            activeTab === tab.id
                                ? 'bg-emerald-600 text-white border-b-2 border-emerald-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ─── TAB: CA LÀM VIỆC ─── */}
            {activeTab === 'shifts' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">Danh sách ca</h2>
                        <button
                            onClick={() => { setShowShiftForm(true); setEditingShift(null); setShiftForm({ name: '', start_time: '', end_time: '', min_staff: { waiter: 2, kitchen: 2, admin: 1 } }); }}
                            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700"
                        >
                            + Thêm ca mới
                        </button>
                    </div>

                    {showShiftForm && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
                            <h3 className="font-semibold text-gray-700 mb-4">{editingShift ? '✏️ Chỉnh sửa ca' : '➕ Tạo ca mới'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Tên ca *</label>
                                    <input
                                        type="text"
                                        value={shiftForm.name}
                                        onChange={(e) => setShiftForm((p) => ({ ...p, name: e.target.value }))}
                                        placeholder="VD: Ca sáng, Ca chiều, Ca gãy"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Giờ bắt đầu *</label>
                                        <input
                                            type="time"
                                            value={shiftForm.start_time}
                                            onChange={(e) => setShiftForm((p) => ({ ...p, start_time: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Giờ kết thúc *</label>
                                        <input
                                            type="time"
                                            value={shiftForm.end_time}
                                            onChange={(e) => setShiftForm((p) => ({ ...p, end_time: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-600 mb-2">Định mức tối thiểu</label>
                                <div className="flex gap-4">
                                    {['waiter', 'kitchen', 'admin'].map((role) => (
                                        <div key={role} className="flex items-center gap-2">
                                            <label className="text-xs text-gray-500 capitalize">{role}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="20"
                                                value={shiftForm.min_staff[role]}
                                                onChange={(e) => setShiftForm((p) => ({ ...p, min_staff: { ...p.min_staff, [role]: parseInt(e.target.value) || 0 } }))}
                                                className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button onClick={handleSaveShift} className="px-5 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700">
                                    {editingShift ? 'Cập nhật' : 'Tạo ca'}
                                </button>
                                <button onClick={() => setShowShiftForm(false)} className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50">
                                    Hủy
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {shifts.map((shift) => (
                            <div key={shift.id} className={`border rounded-2xl p-4 shadow-sm ${shift.is_active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{shift.name}</h3>
                                        <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[15px] text-gray-400">schedule</span>
                                            <span>{shift.start_time} — {shift.end_time}</span>
                                        </p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${shift.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {shift.is_active ? 'Hoạt động' : 'Vô hiệu'}
                                    </span>
                                </div>
                                <div className="mt-3 flex gap-3 text-xs text-gray-600">
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">room_service</span> Waiter: {shift.min_staff?.waiter || 0}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">restaurant</span> Bếp: {shift.min_staff?.kitchen || 0}</span>
                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">manage_accounts</span> Quản lý: {shift.min_staff?.admin || 0}</span>
                                </div>
                                {shift.is_active && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => {
                                                setEditingShift(shift);
                                                setShiftForm({
                                                    name: shift.name,
                                                    start_time: shift.start_time?.slice(0, 5) || '',
                                                    end_time: shift.end_time?.slice(0, 5) || '',
                                                    min_staff: shift.min_staff || { waiter: 2, kitchen: 2, admin: 1 }
                                                });
                                                setShowShiftForm(true);
                                            }}
                                            className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">edit</span>
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDeleteShift(shift.id, shift.name)}
                                            className="flex-1 py-1.5 border border-red-200 text-red-600 text-xs rounded-lg hover:bg-red-50 flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">block</span>
                                            Vô hiệu
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── TAB: PHÂN CA TUẦN ─── */}
            {activeTab === 'roster' && (
                <div>
                    {/* Week navigation */}
                    <div className="flex items-center gap-4 mb-5">
                        <button
                            onClick={() => {
                                const [y, m, d] = weekStart.split('-').map(Number);
                                const prev = new Date(y, m - 1, d - 7);
                                setWeekStart(formatLocalDate(prev));
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 flex items-center gap-1 font-medium"
                        >
                            <span className="material-symbols-outlined text-base">chevron_left</span>
                            Tuần trước
                        </button>
                        <button
                            onClick={() => setWeekStart(getWeekStart())}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-xs hover:bg-gray-50 text-gray-600 font-medium"
                        >
                            Hôm nay
                        </button>
                        <span className="font-semibold text-gray-700 min-w-[200px] text-center">
                            {new Date(weekStart + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                            {' '} – {' '}
                            {new Date(weekEnd + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </span>
                        <button
                            onClick={() => {
                                const [y, m, d] = weekStart.split('-').map(Number);
                                const next = new Date(y, m - 1, d + 7);
                                setWeekStart(formatLocalDate(next));
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 flex items-center gap-1 font-medium"
                        >
                            Tuần sau
                            <span className="material-symbols-outlined text-base">chevron_right</span>
                        </button>
                    </div>

                    {/* Quick assign form */}
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
                        <h3 className="text-sm font-semibold text-blue-700 mb-3">➕ Gán nhân viên vào ca</h3>
                        <div className="flex flex-wrap gap-3">
                            <select
                                value={assignForm.shift_id}
                                onChange={(e) => setAssignForm((p) => ({ ...p, shift_id: e.target.value }))}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">-- Chọn ca --</option>
                                {shifts.filter((s) => s.is_active).map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>
                                ))}
                            </select>
                            <select
                                value={assignForm.user_id}
                                onChange={(e) => setAssignForm((p) => ({ ...p, user_id: e.target.value }))}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value="">-- Chọn nhân viên --</option>
                                {staff.map((s) => (
                                    <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                                ))}
                            </select>
                            <input
                                type="date"
                                value={assignForm.shift_date}
                                min={weekStart}
                                max={weekEnd}
                                onChange={(e) => setAssignForm((p) => ({ ...p, shift_date: e.target.value }))}
                                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <button
                                onClick={handleAssignShift}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-xl font-semibold hover:bg-blue-700"
                            >
                                Gán ca
                            </button>
                        </div>
                    </div>

                    {/* Roster Grid */}
                    {loading ? (
                        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr>
                                        <th className="bg-gray-50 border border-gray-200 px-3 py-3 text-left font-semibold text-gray-600 min-w-[120px]">Ca</th>
                                        {weekDays.map((day, i) => (
                                            <th key={day} className="bg-gray-50 border border-gray-200 px-3 py-3 text-center font-semibold text-gray-600 min-w-[120px]">
                                                <div>{dayLabels[i]}</div>
                                                <div className="text-xs text-gray-400 font-normal">
                                                    {new Date(day + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.filter((s) => s.is_active).map((shift) => {
                                        // Kiểm tra mỗi ô có đủ nhân viên không
                                        return (
                                            <tr key={shift.id}>
                                                <td className="border border-gray-200 px-3 py-2 bg-white">
                                                    <div className="font-semibold">{shift.name}</div>
                                                    <div className="text-xs text-gray-400">{shift.start_time}–{shift.end_time}</div>
                                                </td>
                                                {weekDays.map((day) => {
                                                    const cell = roster[day]?.[shift.id];
                                                    const assignments = cell?.assignments || [];
                                                    const minWaiter = shift.min_staff?.waiter || 0;
                                                    const currentWaiter = assignments.filter((a) => a.user?.role === 'waiter').length;
                                                    const isUnderStaffed = currentWaiter < minWaiter;

                                                    return (
                                                        <td
                                                            key={day}
                                                            className={`border border-gray-200 px-2 py-2 align-top transition-colors ${
                                                                isUnderStaffed ? 'bg-amber-50/50' : 'bg-white'
                                                            }`}
                                                        >
                                                            {assignments.length === 0 ? (
                                                                <div
                                                                    onClick={() => setAssignForm((p) => ({ ...p, shift_id: shift.id, shift_date: day }))}
                                                                    className="text-center py-2 cursor-pointer group rounded hover:bg-blue-50/50 transition-colors"
                                                                    title="Nhấn để gán nhân viên vào ca này"
                                                                >
                                                                    <span className="text-gray-300 text-xs block group-hover:hidden">—</span>
                                                                    <span className="hidden group-hover:inline-block text-xs text-blue-600 font-semibold">
                                                                        + Gán ca
                                                                    </span>
                                                                    {minWaiter > 0 && (
                                                                        <div className="text-[10px] text-amber-600 font-medium mt-1">
                                                                            Trống (Cần {minWaiter} waiter)
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    {assignments.map((a) => (
                                                                        <div key={a.id} className="flex items-center justify-between gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shadow-xs">
                                                                            <div className="min-w-0">
                                                                                <div className="text-xs font-semibold truncate">{a.user?.full_name}</div>
                                                                                <div className="text-[10px] text-gray-400 capitalize">{a.user?.role}</div>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => handleRemoveAssignment(a.id)}
                                                                                className="text-red-400 hover:text-red-600 text-xs shrink-0"
                                                                                title="Hủy phân công"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {isUnderStaffed && (
                                                                        <div className="text-[10px] text-amber-700 font-semibold text-center mt-1 bg-amber-100/70 py-0.5 rounded">
                                                                            Thiếu {minWaiter - currentWaiter} waiter
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TAB: ĐIỂM DANH ─── */}
            {activeTab === 'attendance' && (
                <div>
                    <div className="flex flex-wrap items-start gap-6 mb-6">
                        {/* QR Token động */}
                        <div className="bg-white border-2 border-emerald-400 rounded-2xl p-5 text-center shadow-sm max-w-xs">
                            <h3 className="font-semibold text-gray-700 mb-2 flex items-center justify-center gap-1.5">
                                <span className="material-symbols-outlined text-lg text-emerald-600">qr_code_2</span>
                                Mã QR Điểm Danh Động
                            </h3>
                            {qrToken ? (
                                <>
                                    <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-inner inline-block my-2">
                                        <QRCode value={qrToken} size={150} level="M" />
                                    </div>
                                    <div className={`text-sm font-bold ${qrCountdown <= 10 ? 'text-red-600 animate-pulse' : 'text-emerald-600'}`}>
                                        Hết hạn sau: {qrCountdown}s
                                    </div>
                                    <div className="flex gap-2 justify-center mt-3">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(qrToken);
                                                toast.success('Đã sao chép token!');
                                            }}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-xl font-medium hover:bg-gray-200 inline-flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">content_copy</span>
                                            Copy token
                                        </button>
                                        <button onClick={refreshQRToken} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-xl font-semibold hover:bg-emerald-700 inline-flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs">refresh</span>
                                            Làm mới
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-gray-400 text-sm py-8">Đang tải token...</div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Mã QR tự động làm mới mỗi 30 giây để bảo mật</p>
                        </div>

                        {/* Date picker */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                />
                                <button onClick={fetchAttendance} className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-semibold hover:bg-emerald-700 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">refresh</span>
                                    Tải lại
                                </button>
                            </div>

                            {/* Attendance stats */}
                            <div className="flex gap-3">
                                {[
                                    { label: 'Đúng giờ', value: attendance.filter((a) => a.status === 'checked_in' || a.status === 'checked_out').length, color: 'text-emerald-600' },
                                    { label: 'Vắng mặt', value: attendance.filter((a) => a.status === 'absent').length, color: 'text-red-600' },
                                    { label: 'Chưa điểm danh', value: attendance.filter((a) => a.status === 'scheduled').length, color: 'text-amber-600' },
                                ].map((s) => (
                                    <div key={s.label} className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
                                        <p className="text-xs text-gray-400">{s.label}</p>
                                        <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Nhân viên</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Ca</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Trạng thái</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Check-in</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Check-out</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendance.map((a) => (
                                    <tr key={a.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-800">{a.users?.full_name}</div>
                                            <div className="text-xs text-gray-400 capitalize">{a.users?.role}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{a.shifts?.name}</div>
                                            <div className="text-xs text-gray-400">{a.shifts?.start_time}–{a.shifts?.end_time}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(a.status)}`}>
                                                {a.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </td>
                                    </tr>
                                ))}
                                {attendance.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">Không có dữ liệu điểm danh</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ─── TAB: ĐỔI CA ─── */}
            {activeTab === 'swap' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">Yêu cầu đổi ca</h2>
                        <button onClick={fetchSwapRequests} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-base">refresh</span>
                            Tải lại
                        </button>
                    </div>

                    {swapRequests.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <div className="mb-2">
                                <span className="material-symbols-outlined text-4xl text-gray-300">swap_horiz</span>
                            </div>
                            <p>Không có yêu cầu đổi ca nào</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {swapRequests.map((req) => (
                                <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="font-semibold text-gray-800">
                                                    {req.requester?.full_name} → {req.target_user?.full_name}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSwapStatusColor(req.status)}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                <span>📅 Ca: {req.shift_assignments?.shifts?.name} ({req.shift_assignments?.shift_date})</span>
                                                {req.reason && <span className="ml-4">💬 {req.reason}</span>}
                                            </div>
                                        </div>
                                        {req.status === 'accepted_by_peer' && (
                                            <button
                                                onClick={() => handleApproveSwap(req.id)}
                                                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 whitespace-nowrap"
                                            >
                                                ✅ Duyệt đổi ca
                                            </button>
                                        )}
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

export default ShiftManagement;
