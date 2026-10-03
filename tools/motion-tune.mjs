// Try movement rules offline on the per-frame change quantiles recorded by the lab.
// Each frame has q: 20 quantiles of 8×8 block change (q[0]=5th percentile … q[19]=max).
// Usage: node tools/motion-tune.mjs tools/lab-data.json
import fs from "fs";

const data = JSON.parse(fs.readFileSync(process.argv[2] ?? "tools/lab-data.json", "utf8"));
const IDEAL = { // what a person on that scene would expect "lots of movement" to say
  riverside: "calm", eyetracker: "calm", underpass: "calm", docklands: "calm",
  traffic: "some", square: "some", eatery: "some",
  pedestrian: "busy", subway: "busy", xmas: "busy", beatbox: "some",
  cafe: "some", schoollunch: "busy", classroom: "some", mall: "busy", foodcourt: "busy", concert: "busy", library: "calm",
};
const share = (q, thr) => q.filter((v) => v > thr).length / q.length;

// Each rule maps one frame to an instant "local movement" value 0..1.
export const RULES = {
  "v1: >2×p30+6": (f) => share(f.q, Math.max(10, f.q[5] * 2 + 6)),
  "median ref": (f) => share(f.q, Math.max(10, f.q[9] * 2 + 6)),
  "p30 ref + walk gate": (f) => (f.q[9] > 6 ? 0 : share(f.q, Math.max(10, f.q[5] * 2 + 6))),
  "median ref + walk gate": (f) => (f.q[9] > 6 ? 0 : share(f.q, Math.max(10, f.q[9] * 2 + 6))),
  "fixed 12 + walk gate": (f) => (f.q[9] > 6 ? 0 : share(f.q, 12)),
  // Phone moving = even the calmest 15% of the frame changes; then require change well above typical.
  "calm-parts gate": (f) => share(f.q, f.q[2] > 3 ? Math.max(10, f.q[9] * 2 + 6) : Math.max(10, f.q[5] * 2 + 6)),
};

// Stateful rule: track whether the phone itself is moving (frame shifts, or even calm parts changing),
// smoothed over ~2 s. Still phone → sensitive rule; moving phone → strict rule (avoid false alarms).
RULES['still/moving switch'] = (() => { let moving = 0; return (f) => {
  moving = moving * 0.85 + ((f.s > 0 || f.q[2] > 4) ? 1 : 0) * 0.15;
  return moving > 0.3 ? share(f.q, Math.max(10, f.q[9] * 2 + 6)) : share(f.q, Math.max(10, f.q[5] * 2 + 6));
}; });
const BUSY = Number(process.argv[3] ?? 0.25);
const rows = [];
for (const clip of data) {
  if (!clip.frames?.length) continue;
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  const row = { clip: clip.clip, ideal: IDEAL[clip.clip], "median block Δ": med(clip.frames.map((f) => f.q[9])), "walk-gated %": 0, "calm-15% Δ": med(clip.frames.map((f) => f.q[2])), "shifting %": Math.round(100 * clip.frames.filter((f) => f.s > 0).length / clip.frames.length) };
  row["walk-gated %"] = Math.round(100 * clip.frames.filter((f) => f.q[9] > 6).length / clip.frames.length);
  for (const [name, r] of Object.entries(RULES)) {
    const rule = name === "still/moving switch" ? r() : r;
    let m = 0, busy = 0;
    for (const f of clip.frames) { m = m * 0.8 + rule(f) * 0.2; if (m > BUSY) busy++; }
    row[name] = `${Math.round((100 * busy) / clip.frames.length)}%`;
  }
  rows.push(row);
}
console.log(`% of time "busy" (smoothed movement > ${BUSY})`);
console.table(rows);
