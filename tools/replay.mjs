// Replay sensor readings recorded in the lab (public/lab.html) through the coach,
// once per support profile, and check each result against what that kind of
// support needs. Usage: node tools/replay.mjs tools/lab-data.json
import fs from "fs";
import { pathToFileURL } from "url";
import path from "path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const mod = (f) => import(pathToFileURL(path.join(root, "public/js", f)).href);
const { Coach } = await mod("coach.js");
const { PROFILES, LOUD_LEVELS, noisyLevel, cueTypeOf } = await mod("profiles.js");

const data = JSON.parse(fs.readFileSync(process.argv[2] ?? path.join(root, "tools/lab-data.json"), "utf8"));
const ENV_CUES = ["spike", "loud", "busy", "arrival"];

// What "good" looks like for each kind of scene, written from the user's side.
// quiet: nothing should interrupt. loud: people sensitive to noise should hear about it.
const EXPECT = {
  riverside: "quiet", eyetracker: "quiet-indoor", underpass: "walk", docklands: "walk",
  xmas: "loud", beatbox: "loud", subway: "crowd", square: "busy-place", eatery: "busy-place",
  traffic: "street", pedestrian: "people",
  cafe: "busy-place", schoollunch: "busy-place", classroom: "indoor-people", mall: "busy-place",
  foodcourt: "busy-place", concert: "loud", library: "quiet-indoor",
};

let realNow = 0;
Date.now = () => realNow;

function replay(clip, profileId) {
  const p = PROFILES[profileId];
  const settings = { cues: p.cues, loud: LOUD_LEVELS[p.loud], noisy: noisyLevel(p.loud, p.captions), loudPreset: p.loud, captions: p.captions, checkinMin: 99, name: "Sam" };
  const fired = [];
  realNow = 1000;
  const coach = new Coach({ emit: (c) => fired.push({ t: (realNow - 1000) / 1000, type: cueTypeOf(c.id) }), getSettings: () => settings });
  coach.baseline = clip.audio.baseline;
  // If per-frame data was recorded, rebuild movement with the current vision.js rule (still/moving switch),
  // so movement changes can be judged without re-recording.
  if (clip.frames?.length) {
    let moving = 0, m = 0;
    const share = (q, t) => q.filter((v) => v > t).length / q.length;
    const motionAt = clip.frames.map((f) => {
      moving = moving * 0.85 + ((f.s > 0 || f.q[2] > 4) ? 0.15 : 0);
      const local = moving > 0.3 ? share(f.q, Math.max(10, f.q[9] * 2 + 6)) : share(f.q, Math.max(10, f.q[5] * 2 + 6));
      m = m * 0.8 + local * 0.2;
      return { t: f.t, m };
    });
    let i = 0;
    for (const r of clip.series) {
      if (r.spike) continue;
      while (i + 1 < motionAt.length && motionAt[i + 1].t <= r.t) i++;
      r.m = motionAt[i]?.m ?? 0;
    }
  }
  let nextTick = 1000;
  for (const r of clip.series) {
    realNow = 1000 + r.t * 1000;
    // Mirror audio.js: a jump only counts if the smoothed level reaches 0.6 within 0.75 s.
    if (r.spike) {
      const peak = Math.max(0, ...clip.series.filter((x) => !x.spike && x.t >= r.t && x.t <= r.t + 0.75).map((x) => x.l));
      if (peak >= 0.6) coach.onEnvironment({ spike: true });
    }
    else coach.onEnvironment({ level: r.l, motion: r.m, spike: false });
    while (nextTick <= realNow) { coach.tick(); nextTick += 1000; }
  }
  return fired.filter((f) => ENV_CUES.includes(f.type));
}

const rows = [];
for (const clip of data) {
  const mins = clip.seconds / 60;
  for (const id of ["social", "focus", "sensory", "listening"]) {
    const env = replay(clip, id);
    const count = (t) => env.filter((e) => e.type === t).length;
    rows.push({
      clip: clip.clip, scene: EXPECT[clip.clip] ?? "?", profile: id, sec: clip.seconds,
      loud: count("loud"), spike: count("spike"), busy: count("busy"), arrival: count("arrival"),
      perMin: +(env.length / Math.max(mins, 0.25)).toFixed(1),
      firstLoudAt: env.find((e) => e.type === "loud")?.t ?? null,
    });
  }
}
console.table(rows);
fs.writeFileSync(path.join(root, "tools/replay-out.json"), JSON.stringify(rows, null, 1));
