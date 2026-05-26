class CallSoundManager {
  constructor() {
    this.isUnlocked = false;
    this.audio = null;
    this.lastPlayAttempt = 0;
    this.assetUrl = '/sounds/ringtone.mpeg';
  }

  async unlock() {
    this.ensureAudio();

    try {
      if (!this.audio) return false;
      const previousMuted = this.audio.muted;
      this.audio.muted = true;
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise?.catch) {
        await playPromise;
      }
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.muted = previousMuted;
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
      if (!audio.loop) return;
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
    } catch (error) {
      // ignore stop errors
    }
  }

  stopDialing() {
    return;
  }

  stopAll() {
    this.stopRingtone();
    this.stopDialing();
  }

  async playRingtone() {
    const audio = this.ensureAudio();

    if (!audio) return false;

    const now = Date.now();
    if (now - this.lastPlayAttempt < 500) {
      return this.isUnlocked;
    }
    this.lastPlayAttempt = now;

    try {
      this.stopRingtone();
      audio.loop = true;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise?.catch) {
        await playPromise;
      }
      this.isUnlocked = true;
      return true;
    } catch (error) {
      this.isUnlocked = false;
      return false;
    }
  }

  async playDialingTone() {
    await this.ensureUnlocked();
    return false;
  }
}

const callSoundManager = new CallSoundManager();

export default callSoundManager;
