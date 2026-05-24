import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiPhone, FiClock, FiSettings, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  const items = [
    { to: '/chats', label: 'Chats', icon: FiMessageCircle },
    { to: '/calls', label: 'Calls', icon: FiPhone },
    { to: '/status', label: 'Status', icon: FiClock },
    { to: '/settings', label: 'Settings', icon: FiSettings }
  ];

  if (user?.role === 'admin') {
    items.splice(3, 0, { to: '/admin/users', label: 'Admin', icon: FiShield });
  }

  if (location.pathname.startsWith('/chat/')) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--wa-border)] bg-[rgba(10,10,10,0.96)] backdrop-blur-md lg:hidden">
      <div className={`grid px-1 py-2 pb-[calc(env(safe-area-inset-bottom)+8px)] ${items.length > 4 ? 'grid-cols-5' : 'grid-cols-4'}`}>
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => [
              'mx-1 flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition-all duration-200 active:scale-[0.98]',
              isActive ? 'text-[var(--wa-primary)]' : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-card-hover)]'
            ].join(' ')}
          >
            {({ isActive }) => (
              <span className="relative flex flex-col items-center gap-1">
                <Icon className={`text-[20px] transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />
                <span>{label}</span>
                {isActive ? (
                  <motion.span
                    layoutId="mobile-nav-active"
                    className="absolute -bottom-1 h-1 w-6 rounded-full bg-[var(--wa-primary)]"
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                  />
                ) : null}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
