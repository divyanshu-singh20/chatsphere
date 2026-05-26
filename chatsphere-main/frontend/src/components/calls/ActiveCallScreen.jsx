import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiCamera, FiMaximize, FiMic, FiMicOff, FiMinimize, FiPhoneOff, FiRepeat, FiVideo, FiVideoOff, FiVolume2, FiVolumeX } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Avatar from '../Avatar';
import useCall from '../../hooks/useCall';
import AudioPlayer from './AudioPlayer';

const formatDuration = (seconds = 0) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0');
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${remainingSeconds}`;
};

const StreamVideo = memo(({ stream, muted, className }) => {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    video.autoplay = true;
    video.playsInline = true;
    video.muted = !!muted;

    if (!stream) {
      if (video.srcObject) {
        video.pause();
        video.srcObject = null;
      }
      return;
    }

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }
    };

    if (video.readyState >= 1) {
      playVideo();
    }

    video.onloadedmetadata = playVideo;

    return () => {
      video.onloadedmetadata = null;
      if (video.srcObject === stream) {
        video.pause();
        video.srcObject = null;
      }
    };
  }, [stream, muted]);

  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
});

const controlVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } }
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.96 }
};

export default function ActiveCallScreen({ call, localStream, remoteStream, durationSeconds = 0, onToggleMute, onToggleCamera, onEnd }) {
  const { switchCamera } = useCall();
  const shellRef = useRef(null);
  const peerName = call.peerUser?.fullName || call.peerUser?.username || 'Unknown user';
  const isVideo = call.type === 'video';
  const displayDuration = useMemo(() => formatDuration(durationSeconds), [durationSeconds]);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const connectionLabel = call.status === 'connecting' ? (call.connectedAt ? 'Reconnecting' : 'Connecting') : 'Connected';
  const isConnecting = call.status === 'connecting';

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await shellRef.current?.requestFullscreen?.();
    } catch (error) {
      console.warn('[call][fullscreen]', error);
    }
  }, []);

  const remoteMediaReady = !!remoteStream && (remoteStream.getVideoTracks?.() || []).length > 0;

  return (
    <motion.div
      ref={shellRef}
      className="fixed inset-0 z-50 overflow-hidden bg-black text-white call-shell"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(48,209,88,0.18),transparent_32%),radial-gradient(circle_at_bottom,rgba(10,132,255,0.18),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0.88),rgba(0,0,0,0.98))]" />
      <div className="absolute inset-0 call-grid-overlay opacity-50" />

      <div className="relative flex h-full min-h-[100dvh] flex-col px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className={`call-status-dot ${isConnecting ? 'animate-pulse' : ''}`} />
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">{connectionLabel}</p>
              <p className="truncate text-base font-semibold text-white">{peerName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="call-status-chip">{isVideo ? 'Video' : 'Voice'}</span>
            <span className="call-status-chip">{displayDuration}</span>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          <div className="call-media-shell relative h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[rgba(10,10,10,0.72)] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
            {remoteStream ? <AudioPlayer stream={remoteStream} volume={speakerOn ? 1 : 0.25} /> : null}

            {isVideo && remoteMediaReady ? (
              <StreamVideo stream={remoteStream} muted={false} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center px-6 py-10 text-center">
                <motion.div
                  className="max-w-md"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                >
                  <motion.div
                    className="call-avatar-ring mx-auto mb-5"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Avatar src={call.peerUser?.avatar} name={peerName} size="xl" />
                  </motion.div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">{isVideo ? 'Waiting for video stream' : 'Voice call in progress'}</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{peerName}</h1>
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--wa-text-secondary)]">
                    <span className={`h-2 w-2 rounded-full ${isConnecting ? 'bg-[var(--wa-away)]' : 'bg-[var(--wa-accent)]'}`} />
                    <span>{isConnecting ? 'Connecting devices' : 'Live and stable'}</span>
                  </div>
                  {!isVideo ? (
                    <div className="mt-6 flex items-end justify-center gap-1.5">
                      {Array.from({ length: 9 }).map((_, index) => (
                        <span
                          key={index}
                          className="inline-block w-1.5 rounded-full bg-[var(--wa-accent)]"
                          style={{ height: `${12 + ((index * 7) % 30)}px`, animation: `callWave ${1.2 + index * 0.05}s ease-in-out infinite` }}
                        />
                      ))}
                    </div>
                  ) : null}
                </motion.div>
              </div>
            )}

            {localStream ? (
              <motion.div
                drag
                dragMomentum={false}
                dragElastic={0.08}
                dragConstraints={shellRef}
                whileDrag={{ scale: 1.02 }}
                className="call-pip absolute right-3 top-3 z-20 h-28 w-20 overflow-hidden rounded-[1.4rem] border border-white/10 bg-[rgba(6,6,6,0.92)] shadow-[0_18px_44px_rgba(0,0,0,0.45)] sm:h-36 sm:w-24 md:right-5 md:top-5 md:h-40 md:w-28"
              >
                {isVideo ? (
                  <StreamVideo stream={localStream} muted className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-medium text-[var(--wa-text-secondary)]">Mic on</div>
                )}
                <div className="call-pip__label">You</div>
              </motion.div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-20 sm:px-5 sm:pt-24">
              <motion.div
                className="mx-auto flex max-w-3xl flex-col items-center gap-3"
                variants={controlVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="call-control-dock flex w-full items-center justify-center gap-2 rounded-[1.6rem] px-3 py-3 sm:gap-3 sm:px-4">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onToggleMute}
                    className={`call-control-button ${call.isMuted ? 'is-active' : ''}`}
                    aria-label={call.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    title={call.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {call.isMuted ? <FiMicOff /> : <FiMic />}
                  </motion.button>

                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={onToggleCamera}
                    disabled={!isVideo}
                    className={`call-control-button ${call.isCameraOff ? 'is-active' : ''}`}
                    aria-label={call.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                    title={call.isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                  >
                    {call.isCameraOff ? <FiVideoOff /> : <FiVideo />}
                  </motion.button>

                  {isVideo ? (
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={switchCamera}
                      className="call-control-button"
                      aria-label="Switch camera"
                      title="Switch camera"
                    >
                      <FiCamera />
                    </motion.button>
                  ) : null}

                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setSpeakerOn((current) => !current)}
                    className={`call-control-button ${speakerOn ? 'is-active' : ''}`}
                    aria-label={speakerOn ? 'Turn speaker off' : 'Turn speaker on'}
                    title={speakerOn ? 'Speaker on' : 'Speaker off'}
                  >
                    {speakerOn ? <FiVolume2 /> : <FiVolumeX />}
                  </motion.button>

                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={toggleFullscreen}
                    className="call-control-button hidden md:inline-flex"
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                  </motion.button>

                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onEnd?.('ended')}
                    className="call-control-button call-control-button--end"
                    aria-label="End call"
                    title="End call"
                  >
                    <FiPhoneOff />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}