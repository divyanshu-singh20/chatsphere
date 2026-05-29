import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FiPaperclip, FiSmile, FiMic, FiSend } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageComposer({ onSend, onTyping, onStopTyping, disabled }) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [sendingVoice, setSendingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const typingActiveRef = useRef(false);
  const lastVoiceFileRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch (error) {
          // ignore cleanup errors
        }
      }
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      onStopTyping?.();
    };
  }, [onStopTyping]);

  const clearVoiceTimers = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearVoiceStream = useCallback(() => {
    mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }, []);

  const getSupportedAudioMimeType = useCallback(() => {
    if (typeof MediaRecorder === 'undefined') return '';

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4'
    ];

    return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
  }, []);

  const canSend = useMemo(() => text.trim().length > 0 || files.length > 0, [text, files]);

  const submit = async (event) => {
    event.preventDefault();
    if (!canSend || disabled) return;
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingActiveRef.current = false;
    onStopTyping?.();
    const payload = { content: text.trim(), files };
    setText('');
    setFiles([]);
    setShowEmoji(false);
    await onSend(payload);
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files || []));
  };

  const emitTyping = () => {
    if (disabled) return;
    if (!typingActiveRef.current) {
      typingActiveRef.current = true;
      onTyping?.();
    }
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      typingActiveRef.current = false;
      onStopTyping?.();
    }, 1400);
  };

  const emitStopTyping = () => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
    if (!typingActiveRef.current) return;
    typingActiveRef.current = false;
    onStopTyping?.();
  };

  const startRecording = async () => {
    if (disabled || recording || sendingVoice) return;

    setVoiceError('');

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedAudioMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      clearVoiceTimers();
      chunksRef.current = [];
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setDuration(0);
      setRecording(true);
      setSendingVoice(false);

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setVoiceError('Microphone recording failed.');
      };

      recorder.onstop = async () => {
        const activeChunks = [...chunksRef.current];
        const resolvedMimeType = recorder.mimeType || mimeType || activeChunks[0]?.type || 'audio/webm';
        const blob = new Blob(activeChunks, { type: resolvedMimeType });

        if (!blob.size) {
          setVoiceError('No audio was captured. Please try again.');
          clearVoiceStream();
          mediaRecorderRef.current = null;
          setRecording(false);
          setDuration(0);
          return;
        }

        const extension = resolvedMimeType.includes('ogg') ? 'ogg' : resolvedMimeType.includes('mp4') ? 'm4a' : 'webm';
        const voiceFile = new File([blob], `voice-${Date.now()}.${extension}`, { type: resolvedMimeType });
        lastVoiceFileRef.current = voiceFile;
        setSendingVoice(true);

        try {
          await onSend({ content: '', files: [voiceFile] });
          lastVoiceFileRef.current = null;
          setVoiceError('');
        } catch (error) {
          setVoiceError(error?.message || 'Failed to send voice message.');
        } finally {
          clearVoiceStream();
          mediaRecorderRef.current = null;
          setRecording(false);
          setSendingVoice(false);
          setDuration(0);
        }
      };

      recorder.start();
      timerRef.current = window.setInterval(() => setDuration((value) => value + 1), 1000);
    } catch (error) {
      clearVoiceStream();
      mediaRecorderRef.current = null;
      setRecording(false);
      setDuration(0);
      setVoiceError(error?.message || 'Unable to access the microphone.');
    }
  };

  const stopRecording = () => {
    clearVoiceTimers();
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }
  };

  const retryVoiceSend = async () => {
    if (!lastVoiceFileRef.current || sendingVoice || disabled) return;
    setVoiceError('');
    setSendingVoice(true);

    try {
      await onSend({ content: '', files: [lastVoiceFileRef.current] });
      lastVoiceFileRef.current = null;
    } catch (error) {
      setVoiceError(error?.message || 'Failed to resend voice message.');
    } finally {
      setSendingVoice(false);
    }
  };

  return (
    <div className="w-full pb-[env(safe-area-inset-bottom)]">
      <AnimatePresence>
        {showEmoji ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} className="absolute bottom-20 right-4 z-20 md:right-6">
            <EmojiPicker onEmojiClick={(emoji) => setText((current) => current + emoji.emoji)} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <form onSubmit={submit} className="chat-composer items-center safe-area-bottom">
        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_18px_rgba(10,132,255,0.12)]"
          title="Emoji picker"
          aria-label="Open emoji picker"
        >
          <FiSmile />
        </button>

        <label className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_18px_rgba(10,132,255,0.12)]">
          <input type="file" multiple className="hidden" onChange={handleFileChange} />
          <FiPaperclip />
        </label>

        <textarea
          value={text}
          onChange={(event) => {
            const nextValue = event.target.value;
            setText(nextValue);
            if (nextValue.trim().length > 0) {
              emitTyping();
            } else {
              emitStopTyping();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit(event);
            }
          }}
          onBlur={emitStopTyping}
          placeholder="Type a message"
          rows={1}
          className="composer-input min-h-11 bg-[rgba(17,17,17,0.98)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
        />

        <div className="flex items-center gap-[var(--space-sm)]">
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled || sendingVoice}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--wa-primary)] transition-all active:scale-95 hover:bg-white/10 hover:shadow-[0_0_0_1px_rgba(10,132,255,0.18),0_0_18px_rgba(10,132,255,0.12)]"
              title="Record voice message"
              aria-label="Record voice message"
            >
              <FiMic />
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              disabled={sendingVoice}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--wa-error)] text-white font-[var(--fw-semibold)] transition-all active:scale-95"
              title="Stop recording"
            >
              {sendingVoice ? '...' : `${duration}s`}
            </button>
          )}

          <button
            disabled={!canSend || disabled || sendingVoice || recording}
            type="submit"
            className="composer-send"
            title="Send message"
          >
            <FiSend />
          </button>
        </div>
      </form>

      {voiceError ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[var(--wa-error)]/20 bg-[var(--wa-error)]/10 px-4 py-2 text-sm text-[var(--wa-text)]">
          <span className="truncate">{voiceError}</span>
          {lastVoiceFileRef.current ? (
            <button type="button" onClick={retryVoiceSend} disabled={sendingVoice || disabled} className="text-[var(--wa-primary)] font-[var(--fw-semibold)]">
              Retry
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}