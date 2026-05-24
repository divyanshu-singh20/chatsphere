import { memo, useEffect, useMemo, useRef } from 'react';
import { FiCamera, FiMic, FiMicOff, FiPhoneOff, FiVideo, FiVideoOff } from 'react-icons/fi';
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

const StreamVideo = memo(({ stream, className }) => {
  const ref = useRef(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;

    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;

    if (!stream) {
      if (video.srcObject) {
        video.pause();
        video.srcObject = null;
      }
      return undefined;
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
  }, [stream]);

  return <video ref={ref} autoPlay playsInline muted className={className} />;
});

export default function ActiveCallScreen({ call, localStream, remoteStream, durationSeconds = 0, onToggleMute, onToggleCamera, onEnd }) {
  const { switchCamera } = useCall();
  const peerName = call.peerUser?.fullName || call.peerUser?.username || 'Unknown user';
  const isVideo = call.type === 'video';
  const displayDuration = useMemo(() => formatDuration(durationSeconds), [durationSeconds]);
  const connectionLabel = call.status === 'connecting' ? 'Reconnecting' : 'Connected';

  return (
    <div className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col overflow-hidden bg-[#000000] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(10,132,255,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(48,209,88,0.12),transparent_34%)]" />

      <div className="relative flex items-center justify-between gap-4 px-4 pb-3 pt-[max(env(safe-area-inset-top),1rem)] md:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">{connectionLabel}</p>
          <p className="mt-1 text-sm text-white">{peerName}</p>
        </div>
        <div className="rounded-full border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-3 py-2 text-sm font-medium text-white tabular-nums tracking-[0.12em]">{displayDuration}</div>
      </div>

      <div className="relative flex-1 px-4 pb-4 md:px-6 md:pb-6">
        <div className="relative h-full min-h-[calc(100dvh-220px)] overflow-hidden rounded-[2rem] border border-[var(--wa-border)] bg-[rgba(13,13,13,0.9)] shadow-2xl">
          {remoteStream ? <AudioPlayer stream={remoteStream} /> : null}

          {isVideo && remoteStream && (remoteStream.getVideoTracks?.() || []).length ? (
            <StreamVideo stream={remoteStream} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <Avatar src={call.peerUser?.avatar} name={peerName} size="xl" />
                <h1 className="mt-4 text-3xl font-semibold text-white">{peerName}</h1>
                <p className="mt-2 text-sm text-[var(--wa-text-secondary)]">{isVideo ? 'Waiting for video stream...' : 'Voice call in progress'}</p>
                {!isVideo ? (
                  <div className="mt-6 flex items-end justify-center gap-1">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span
                        key={index}
                        className="inline-block w-1 rounded-full bg-[var(--wa-accent)]"
                        style={{ height: `${10 + ((index * 7) % 28)}px`, animation: `pulse ${1.2 + index * 0.04}s ease-in-out infinite` }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {localStream ? (
            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-2xl border border-[var(--wa-border)] bg-[rgba(10,10,10,0.94)] shadow-xl md:h-32 md:w-44">
              {isVideo ? <StreamVideo stream={localStream} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[var(--wa-text-secondary)]">Mic on</div>}
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 pt-16 md:p-6 md:pt-24">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-6 md:max-w-lg">
                <button onClick={onToggleMute} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wa-card-hover)] text-white transition active:scale-95 hover:bg-[rgba(10,132,255,0.12)]">
                  {call.isMuted ? <FiMicOff /> : <FiMic />}
                </button>
                <button onClick={onToggleCamera} disabled={!isVideo} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wa-card-hover)] text-white transition active:scale-95 disabled:opacity-50 hover:bg-[rgba(10,132,255,0.12)]">
                  {call.isCameraOff ? <FiVideoOff /> : <FiVideo />}
                </button>
                {isVideo ? (
                  <button onClick={switchCamera} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wa-card-hover)] text-white transition active:scale-95 hover:bg-[rgba(10,132,255,0.12)]" aria-label="Switch camera">
                    <FiCamera />
                  </button>
                ) : null}
                <button onClick={() => onEnd?.('ended')} className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--wa-error)] text-white transition active:scale-95">
                  <FiPhoneOff />
                </button>
              </div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--wa-text-secondary)]">Swipe down to hide this panel on mobile</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}