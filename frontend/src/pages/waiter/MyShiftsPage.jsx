import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * MyShiftsPage.jsx — Cổng nhân viên: Xem lịch trực & Điểm danh (Waiter/Kitchen)
 * Phase 5:
 * - Xem lịch trực cá nhân trong tuần
 * - Điểm danh vào/ra ca bằng QR hoặc nút bấm (có popup nhập QR token)
 * - Gửi yêu cầu đổi ca
 * - Xem trạng thái yêu cầu đổi ca đã gửi
 */
const MyShiftsPage = () => {
    const [myShifts, setMyShifts] = useState([]);
    const [staff, setStaff] = useState([]);
    const [mySwapRequests, setMySwapRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'swap'

    // QR Check-in modal
    const [checkInModal, setCheckInModal] = useState(null); // { assignmentId, shiftName }
    const [qrInput, setQrInput] = useState('');
    const [checkingIn, setCheckingIn] = useState(false);

    // Swap modal
    const [swapModal, setSwapModal] = useState(null); // { assignmentId }
    const [swapTargetUserId, setSwapTargetUserId] = useState('');
    const [swapReason, setSwapReason] = useState('');
    const [submittingSwap, setSubmittingSwap] = useState(false);

    // Week navigation
    const getWeekStart = (offset = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay() + 1 + offset * 7);
        return d.toISOString().split('T')[0];
    };
    const [weekOffset, setWeekOffset] = useState(0);
    const weekStart = getWeekStart(weekOffset);
    const weekEnd = (() => { const d = new Date(weekStart + 'T00:00:00'); d.setDate(d.getDate() + 6); return d.toISOString().split('T')[0]; })();

    const today = new Date().toISOString().split('T')[0];

    // ─── Fetch ─────────────────────────────────────────────────────────────

    const fetchMyShifts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/shifts/my-shifts', { params: { week_start: weekStart, week_end: weekEnd } });
            setMyShifts(res.data.data || []);
        } catch (_) { toast.error('Không thể tải lịch trực'); }
        finally { setLoading(false); }
    }, [weekStart, weekEnd]);

    const fetchStaff = useCallback(async () => {
        try {
            const res = await api.get('/api/admin/staff');
            setStaff(res.data.data || []);
        } catch (_) {}
    }, []);

    const fetchMySwapRequests = useCallback(async () => {
        try {
            const res = await api.get('/api/shifts/swap-requests');
            setMySwapRequests(res.data.data || []);
        } catch (_) {}
    }, []);

    useEffect(() => { fetchMyShifts(); }, [fetchMyShifts]);
    useEffect(() => { fetchStaff(); fetchMySwapRequests(); }, []);

    // ─── Check-in / Check-out ────────────────────────────────────────────────

    const handleCheckIn = async () => {
        if (!qrInput.trim()) return toast.error('Vui lòng nhập hoặc quét mã QR');
        setCheckingIn(true);
        try {
            await api.post('/api/shifts/attendance/check-in', {
                qr_token: qrInput.trim(),
                assignment_id: checkInModal.assignmentId,
            });
            toast.success(`✅ Điểm danh vào ca ${checkInModal.shiftName} thành công!`);
            setCheckInModal(null);
            setQrInput('');
            fetchMyShifts();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Điểm danh thất bại');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleCheckOut = async (assignmentId, shiftName) => {
        try {
            await api.post('/api/shifts/attendance/check-out', { assignment_id: assignmentId });
            toast.success(`✅ Điểm danh kết thúc ca ${shiftName}`);
            fetchMyShifts();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Check-out thất bại');
        }
    };

    // ─── Swap Request ────────────────────────────────────────────────────────

    const handleSubmitSwap = async () => {
        if (!swapTargetUserId) return toast.error('Vui lòng chọn nhân viên muốn đổi ca');
        setSubmittingSwap(true);
        try {
            await api.post('/api/shifts/swap-requests', {
                assignment_id: swapModal.assignmentId,
                target_user_id: swapTargetUserId,
                reason: swapReason.trim() || undefined,
            });
            toast.success('Đã gửi yêu cầu đổi ca! Chờ đồng nghiệp xác nhận.');
            setSwapModal(null);
            setSwapTargetUserId('');
            setSwapReason('');
            fetchMySwapRequests();
        } catch (err) {
            toast.error(err.response?.data?.error?.message || 'Gửi yêu cầu thất bại');
        } finally {
            setSubmittingSwap(false);
        }
    };

    const handleRespondSwap = async (requestId, action) => {
        try {
            await api.patch(`/api/shifts/swap-requests/${requestId}/respond`, { action });
            toast.success(action === 'accept' ? '✅ Đã đồng ý đổi ca' : 'Đã từ chối yêu cầu');
            fetchMySwapRequests();
        } catch (err) {
            toast.error('Xử lý thất bại');
        }
    };

    // ─── Helpers ────────────────────────────────────────────────────────────

    const getStatusColor = (status) => {
        const m = { scheduled: 'bg-blue-100 text-blue-700', checked_in: 'bg-emerald-100 text-emerald-700', checked_out: 'bg-gray-100 text-gray-600', absent: 'bg-red-100 text-red-700', swapped: 'bg-purple-100 text-purple-700' };
        return m[status] || 'bg-gray-100 text-gray-600';
    };

    const getStatusVN = (status) => {
        const m = { scheduled: 'Đã xếp ca', checked_in: 'Đang làm việc', checked_out: 'Đã kết thúc', absent: 'Vắng mặt', swapped: 'Đã đổi ca' };
        return m[status] || status;
    };

    const getSwapStatusColor = (status) => {
        const m = { pending: 'bg-amber-100 text-amber-700', accepted_by_peer: 'bg-blue-100 text-blue-700', approved_by_admin: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' };
        return m[status] || 'bg-gray-100 text-gray-600';
    };

    const getSwapStatusVN = (status) => {
        const m = { pending: 'Chờ phản hồi', accepted_by_peer: 'Chờ Admin duyệt', approved_by_admin: 'Đã duyệt', rejected: 'Đã từ chối', cancelled: 'Đã hủy' };
        return m[status] || status;
    };

    const weekDayLabel = (dateStr) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
    };

    // Group shifts by date
    const shiftsByDate = myShifts.reduce((acc, s) => {
        if (!acc[s.shift_date]) acc[s.shift_date] = [];
        acc[s.shift_date].push(s);
        return acc;
    }, {});

    const pendingSwapRequests = mySwapRequests.filter((r) => r.status === 'pending' && r.target_user?.id === JSON.parse(localStorage.getItem('user') || '{}')?.id);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg min-h-[85vh]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">📅 Lịch Trực Của Tôi</h1>
                    <p className="text-gray-500 text-sm mt-1">Xem lịch, điểm danh và đổi ca</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'schedule' ? 'bg-emerald-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        📅 Lịch trực
                    </button>
                    <button
                        onClick={() => setActiveTab('swap')}
                        className={`relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${activeTab === 'swap' ? 'bg-emerald-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        🔄 Đổi ca
                        {pendingSwapRequests.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {pendingSwapRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ─── TAB: LỊCH TRỰC ─── */}
            {activeTab === 'schedule' && (
                <>
                    {/* Week navigation */}
                    <div className="flex items-center justify-between mb-5">
                        <button
                            onClick={() => setWeekOffset((o) => o - 1)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                        >
                            ← Tuần trước
                        </button>
                        <div className="text-center">
                            <span className="font-semibold text-gray-700">
                                {new Date(weekStart + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                {' '} – {' '}
                                {new Date(weekEnd + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            {weekOffset === 0 && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Tuần này</span>}
                        </div>
                        <button
                            onClick={() => setWeekOffset((o) => o + 1)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                        >
                            Tuần sau →
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" /></div>
                    ) : myShifts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400">
                            <div className="text-5xl mb-3">🗓️</div>
                            <p>Bạn không có ca trực nào trong tuần này</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(shiftsByDate)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([date, shifts]) => (
                                    <div key={date} className={`rounded-2xl border-2 overflow-hidden ${date === today ? 'border-emerald-400 shadow-md' : 'border-gray-200'}`}>
                                        <div className={`px-4 py-3 flex items-center justify-between ${date === today ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-gray-700">{weekDayLabel(date)}</span>
                                                {date === today && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">Hôm nay</span>}
                                            </div>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {shifts.map((shift) => (
                                                <div key={shift.id} className="flex items-center justify-between px-4 py-4 bg-white">
                                                    <div>
                                                        <div className="font-semibold text-gray-800">{shift.shifts?.name}</div>
                                                        <div className="text-sm text-gray-500 mt-0.5">
                                                            🕐 {shift.shifts?.start_time} – {shift.shifts?.end_time}
                                                        </div>
                                                        {shift.check_in_time && (
                                                            <div className="text-xs text-emerald-600 mt-0.5">
                                                                ✓ Vào: {new Date(shift.check_in_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                        {shift.check_out_time && (
                                                            <div className="text-xs text-gray-400 mt-0.5">
                                                                ✓ Ra: {new Date(shift.check_out_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(shift.status)}`}>
                                                            {getStatusVN(shift.status)}
                                                        </span>
                                                        {/* Điểm danh vào ca */}
                                                        {date === today && shift.status === 'scheduled' && (
                                                            <button
                                                                onClick={() => setCheckInModal({ assignmentId: shift.id, shiftName: shift.shifts?.name })}
                                                                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700"
                                                            >
                                                                📱 Điểm danh
                                                            </button>
                                                        )}
                                                        {/* Check-out */}
                                                        {date === today && shift.status === 'checked_in' && (
                                                            <button
                                                                onClick={() => handleCheckOut(shift.id, shift.shifts?.name)}
                                                                className="px-3 py-1.5 bg-gray-600 text-white text-xs font-semibold rounded-xl hover:bg-gray-700"
                                                            >
                                                                ✓ Kết thúc ca
                                                            </button>
                                                        )}
                                                        {/* Đổi ca */}
                                                        {shift.status === 'scheduled' && (
                                                            <button
                                                                onClick={() => setSwapModal({ assignmentId: shift.id, shiftName: shift.shifts?.name, shiftDate: date })}
                                                                className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50"
                                                            >
                                                                🔄 Đổi ca
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </>
            )}

            {/* ─── TAB: ĐỔI CA ─── */}
            {activeTab === 'swap' && (
                <div className="space-y-4">
                    {/* Yêu cầu mình nhận */}
                    {pendingSwapRequests.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                            <h3 className="font-semibold text-amber-700 mb-3">📬 Yêu cầu đổi ca gửi đến bạn</h3>
                            {pendingSwapRequests.map((req) => (
                                <div key={req.id} className="bg-white rounded-xl p-4 shadow-sm mb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-semibold">{req.requester?.full_name} muốn đổi ca với bạn</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                📅 Ca {req.shift_assignments?.shifts?.name} — {req.shift_assignments?.shift_date}
                                            </div>
                                            {req.reason && <div className="text-sm text-gray-400 mt-1">💬 {req.reason}</div>}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button onClick={() => handleRespondSwap(req.id, 'accept')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700">✅ Đồng ý</button>
                                            <button onClick={() => handleRespondSwap(req.id, 'reject')} className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-50">✕ Từ chối</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Lịch sử yêu cầu của mình */}
                    <div>
                        <h3 className="font-semibold text-gray-700 mb-3">📋 Lịch sử yêu cầu đổi ca</h3>
                        {mySwapRequests.length === 0 ? (
                            <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">🔄</div><p>Chưa có yêu cầu đổi ca nào</p></div>
                        ) : (
                            <div className="space-y-3">
                                {mySwapRequests.map((req) => (
                                    <div key={req.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    {req.requester?.full_name === JSON.parse(localStorage.getItem('user') || '{}')?.full_name
                                                        ? `Bạn → ${req.target_user?.full_name}`
                                                        : `${req.requester?.full_name} → Bạn`}
                                                </div>
                                                <div className="text-xs text-gray-400 mt-0.5">
                                                    Ca: {req.shift_assignments?.shifts?.name} — {req.shift_assignments?.shift_date}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getSwapStatusColor(req.status)}`}>
                                                {getSwapStatusVN(req.status)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── MODAL: ĐIỂM DANH ─── */}
            {checkInModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">📱 Điểm danh vào ca</h3>
                        <p className="text-gray-500 text-sm mb-4">Ca: <strong>{checkInModal.shiftName}</strong></p>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nhập hoặc quét token QR từ màn hình quầy thu ngân:</label>
                        <input
                            type="text"
                            value={qrInput}
                            onChange={(e) => setQrInput(e.target.value)}
                            placeholder="Dán token QR vào đây..."
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-4"
                            autoFocus
                        />
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mb-4">
                            ⚠️ Token chỉ có hiệu lực 30 giây và chỉ hoạt động trong mạng Wifi nội bộ của nhà hàng.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => { setCheckInModal(null); setQrInput(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
                                Hủy
                            </button>
                            <button onClick={handleCheckIn} disabled={checkingIn || !qrInput.trim()} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60">
                                {checkingIn ? 'Đang xử lý...' : '✅ Xác nhận điểm danh'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── MODAL: ĐỔI CA ─── */}
            {swapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">🔄 Yêu cầu đổi ca</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            Ca: <strong>{swapModal.shiftName}</strong> — {swapModal.shiftDate}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chọn đồng nghiệp muốn đổi *</label>
                                <select
                                    value={swapTargetUserId}
                                    onChange={(e) => setSwapTargetUserId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {staff.map((s) => (
                                        <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lý do (không bắt buộc)</label>
                                <textarea
                                    value={swapReason}
                                    onChange={(e) => setSwapReason(e.target.value)}
                                    placeholder="VD: Có việc bận đột xuất..."
                                    rows={3}
                                    maxLength={300}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => { setSwapModal(null); setSwapTargetUserId(''); setSwapReason(''); }} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
                                Hủy
                            </button>
                            <button onClick={handleSubmitSwap} disabled={submittingSwap} className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-60">
                                {submittingSwap ? 'Đang gửi...' : '📨 Gửi yêu cầu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyShiftsPage;
