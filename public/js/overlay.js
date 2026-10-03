// Camera check: draws what Grover sees on top of the live video, so it is easy to
// tell that the camera is working and being read. Faces get a thin box that follows
// them, labelled with their expression in words (with the emoji beside it, never on
// its own); people found by the object reader get a fainter box. A status line shows
// the camera's frame rate and whether the face reader is loading, ready or stuck.

import { EXPRESSIONS } from "./perception.js";

// How quickly a box glides to the newest face position (ms to cover most of the gap).
const FOLLOW_MS = 70;
// Face readings arrive 8× a second; a face missing for longer than this has left.
const LOST_MS = 400;

export class CameraOverlay {
  constructor(video, canvas, statusEl) {
    this.video = video;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.statusEl = statusEl;
    this.result = null;     // last full perception reading (people boxes, errors)
    this.resultAt = 0;
    this.tracks = [];       // faces being followed: { box shown, target, history of expressions }
    this.frames = [];       // times of recent camera frames, for the fps count
    this.reader = () => ({ status: "off" });
  }

  // reader(): { status, progress, rate, error } from the perception runner.
  start(reader) {
    this.reader = reader;
    this.running = true;
    this.frames = [];
    const v = this.video;
    // Count real decoded frames where the browser can tell us; otherwise watch the video clock move.
    if ("requestVideoFrameCallback" in v) {
      const onFrame = () => {
        if (!this.running) return;
        this.frames.push(performance.now());
        v.requestVideoFrameCallback(onFrame);
      };
      v.requestVideoFrameCallback(onFrame);
    } else {
      this.lastTime = -1;
    }
    const loop = () => {
      if (!this.running) return;
      if (!("requestVideoFrameCallback" in v) && v.currentTime !== this.lastTime) {
        this.lastTime = v.currentTime;
        this.frames.push(performance.now());
      }
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
    this.statusTimer = setInterval(() => this.renderStatus(), 500);
    this.renderStatus();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    clearInterval(this.statusTimer);
    this.result = null;
    this.tracks = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.statusEl.textContent = "Camera is off";
    this.statusEl.className = "cam-status";
  }

  update(p) {
    this.result = { people: p.people ?? this.result?.people ?? [], errors: p.errors };
    this.resultAt = performance.now();
  }

  // A new face reading (8× a second). Each face is matched to the nearest face already
  // being followed, so its box can glide there and its expression label stays steady.
  track(faces) {
    const now = performance.now();
    const centre = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
    const free = [...this.tracks];
    const next = [];
    for (const f of faces) {
      const target = headBox(f.box);
      const c = centre(target);
      // The face reader numbers each face it follows; fall back to the nearest box.
      let best = f.id != null ? free.find((t) => t.id === f.id) ?? null : null, bestD = best ? 0 : Infinity;
      if (!best) for (const t of free) {
        const tc = centre(t.target);
        const d = Math.hypot(tc.x - c.x, tc.y - c.y);
        if (d < Math.max(t.target.w, target.w) && d < bestD) { best = t; bestD = d; }
      }
      const t = best ?? { box: { ...target }, history: [] };
      if (best) free.splice(free.indexOf(best), 1);
      t.target = target;
      t.id = f.id;
      t.readable = f.readable;
      t.lookingAtYou = f.lookingAtYou;
      // Show the expression seen most over the last ~0.6 s, so the label doesn't flicker.
      t.history = [...t.history, f.expression].slice(-5);
      t.hits = (t.hits ?? 0) + 1;
      t.seen = now;
      next.push(t);
    }
    // Keep a face that vanished for a moment (a blink of the detector), but not for long.
    this.tracks = [...next, ...free.filter((t) => now - t.seen < LOST_MS)];
    this.faceCount = faces.length;
  }

  fps() {
    const now = performance.now();
    this.frames = this.frames.filter((t) => now - t < 1000);
    return this.frames.length;
  }

  renderStatus() {
    const v = this.video, r = this.reader();
    const fps = this.fps();
    const cam = v.videoWidth
      ? (fps > 0 ? `📷 Camera live · ${v.videoWidth}×${v.videoHeight} · ${fps} fps` : "📷 Camera connected, but no new frames")
      : "📷 Waiting for the camera…";
    let read;
    if (r.status === "off") read = "Face reader off (this profile doesn't use faces)";
    else if (r.status === "loading") read = `Loading face reader… ${Math.round((r.progress ?? 0) * 100)}%`;
    else if (r.status === "error") read = `Face reader failed: ${String(r.error ?? "").slice(0, 80)}`;
    else if (!r.rate) read = "Face reader ready, waiting for frames";
    else {
      const n = this.faceCount ?? 0;
      read = `Reading ${Math.round(r.rate)}× a second · ${n === 0 ? "no faces" : n === 1 ? "1 face" : `${n} faces`}`;
    }
    if (this.result?.errors?.length) read += ` · ⚠ ${this.result.errors[0]}`;
    this.statusEl.textContent = `${cam}\n${read}`;
    const bad = !v.videoWidth || fps === 0 || r.status === "error";
    this.statusEl.className = "cam-status" + (bad ? " bad" : r.status === "ready" && r.rate ? " ok" : "");
  }

  draw() {
    const { canvas, ctx, video: v } = this;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const now = performance.now();
    // Nothing to draw while the camera page is out of view (saves battery).
    if (this.visible === false) return;
    this.tracks = this.tracks.filter((t) => now - t.seen < LOST_MS);
    if (!v.videoWidth) return;

    // Mirrored for the front camera.
    const vw = v.videoWidth, vh = v.videoHeight;
    // Matches how the video is shown: "contain" (whole picture) or "cover" (cropped to fill).
    const fit = getComputedStyle(v).objectFit === "contain" ? Math.min : Math.max;
    const scale = fit(cw / vw, ch / vh);
    const ox = (cw - vw * scale) / 2, oy = (ch - vh * scale) / 2;
    const mirror = v.classList.contains("mirror");
    const toScreen = (b) => {
      let x = ox + b.x * vw * scale;
      const w = b.w * vw * scale;
      if (mirror) x = cw - x - w;
      return { x, y: oy + b.y * vh * scale, w, h: b.h * vh * scale };
    };
    const css = getComputedStyle(canvas);
    const faceColour = css.getPropertyValue("--cam-face").trim() || "#4ade80";
    const personColour = css.getPropertyValue("--cam-person").trim() || "#60a5fa";

    // People boxes come ~1.3× a second; drop them once they're stale.
    if (this.result && now - this.resultAt < 1500) {
      for (const p of this.result.people) {
        box(ctx, toScreen(p), personColour, 1, ["Person"], "bottom", 0.6);
      }
    }

    // Glide each face box toward its newest position and size.
    const dt = now - (this.lastDraw ?? now);
    this.lastDraw = now;
    const k = 1 - Math.exp(-dt / FOLLOW_MS);
    // Labels go above each face, or below it if that space is already taken by a neighbour's label.
    const taken = [];
    for (const t of this.tracks) {
      for (const key of ["x", "y", "w", "h"]) t.box[key] += (t.target[key] - t.box[key]) * k;
      // A face seen only once could be a false find (a face in a poster, a pattern): wait for a second reading.
      if (t.hits < 2) continue;
      box(ctx, toScreen(t.box), faceColour, 1.5, faceLabel(t), "top", 1, taken);
    }
  }
}

// The face model's points run from the eyebrows' top to the chin; grow the box a little
// so it frames the whole head, not just the middle of the face.
function headBox(b) {
  return { x: b.x - b.w * 0.06, y: b.y - b.h * 0.18, w: b.w * 1.12, h: b.h * 1.22 };
}

// Expression in words, with the emoji beside the word (never an emoji on its own).
function faceLabel(t) {
  if (!t.readable) return ["🔍 Too far to read"];
  const counts = {};
  for (const e of t.history) if (e) counts[e] = (counts[e] ?? 0) + 1;
  const expr = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const lines = [expr && EXPRESSIONS[expr] ? `${EXPRESSIONS[expr].emoji} ${EXPRESSIONS[expr].label}` : "Face"];
  if (t.lookingAtYou) lines.push("👀 Looking at you");
  return lines;
}

// Draws a thin box with its label lines on a see-through dark strip, so it hides as little
// of the picture as possible. `taken` lists label areas already drawn, to avoid overlaps.
function box(ctx, r, colour, width, lines, where, alpha, taken = []) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.font = "500 11px system-ui, sans-serif";
  const LH = 14;
  const lw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 8, lh = lines.length * LH + 2;
  const above = { x: r.x, y: r.y - lh, w: lw, h: lh }, below = { x: r.x, y: r.y + r.h, w: lw, h: lh };
  const clash = (a) => taken.some((b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h);
  let at = where === "top" ? (above.y >= 0 && !clash(above) ? above : !clash(below) ? below : above) : { x: r.x, y: r.y + r.h - lh, w: lw, h: lh };
  if (at.y < 0) at = { ...at, y: r.y };
  taken.push(at);
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(at.x, at.y, at.w, at.h);
  ctx.fillStyle = colour;
  lines.forEach((l, i) => ctx.fillText(l, at.x + 4, at.y + 12 + i * LH));
  ctx.globalAlpha = 1;
}
