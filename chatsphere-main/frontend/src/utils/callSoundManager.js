class CallSoundManager {
  constructor() {
    this.isUnlocked = true;
  }

  async unlock() {
    return true;
  }

  async ensureUnlocked() {
    return true;
  }

  stopRingtone() {
    return;
  }

  stopDialing() {
    return;
  }

  stopAll() {
    this.stopRingtone();
    this.stopDialing();
  }

  async playRingtone() {
    await this.ensureUnlocked();
    return false;
  }

  async playDialingTone() {
    await this.ensureUnlocked();
    return false;
  }
}

const callSoundManager = new CallSoundManager();

export default callSoundManager;
