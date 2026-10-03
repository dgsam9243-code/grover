// On-device perception with Google MediaPipe: faces (expressions, gaze), bodies
// (waving, crossed arms, turned away…), objects (people, tables, cups, buses…) and
// a whole-image classifier (ImageNet scene labels). Models download once from a CDN;
// every frame is analysed on this device and never uploaded.

const VERSION = "1.0.1";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const MODEL = "https://storage.googleapis.com/mediapipe-models";
const MODELS = {
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

// Is the face turned toward the camera (toward the user)? Nose position between the eye corners.
export function lookingAtCamera(lm) {
  const nose = lm[1], left = lm[33], right = lm[263];
  if (!nose || !left || !right) return false;
  const span = right.x - left.x;
  if (Math.abs(span) < 1e-3) return false;
  const pos = (nose.x - left.x) / span; // 0.5 = centred
  return pos > 0.32 && pos < 0.68;
}

// Faces narrower than this share of the frame are too small to read expressions reliably.
export const MIN_FACE = 0.12;

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
          try { return await Task.createFromOptions(files, { ...options, baseOptions: { ...options.baseOptions, delegate }, runningMode: "VIDEO" }); }
          catch (e) { if (delegate === "CPU") throw e; }
        }
      };
      const steps = [
        ["face", () => make(mp.FaceLandmarker, { baseOptions: { modelAssetPath: MODELS.face }, numFaces: 4, outputFaceBlendshapes: true })],
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

  // Analyse the playing video a few times a second. Faces and bodies every tick,
  // objects every 3rd tick, the scene classifier every 6th.
  start(video) {
    this.video = video;
    this.tick = 0;
    this.stamps = [];
    this.timer = setInterval(() => this.step(), 250);
  }

  stop() {
    clearInterval(this.timer);
  }

  step() {
    const v = this.video;
    if (this.status !== "ready" || !v || v.readyState < 2 || v.paused) return;
    const ts = performance.now();
    const out = { t: Date.now() };
    const errors = [];
    const attempt = (name, fn) => { try { fn(); } catch (e) { errors.push(`${name}: ${String(e).slice(0, 120)}`); } };
    attempt("face", () => {
      const face = this.tasks.face.detectForVideo(v, ts);
      out.faces = (face.faceLandmarks ?? []).map((lm, i) => {
        const xs = lm.map((p) => p.x), ys = lm.map((p) => p.y);
        return {
          box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) },
          lookingAtYou: lookingAtCamera(lm),
          shapes: face.faceBlendshapes?.[i]?.categories ?? [],
        };
      }).sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h);
      // "Talking" = the main face's jaw keeps opening and closing.
      const main = out.faces[0];
      const jaw = main?.shapes.find((c) => c.categoryName === "jawOpen")?.score;
      this.jawHistory = [...this.jawHistory, jaw ?? 0].slice(-8);
      const talking = jaw != null && Math.max(...this.jawHistory) - Math.min(...this.jawHistory) > 0.15;
      out.faces.forEach((f, i) => {
        f.readable = f.box.w >= MIN_FACE;
        f.expression = f.readable ? readExpression(f.shapes, i === 0 && talking) : null;
        delete f.shapes;
      });
    });
    attempt("pose", () => {
      const pose = this.tasks.pose.detectForVideo(v, ts);
      const bodies = pose.landmarks ?? [];
      this.poseHistory = [...this.poseHistory, bodies[0] ?? []].slice(-8);
      out.bodies = bodies.map((lm, i) => readBody(lm, i === 0 ? this.poseHistory : []));
    });
    if (this.tick % 3 === 0) attempt("objects", () => {
        const det = this.tasks.objects.detectForVideo(v, ts);
        out.objects = {};
        for (const d of det.detections ?? []) {
          const name = d.categories?.[0]?.categoryName;
          if (name) out.objects[name] = (out.objects[name] ?? 0) + 1;
        }
    });
    if (this.tick % 6 === 0) attempt("scene", () => {
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
