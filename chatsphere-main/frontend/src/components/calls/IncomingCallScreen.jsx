import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPhoneIncoming, FiPhoneOff, FiVolume2 } from 'react-icons/fi';
import Avatar from '../Avatar';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3, staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const buttonVariants = {
  hover: { scale: 1.1, transition: { duration: 0.2 } },
  tap: { scale: 0.95 },
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
      className="fixed inset-0 z-50 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#000000] px-4 py-6 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(48,209,88,0.14),transparent_32%)]" />
      <motion.div
        className="relative flex h-full w-full max-w-xl flex-col items-center justify-between rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(13,13,13,0.9)] p-5 shadow-2xl backdrop-blur-xl md:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="flex w-full items-center justify-between text-xs uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]" variants={itemVariants}>
          <span>Incoming call</span>
          <span>{isVideo ? 'Video' : 'Voice'}</span>
        </motion.div>

        <motion.div className="flex flex-1 flex-col items-center justify-center text-center" variants={itemVariants}>
          <motion.div className="relative mb-6" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 100 }}>
            <motion.div className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20 blur-2xl" />
            <motion.div className="absolute inset-[-18px] rounded-full border border-emerald-400/20" animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }} />
            <Avatar src={call.peerUser?.avatar} name={peerName} size="xl" />
          </motion.div>
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--wa-text-secondary)]">Incoming {isVideo ? 'video' : 'voice'} call</p>
          <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">{peerName}</h1>
          <p className="mt-2 max-w-sm text-sm text-[var(--wa-text-secondary)]">Swipe up or tap accept to answer. The call will auto-expire if not answered.</p>
          {soundBlocked ? (
            <button onClick={onEnableSound} className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-4 py-2 text-sm text-white transition active:scale-95 hover:bg-[rgba(10,132,255,0.12)]">
              <FiVolume2 /> Tap to enable sound
            </button>
          ) : null}
        </motion.div>

        <motion.div className="flex w-full items-center justify-center gap-6" variants={itemVariants}>
          <motion.button
            onClick={() => onReject?.('rejected')}
            className="h-16 w-16 inline-flex items-center justify-center rounded-full bg-[var(--wa-error)] text-white transition-shadow hover:shadow-lg shadow-[0_0_24px_rgba(255,69,58,0.35)]"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiPhoneOff className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={() => onAccept?.()}
            className="h-16 w-16 inline-flex items-center justify-center rounded-full bg-[var(--wa-accent)] text-white transition-shadow hover:shadow-lg shadow-[0_0_24px_rgba(48,209,88,0.35)]"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
          >
            <FiPhoneIncoming className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}