import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

const OrderManagement = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [totalOrders, setTotalOrders] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;
    const fetchingRef = useRef(false);
    const debounceRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5001');

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchOrders = async (showLoading = true) => {
        // Prevent concurrent requests
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            if (showLoading) setLoading(true);
            let url = `${API_URL}/api/orders?limit=${itemsPerPage}&page=${currentPage}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

            const response = await axios.get(url, getAuthHeader());
            console.log('API Response:', response.data);
            setOrders(response.data.data || []);
            // Get total count and pages from pagination
            const total = response.data.pagination?.total || response.data.data?.length || 0;
            const pages = response.data.pagination?.totalPages || 1;
            console.log('Total orders:', total, 'Total pages:', pages, 'Pagination:', response.data.pagination);
            setTotalOrders(total);
            setTotalPages(pages);
        } catch (err) {
            console.error(err);
            toast.error(t('admin.order_fetch_error'));
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    };

    // Handle statusFilter changes - reset page and fetch immediately
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // Fetch when statusFilter or currentPage changes
    useEffect(() => {
        fetchOrders(true);
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [statusFilter, currentPage]);

    // Debounce search to avoid excessive API calls
    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 when searching
            fetchOrders(false); // Fetch silently, no loading spinner
        }, 500); // Wait 500ms after user stops typing

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    // Trigger immediate search (used by search button or Enter key)
    const handleSearch = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
            debounceRef.current = null;
        }
        fetchOrders(true);
    };

    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((currentTime - new Date(createdAt)) / 60000);
        if (diff < 1) return t('admin.order_new');
        if (diff < 60) return `${diff}m`;
        return `${Math.floor(diff / 60)}h`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('admin.status_pending') },
            processing: { bg: 'bg-blue-100', text: 'text-blue-700', label: t('admin.status_processing') },
            completed: { bg: 'bg-green-100', text: 'text-green-700', label: t('admin.status_completed') },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: t('admin.status_cancelled') }
        };
        return badges[status] || badges.pending;
    };

    const getPaymentStatusBadge = (status) => {
        const badges = {
            pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: t('admin.payment_pending') },
            waiting_payment: { bg: 'bg-orange-100', text: 'text-orange-700', label: t('admin.payment_waiting') },
            paid: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: t('admin.payment_paid') }
        };
        return badges[status] || badges.pending;
    };

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await axios.put(
                `${API_URL}/api/orders/${orderId}/status`,
                { status: newStatus },
                getAuthHeader()
            );
            toast.success(t('admin.order_updated'));
            fetchOrders(false);
            if (selectedOrder && selectedOrder.id === orderId) {
                setSelectedOrder({ ...selectedOrder, status: newStatus });
            }
        } catch (err) {
            toast.error(t('admin.order_update_error'));
        }
    };

    const filteredAndSortedOrders = useMemo(() => {
        // Orders already filtered by backend, just sort by date
        return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [orders]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                        {t('admin.order_management')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">{t('admin.order_count')}: {totalOrders}</p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">refresh</span>
                    {t('common.refresh')}
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('admin.order_search')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-lg">search</span>
                    </button>
                </form>

                {/* Status Filter */}
                <div className="flex flex-nowrap overflow-x-auto pb-2 sm:pb-0 sm:flex-wrap gap-2 no-scrollbar">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${statusFilter === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {t('admin.filter_all')} ({orders.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('pending')}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${statusFilter === 'pending'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            }`}
                    >
                        {t('admin.status_pending')} ({orders.filter(o => o.status === 'pending').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('processing')}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${statusFilter === 'processing'
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                    >
                        {t('admin.status_processing')} ({orders.filter(o => o.status === 'processing').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('completed')}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all flex-shrink-0 ${statusFilter === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                    >
                        {t('admin.status_completed')} ({orders.filter(o => o.status === 'completed').length})
                    </button>
                </div>
            </div>

            {/* Mobile Card View (Hidden on Desktop) */}
            <div className="block md:hidden space-y-4">
                {filteredAndSortedOrders.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl text-center text-gray-400">
                        {t('admin.order_empty')}
                    </div>
                ) : (
                    filteredAndSortedOrders.map(order => {
                        const badge = getStatusBadge(order.status);
                        const paymentBadge = getPaymentStatusBadge(order.payment_status);

                        return (
                            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="font-mono text-sm font-bold text-gray-800">#{order.id.slice(0, 8)}</span>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(order.created_at).toLocaleTimeString('vi-VN')} ({getElapsedTime(order.created_at)})
                                        </div>
                                    </div>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                                        {badge.label}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="material-symbols-outlined text-lg text-gray-400">table_restaurant</span>
                                        <span className="font-semibold">
                                            {order.tables?.table_number ? `Bàn ${order.tables.table_number}` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <span className="material-symbols-outlined text-lg text-gray-400">person</span>
                                        <span>{order.users?.full_name || t('admin.order_guest')}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                    <span className={`text-xs font-bold ${paymentBadge.text}`}>
                                        {paymentBadge.label}
                                    </span>
                                    <span className="font-bold text-emerald-600 text-lg">
                                        {order.total_amount?.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setIsDetailModalOpen(true);
                                    }}
                                    className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-all"
                                >
                                    {t('common.view')}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_id')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_table')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_customer')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_time')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_status')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_payment')}</th>
                                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">{t('admin.order_total')}</th>
                                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700">{t('common.action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAndSortedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                                        {t('admin.order_empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedOrders.map(order => {
                                    const badge = getStatusBadge(order.status);
                                    const paymentBadge = getPaymentStatusBadge(order.payment_status);

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-bold text-gray-800">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 font-semibold">
                                                {order.tables?.table_number ? `Bàn ${order.tables.table_number}` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {order.users?.full_name || t('admin.order_guest')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-600">
                                                    {new Date(order.created_at).toLocaleTimeString('vi-VN')}
                                                </div>
                                                <div className="text-xs text-gray-400">{getElapsedTime(order.created_at)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${badge.bg} ${badge.text}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${paymentBadge.bg} ${paymentBadge.text}`}>
                                                    {paymentBadge.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-emerald-600">
                                                    {order.total_amount?.toLocaleString('vi-VN')}đ
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsDetailModalOpen(true);
                                                    }}
                                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                                                >
                                                    {t('common.view')}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Common) */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-100">
                        <span className="text-sm text-gray-600 order-2 sm:order-1">
                            {t('admin.pagination_page')} {currentPage} {t('admin.pagination_of')} {totalPages}
                        </span>

                        <div className="flex gap-2 order-1 sm:order-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                ←
                            </button>

                            <div className="flex gap-1">
                                {[...Array(totalPages)].map((_, i) => {
                                    const page = i + 1;
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 1 && page <= currentPage + 1)
                                    ) {
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-2 rounded-lg font-bold transition-all ${currentPage === page
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    } else if (
                                        page === currentPage - 2 ||
                                        page === currentPage + 2
                                    ) {
                                        return <span key={page} className="px-2">...</span>;
                                    }
                                    return null;
                                })}
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination for Mobile Card View (if needed separate, using the same one for now inside hidden block above... wait, the pagination was inside the table div. I should move it out or duplicate it. Moving it out is cleaner.) */}
            {/* Note: I moved pagination inside the desktop block in the original code. 
                But for mobile, we need pagination too. 
                Let's make pagination a shared component or just place it outside the view containers.
             */}
            <div className="md:hidden">
                {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm disabled:opacity-50"
                            >
                                ← Prev
                            </button>
                            <span className="flex items-center px-4 font-bold text-gray-600 bg-white rounded-xl border border-gray-200">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm disabled:opacity-50"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Detail Modal */}
            {isDetailModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 flex justify-between items-center z-10">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                                {t('admin.order_details')} #{selectedOrder.id.slice(0, 8)}
                            </h2>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full bg-gray-50"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
                            {/* Order Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_table')}</p>
                                    <p className="text-lg font-bold text-gray-800">{selectedOrder.tables?.table_number}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_customer')}</p>
                                    <p className="text-lg font-bold text-gray-800">{selectedOrder.users?.full_name || t('admin.order_guest')}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_created')}</p>
                                    <p className="text-sm sm:text-lg font-bold text-gray-800">
                                        {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-bold">{t('admin.order_total')}</p>
                                    <p className="text-lg font-bold text-emerald-600">
                                        {selectedOrder.total_amount?.toLocaleString('vi-VN')}đ
                                    </p>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_status')}</p>
                                <div className="flex gap-2 flex-wrap">
                                    {['pending', 'processing', 'completed', 'cancelled'].map(status => {
                                        const badge = getStatusBadge(status);
                                        const isCurrentStatus = selectedOrder.status === status;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                                                className={`px-4 py-2 rounded-xl font-bold transition-all text-sm flex-1 sm:flex-none ${isCurrentStatus
                                                    ? `${badge.bg} ${badge.text} ring-2 ring-offset-1`
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {getStatusBadge(status).label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_items')}</p>
                                <div className="space-y-3">
                                    {selectedOrder.order_items?.map(item => (
                                        <div key={item.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="font-bold text-gray-800 text-sm sm:text-base">
                                                    {item.quantity}x {item.menu_items?.name}
                                                </div>
                                                <span className="text-emerald-600 font-bold text-sm sm:text-base">
                                                    {(item.unit_price * item.quantity).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-gray-500 italic mt-1">
                                                    📝 {item.notes}
                                                </p>
                                            )}
                                            {item.order_item_modifiers?.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.order_item_modifiers.map(m => (
                                                        <span key={m.id} className="inline-block text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap">
                                                            + {m.modifier_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Info */}
                            <div className="border-t border-gray-100 pt-6">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-3">{t('admin.order_payment')}</p>
                                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm sm:text-base">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t('admin.order_subtotal')}</span>
                                        <span className="font-bold">{(selectedOrder.subtotal || selectedOrder.total_amount).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    {selectedOrder.tax_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('admin.order_tax')}</span>
                                            <span className="font-bold">{selectedOrder.tax_amount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    {selectedOrder.discount_amount > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t('admin.order_discount')}</span>
                                            <span className="font-bold text-emerald-600">-{selectedOrder.discount_amount.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-2 flex justify-between mt-2">
                                        <span className="font-bold">{t('admin.order_total')}</span>
                                        <span className="text-lg font-bold text-emerald-600">{selectedOrder.total_amount?.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
