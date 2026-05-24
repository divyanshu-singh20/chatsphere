import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiClock, FiShield, FiAlertTriangle } from 'react-icons/fi';

const statusMeta = {
  pending: {
    icon: FiClock,
    title: 'Waiting for approval',
    badge: 'Pending review',
    accent: 'text-amber-300',
    ring: 'shadow-[0_0_60px_rgba(245,158,11,0.18)]',
    message: 'Your account is waiting for admin approval. You can sign in once the owner approves it.'
  },
  blocked: {
    icon: FiAlertTriangle,
    title: 'Account blocked',
    badge: 'Blocked by admin',
    accent: 'text-rose-300',
    ring: 'shadow-[0_0_60px_rgba(244,63,94,0.18)]',
    message: 'This account has been blocked by an admin. Contact the owner if you believe this is a mistake.'
  },
  approved: {
    icon: FiShield,
    title: 'Account approved',
    badge: 'Approved',
    accent: 'text-emerald-300',
    ring: 'shadow-[0_0_60px_rgba(34,197,94,0.14)]',
    message: 'Your account is active. You can continue to the app.'
  }
};

export default function AccountStatusPage({ status = 'pending', message, title }) {
  const location = useLocation();
  const meta = statusMeta[status] || statusMeta.pending;
  const Icon = meta.icon;
  const nextMessage = message || location.state?.message || meta.message;
  const nextTitle = title || location.state?.title || meta.title;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-2xl items-center px-2 py-8"
    >
      <div className={`w-full rounded-[2rem] border border-[var(--wa-border)] bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.12),transparent_36%),linear-gradient(180deg,rgba(13,13,13,0.98),rgba(7,7,7,0.96))] p-6 text-center shadow-2xl ${meta.ring} sm:p-10`}>
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 ${meta.accent}`}>
          <Icon className="h-7 w-7" />
        </div>
        <p className="mt-5 text-xs uppercase tracking-[0.32em] text-[var(--wa-text-secondary)]">Account access</p>
        <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{nextTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--wa-text-secondary)] sm:text-base">{nextMessage}</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[rgba(10,132,255,0.12)]">
            Go to login
          </Link>
          <Link to="/register" className="inline-flex items-center justify-center rounded-2xl bg-[var(--wa-primary)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0b93ff]">
            Create another account
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--wa-border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-xs uppercase tracking-[0.28em] text-[var(--wa-text-secondary)]">
          {meta.badge}
        </div>
      </div>
    </motion.div>
  );
}
