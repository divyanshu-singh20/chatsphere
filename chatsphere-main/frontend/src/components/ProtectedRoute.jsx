import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccountStatusPage from '../pages/AccountStatusPage';

export default function ProtectedRoute({ children }) {
  const { user, loading, accessNotice } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[var(--wa-bg)] text-white">Loading ChatSphere...</div>;
  }

  if (!user) {
    if (accessNotice) {
      return <AccountStatusPage status={accessNotice.status || 'pending'} message={accessNotice.message} />;
    }

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.status === 'pending' || user.status === 'blocked') {
    return <AccountStatusPage status={user.status} />;
  }

  return children;
}