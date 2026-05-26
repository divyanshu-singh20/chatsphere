import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPhoneIncoming, FiPhoneOff, FiVolume2 } from 'react-icons/fi';
import Avatar from '../Avatar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } }
};

const actionVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.96 }
};

export default function IncomingCallScreen({ call, soundBlocked, onEnableSound, onAccept, onReject }) {
  const peerName = call.peerUser?.fullName || call.peerUser?.username || 'Unknown user';
  const isVideo = call.type === 'video';

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      onReject?.('missed');
    }, 30000);

    return () => window.clearTimeout(timeout);
  }, [onReject]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black px-4 py-6 text-white call-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(48,209,88,0.18),transparent_30%),radial-gradient(circle_at_bottom,rgba(10,132,255,0.14),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.88),rgba(0,0,0,0.98))]" />
      <div className="absolute inset-0 call-grid-overlay opacity-45" />
      <motion.div
        className="relative flex w-full max-w-xl flex-col items-center justify-between rounded-[2rem] border border-white/10 bg-[rgba(13,13,13,0.88)] px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:px-8 sm:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex w-full items-center justify-between text-[11px] uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]" variants={itemVariants}>
          <span>Incoming call</span>
          <span>{isVideo ? 'Video' : 'Voice'}</span>
        </motion.div>

        <motion.div className="flex flex-1 flex-col items-center justify-center text-center" variants={itemVariants}>
          <motion.div className="call-avatar-ring relative mb-6" initial={{ scale: 0.92 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 110 }}>
            <motion.div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl" animate={{ opacity: [0.35, 0.8, 0.35], scale: [1, 1.08, 1] }} transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }} />
            <Avatar src={call.peerUser?.avatar} name={peerName} size="xl" />
          </motion.div>

          <div className="call-status-chip mb-3 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--wa-accent)] animate-pulse" />
            Ringing
          </div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">{isVideo ? 'Incoming video call' : 'Incoming voice call'}</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{peerName}</h1>
          <p className="mt-3 max-w-sm text-sm text-[var(--wa-text-secondary)]">Swipe up or tap accept to answer. The ring will end automatically if the call is missed.</p>
          {soundBlocked ? (
            <motion.button
              onClick={onEnableSound}
              variants={actionVariants}
              whileHover="hover"
              whileTap="tap"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white transition hover:bg-white/10"
            >
              <FiVolume2 /> Tap to enable sound
            </motion.button>
          ) : null}
        </motion.div>

        <motion.div className="flex w-full items-center justify-center gap-5 pt-2 sm:gap-6" variants={itemVariants}>
          <motion.button
            onClick={() => onReject?.('rejected')}
            variants={actionVariants}
            whileHover="hover"
            whileTap="tap"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wa-error)] text-white shadow-[0_0_24px_rgba(255,69,58,0.35)] transition"
            aria-label="Reject call"
            title="Reject call"
          >
            <FiPhoneOff className="h-6 w-6" />
          </motion.button>

          <motion.button
            onClick={() => onAccept?.()}
            variants={actionVariants}
            whileHover="hover"
            whileTap="tap"
            className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--wa-accent)] text-white shadow-[0_0_24px_rgba(48,209,88,0.34)] transition"
            aria-label="Accept call"
            title="Accept call"
          >
            <FiPhoneIncoming className="h-6 w-6" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}