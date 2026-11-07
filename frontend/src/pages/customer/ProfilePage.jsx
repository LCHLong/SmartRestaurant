import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import api from '../../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

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

    // MemGPT Dining & Allergy Profile state
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

            const response = await axios.get(`${API_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

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
                    text: '✅ Đã lưu hồ sơ khẩu vị & an toàn dị ứng thành công! Trợ lý Aria đã cập nhật thông tin mới nhất.'
                });
                setTimeout(() => setDiningMessage({ type: '', text: '' }), 5000);
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
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/users/profile`,
                profileData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

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
            const token = localStorage.getItem('token');
            const response = await axios.put(
                `${API_URL}/api/users/password`,
                {
                    oldPassword: passwordData.oldPassword,
                    newPassword: passwordData.newPassword
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

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
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', file);

            const response = await axios.post(
                `${API_URL}/api/users/avatar`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                const avatarUrl = response.data.data.url;
                setProfileData({ ...profileData, avatar_url: avatarUrl });

                // Update profile with new avatar URL
                await axios.put(
                    `${API_URL}/api/users/profile`,
                    { avatar_url: avatarUrl },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
                fetchUserProfile(); // Refresh user data
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
                    {/* Header with Back Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('customer.profile.title')}</h1>
                        <button
                            onClick={() => navigate('/menu')}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-white text-gray-700 rounded-lg sm:rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-md hover:shadow-lg border border-gray-200 text-sm sm:text-base active:scale-95"
                        >
                            <span>{t('customer.orders.back_to_menu')}</span>
                        </button>
                    </div>

                    {/* Message Alert */}
                    {message.text && (
                        <div
                            className={`p-3 sm:p-4 rounded-lg text-sm sm:text-base ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Profile Information Section */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('customer.profile.account_info')}</h2>
                            <form onSubmit={handleProfileUpdate}>
                                {/* Avatar */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                                    <div className="relative">
                                        {profileData.avatar_url ? (
                                            <img
                                                src={profileData.avatar_url}
                                                alt="Avatar"
                                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover shadow-lg border-2 border-blue-500"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                                                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <label
                                            htmlFor="avatar-upload"
                                            className={`absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-all ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {uploadingAvatar ? (
                                                <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3 sm:h-4 sm:w-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                    />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
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
                                        <p className="text-xs sm:text-sm text-gray-600">Email</p>
                                        <p className="font-medium text-sm sm:text-base">{user?.email}</p>
                                        <p className="text-xs sm:text-sm text-gray-600 mt-1">{t('customer.profile.role')}: {user?.role}</p>
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="mb-3 sm:mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.fullname')}</label>
                                    <input
                                        type="text"
                                        value={profileData.full_name}
                                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.phone')}</label>
                                    <input
                                        type="tel"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        placeholder="0123456789"
                                        className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-semibold text-sm sm:text-base active:scale-95"
                                >
                                    {t('customer.profile.update_btn')}
                                </button>
                            </form>
                        </div>

                        {/* MemGPT Dining & Allergy Profile Card */}
                        <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6 border border-emerald-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-100 gap-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                            🛡️ Hồ Sơ Khẩu Vị & An Toàn Dị Ứng
                                        </h2>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                            MemGPT Active
                                        </span>
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                        Trợ lý Aria tự động ghi nhớ và bảo vệ an toàn cho bạn trong mọi lần dùng bữa.
                                    </p>
                                </div>
                                {diningProfile.visit_count > 1 && (
                                    <span className="text-xs font-medium px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 self-start sm:self-auto">
                                        🌟 Khách quen ({diningProfile.visit_count} lần ghé)
                                    </span>
                                )}
                            </div>

                            {diningMessage.text && (
                                <div
                                    className={`p-3 mb-4 rounded-lg text-sm ${diningMessage.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                    }`}
                                >
                                    {diningMessage.text}
                                </div>
                            )}

                            {loadingDining ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                                </div>
                            ) : (
                                <form onSubmit={handleSaveDiningProfile} className="space-y-5">
                                    {/* Allergies Section */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                                            ⚠️ Thực phẩm gây dị ứng (Aria sẽ cảnh báo & loại trừ khi tư vấn món)
                                        </label>
                                        <p className="text-xs text-gray-500 mb-2">
                                            Aria sẽ tự động chặn mọi món ăn chứa các thành phần này để bảo vệ an toàn tuyệt đối.
                                        </p>

                                        {/* Current Allergy Badges */}
                                        <div className="flex flex-wrap gap-2 mb-3 min-h-[36px] p-2 bg-red-50/50 rounded-lg border border-red-100">
                                            {diningProfile.allergies.length === 0 ? (
                                                <span className="text-xs text-gray-400 italic py-1">
                                                    Chưa ghi nhận dị ứng nào. Nhập bên dưới hoặc bấm gợi ý để thêm.
                                                </span>
                                            ) : (
                                                diningProfile.allergies.map((allergy, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 animate-fadeIn"
                                                    >
                                                        🚫 {allergy}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAllergy(allergy)}
                                                            className="hover:text-red-900 font-bold ml-0.5 focus:outline-none"
                                                            title={`Xóa ${allergy}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        {/* Add Custom Allergy */}
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
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleAddAllergy()}
                                                className="px-4 py-2 bg-gray-800 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-gray-900 transition active:scale-95"
                                            >
                                                + Thêm
                                            </button>
                                        </div>

                                        {/* Quick Add Suggestions */}
                                        <div>
                                            <span className="text-xs text-gray-500 mr-2">Gợi ý nhanh:</span>
                                            <div className="inline-flex flex-wrap gap-1.5 mt-1">
                                                {commonAllergens.map((item) => {
                                                    const isSelected = diningProfile.allergies.map(a => a.toLowerCase()).includes(item.toLowerCase());
                                                    return (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            disabled={isSelected}
                                                            onClick={() => handleAddAllergy(item)}
                                                            className={`text-xs px-2.5 py-1 rounded-md transition ${
                                                                isSelected
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                                                    : 'bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-200 hover:border-emerald-300'
                                                            }`}
                                                        >
                                                            + {item}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Taste & Dining Preferences */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                🌶️ Độ cay yêu thích
                                            </label>
                                            <select
                                                value={diningProfile.spice_preference}
                                                onChange={(e) => setDiningProfile({ ...diningProfile, spice_preference: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                            >
                                                <option value="không cay">Không cay (0/5)</option>
                                                <option value="ít cay">Ít cay (1/5)</option>
                                                <option value="vừa">Cay vừa (2/5)</option>
                                                <option value="cay">Cay (3/5)</option>
                                                <option value="rất cay">Rất cay (4/5+)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                🪑 Khu vực ngồi ưa thích
                                            </label>
                                            <select
                                                value={diningProfile.preferred_zone || ''}
                                                onChange={(e) => setDiningProfile({ ...diningProfile, preferred_zone: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
                                            >
                                                <option value="">Không có yêu cầu riêng</option>
                                                <option value="indoor">Trong nhà (Máy lạnh)</option>
                                                <option value="outdoor">Ngoài trời / Sân vườn thoáng đãng</option>
                                                <option value="vip">Phòng VIP riêng tư</option>
                                                <option value="window">Gần cửa sổ view đẹp</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Special Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            📝 Ghi chú ăn uống riêng
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={diningProfile.special_notes}
                                            onChange={(e) => setDiningProfile({ ...diningProfile, special_notes: e.target.value })}
                                            placeholder="Ví dụ: Ăn chay linh hoạt vào rằm, thích ít đá trong nước ngọt, đi cùng người lớn tuổi..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={savingDining}
                                        className="w-full bg-emerald-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-emerald-700 transition duration-200 font-semibold text-sm sm:text-base active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        {savingDining ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                <span>Đang lưu...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>💾 Lưu Hồ Sơ Khẩu Vị & An Toàn Dị Ứng</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* Password Change Card - Only show for users with password (not OAuth) */}
                        {user?.has_password && (
                            <div className="bg-white shadow rounded-lg sm:rounded-xl p-4 sm:p-6">
                                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">{t('customer.profile.change_password')}</h2>
                                <form onSubmit={handlePasswordChange}>
                                    <div className="mb-3 sm:mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.old_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <div className="mb-3 sm:mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.new_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{t('customer.profile.min_length')}</p>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">{t('customer.profile.confirm_password')}</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:bg-green-700 transition duration-200 font-semibold text-sm sm:text-base active:scale-95"
                                    >
                                        {t('customer.profile.change_password_btn')}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
