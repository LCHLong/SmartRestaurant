import { Routes, Route, Navigate } from 'react-router-dom';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import ProfilePage from './pages/customer/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallback from './pages/auth/GoogleCallback';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminSidebar from './pages/admin/AdminSidebar';
import MenuManagement from './pages/admin/MenuManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import DashboardPage from './pages/admin/DashboardPage';
import TableManagement from './pages/admin/TableManagement';
import StaffManagement from './pages/admin/StaffManagement';
import ModifierManagement from './pages/admin/ModifierManagement';
import OrderManagement from './pages/admin/OrderManagement';
import ReservationManagement from './pages/admin/ReservationManagement'; // Phase 5
import ShiftManagement from './pages/admin/ShiftManagement'; // Phase 5
import WaiterLayout from './layouts/WaiterLayout';
import OrderListPage from './pages/waiter/OrderListPage';
import TableMapPage from './pages/waiter/TableMapPage';
import MyShiftsPage from './pages/waiter/MyShiftsPage'; // Phase 5
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';
import CheckoutPage from './pages/customer/CustomerCheckoutPage';
import ReservationPage from './pages/customer/ReservationPage'; // Phase 5
import ReservationLookupPage from './pages/customer/ReservationLookupPage'; // Phase 5
import ReservationCancelPage from './pages/customer/ReservationCancelPage'; // Phase 5
import WaiterBillPage from './pages/waiter/WaiterBillPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import CreateAdminPage from './pages/superadmin/CreateAdminPage';
import UserManagementPage from './pages/superadmin/UserManagementPage';
import SystemSettingsPage from './pages/superadmin/SystemSettingsPage';
import CreateCouponPage from './pages/admin/CreateCouponPage';
import CouponListPage from './pages/admin/CouponListPage';
import EditCouponPage from './pages/admin/EditCouponPage';
import { Toaster } from 'react-hot-toast';
import GuestActiveOrdersBanner from './components/customer/GuestActiveOrdersBanner';
import './App.css';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <GuestActiveOrdersBanner /> {/* Persistent Banner for Guests */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reservations" element={<ReservationPage />} /> {/* Phase 5: Public reservation */}
        <Route path="/reservations/lookup" element={<ReservationLookupPage />} /> {/* Phase 5 */}
        <Route path="/reservations/cancel" element={<ReservationCancelPage />} /> {/* Phase 5 */}

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminSidebar />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="orders" element={<OrderManagement />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="coupons/create" element={<CreateCouponPage />} />
            <Route path="coupons" element={<CouponListPage />} />
            <Route path="coupons/edit/:id" element={<EditCouponPage />} />
            <Route path="tables" element={<TableManagement />} />
            <Route path="staff" element={<StaffManagement />} />
            <Route path="modifiers" element={<ModifierManagement />} />
            <Route path="reservations" element={<ReservationManagement />} /> {/* Phase 5 */}
            <Route path="shifts" element={<ShiftManagement />} /> {/* Phase 5 */}
          </Route>
        </Route>

        {/* --- SUPER ADMIN ROUTES --- */}
        <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
          <Route path="/super-admin" element={<SuperAdminLayout />}>
            {/* Mặc định chuyển hướng vào trang tạo admin */}
            <Route index element={<Navigate to="create-admin" replace />} />
            <Route path="create-admin" element={<CreateAdminPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="settings" element={<SystemSettingsPage />} />
          </Route>
        </Route>

        {/* Waiter Routes */}
        <Route element={<ProtectedRoute allowedRoles={['waiter', 'admin']} />}>
          <Route path="/waiter" element={<WaiterLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrderListPage />} />
            <Route path="bill/:orderId" element={<WaiterBillPage />} />
            <Route path="map" element={<TableMapPage />} />
            <Route path="shifts" element={<MyShiftsPage />} /> {/* Phase 5 */}
          </Route>
        </Route>

        {/* --- KITCHEN ROUTES (Bếp & Admin) --- */}
        <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
          <Route path="/kitchen" element={<KitchenDisplayPage />} />
        </Route>

      </Routes>
    </>
  );
}

export default App;