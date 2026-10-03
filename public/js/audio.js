// Ambient sound sensing: overall loudness + sudden loud sounds.
// Uses the Web Audio API; nothing is recorded or sent anywhere.

// For the first few seconds Grover listens to the room to learn its usual level.
// This is a warm-up: the level starts at the room's level instead of rising from
// zero, and sudden-sound alerts wait until it is done.
const CALIBRATE_MS = 4000;
const SMOOTH_S = 0.2;
const SPIKE_CONFIRM = 0.6;

// The level that counts as loud is the profile's own, absolute threshold.
// Raising it to match a noisy room was tried and removed: on real footage it hid
// genuinely loud places (a market, loud music) from everyone. See SENSOR-TUNING.md.
export function loudThreshold(profileLoud) {
  return profileLoud;
}

// What a quiet room reads on the reference footage (library, calm indoor walk: about 0.20).
export const QUIET_ROOM = 0.2;
// Sound check: from readings taken in a quiet room, the correction for this phone's mic.
// Returns null if the room was too noisy to tell. 0.1 on this scale is about 6 dB.
export function micOffsetFrom(quietReadings) {
  const sorted = [...quietReadings].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median == null || median > 0.42) return null;
  return Math.max(-0.15, Math.min(0.15, QUIET_ROOM - median));
}

export class AudioSensor {
  constructor(onUpdate, onCalibrated) {
    this.onUpdate = onUpdate;
    this.onCalibrated = onCalibrated;
    this.baseline = null;
    this.micOffset = 0;
    this.samples = [];
    this.level = 0;        // smoothed 0..1
    this.ctx = null;
  }

  start(stream) {
    this.ctx = new AudioContext();
    this.listen(this.ctx.createMediaStreamSource(stream));
  }

  // For testing on recorded video (lab.html): analyse a playing <video> and still let it be heard.
  startFromElement(el) {
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaElementSource(el);
    src.connect(this.ctx.destination);
    this.listen(src);
  }

  listen(src) {
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    src.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.spec = new Float32Array(this.analyser.frequencyBinCount);
    this.sounds = new SoundEvents();
    this.calibrateUntil = performance.now() + CALIBRATE_MS;
    this.lastT = performance.now();
    // A fixed ~30 Hz timer (not requestAnimationFrame): same behaviour on 30/60/120 Hz screens and in low-power mode.
    this.timer = setInterval(this.tick, 33);
  }

  tick = () => {
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (const v of this.buf) sum += v * v;
    const rms = Math.sqrt(sum / this.buf.length);
    // Map roughly -60dBFS..0dBFS onto 0..1. Not calibrated SPL, just relative.
    const db = 20 * Math.log10(rms + 1e-8);
    // micOffset comes from the sound check: phones' microphones record louder or quieter.
    const instant = Math.min(1, Math.max(0, (db + 60) / 60 + this.micOffset));
    const now = performance.now();
    const dt = Math.min(0.5, (now - this.lastT) / 1000);
    this.lastT = now;
    const prev = this.level;
    // Time-based smoothing (≈0.2 s), independent of how often tick runs.
    this.level = prev + (instant - prev) * (1 - Math.exp(-dt / SMOOTH_S));
    const calibrating = this.baseline == null;
    if (calibrating) {
      this.samples.push(instant);
      if (performance.now() >= this.calibrateUntil) {
        // Median: one door slam during calibration shouldn't set the baseline.
        const sorted = [...this.samples].sort((a, b) => a - b);
        this.baseline = sorted[Math.floor(sorted.length / 2)] ?? 0;
        this.level = this.baseline;
        this.onCalibrated?.(this.baseline);
      }
    }
    // A sudden jump only counts if it actually becomes loud within 0.75 s. On real footage, most
    // jumps were voices or doors near the mic that stayed moderate (see SENSOR-TUNING.md, round 3).
    if (!calibrating && instant - prev > 0.35 && instant > 0.7) this.pendingSpike ??= now;
    let spike = false;
    if (this.pendingSpike != null) {
      if (this.level >= SPIKE_CONFIRM) { spike = true; this.pendingSpike = null; }
      else if (now - this.pendingSpike > 750) this.pendingSpike = null;
    }
    // Spectrum features for stressful sounds (sirens, alarms, shrill noise).
    this.analyser.getFloatFrequencyData(this.spec);
    const f = spectrumFeatures(this.spec, this.ctx.sampleRate / this.analyser.fftSize);
    const sound = calibrating ? null : this.sounds.update({ ...f, level: this.level }, now);
    this.onUpdate({ level: this.level, spike, instant, sound, features: f });
  };

  stop() {
    clearInterval(this.timer);
    this.ctx?.close();
  }
}

export function describeLevel(l) {
  if (l < 0.3) return "Quiet";
  if (l < 0.55) return "Moderate";
  if (l < 0.72) return "Busy";
  return "Loud";
}

// ---------- stressful sounds ----------
// One frame of the spectrum: the strongest pitch, how much it stands out ("tonal": a beep or a
// siren, rather than chatter or traffic), and the share of energy above 4 kHz (shrill sounds).
export function spectrumFeatures(spec, binHz) {
  let peak = -Infinity, peakBin = 0, total = 0, high = 0;
  const lo = Math.floor(150 / binHz), hiStart = Math.floor(4000 / binHz);
  const sorted = [];
  for (let i = lo; i < spec.length; i++) {
    const db = spec[i];
    sorted.push(db);
    const p = Math.pow(10, db / 10);
    total += p;
    if (i >= hiStart) high += p;
    if (db > peak) { peak = db; peakBin = i; }
  }
  sorted.sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  // Purity: share of energy right at the main pitch. Electronic sirens and alarms are close
  // to one pure tone; instruments and voices spread energy over harmonics and chords.
  let near = 0;
  for (let i = Math.max(lo, peakBin - 2); i <= Math.min(spec.length - 1, peakBin + 2); i++) near += Math.pow(10, spec[i] / 10);
  return { pitch: peakBin * binHz, prominence: peak - median, highShare: total ? high / total : 0, purity: total ? near / total : 0 };
}

// Recognises patterns over the last few seconds:
//  siren  – a strong tone that sweeps up and down (~450–2000 Hz), or jumps between two pitches (two-tone)
//  alarm  – one steady pitch beeping on and off (any pitch 400–4000 Hz), or a steady tone ≥ 2.5 kHz
//  shrill – loud, with a lot of very high-pitched energy (squeals, whistles, hand dryers)
// Tuned on synthetic sounds and checked against real footage (SENSOR-TUNING.md).
const PURE_TONE = 0.5;

export class SoundEvents {
  constructor() { this.hist = []; }
  update(f, now) {
    this.hist = [...this.hist.filter((h) => now - h.t < 3000), { t: now, ...f }];
    if (this.hist.length < 40 || now - this.hist[0].t < 2500) return null;
    const tonal = this.hist.filter((h) => h.prominence > 30 && h.level > 0.35);
    const share = tonal.length / this.hist.length;
    const pitches = tonal.map((h) => h.pitch);
    // Sirens and alarms are near-pure tones (purity ~0.6–0.8 on real recordings); music is not
    // (an accordion measured 0.38). Without that, a melody can look like a siren.
    const purities = tonal.map((h) => h.purity ?? 1).sort((x, y) => x - y);
    const pure = purities.length > 0 && purities[Math.floor(purities.length / 2)] > PURE_TONE;
    if (!pure) {
      const shrillOnly = this.hist.filter((h) => h.highShare > 0.4 && h.level > 0.5).length / this.hist.length;
      return shrillOnly > 0.7 ? "shrill" : null;
    }
    if (share > 0.6) {
      const lo = Math.min(...pitches), hi = Math.max(...pitches);
      const mid = pitches.reduce((a, b) => a + b, 0) / pitches.length;
      // A siren GLIDES: the pitch keeps moving a little every frame. Music holds a note and
      // then jumps (an accordion and a beatboxer read as sirens until this was added).
      // Pitch is measured in ~47 Hz steps, so compare with ~0.17 s earlier (5 frames), not the last frame.
      let gliding = 0, compared = 0;
      for (let i = 5; i < pitches.length; i++) { const d = Math.abs(pitches[i] - pitches[i - 5]); compared++; if (d > 30 && d < 400) gliding++; }
      if (mid > 450 && mid < 2000 && hi - lo > 250 && compared && gliding / compared > 0.5) return "siren";
      // Two-tone sirens ("nee-naw", common in the UK and Europe) jump between two fixed pitches.
      const split = (lo + hi) / 2;
      const low = pitches.filter((p) => p < split).length / pitches.length;
      let jumps = 0;
      for (let i = 1; i < pitches.length; i++) if ((pitches[i] < split) !== (pitches[i - 1] < split)) jumps++;
      // ...and only two pitches, each held steady (melodies use many notes).
      const spreadOf = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length); };
      const lows = pitches.filter((p) => p < split), highs = pitches.filter((p) => p >= split);
      const twoSteady = lows.length > 3 && highs.length > 3 && spreadOf(lows) < 25 && spreadOf(highs) < 25;
      if (mid > 400 && mid < 1500 && hi - lo > 80 && low > 0.25 && low < 0.75 && jumps >= 3 && twoSteady) return "siren";
      if (mid >= 2500 && hi - lo < 250) return "alarm"; // smoke alarms sit near 3 kHz; held musical notes are lower
    }
    // Alarm pattern: the SAME pitch switching on and off again and again. Real fire alarms
    // include low 520 Hz sounders (found on real recordings), so any pitch 400–4000 Hz counts;
    // sirens sweep their pitch and music keeps changing it, so they don't match.
    const on = (h) => h.prominence > 30 && h.level > 0.35;
    let switches = 0;
    for (let i = 1; i < this.hist.length; i++) if (on(this.hist[i]) !== on(this.hist[i - 1])) switches++;
    if (switches >= 4 && tonal.length >= 8) {
      const mean = pitches.reduce((x, y) => x + y, 0) / pitches.length;
      const spread = Math.sqrt(pitches.reduce((x, y) => x + (y - mean) ** 2, 0) / pitches.length);
      if (mean > 400 && mean < 4000 && spread < 40) return "alarm";
    }
    const shrill = this.hist.filter((h) => h.highShare > 0.4 && h.level > 0.5).length / this.hist.length;
    if (shrill > 0.7) return "shrill";
    return null;
  }
}
