import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiClock, FiPhoneOff } from 'react-icons/fi';
import Avatar from '../Avatar';

const variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.24, ease: 'easeOut' } }
};

const statusCopy = {
  missed: {
    icon: FiAlertCircle,
    title: 'Missed call',
    description: 'The call rang out before anyone answered.'
  },
  rejected: {
    icon: FiPhoneOff,
    title: 'Call rejected',
    description: 'The other person declined the call.'
  },
  ended: {
    icon: FiCheckCircle,
    title: 'Call ended',
    description: 'The session has been closed cleanly.'
  }
};

export default function CallTerminalScreen({ call }) {
  const peerName = call.peerUser?.fullName || call.peerUser?.username || 'Unknown user';
  const meta = statusCopy[call.endedReason] || statusCopy.ended;
  const StatusIcon = meta.icon;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black px-4 py-6 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(48,209,88,0.12),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.88),rgba(0,0,0,0.98))]" />
      <div className="absolute inset-0 call-grid-overlay opacity-40" />

      <motion.div
        className="relative flex w-full max-w-xl flex-col items-center rounded-[2rem] border border-white/10 bg-[rgba(12,12,12,0.9)] px-6 py-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-2xl sm:px-8 sm:py-10"
        variants={variants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-[2rem] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="call-status-chip mb-4 inline-flex items-center gap-2">
          <FiClock /> Ending
        </div>
        <motion.div
          className="call-avatar-ring mx-auto mb-5"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Avatar src={call.peerUser?.avatar} name={peerName} size="xl" />
        </motion.div>
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-[rgba(255,255,255,0.06)] text-2xl text-white">
          <StatusIcon />
        </div>
        <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">{meta.title}</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">{peerName}</h1>
        <p className="mt-3 max-w-sm text-sm text-[var(--wa-text-secondary)]">{meta.description}</p>
      </motion.div>
    </motion.div>
  );
}