import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MenuProvider } from './context/MenuContext';
import { Role } from './types';
import LoadingScreen from './components/common/LoadingScreen';

// Common pages
import HomePage from './pages/HomePage';
import LoginOwnerPage from './pages/LoginOwnerPage';
import RegisterOwnerPage from './pages/RegisterOwnerPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// Customer pages
import CustomerLayout from './pages/student/StudentLayout';
import MenuPage from './pages/student/MenuPage';
import GamesPage from './pages/student/GamesPage';
import FoodDetailPage from './pages/student/FoodDetailPage';
import CartPage from './pages/student/CartPage';
import OrderSuccessPage from './pages/student/OrderSuccessPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import FeedbackPage from './pages/student/FeedbackPage';
import ProfilePage from './pages/student/ProfilePage';
import CouponsPage from './pages/student/CouponsPage';
import RewardsPage from './pages/student/RewardsPage';

// Canteen Owner pages
import OwnerLayout from './pages/owner/OwnerLayout';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import SalesAnalyticsPage from './pages/owner/SalesAnalyticsPage';
import ScanQrPage from './pages/owner/ScanQrPage';
import FoodPopularityPage from './pages/owner/FoodPopularityPage';
import GamesManagementPage from './pages/owner/GamesManagementPage';
import OwnerFeedbackPage from './pages/owner/FeedbackPage';
import ScanTerminalLoginPage from './pages/owner/ScanTerminalLoginPage';
import ScanTerminalHomePage from './pages/owner/ScanTerminalHomePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalPage from './pages/admin/ApprovalPage';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login-owner" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
     return <Navigate to="/404" replace />;
  }

  if (user.role === Role.CANTEEN_OWNER && user.approvalStatus !== 'approved') {
      return <Navigate to="/login-owner" replace />;
  }

  return <>{children}</>;
};


const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }
    
    const RootRedirect = () => {
        if (!user) {
            return <HomePage />;
        }

        switch (user.role) {
            case Role.STUDENT:
                return <Navigate to="/customer/games" replace />;
            case Role.CANTEEN_OWNER:
                if (user.approvalStatus !== 'approved') {
                    // Stay on login page to show pending/rejected status
                    return <Navigate to="/login-owner" replace />;
                }
                return user.canteenName
                    ? <Navigate to="/owner/dashboard" replace />
                    : <Navigate to="/scan-terminal/home" replace />;
            case Role.ADMIN:
                return <Navigate to="/admin/dashboard" replace />;
            default:
                return <HomePage />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes accessible without login */}
            <Route path="/login-owner" element={
                user && (user.role === Role.STUDENT || (user.role === Role.CANTEEN_OWNER && user.approvalStatus === 'approved') || user.role === Role.ADMIN) 
                ? <Navigate to="/" replace /> 
                : <LoginOwnerPage />
            } />
            <Route path="/register-owner" element={user ? <Navigate to="/" replace /> : <RegisterOwnerPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />
            <Route path="/owner/scan-terminal" element={user ? <Navigate to="/" replace /> : <ScanTerminalLoginPage />} />

            {/* Customer Routes */}
            <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<Navigate to="games" replace />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="menu/:itemId" element={<FoodDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="history" element={<OrderHistoryPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="rewards" element={<RewardsPage />} />
            </Route>

            {/* Canteen Owner Routes */}
            <Route path="/owner" element={
                <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <OwnerLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="sales" element={<SalesAnalyticsPage />} />
                <Route path="scan" element={<ScanQrPage />} />
                <Route path="popularity" element={<FoodPopularityPage />} />
                <Route path="games-menu" element={<GamesManagementPage />} />
                <Route path="feedback" element={<OwnerFeedbackPage />} />
            </Route>
            
            {/* Standalone Scan Terminal page */}
            <Route path="/scan-terminal/home" element={
                 <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <ScanTerminalHomePage />
                </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
                 <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
                 <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <ApprovalPage />
                </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}


const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden font-sans bg-background text-textPrimary">
      <AuthProvider>
        <MenuProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </MenuProvider>
      </AuthProvider>
    </div>
  );
};

export default App;