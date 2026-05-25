import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiLogOut, FiSettings, FiUser } from 'react-icons/fi';
import Avatar from './Avatar';

export default function MobileAccountMenu({ user, logout, className = '' }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = useMemo(() => (user?.fullName || user?.username || 'U').slice(0, 1), [user?.fullName, user?.username]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--wa-border)] bg-[var(--wa-card-hover)] text-white transition-all active:scale-95 hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_16px_rgba(10,132,255,0.12)]"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        {user?.avatar ? (
          <Avatar src={user.avatar} name={user?.fullName || user?.username || 'User'} size="sm" className="h-full w-full" />
        ) : (
          <span className="text-sm font-semibold uppercase">{initials}</span>
        )}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Close profile menu"
              className="fixed inset-0 z-40 cursor-default bg-black/25 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-14 z-50 w-64 overflow-hidden rounded-3xl border border-[var(--wa-border)] bg-[rgba(15,15,15,0.98)] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-3 py-3">
                <Avatar src={user?.avatar} name={user?.fullName || user?.username || 'User'} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user?.fullName || 'Profile'}</p>
                  <p className="truncate text-xs text-[var(--wa-text-secondary)]">{user?.username || 'Signed in'}</p>
                </div>
              </div>

              <div className="mt-2 grid gap-1">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--wa-text)] transition hover:bg-[var(--wa-card-hover)]"
                >
                  <FiUser className="text-base text-[var(--wa-primary)]" />
                  Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--wa-text)] transition hover:bg-[var(--wa-card-hover)]"
                >
                  <FiSettings className="text-base text-[var(--wa-primary)]" />
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    logout?.();
                    navigate('/login', { replace: true });
                  }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-rose-300 transition hover:bg-rose-500/10"
                >
                  <FiLogOut className="text-base" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}