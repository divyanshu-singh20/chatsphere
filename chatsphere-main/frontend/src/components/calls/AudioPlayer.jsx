import { memo, useEffect, useRef } from 'react';

function AudioPlayer({ stream, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const audio = ref.current;
    if (!audio) return;

    if (!stream) {
      if (audio.srcObject) {
        audio.pause();
        audio.srcObject = null;
      }
      return;
    }

    if (audio.srcObject !== stream) {
      audio.srcObject = stream;
    }

    // Prime playback muted to satisfy autoplay restrictions, then unmute once playing.
    audio.muted = true;
    audio.volume = 1;

    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise
        .then(() => {
          audio.muted = false;
        })
        .catch((error) => {
          if (error?.name === 'AbortError') return;
          console.warn('[webrtc][audio] remote playback blocked', error);
        });
    }

    const handlePlaying = () => {
      audio.muted = false;
    };

    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('playing', handlePlaying);
      if (audio.srcObject === stream) {
        audio.pause();
        audio.srcObject = null;
      }
    };
  }, [stream]);

  return <audio ref={ref} autoPlay playsInline className={className} />;
}

export default memo(AudioPlayer);