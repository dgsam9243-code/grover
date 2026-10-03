// Live speech-to-text via the browser's Web Speech API (Chrome/Edge).
// Note: browser speech recognition may use a cloud service under the hood.
// It cannot tell speakers apart, so cues are phrased as "someone may…".

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const speechSupported = Boolean(SR);

export class SpeechSensor {
  constructor({ onFinal, onInterim, onPace }) {
    this.onFinal = onFinal;
    this.onInterim = onInterim;
    this.onPace = onPace;
    this.words = []; // timestamps of recent words, for pace
    this.paused = false;
    this.running = false;
  }

  start() {
    if (!SR) return false;
    this.rec = new SR();
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.lang = navigator.language || "en-US";
    this.rec.onresult = (e) => {
      if (this.paused) return;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const text = r[0].transcript.trim();
          if (text) {
            this.recordWords(text);
            this.onFinal(text);
          }
        } else {
          interim += r[0].transcript;
        }
      }
      this.onInterim(interim);
    };
    // Recognition stops itself after silence; keep it alive while we're running.
    this.rec.onend = () => this.running && this.rec.start();
    this.rec.onerror = (e) => {
      if (e.error === "not-allowed") this.running = false;
    };
    this.running = true;
    this.rec.start();
    this.paceTimer = setInterval(() => this.onPace(this.wpm()), 1000);
    return true;
  }

  recordWords(text) {
    const now = Date.now();
    const n = text.split(/\s+/).length;
    for (let i = 0; i < n; i++) this.words.push(now);
  }

  wpm() {
    const cutoff = Date.now() - 20000;
    this.words = this.words.filter((t) => t > cutoff);
    return this.words.length * 3; // words in last 20s -> per minute
  }

  // Avoid transcribing our own spoken coaching.
  setPaused(p) {
    this.paused = p;
  }

  stop() {
    this.running = false;
    clearInterval(this.paceTimer);
    this.rec?.stop();
  }
}

export function describePace(wpm) {
  if (wpm === 0) return "Silent";
  if (wpm < 110) return "Slow";
  if (wpm < 170) return "Normal";
  return "Fast";
}
