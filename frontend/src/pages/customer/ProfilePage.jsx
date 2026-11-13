import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAiChat } from '../../contexts/AiChatContext';

const commonAllergens = ['Đậu phộng', 'Tôm', 'Cua biển', 'Hải sản có vỏ', 'Sữa tươi', 'Trứng', 'Gluten / Bột mì', 'Đậu nành'];

const ProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { refreshGuestProfile } = useAiChat();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Profile form state
    const [profileData, setProfileData] = useState({
        full_name: '',
        phone: '',
        avatar_url: ''
    });

    // Password form state
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // MemGPT Guest Profile state (Phase 6 - Tính năng F4)
    const [guestProfile, setGuestProfile] = useState({
        allergies: [],
        spice_preference: 'vừa',
        preferred_zone: '',
        special_notes: '',
        favorite_dishes: [],
        visit_count: 1
    });
    const [loadingGuestProfile, setLoadingGuestProfile] = useState(true);
    const [savingGuestProfile, setSavingGuestProfile] = useState(false);
    const [newAllergenInput, setNewAllergenInput] = useState('');
    const [guestProfileMessage, setGuestProfileMessage] = useState({ type: '', text: '' });
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchUserProfile();
        fetchGuestProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await api.get('/api/auth/me');

            if (response.data.success) {
                setUser(response.data.user);
                setProfileData({
                    full_name: response.data.user.full_name || '',
                    phone: response.data.user.phone || '',
                    avatar_url: response.data.user.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            if (error.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchGuestProfile = async () => {
        try {
            setLoadingGuestProfile(true);
            const res = await api.get('/api/guest-profile/me');
            if (res.data?.success && res.data.data) {
                const d = res.data.data;
                setGuestProfile({
                    allergies: Array.isArray(d.allergies) ? d.allergies : [],
                    spice_preference: d.spice_preference || 'vừa',
                    preferred_zone: d.preferred_zone || '',
                    special_notes: d.special_notes || '',
                    favorite_dishes: Array.isArray(d.favorite_dishes) ? d.favorite_dishes : [],
                    visit_count: d.visit_count || 1
                });
            }
        } catch (err) {
            console.error('Lỗi nạp hồ sơ khách quen MemGPT:', err);
        } finally {
            setLoadingGuestProfile(false);
        }
    };

    const handleAddAllergen = (itemToAdd) => {
        const val = (itemToAdd || newAllergenInput).trim().toLowerCase();
        if (!val) return;
        if (guestProfile.allergies.includes(val)) {
            toast.error(`"${val}" đã có trong danh sách dị ứng!`);
            return;
        }
        setGuestProfile(prev => ({
            ...prev,
            allergies: [...prev.allergies, val]
        }));
        setNewAllergenInput('');
    };

    const handleRemoveAllergen = (allergenToRemove) => {
        setGuestProfile(prev => ({
            ...prev,
            allergies: prev.allergies.filter(a => a !== allergenToRemove)
        }));
    };

    const handleSaveGuestProfile = async () => {
        setSavingGuestProfile(true);
        setGuestProfileMessage({ type: '', text: '' });
        setShowConfirmModal(false);

        try {
            const payload = {
                allergies: guestProfile.allergies, // Explicit Overwrite
                spice_preference: guestProfile.spice_preference,
                preferred_zone: guestProfile.preferred_zone.trim() || null,
                special_notes: guestProfile.special_notes.trim() || null,
                favorite_dishes: guestProfile.favorite_dishes
            };

            const res = await api.put('/api/guest-profile/me', payload);
            if (res.data?.success) {
                setGuestProfileMessage({
                    type: 'success',
                    text: 'Đã lưu hồ sơ khẩu vị và bảo toàn rào chắn dị ứng thành công!'
                });
                toast.success('Hồ sơ ẩm thực đã được cập nhật thành công!');
                if (refreshGuestProfile) {
                    refreshGuestProfile();
                }
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Lỗi khi lưu hồ sơ ẩm thực';
            setGuestProfileMessage({ type: 'error', text: errMsg });
            toast.error(errMsg);
        } finally {
            setSavingGuestProfile(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        try {
            const response = await api.put('/api/users/profile', profileData);

            if (response.data.success) {
                setMessage({ type: 'success', text: t('customer.profile.update_success') });
                setUser(response.data.user);
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || t('customer.profile.update_error')
            });
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: t('customer.profile.password_mismatch') });
            return;
        }

        // Validate password length
        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: t('customer.profile.password_length') });
            return;
        }

        try {
            const response = await api.put('/api/users/password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                setMessage({ type: 'success', text: t('customer.profile.password_success') });
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || t('customer.profile.password_error')
            });
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh hợp lệ' });
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Kích thước file không được vượt quá 5MB' });
            return;
        }

        setUploadingAvatar(true);
        setMessage({ type: '', text: '' });

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/api/users/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.data.success) {
                const avatarUrl = response.data.data.url;
                setProfileData({ ...profileData, avatar_url: avatarUrl });

                // Update profile with new avatar URL
                await api.put('/api/users/profile', { avatar_url: avatarUrl });

                setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
                fetchUserProfile();
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.'
            });
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-3 border-emerald-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-4xl mx-auto px-3 sm:px-6">
                <div className="space-y-5 sm:space-y-6">
                    {/* Header with Back Button */}
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('customer.profile.title')}</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Quản lý thông tin tài khoản và khẩu vị ăn uống</p>
                        </div>
                        <button
                            onClick={() => navigate('/menu')}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all shadow-sm border border-gray-200 text-xs sm:text-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">restaurant_menu</span>
                            <span>{t('customer.orders.back_to_menu')}</span>
                        </button>
                    </div>

                    {/* Message Alert */}
                    {message.text && (
                        <div
                            className={`p-3.5 rounded-xl text-sm border ${message.type === 'success' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Section 1: Thông tin tài khoản */}
                    <div className="bg-white shadow-sm rounded-2xl p-5 sm:p-7 border border-gray-200/80">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                            <span className="material-symbols-outlined text-emerald-600 text-xl">person</span>
                            <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('customer.profile.account_info')}</h2>
                        </div>

                        <form onSubmit={handleProfileUpdate}>
                            {/* Avatar & Email */}
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-5">
                                <div className="relative">
                                    {profileData.avatar_url ? (
                                        <img
                                            src={profileData.avatar_url}
                                            alt="Avatar"
                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-sm border-2 border-emerald-500"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-sm">
                                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <label
                                        htmlFor="avatar-upload"
                                        className={`absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-700 shadow-sm transition-all ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {uploadingAvatar ? (
                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-sm leading-none block">photo_camera</span>
                                        )}
                                    </label>
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={uploadingAvatar}
                                    />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-xs text-gray-500">Email đăng nhập</p>
                                    <p className="font-semibold text-gray-900 text-sm sm:text-base">{user?.email}</p>
                                    <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        Vai trò: {user?.role === 'customer' ? 'Khách hàng' : user?.role}
                                    </div>
                                </div>
                            </div>

                            {/* Full Name & Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{t('customer.profile.fullname')}</label>
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        placeholder="Nhập họ và tên..."
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{t('customer.profile.phone')}</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="Ví dụ: 0901234567"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition duration-150 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-outlined text-base">check</span>
                                <span>{t('customer.profile.update_btn')}</span>
                            </button>
                        </form>
                    </div>

                    {/* Section 2: Sở thích Ẩm thực & Dị ứng (Aria Memory - Phase 6 MemGPT F4) */}
                    <div className="bg-white shadow-sm rounded-2xl p-5 sm:p-7 border border-orange-200/80 relative">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-gray-100 gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-orange-500 text-2xl">psychology</span>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                        Sở thích Ẩm thực & Dị ứng (Aria Memory)
                                    </h2>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    Hồ sơ dài hạn MemGPT giúp trợ lý ảo Aria tự động ghi nhớ khẩu vị, vị trí ngồi và kích hoạt rào chắn
                                    <strong className="text-gray-700 font-semibold"> Allergy Safety Latch</strong> loại trừ 100% món ăn gây dị ứng.
                                </p>
                            </div>
                            {guestProfile.visit_count > 1 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-orange-50 text-orange-700 rounded-full border border-orange-200 self-start sm:self-auto">
                                    <span className="material-symbols-outlined text-xs">memory</span>
                                    Khách quen • {guestProfile.visit_count} lượt ghé
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
                                    Thực khách mới
                                </span>
                            )}
                        </div>

                        {guestProfileMessage.text && (
                            <div className={`p-3 mb-4 rounded-xl text-xs sm:text-sm border ${
                                guestProfileMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                            }`}>
                                {guestProfileMessage.text}
                            </div>
                        )}

                        {loadingGuestProfile ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
                                <span className="ml-2 text-xs text-gray-500">Đang nạp hồ sơ khẩu vị dài hạn từ máy chủ...</span>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {/* 1. DỊ ỨNG THỰC PHẨM (ALLERGY SAFETY LATCH & EXPLICIT OVERWRITE) */}
                                <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-rose-900 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-rose-600 text-lg">warning</span>
                                            Dị ứng thực phẩm (Bảo toàn tuyệt đối)
                                        </label>
                                        <span className="text-[11px] text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-medium">
                                            Rào chắn an toàn 100%
                                        </span>
                                    </div>
                                    <p className="text-xs text-rose-700 mb-3">
                                        Aria sẽ loại bỏ hoàn toàn các món có thành phần dị ứng này. Bạn có thể bấm dấu <strong>×</strong> để xóa nếu bị nhận diện sai (hệ thống sẽ áp dụng <em>Explicit Overwrite</em> khi lưu).
                                    </p>

                                    {/* Danh sách thẻ dị ứng hiện tại */}
                                    <div className="flex flex-wrap gap-2 mb-3 min-h-[40px] p-2 bg-white rounded-xl border border-rose-200">
                                        {guestProfile.allergies.length > 0 ? (
                                            guestProfile.allergies.map((allergy) => (
                                                <span
                                                    key={allergy}
                                                    className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-xs sm:text-sm font-medium px-3 py-1 rounded-full border border-rose-300 shadow-sm"
                                                >
                                                    <span>{allergy}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAllergen(allergy)}
                                                        className="w-4 h-4 rounded-full flex items-center justify-center text-rose-600 hover:text-white hover:bg-rose-600 transition-colors cursor-pointer"
                                                        title={`Xóa bỏ dị ứng ${allergy}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-gray-400 italic py-1">Chưa ghi nhận tiền sử dị ứng nào. Nhập bên dưới hoặc chọn gợi ý để thêm.</span>
                                        )}
                                    </div>

                                    {/* Ô nhập thêm dị ứng mới */}
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newAllergenInput}
                                            onChange={(e) => setNewAllergenInput(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergen(); } }}
                                            placeholder="Nhập chất dị ứng (vd: tôm, cua, đậu phộng, hải sản...)"
                                            className="flex-1 px-3.5 py-2 border border-rose-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddAllergen()}
                                            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-rose-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                                        >
                                            + Thêm
                                        </button>
                                    </div>

                                    {/* Gợi ý dị ứng phổ biến */}
                                    <div className="flex items-center flex-wrap gap-1.5 text-xs text-gray-600">
                                        <span className="text-gray-500">Gợi ý nhanh:</span>
                                        {commonAllergens.map((item) => {
                                            const isSelected = guestProfile.allergies.includes(item.trim().toLowerCase());
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    disabled={isSelected}
                                                    onClick={() => handleAddAllergen(item)}
                                                    className={`px-2.5 py-0.5 rounded-lg text-xs transition-colors cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed line-through'
                                                            : 'bg-white border-gray-200 text-gray-700 hover:border-rose-400 hover:text-rose-600'
                                                    }`}
                                                >
                                                    + {item}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 2. GU ĂN CAY (SPICE PREFERENCE) */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-red-500 text-lg">local_fire_department</span>
                                        Khẩu vị cay quen thuộc
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {[
                                            { id: 'không cay', label: 'Không cay', icon: '🥬', desc: 'Không ớt' },
                                            { id: 'ít cay', label: 'Ít cay', icon: '🌶️', desc: 'Cay nhẹ' },
                                            { id: 'vừa', label: 'Cay vừa', icon: '🌶️🌶️', desc: 'Vị chuẩn' },
                                            { id: 'cay nồng', label: 'Cay nồng', icon: '🔥', desc: 'Thích ăn cay' }
                                        ].map((spice) => {
                                            const isSelected = guestProfile.spice_preference === spice.id;
                                            return (
                                                <button
                                                    key={spice.id}
                                                    type="button"
                                                    onClick={() => setGuestProfile(prev => ({ ...prev, spice_preference: spice.id }))}
                                                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'border-orange-500 bg-orange-50/70 text-orange-900 shadow-sm ring-1 ring-orange-400'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className="text-base sm:text-lg mb-0.5">{spice.icon}</div>
                                                    <div className="font-semibold text-xs sm:text-sm">{spice.label}</div>
                                                    <div className="text-[11px] text-gray-500">{spice.desc}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* 3. KHU VỰC BÀN YÊU THÍCH (PREFERRED ZONE) */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">table_restaurant</span>
                                        Khu vực / Loại bàn ưu tiên
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                                        {[
                                            { id: 'ngoài trời', label: 'Ngoài trời', icon: '🌿' },
                                            { id: 'phòng VIP', label: 'Phòng VIP', icon: '👑' },
                                            { id: 'cạnh cửa sổ', label: 'Cạnh cửa sổ', icon: '🪟' },
                                            { id: 'tầng 2', label: 'Tầng 2', icon: '🏢' }
                                        ].map((zone) => {
                                            const isSelected = guestProfile.preferred_zone === zone.id;
                                            return (
                                                <button
                                                    key={zone.id}
                                                    type="button"
                                                    onClick={() => setGuestProfile(prev => ({ ...prev, preferred_zone: zone.id }))}
                                                    className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 justify-center cursor-pointer ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-400'
                                                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <span>{zone.icon}</span>
                                                    <span>{zone.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="text"
                                        value={guestProfile.preferred_zone}
                                        onChange={(e) => setGuestProfile(prev => ({ ...prev, preferred_zone: e.target.value }))}
                                        placeholder="Hoặc tự điền vị trí yêu thích khác (vd: gần quầy bar, tầng trệt...)"
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    />
                                </div>

                                {/* 4. GHI CHÚ PHỤC VỤ ĐẶC BIỆT */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-purple-500 text-lg">edit_note</span>
                                        Ghi chú đặc biệt phục vụ
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={guestProfile.special_notes}
                                        onChange={(e) => setGuestProfile(prev => ({ ...prev, special_notes: e.target.value }))}
                                        placeholder="Ví dụ: Thường đi kèm trẻ nhỏ cần ghế ăn dặm, ăn chay vào ngày rằm, thích bàn yên tĩnh tiếp khách..."
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                                    />
                                </div>

                                {/* 5. MÓN ĂN QUEN THUỘC ĐÃ GHI NHẬN (FAVORITE DISHES) */}
                                {guestProfile.favorite_dishes.length > 0 && (
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-amber-500 text-lg">favorite</span>
                                            Món ăn quen thuộc đã từng dùng
                                        </label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {guestProfile.favorite_dishes.map((dish, i) => (
                                                <span
                                                    key={i}
                                                    className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg"
                                                >
                                                    🍽️ {dish}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Nút lưu hồ sơ với xác nhận */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmModal(true)}
                                        disabled={savingGuestProfile}
                                        className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {savingGuestProfile ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                                <span>Đang lưu hồ sơ...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-base">save</span>
                                                <span>Lưu Hồ Sơ Khẩu Vị & Dị Ứng</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Đổi mật khẩu (chỉ hiển thị nếu tài khoản dùng mật khẩu) */}
                    {user?.has_password && (
                        <div className="bg-white shadow-sm rounded-2xl p-5 sm:p-7 border border-gray-200/80">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                <span className="material-symbols-outlined text-emerald-600 text-xl">lock_reset</span>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('customer.profile.change_password')}</h2>
                            </div>
                            <form onSubmit={handlePasswordChange}>
                                <div className="space-y-4 mb-5">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{t('customer.profile.old_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            placeholder="Nhập mật khẩu hiện tại..."
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{t('customer.profile.new_password')}</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                placeholder="Tối thiểu 6 ký tự..."
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                                                required
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{t('customer.profile.min_length')}</p>
                                        </div>

                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">{t('customer.profile.confirm_password')}</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                placeholder="Nhập lại mật khẩu mới..."
                                                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition duration-150 active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-base">key</span>
                                    <span>{t('customer.profile.change_password_btn')}</span>
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Modal xác nhận cập nhật (Explicit Overwrite Confirmation) */}
                    {showConfirmModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex items-center gap-3 text-orange-600 mb-3">
                                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                                    <h3 className="text-lg font-bold text-gray-900">Xác nhận cập nhật hồ sơ</h3>
                                </div>
                                <div className="text-sm text-gray-600 space-y-2.5 mb-6">
                                    <p>Bạn đang cập nhật hồ sơ khẩu vị và rào chắn an toàn dị ứng của mình:</p>
                                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800">
                                        <p className="font-semibold mb-1">⚠️ Danh sách dị ứng sẽ lưu thành:</p>
                                        <p className="font-mono font-medium">
                                            {guestProfile.allergies.length > 0
                                                ? guestProfile.allergies.join(', ')
                                                : '(Không có chất dị ứng nào)'
                                            }
                                        </p>
                                        <p className="mt-1.5 text-[11px] text-rose-600 italic">
                                            * Các chất dị ứng đã bỏ chọn sẽ được xóa hoàn toàn khỏi hồ sơ (Explicit Overwrite).
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <p>• <strong>Khẩu vị cay:</strong> {guestProfile.spice_preference}</p>
                                        <p>• <strong>Khu vực bàn:</strong> {guestProfile.preferred_zone || 'Chưa chọn'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmModal(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveGuestProfile}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
                                    >
                                        Xác nhận lưu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
