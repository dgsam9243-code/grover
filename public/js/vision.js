// Camera sensing on a tiny downscaled frame: brightness, movement, and
// (where the browser supports the Shape Detection API) number of faces.
// Frames never leave the device in this proof of concept.

import { emergencyColours } from "./scene.js";

export class VisionSensor {
  constructor(video, canvas, onUpdate) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.onUpdate = onUpdate;
    this.prev = null;
    this.motion = 0;
    this.faceDetector = "FaceDetector" in window ? new window.FaceDetector({ fastMode: true }) : null;
  }

  start() {
    this.timer = setInterval(() => this.sample(), 300);
    // Flashing lights need a faster look: brightness of a tiny copy of the picture, 10× a second.
    this.tiny = document.createElement("canvas");
    this.tiny.width = 16; this.tiny.height = 12;
    this.tinyCtx = this.tiny.getContext("2d", { willReadFrequently: true });
    this.flashHist = [];
    this.flashTimer = setInterval(() => this.sampleFlashes(), 100);
  }

  // Counts sudden jumps in brightness over the last 3 seconds (strobes, camera flashes,
  // flickering lights). The phone moving past a window gives one jump, not many.
  sampleFlashes() {
    if (this.video.readyState < 2) return;
    this.tinyCtx.drawImage(this.video, 0, 0, 16, 12);
    const d = this.tinyCtx.getImageData(0, 0, 16, 12).data;
    let sum = 0, peak = 0;
    for (let i = 0; i < d.length; i += 4) {
      const b = (d[i] + d[i + 1] + d[i + 2]) / 765;
      sum += b;
      if (b > peak) peak = b;
    }
    const now = performance.now();
    this.flashHist = [...this.flashHist.filter((h) => now - h.t < 3000), { t: now, mean: sum / 192, peak }];
    let jumps = 0;
    for (let i = 1; i < this.flashHist.length; i++) {
      const a = this.flashHist[i - 1], b = this.flashHist[i];
      if (Math.abs(b.mean - a.mean) > FLASH_STEP || Math.abs(b.peak - a.peak) > 0.35) jumps++;
    }
    this.flashes = jumps;
  }

  async sample() {
    const { width: w, height: h } = this.canvas;
    if (this.video.readyState < 2) return;
    this.ctx.drawImage(this.video, 0, 0, w, h);
    const { data } = this.ctx.getImageData(0, 0, w, h);

    const gray = new Uint8Array(w * h);
    let total = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
      gray[p] = g;
      total += g;
    }
    const brightness = total / gray.length / 255;

    const m = this.prev ? frameMotion(this.prev, gray, w, h) : { localStill: 0, localMoving: 0, global: 0, shift: 0, q: [] };
    this.prev = gray;
    // Is the phone itself moving (being walked with)? Frames shift, or even the calmest parts change.
    // Smoothed over ~2 s. Tuned on real walking footage: see SENSOR-TUNING.md (round 1).
    const shaking = m.shift > 0 || (m.q[2] ?? 0) > 4;
    this.phoneMoving = (this.phoneMoving ?? 0) * 0.85 + (shaking ? 0.15 : 0);
    // Still phone: count local movement sensitively. Moving phone: only clearly independent movement,
    // because a phone can't fully separate people moving from its own movement. Prefer quiet over false alarms.
    const local = this.phoneMoving > 0.3 ? m.localMoving : m.localStill;
    this.motion = this.motion * 0.8 + local * 0.2;

    let faces = null;
    if (this.faceDetector) {
      try {
        faces = (await this.faceDetector.detect(this.video)).length;
      } catch {
        this.faceDetector = null;
      }
    }

    this.onUpdate({ brightness, motion: this.motion, phoneMoving: this.phoneMoving > 0.3, faces, frame: m, colours: emergencyColours(data), flashes: this.flashes ?? 0 });
  }

  stop() {
    clearInterval(this.timer);
    clearInterval(this.flashTimer);
  }
}

// How much of the scene is moving on its own, separate from the phone moving.
// 1) Find the small shift that best lines up the two frames (hand shake, panning).
// 2) Split the frame into 8×8 blocks and measure how much each block changed after that shift.
// 3) "Everything changed a bit" (walking, light flicker, video noise) sets the reference level;
//    only blocks changing well above it count as real local movement, such as people passing.
// Returns localStill / localMoving: share of blocks with local movement (0..1) under a sensitive rule
// (for a still phone) and a strict one (for a moving phone), plus the shift and change quantiles.
export function frameMotion(prev, cur, w, h) {
  const R = 4;
  let best = { dx: 0, dy: 0, err: Infinity };
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      let err = 0, n = 0;
      for (let y = R; y < h - R; y += 2) {
        for (let x = R; x < w - R; x += 2) {
          err += Math.abs(cur[y * w + x] - prev[(y + dy) * w + x + dx]);
          n++;
        }
      }
      err /= n;
      if (err < best.err) best = { dx, dy, err };
    }
  }
  const B = 8, diffs = [];
  for (let by = R; by + B <= h - R; by += B) {
    for (let bx = R; bx + B <= w - R; bx += B) {
      let sum = 0;
      for (let y = by; y < by + B; y++) {
        for (let x = bx; x < bx + B; x++) sum += Math.abs(cur[y * w + x] - prev[(y + best.dy) * w + x + best.dx]);
      }
      diffs.push(sum / (B * B));
    }
  }
  const sorted = [...diffs].sort((a, b) => a - b);
  const ref = sorted[Math.floor(sorted.length * 0.3)];
  const mid = sorted[Math.floor(sorted.length * 0.5)];
  const shareAbove = (t) => diffs.filter((d) => d > t).length / diffs.length;
  const localStill = shareAbove(Math.max(10, ref * 2 + 6));
  const localMoving = shareAbove(Math.max(10, mid * 2 + 6));
  // 20 quantiles of block change, so the lab can try other movement rules offline.
  const q = Array.from({ length: 20 }, (_, i) => +sorted[Math.min(sorted.length - 1, Math.floor(((i + 1) / 20) * sorted.length))].toFixed(1));
  return { localStill, localMoving, global: ref / 255, shift: Math.hypot(best.dx, best.dy), q };
}

// A jump in average brightness between samples 0.1 s apart that counts as a flash.
export const FLASH_STEP = 0.08;
// This many flashes in 3 seconds counts as "lots of light flashes".
export const MANY_FLASHES = 5;

export function describeMotion(m) {
  if (m < 0.08) return "Still";
  if (m < 0.25) return "Some";
  return "Lots";
}

export function describeLight(b) {
  if (b < 0.18) return "Dim";
  if (b > 0.8) return "Very bright";
  return "Normal";
}
