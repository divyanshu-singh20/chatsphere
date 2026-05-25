import { lazy } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage'));
const ChatPage = lazy(() => import('../pages/ChatPage'));
const CallHistoryPage = lazy(() => import('../pages/CallHistoryPage'));
const StatusPage = lazy(() => import('../pages/StatusPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

function LegacyChatRedirect() {
  const params = useParams();
  return <Navigate to={params.id ? `/chat/${params.id}` : '/chats'} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
      </Route>

      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/chats" replace />} />
        <Route path="chats" element={<ChatPage />} />
        <Route path="chat/:id" element={<ChatPage />} />
        <Route path="calls" element={<CallHistoryPage />} />
        <Route path="status" element={<StatusPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route path="app" element={<Navigate to="/chats" replace />} />
        <Route path="app/chat" element={<Navigate to="/chats" replace />} />
        <Route path="app/chat/:id" element={<LegacyChatRedirect />} />
        <Route path="app/calls" element={<Navigate to="/calls" replace />} />
        <Route path="app/status" element={<Navigate to="/status" replace />} />
        <Route path="app/settings" element={<Navigate to="/settings" replace />} />
        <Route path="app/profile" element={<Navigate to="/profile" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/chats" replace />} />
    </Routes>
  );
}
