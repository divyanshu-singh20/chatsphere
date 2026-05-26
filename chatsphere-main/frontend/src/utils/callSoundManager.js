class CallSoundManager {
  constructor() {
    this.isUnlocked = false;
    this.audio = null;
    this.lastPlayAttempt = 0;
    this.activeMode = null;
    this.assetUrl = '/sounds/call-tone.mpeg';

    if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname || '')) {
      window.__callSoundManager = this;
    }
  }

  async unlock() {
    this.ensureAudio();

    try {
      if (!this.audio) return false;
      this.audio.muted = true;
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise?.catch) {
        await playPromise;
      }
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.muted = false;
      this.isUnlocked = true;
      return true;
    } catch (error) {
      this.isUnlocked = false;
      return false;
    }
  }

  async ensureUnlocked() {
    this.ensureAudio();
    return this.isUnlocked;
  }

  ensureAudio() {
    if (this.audio) return this.audio;

    const audio = new Audio(this.assetUrl);
    audio.preload = 'auto';
    audio.loop = true;
    audio.playsInline = true;
    audio.crossOrigin = 'anonymous';
    audio.volume = 1;

    audio.addEventListener('ended', () => {
      if (!audio.loop || audio.paused) return;
      audio.currentTime = 0;
      const replay = audio.play();
      if (replay?.catch) replay.catch(() => {});
    });

    this.audio = audio;
    return audio;
  }

  stopRingtone() {
    if (!this.audio) return;

    try {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.muted = false;
    } catch (error) {
      // ignore stop errors
    }

    this.activeMode = null;
  }

  stopDialing() {
    this.stopRingtone();
  }

  stopAll() {
    this.stopRingtone();
    this.stopDialing();
  }

  async playTone(mode = 'ringtone') {
    const audio = this.ensureAudio();

    if (!audio) return false;

    const now = Date.now();
    if (now - this.lastPlayAttempt < 350 && this.activeMode === mode && !audio.paused) {
      return this.isUnlocked;
    }
    this.lastPlayAttempt = now;

    try {
      if (this.activeMode !== mode || audio.paused) {
        this.stopRingtone();
      }

      audio.loop = true;
      audio.preload = 'auto';
      audio.currentTime = 0;
      audio.muted = false;
      const playPromise = audio.play();
      if (playPromise?.catch) {
        await playPromise;
      }
      this.isUnlocked = true;
      this.activeMode = mode;
      return true;
    } catch (error) {
      if (error?.name === 'AbortError') {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (cleanupError) {
          // ignore cleanup errors
        }
      }

      this.isUnlocked = false;
      this.activeMode = null;
      return false;
    }
  }

  async playRingtone() {
    return this.playTone('incoming');
  }

  async playDialingTone() {
    return this.playTone('dialing');
  }
}

const callSoundManager = new CallSoundManager();

export default callSoundManager;
