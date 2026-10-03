// On-device perception with Google MediaPipe: faces (expressions, gaze), bodies
// (waving, crossed arms, turned away…), objects (people, tables, cups, buses…) and
// a whole-image classifier (ImageNet scene labels). Models download once from a CDN;
// every frame is analysed on this device and never uploaded.

const VERSION = "1.0.1";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = "https://storage.googleapis.com/mediapipe-models";
const MODELS = {
  // Finds faces up to ~5 m away (the face landmarker's own finder only works at selfie distance).
  faceBoxes: `${MODEL}/face_detector/blaze_face_full_range/float16/1/blaze_face_full_range.tflite`,
  face: `${MODEL}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
  pose: `${MODEL}/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
  objects: `${MODEL}/object_detector/efficientdet_lite0/int8/1/efficientdet_lite0.tflite`,
  scene: `${MODEL}/image_classifier/efficientnet_lite0/int8/1/efficientnet_lite0.tflite`,
};

// ---------- facial expressions (from the face model's 52 blendshape scores) ----------
// Describes what a face is doing, not what someone feels: expressions aren't emotions.
export const EXPRESSIONS = {
  laughing: { emoji: "😄", label: "Laughing" },
  smiling: { emoji: "😊", label: "Smiling" },
  surprised: { emoji: "😮", label: "Surprised look" },
  frowning: { emoji: "🙁", label: "Frowning" },
  worried: { emoji: "😟", label: "Worried look" },
  tense: { emoji: "😠", label: "Tense brows" },
  talking: { emoji: "🗣️", label: "Talking" },
  neutral: { emoji: "😐", label: "Neutral" },
};

export function readExpression(shapes, talking = false) {
  const s = Object.fromEntries(shapes.map((c) => [c.categoryName, c.score]));
  const avg = (...k) => k.reduce((a, n) => a + (s[n] ?? 0), 0) / k.length;
  const smile = avg("mouthSmileLeft", "mouthSmileRight");
  const frown = avg("mouthFrownLeft", "mouthFrownRight");
  const browDown = avg("browDownLeft", "browDownRight");
  const browUp = s.browInnerUp ?? 0;
  const eyesWide = avg("eyeWideLeft", "eyeWideRight");
  const jaw = s.jawOpen ?? 0;
  // Tuned on real footage (SENSOR-TUNING.md, perception round 1). A wrong emotion label is worse
  // than none, so negative expressions need strong evidence: talking with raised brows read as
  // "worried", and a dim, tilted face read as "tense", until these were raised.
  if (smile > 0.5 && jaw > 0.3) return "laughing";
  if (smile > 0.45) return "smiling";
  if (jaw > 0.45 && (eyesWide > 0.35 || browUp > 0.55) && smile < 0.2) return "surprised";
  if (browDown > 0.6 && smile < 0.15) return "tense";
  if (browUp > 0.65 && frown > 0.1 && smile < 0.15) return "worried";
  if (frown > 0.4 && smile < 0.15) return "frowning";
  if (talking) return "talking";
  return "neutral";
}

// Is the face turned toward the camera (toward the user)? With the face model's 3D head pose,
// the head must be turned less than 20° (on footage: people facing the camera 0–14°, someone
// eating and glancing sideways 26–56°). Without it, the nose position between the eye corners.
// Eyes looking down (at food, a phone) also don't count, unless the person is smiling: a broad
// smile narrows the eyes, which the model reads as looking down (0.71 for a smile at the camera).
export function lookingAtCamera(lm, shapes, head) {
  if (head) {
    if (Math.abs(head.yaw) >= MAX_YAW) return false;
  } else {
    const nose = lm[1], left = lm[33], right = lm[263];
    if (!nose || !left || !right) return false;
    const span = right.x - left.x;
    if (Math.abs(span) < 1e-3) return false;
    const pos = (nose.x - left.x) / span; // 0.5 = centred
    if (pos <= 0.32 || pos >= 0.68) return false;
  }
  if (!shapes) return true;
  const s = (n) => shapes.find((c) => c.categoryName === n)?.score ?? 0;
  const smile = (s("mouthSmileLeft") + s("mouthSmileRight")) / 2;
  return eyesDown(shapes) < LOOK_DOWN || smile > 0.3;
}

// How far the eyes look down (0..1), from the face's expression scores.
export function eyesDown(shapes) {
  const s = (n) => shapes.find((c) => c.categoryName === n)?.score ?? 0;
  return (s("eyeLookDownLeft") + s("eyeLookDownRight")) / 2;
}
// Tuned on footage: facing the camera ≤ 0.49, looking down at a phone 0.66–0.75.
export const LOOK_DOWN = 0.6;
export const MAX_YAW = 20;

// Head tilt in degrees from the face model's 3D head pose: pitch (nodding) and yaw (turning).
export function headAngles(m) {
  if (!m || m.length < 16) return null;
  const deg = 180 / Math.PI;
  return { pitch: +(Math.atan2(m[6], m[10]) * deg).toFixed(1), yaw: +(Math.asin(Math.max(-1, Math.min(1, -m[2]))) * deg).toFixed(1) };
}

// Faces narrower than this many camera pixels are too small to read expressions reliably.
// With the 1280-pixel-wide camera picture the app asks for, that reaches about 2.5 m away:
// normal conversation distance. (Checked on footage: SENSOR-TUNING.md, face boxes round.)
export const MIN_FACE_PX = 56;
// Expressions are read for at most this many faces (the biggest), to keep phones cool.
export const MAX_READ = 6;

// ---------- body language (from the pose model's 33 landmarks) ----------
// Described cautiously: the same posture can mean different things.
export const BODY = {
  waving: { emoji: "👋", label: "Waving" },
  handUp: { emoji: "✋", label: "Hand raised" },
  armsCrossed: { emoji: "🙅", label: "Arms crossed" },
  pointing: { emoji: "👉", label: "Pointing" },
  turnedAway: { emoji: "↩️", label: "Turned away" },
  facing: { emoji: "🧍", label: "Facing you" },
  sitting: { emoji: "🪑", label: "Sitting" },
};

export function readBody(lm, history) {
  const cues = [];
  const P = (i) => lm[i];
  const vis = (i) => (P(i)?.visibility ?? 1) > 0.5;
  const [nose, lSh, rSh, lEl, rEl, lWr, rWr, lHip, rHip, lKn, rKn] = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26].map(P);
  if (!lSh || !rSh) return cues;
  const shoulderW = Math.abs(lSh.x - rSh.x);
  const shoulderY = (lSh.y + rSh.y) / 2;
  // Hand above the shoulder; waving if that wrist has been moving side to side.
  for (const [wr, i] of [[lWr, 15], [rWr, 16]]) {
    if (wr && vis(i) && wr.y < shoulderY - 0.05) {
      const xs = history.map((h) => h[i]?.x).filter((x) => x != null);
      const swing = xs.length > 3 ? Math.max(...xs) - Math.min(...xs) : 0;
      cues.push(swing > shoulderW * 0.35 ? "waving" : "handUp");
      break;
    }
  }
  // Wrists crossed over the chest, each near the opposite elbow.
  if (lWr && rWr && lEl && rEl && vis(15) && vis(16)) {
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const atChest = lWr.y > shoulderY && rWr.y > shoulderY && (!lHip || lWr.y < lHip.y);
    if (atChest && d(lWr, rEl) < shoulderW * 0.6 && d(rWr, lEl) < shoulderW * 0.6) cues.push("armsCrossed");
  }
  // Pointing: an arm held out straight, sideways from the body.
  for (const [sh, el, wr, i] of [[lSh, lEl, lWr, 15], [rSh, rEl, rWr, 16]]) {
    if (!el || !wr || !vis(i)) continue;
    const reach = Math.hypot(wr.x - sh.x, wr.y - sh.y);
    const straight = Math.hypot(el.x - sh.x, el.y - sh.y) + Math.hypot(wr.x - el.x, wr.y - el.y);
    if (reach > shoulderW * 1.3 && reach / straight > 0.92 && Math.abs(wr.y - sh.y) < shoulderW * 0.6) { cues.push("pointing"); break; }
  }
  // Turned away: shoulders visible but the face isn't.
  if (nose && (nose.visibility ?? 1) < 0.3 && vis(11) && vis(12)) cues.push("turnedAway");
  else if (shoulderW > 0.08) cues.push("facing");
  // Sitting: knees roughly level with the hips.
  if (lHip && lKn && vis(23) && vis(25) && Math.abs(lKn.y - lHip.y) < Math.abs(lHip.y - lSh.y) * 0.35) cues.push("sitting");
  return cues;
}

// ---------- the runner ----------
export class Perception {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.status = "off";        // off | loading | ready | error
    this.progress = 0;
    this.rate = 0;              // analyses per second, for the "it's working" indicator
    this.jawHistory = [];
    this.poseHistory = [];
    this.faceTracks = [];       // faces followed from reading to reading, keeping their last expression
    this.nextId = 1;
    this.readTurn = 0;          // which other face gets read next (round robin)
    this.crop = document.createElement("canvas");
    this.crop.width = this.crop.height = 256;
    this.cropCtx = this.crop.getContext("2d", { willReadFrequently: true });
  }

  // Finds every face in the frame and reads the expression of up to `budget` of them
  // (always the biggest, then the others in turn), each from a zoomed-in crop.
  // Faces not read this time keep the expression from their last reading.
  // Returns faces biggest first: { id, box (0..1), readable, expression, lookingAtYou, jaw }.
  readFaces(source, ts, budget = MAX_READ, video = true) {
    const W = source.videoWidth || source.width, H = source.videoHeight || source.height;
    const res = video ? this.tasks.faceBoxes.detectForVideo(source, ts) : this.tasks.faceBoxes.detect(source);
    const found = (res.detections ?? []).map((d) => {
      const b = d.boundingBox;
      return { box: { x: b.originX / W, y: b.originY / H, w: b.width / W, h: b.height / H }, px: b.width };
    }).sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h);

    // Match each face to one already being followed (nearest centre, within a face width).
    const now = performance.now();
    const centre = (b) => [b.x + b.w / 2, b.y + b.h / 2];
    const free = [...this.faceTracks];
    const faces = found.map((f) => {
      const [cx, cy] = centre(f.box);
      let best = null, bestD = Infinity;
      for (const t of free) {
        const [tx, ty] = centre(t.box);
        const d = Math.hypot(tx - cx, ty - cy);
        if (d < Math.max(t.box.w, f.box.w) && d < bestD) { best = t; bestD = d; }
      }
      if (best) free.splice(free.indexOf(best), 1);
      const t = best ?? { id: this.nextId++, expression: null, lookingAtYou: false, jaw: null };
      Object.assign(t, { box: f.box, readable: f.px >= MIN_FACE_PX, seen: now });
      return t;
    });
    this.faceTracks = [...faces, ...free.filter((t) => now - t.seen < 500)];

    // Read the biggest readable face every time, and share the rest of the budget out in turn.
    const readable = faces.filter((f) => f.readable).slice(0, MAX_READ);
    const toRead = readable.slice(0, 1);
    const others = readable.slice(1);
    for (let i = 0; i < Math.min(others.length, budget - 1); i++) toRead.push(others[(this.readTurn + i) % others.length]);
    this.readTurn += Math.max(1, budget - 1);
    for (const f of toRead) this.readFace(source, W, H, f);
    for (const f of faces) if (!f.readable) { f.expression = null; f.lookingAtYou = false; }
    return faces;
  }

  // Zoom in on one face (a square 1.8× its size, scaled to 256 px) and read its expression there.
  // If the face reader can't place the face in that crop, try a tighter one, then a wider one:
  // on footage this recovered about half of the faces the first crop missed.
  readFace(source, W, H, f) {
    const cx = (f.box.x + f.box.w / 2) * W, cy = (f.box.y + f.box.h / 2) * H;
    const g = this.cropCtx;
    let r, lm;
    for (const zoom of [1.8, 1.4, 2.4]) {
      const side = Math.max(f.box.w * W, f.box.h * H) * zoom;
      g.fillStyle = "#000";
      g.fillRect(0, 0, 256, 256);
      g.drawImage(source, cx - side / 2, cy - side / 2, side, side, 0, 0, 256, 256);
      r = this.tasks.face.detect(this.crop);
      lm = r.faceLandmarks?.[0];
      if (lm) break;
    }
    if (!lm) return;
    const shapes = r.faceBlendshapes?.[0]?.categories ?? [];
    f.shapes = shapes;
    f.jaw = shapes.find((c) => c.categoryName === "jawOpen")?.score ?? null;
    f.head = headAngles(r.facialTransformationMatrixes?.[0]?.data);
    f.lookingAtYou = lookingAtCamera(lm, shapes, f.head);
    f.readAt = performance.now();
  }

  async load() {
    if (this.status === "ready" || this.status === "loading") return this.loading;
    this.status = "loading";
    this.loading = (async () => {
      const mp = await import(`${CDN}/vision_bundle.mjs`);
      const files = await mp.FilesetResolver.forVisionTasks(`${CDN}/wasm`);
      // Compressed (int8) models only run on the CPU; the float face and body models use the GPU when possible.
      const make = async (Task, options, cpuOnly = false) => {
        for (const delegate of cpuOnly ? ["CPU"] : ["GPU", "CPU"]) {
          try { return await Task.createFromOptions(files, { runningMode: "VIDEO", ...options, baseOptions: { ...options.baseOptions, delegate } }); }
          catch (e) { if (delegate === "CPU") throw e; }
        }
      };
      const steps = [
        ["faceBoxes", () => make(mp.FaceDetector, { baseOptions: { modelAssetPath: MODELS.faceBoxes }, minDetectionConfidence: 0.5 })],
        // Reads one face at a time from a zoomed-in crop, so faces across a room can be read too.
        ["face", () => make(mp.FaceLandmarker, { baseOptions: { modelAssetPath: MODELS.face }, runningMode: "IMAGE", numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true })],
        ["pose", () => make(mp.PoseLandmarker, { baseOptions: { modelAssetPath: MODELS.pose }, numPoses: 3 })],
        ["objects", () => make(mp.ObjectDetector, { baseOptions: { modelAssetPath: MODELS.objects }, scoreThreshold: 0.35, maxResults: 25 }, true)],
        ["scene", () => make(mp.ImageClassifier, { baseOptions: { modelAssetPath: MODELS.scene }, maxResults: 5 }, true)],
      ];
      this.tasks = {};
      for (const [i, [name, create]] of steps.entries()) {
        this.tasks[name] = await create();
        this.progress = (i + 1) / steps.length;
      }
      this.status = "ready";
    })().catch((e) => { this.status = "error"; this.error = String(e); throw e; });
    return this.loading;
  }

  // Analyse the playing video several times a second. Faces every tick (8× a second, so the
  // camera check view can follow them closely); everything else on every 2nd tick (4× a second):
  // bodies every 2nd tick, objects every 6th, the scene classifier every 12th.
  // onTrack(faces) gets every face reading; onUpdate(out) gets the full reading 4× a second.
  start(video, onTrack) {
    this.video = video;
    this.onTrack = onTrack;
    this.tick = 0;
    this.stamps = [];
    this.talking = false;
    this.timer = setInterval(() => this.step(), 125);
  }

  stop() {
    clearInterval(this.timer);
  }

  step() {
    const v = this.video;
    if (this.status !== "ready" || !v || v.readyState < 2 || v.paused) return;
    const ts = performance.now();
    const full = this.tick % 2 === 0;
    const out = { t: Date.now() };
    const errors = [];
    const attempt = (name, fn) => { try { fn(); } catch (e) { errors.push(`${name}: ${String(e).slice(0, 120)}`); } };
    attempt("face", () => {
      // Read 2 faces' expressions on full ticks and 1 in between: ~12 readings a second in all.
      const faces = this.readFaces(v, ts, full ? 2 : 1);
      // "Talking" = the main face's jaw keeps opening and closing (over the last ~2 s of full readings).
      const main = faces.find((f) => f.readable);
      if (full) {
        this.jawHistory = main?.id === this.jawId ? [...this.jawHistory, main.jaw ?? 0].slice(-8) : [main?.jaw ?? 0];
        this.jawId = main?.id;
        this.talking = main?.jaw != null && Math.max(...this.jawHistory) - Math.min(...this.jawHistory) > 0.15;
      }
      out.faces = faces.map((f) => {
        if (f.shapes) { f.expression = readExpression(f.shapes, f === main && this.talking); delete f.shapes; }
        return { id: f.id, box: f.box, readable: f.readable, expression: f.expression, lookingAtYou: f.lookingAtYou };
      });
    });
    if (out.faces) this.onTrack?.(out.faces);
    if (!full) {
      this.tick++;
      return;
    }
    attempt("pose", () => {
      const pose = this.tasks.pose.detectForVideo(v, ts);
      const bodies = pose.landmarks ?? [];
      this.poseHistory = [...this.poseHistory, bodies[0] ?? []].slice(-8);
      out.bodies = bodies.map((lm, i) => readBody(lm, i === 0 ? this.poseHistory : []));
    });
    if (this.tick % 6 === 0) attempt("objects", () => {
        const det = this.tasks.objects.detectForVideo(v, ts);
        out.objects = {};
        out.people = [];
        for (const d of det.detections ?? []) {
          const name = d.categories?.[0]?.categoryName;
          if (name) out.objects[name] = (out.objects[name] ?? 0) + 1;
          // Where each person is (0..1 of the frame), for the camera check view.
          const b = d.boundingBox;
          if (name === "person" && b && v.videoWidth) {
            out.people.push({ x: b.originX / v.videoWidth, y: b.originY / v.videoHeight, w: b.width / v.videoWidth, h: b.height / v.videoHeight, score: d.categories[0].score });
          }
        }
    });
    if (this.tick % 12 === 0) attempt("scene", () => {
        const cls = this.tasks.scene.classifyForVideo(v, ts);
        out.labels = (cls.classifications?.[0]?.categories ?? []).map((c) => ({ name: c.categoryName, score: +c.score.toFixed(3) }));
    });
    if (errors.length) out.errors = errors;
    this.tick++;
    this.stamps = [...this.stamps.filter((s) => ts - s < 2000), ts];
    this.rate = this.stamps.length / 2;
    this.onUpdate(out);
  }
}
