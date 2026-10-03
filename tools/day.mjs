// "A day out": stitch recorded lab readings into a realistic ~70-minute timeline
// (looping each clip for as long as someone would really be there), replay it
// through every support profile, and print when each environment cue fires.
// Tests what short clips can't: nagging over long stays, and slow "noisy" build-up.
// Usage: node tools/day.mjs
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const mod = (f) => import(pathToFileURL(path.join(root, "public/js", f)).href);
const { Coach } = await mod("coach.js");
const { PROFILES, LOUD_LEVELS, noisyLevel, cueTypeOf } = await mod("profiles.js");
const data = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "tools/lab-data.json"), "utf8")).map((c) => [c.clip, c]));

const DAY = [
  ["underpass", 2, "walk to the café"],
  ["cafe", 10, "café"],
  ["docklands", 3, "city walk"],
  ["schoollunch", 15, "school lunch"],
  ["subway", 5, "subway"],
  ["concert", 10, "concert"],
  ["library", 10, "library"],
  ["riverside", 3, "quiet walk home"],
];

// Build one long series of readings; motion is rebuilt from frames exactly as in replay.mjs.
const share = (q, t) => q.filter((v) => v > t).length / q.length;
const timeline = [], segments = [];
let offset = 0;
for (const [id, minutes, label] of DAY) {
  const clip = data[id];
  let moving = 0, m = 0;
  const motion = clip.frames.map((f) => {
    moving = moving * 0.85 + ((f.s > 0 || f.q[2] > 4) ? 0.15 : 0);
    m = m * 0.8 + (moving > 0.3 ? share(f.q, Math.max(10, f.q[9] * 2 + 6)) : share(f.q, Math.max(10, f.q[5] * 2 + 6))) * 0.2;
    return { t: f.t, m };
  });
  const rows = clip.series.filter((r) => !r.spike && r.t > 4.5); // skip each clip's warm-up so loops join smoothly
  const spikes = clip.series.filter((r) => r.spike);
  const len = rows.at(-1).t - rows[0].t;
  segments.push({ label, start: offset / 60, end: (offset + minutes * 60) / 60 });
  for (let loop = 0; loop * len < minutes * 60; loop++) {
    let i = 0;
    for (const r of rows) {
      const t = offset + loop * len + (r.t - rows[0].t);
      if (t >= offset + minutes * 60) break;
      while (i + 1 < motion.length && motion[i + 1].t <= r.t) i++;
      timeline.push({ t, l: r.l, m: motion[i]?.m ?? 0 });
    }
    for (const s of spikes) {
      const t = offset + loop * len + (s.t - rows[0].t);
      const peak = Math.max(0, ...clip.series.filter((x) => !x.spike && x.t >= s.t && x.t <= s.t + 0.75).map((x) => x.l));
      if (t > offset && t < offset + minutes * 60 && peak >= 0.6) timeline.push({ t, spike: true });
    }
  }
  offset += minutes * 60;
}
timeline.sort((a, b) => a.t - b.t);

let now = 0;
Date.now = () => now;
const where = (min) => segments.find((s) => min >= s.start && min < s.end)?.label ?? "?";
for (const id of ["social", "focus", "sensory", "listening"]) {
  const p = PROFILES[id];
  const settings = { cues: p.cues, loud: LOUD_LEVELS[p.loud], noisy: noisyLevel(p.loud, p.captions), loudPreset: p.loud, captions: p.captions, checkinMin: 99, name: "Sam" };
  const fired = [];
  now = 1000;
  const coach = new Coach({ emit: (c) => fired.push({ min: (now - 1000) / 60000, type: cueTypeOf(c.id), msg: c.msg }), getSettings: () => settings });
  let nextTick = 1000;
  for (const r of timeline) {
    now = 1000 + r.t * 1000;
    if (r.spike) coach.onEnvironment({ spike: true });
    else coach.onEnvironment({ level: r.l, motion: r.m, spike: false });
    while (nextTick <= now) { coach.tick(); nextTick += 1000; }
  }
  const env = fired.filter((f) => ["loud", "spike", "busy", "arrival"].includes(f.type));
  console.log(`\n${p.label}: ${env.length} environment cues in ${Math.round(offset / 60)} min`);
  for (const f of env) console.log(`  ${f.min.toFixed(1).padStart(5)} min  ${where(f.min).padEnd(16)} ${f.msg}`);
}
