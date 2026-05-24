// Utility to pause/resume background audio/video elements when a call starts
const PAUSED_BY_MANAGER_ATTR = 'data-paused-by-audio-manager';

export function pauseBackgroundAudio() {
  try {
    const els = Array.from(document.querySelectorAll('audio,video'));
    els.forEach((el) => {
      try {
        if (el.paused) return;
        el.pause();
        el.setAttribute(PAUSED_BY_MANAGER_ATTR, '1');
      } catch (e) {
        // ignore individual element errors
      }
    });
  } catch (e) {
    // ignore
  }
}

export function resumeBackgroundAudio() {
  try {
    const els = Array.from(document.querySelectorAll(`audio[${PAUSED_BY_MANAGER_ATTR}],video[${PAUSED_BY_MANAGER_ATTR}]`));
    els.forEach((el) => {
      try {
        // attempt to play, but browsers may block autoplay — ignore failures
        const p = el.play();
        if (p && p.catch) p.catch(() => {});
        el.removeAttribute(PAUSED_BY_MANAGER_ATTR);
      } catch (e) {
        // ignore
      }
    });
  } catch (e) {
    // ignore
  }
}

export default { pauseBackgroundAudio, resumeBackgroundAudio };
