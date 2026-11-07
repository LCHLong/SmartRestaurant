import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const commonAllergens = ['Đậu phộng', 'Tôm', 'Cua biển', 'Hải sản có vỏ', 'Sữa tươi', 'Trứng', 'Gluten / Bột mì', 'Đậu nành'];

const ProfilePage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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

    // Dining & Allergy Profile state
    const [diningProfile, setDiningProfile] = useState({
        allergies: [],
        spice_preference: 'vừa',
        preferred_zone: '',
        favorite_dishes: [],
        special_notes: '',
        visit_count: 1
    });
    const [loadingDining, setLoadingDining] = useState(false);
    const [savingDining, setSavingDining] = useState(false);
    const [diningMessage, setDiningMessage] = useState({ type: '', text: '' });
    const [newAllergyInput, setNewAllergyInput] = useState('');

    // Password form state
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchUserProfile();
        fetchDiningProfile();
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

    const fetchDiningProfile = async () => {
        try {
            setLoadingDining(true);
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await api.get('/api/guest-profile/me');
            if (res.data?.success && res.data?.data) {
                const d = res.data.data;
                setDiningProfile({
                    allergies: Array.isArray(d.allergies) ? d.allergies : [],
                    spice_preference: d.spice_preference || 'vừa',
                    preferred_zone: d.preferred_zone || '',
                    favorite_dishes: Array.isArray(d.favorite_dishes) ? d.favorite_dishes : [],
                    special_notes: d.special_notes || '',
                    visit_count: d.visit_count || 1
                });
            }
        } catch (err) {
            console.warn('[ProfilePage] Không thể nạp hồ sơ khẩu vị:', err?.message || err);
        } finally {
            setLoadingDining(false);
        }
    };

    const handleAddAllergy = (valToAdd) => {
        const val = (valToAdd || newAllergyInput).trim().toLowerCase();
        if (!val) return;
        if (!diningProfile.allergies.map(a => a.toLowerCase()).includes(val)) {
            setDiningProfile(prev => ({
                ...prev,
                allergies: [...prev.allergies, val]
            }));
        }
        setNewAllergyInput('');
    };

    const handleRemoveAllergy = (allergyToRemove) => {
        setDiningProfile(prev => ({
            ...prev,
            allergies: prev.allergies.filter(a => a !== allergyToRemove)
        }));
    };

    const handleSaveDiningProfile = async (e) => {
        e.preventDefault();
        setSavingDining(true);
        setDiningMessage({ type: '', text: '' });
        try {
            const res = await api.put('/api/guest-profile/me', {
                allergies: diningProfile.allergies,
                spice_preference: diningProfile.spice_preference,
                preferred_zone: diningProfile.preferred_zone || null,
                special_notes: diningProfile.special_notes || null,
                favorite_dishes: diningProfile.favorite_dishes
            });
            if (res.data?.success) {
                setDiningMessage({
                    type: 'success',
                    text: 'Đã lưu hồ sơ khẩu vị & an toàn dị ứng thành công.'
                });
                setTimeout(() => setDiningMessage({ type: '', text: '' }), 4000);
            }
        } catch (err) {
            setDiningMessage({
                type: 'error',
                text: err.response?.data?.message || 'Lỗi khi cập nhật khẩu vị. Vui lòng thử lại.'
            });
        } finally {
            setSavingDining(false);
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

                    {/* Section 2: Khẩu vị & Dị ứng thực phẩm */}
                    <div className="bg-white shadow-sm rounded-2xl p-5 sm:p-7 border border-gray-200/80">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-gray-100 gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-600 text-xl">restaurant</span>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                        Khẩu vị & Dị ứng thực phẩm
                                    </h2>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                                    Lưu ý sở thích ăn uống để nhà hàng phục vụ chu đáo và an toàn nhất cho bạn.
                                </p>
                            </div>
                            {diningProfile.visit_count > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 self-start sm:self-auto">
                                    <span className="material-symbols-outlined text-xs">verified</span>
                                    Khách quen ({diningProfile.visit_count} lần ghé)
                                </span>
                            )}
                        </div>

                        {diningMessage.text && (
                            <div
                                className={`p-3 mb-4 rounded-xl text-xs sm:text-sm border ${diningMessage.type === 'success'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}
                            >
                                {diningMessage.text}
                            </div>
                        )}

                        {loadingDining ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveDiningProfile} className="space-y-5">
                                {/* Dị ứng thực phẩm */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="material-symbols-outlined text-amber-500 text-base">warning</span>
                                        <label className="text-xs sm:text-sm font-semibold text-gray-800">
                                            Dị ứng & Kiêng khem thực phẩm
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 mb-2.5">
                                        Nhà hàng sẽ chủ động cảnh báo hoặc loại trừ các món có thành phần này khi phục vụ bạn.
                                    </p>

                                    {/* Danh sách dị ứng hiện tại */}
                                    <div className="flex flex-wrap gap-2 mb-3 min-h-[44px] p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                        {diningProfile.allergies.length === 0 ? (
                                            <span className="text-xs text-gray-400 italic py-1">
                                                Chưa ghi nhận dị ứng nào. Nhập bên dưới hoặc bấm gợi ý để thêm.
                                            </span>
                                        ) : (
                                            diningProfile.allergies.map((allergy, idx) => (
                                                <span
                                                    key={idx}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200/70"
                                                >
                                                    <span className="material-symbols-outlined text-xs">block</span>
                                                    <span>{allergy}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAllergy(allergy)}
                                                        className="hover:text-red-900 font-bold ml-0.5 text-sm leading-none focus:outline-none"
                                                        title={`Xóa ${allergy}`}
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))
                                        )}
                                    </div>

                                    {/* Input thêm dị ứng */}
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newAllergyInput}
                                            onChange={(e) => setNewAllergyInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddAllergy();
                                                }
                                            }}
                                            placeholder="Ví dụ: Đậu phộng, tôm sú, hành tây..."
                                            className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleAddAllergy()}
                                            className="px-4 py-2 bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-gray-900 transition active:scale-95"
                                        >
                                            + Thêm
                                        </button>
                                    </div>

                                    {/* Gợi ý nhanh */}
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        <span className="text-xs text-gray-500 mr-1">Gợi ý nhanh:</span>
                                        {commonAllergens.map((item) => {
                                            const isSelected = diningProfile.allergies.map(a => a.toLowerCase()).includes(item.toLowerCase());
                                            return (
                                                <button
                                                    key={item}
                                                    type="button"
                                                    disabled={isSelected}
                                                    onClick={() => handleAddAllergy(item)}
                                                    className={`text-xs px-2.5 py-1 rounded-lg transition ${
                                                        isSelected
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through border border-transparent'
                                                            : 'bg-white text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-gray-200'
                                                    }`}
                                                >
                                                    + {item}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Độ cay & Khu vực bàn */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-red-500 text-sm">local_fire_department</span>
                                            <span>Độ cay yêu thích</span>
                                        </label>
                                        <select
                                            value={diningProfile.spice_preference}
                                            onChange={(e) => setDiningProfile({ ...diningProfile, spice_preference: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer transition"
                                        >
                                            <option value="không cay">Không cay (0/5)</option>
                                            <option value="ít cay">Ít cay (1/5)</option>
                                            <option value="vừa">Cay vừa (2/5)</option>
                                            <option value="cay">Cay (3/5)</option>
                                            <option value="rất cay">Rất cay (4/5+)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-emerald-600 text-sm">chair</span>
                                            <span>Khu vực ngồi ưa thích</span>
                                        </label>
                                        <select
                                            value={diningProfile.preferred_zone || ''}
                                            onChange={(e) => setDiningProfile({ ...diningProfile, preferred_zone: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer transition"
                                        >
                                            <option value="">Không có yêu cầu riêng</option>
                                            <option value="indoor">Trong nhà (Máy lạnh)</option>
                                            <option value="outdoor">Ngoài trời / Sân vườn thoáng đãng</option>
                                            <option value="vip">Phòng VIP riêng tư</option>
                                            <option value="window">Gần cửa sổ view đẹp</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Ghi chú đặc biệt */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-gray-500 text-sm">edit_note</span>
                                        <span>Ghi chú ăn uống riêng</span>
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={diningProfile.special_notes || ''}
                                        onChange={(e) => setDiningProfile({ ...diningProfile, special_notes: e.target.value })}
                                        placeholder="Ví dụ: Ăn chay linh hoạt vào rằm, thích ít đá trong nước ngọt, đi cùng người lớn tuổi..."
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={savingDining}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition duration-150 active:scale-95 flex items-center justify-center gap-1.5"
                                >
                                    {savingDining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Đang lưu...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-base">save</span>
                                            <span>Lưu hồ sơ khẩu vị & Dị ứng</span>
                                        </>
                                    )}
                                </button>
                            </form>
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
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
