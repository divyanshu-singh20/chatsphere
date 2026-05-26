import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMessageCircle, FiUser, FiSettings, FiLogOut, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import useCall from '../hooks/useCall';
import CallOverlay from '../components/CallOverlay';
import MobileBottomNav from '../components/MobileBottomNav';
import MobileAccountMenu from '../components/MobileAccountMenu';

const avatarBaseUrl = import.meta.env.VITE_AVATAR_BASE_URL;

const buildAvatarUrl = (seed) => {
  if (!avatarBaseUrl) return undefined;
  return `${avatarBaseUrl}${encodeURIComponent(seed)}`;
};

const navItems = [
  { to: '/chats', label: 'Chats', icon: FiMessageCircle },
  { to: '/calls', label: 'Calls', icon: FiClock },
  { to: '/profile', label: 'Profile', icon: FiUser },
  { to: '/settings', label: 'Settings', icon: FiSettings }
];

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { call, localStream, remoteStream, callDurationSeconds, soundBlocked, unlockCallSound, acceptCall, rejectCall, endCall, toggleMute, toggleCamera } = useCall();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);

  const getRouteIndex = (pathname) => {
    if (pathname.startsWith('/chat/')) return 0;
    if (pathname.startsWith('/chats')) return 0;
    if (pathname.startsWith('/calls')) return 1;
    if (pathname.startsWith('/status')) return 2;
    if (pathname.startsWith('/settings')) return 3;
    if (pathname.startsWith('/profile')) return 3;
    return 0;
  };

  const direction = getRouteIndex(location.pathname) >= getRouteIndex(previousPathRef.current) ? 1 : -1;

  useEffect(() => {
    previousPathRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-screen bg-[var(--wa-bg)] text-[var(--wa-text)]">
      <div className="flex min-h-[100dvh] h-[100dvh] w-screen flex-col overflow-hidden lg:flex-row">
        {!location.pathname.startsWith('/chat/') ? (
          <header className="flex items-center justify-between border-b border-[var(--wa-border)] bg-[rgba(10,10,10,0.96)] px-4 py-3 backdrop-blur-md lg:hidden">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--wa-text-secondary)]">ChatSphere</p>
              <p className="truncate text-sm font-semibold text-white">{user?.fullName || 'Your account'}</p>
            </div>
            <MobileAccountMenu user={user} logout={logout} />
          </header>
        ) : null}
        <aside className="hidden h-[100dvh] w-[320px] flex-col border-r border-[var(--wa-border)] bg-[var(--wa-sidebar-bg)] p-0 lg:flex">
          <div className="flex items-center justify-between px-4 pt-4">
            <Link to="/app/chat" className="text-xl font-semibold tracking-tight text-white">
              ChatSphere
            </Link>
            <button
              onClick={toggleTheme}
              className="rounded-full border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-3 py-2 text-[10px] uppercase tracking-[0.28em] text-[var(--wa-text-secondary)]"
            >
              Dark
            </button>
          </div>
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <img src={user?.avatar || buildAvatarUrl('CS')} alt="avatar" className="h-9 w-9 rounded-full object-cover" />
              <div>
                <p className="font-medium text-sm text-[var(--wa-text)]">{user?.fullName || 'Guest User'}</p>
              </div>
            </div>
            <div className="flex gap-2 px-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--wa-primary)] transition hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.16)]">🔍</button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--wa-primary)] transition hover:bg-[var(--wa-card-hover)] hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.16)]">⋯</button>
            </div>
          </div>
          <nav className="mt-1 grid gap-1 border-b border-[var(--wa-border)] px-2 pb-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-[var(--wa-sidebar-active)] text-white' : 'text-[var(--wa-text-secondary)] hover:bg-[var(--wa-card-hover)] hover:text-white'
                  }`
                }
              >
                <Icon />
                {label}
              </NavLink>
            ))}
          </nav>
          <button onClick={logout} className="mt-auto flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-[var(--wa-text-secondary)] transition hover:bg-[var(--wa-card-hover)] hover:text-white"> <FiLogOut className="text-lg" /> Logout</button>
        </aside>
        <main className="relative h-[100dvh] flex-1 overflow-hidden bg-[var(--wa-chat-bg)] w-full">
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              className="h-full w-full"
              initial={{ opacity: 0, x: direction > 0 ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -16 : 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileBottomNav />
      <CallOverlay
        call={call}
        localStream={localStream}
        remoteStream={remoteStream}
        durationSeconds={callDurationSeconds}
        soundBlocked={soundBlocked}
        onEnableSound={unlockCallSound}
        onAccept={acceptCall}
        onReject={rejectCall}
        onEnd={endCall}
        onToggleMute={toggleMute}
        onToggleCamera={toggleCamera}
      />
    </div>
  );
}