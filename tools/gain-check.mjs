// How robust are the loudness cues to phones whose mics record louder or quieter?
// On Grover's 0..1 scale (−60..0 dBFS), 0.1 ≈ 6 dB. Replays every clip with the level shifted.
// Usage: node tools/gain-check.mjs
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const mod = (f) => import(pathToFileURL(path.join(root, "public/js", f)).href);
const { Coach } = await mod("coach.js");
const { PROFILES, LOUD_LEVELS, noisyLevel } = await mod("profiles.js");
const { micOffsetFrom } = await mod("audio.js");
const data = JSON.parse(fs.readFileSync(path.join(root, "tools/lab-data.json"), "utf8")).filter((c) => !c.audio.silent);

const QUIET = ["library", "eyetracker", "square", "underpass"];       // nobody should be warned
const LOUD = ["concert", "beatbox", "xmas", "mall"];                   // Social, Sensory, Listening should be
let now = 0;
Date.now = () => now;

function loudCues(clip, id, gain) {
  const p = PROFILES[id];
  const settings = { cues: p.cues, loud: LOUD_LEVELS[p.loud], noisy: noisyLevel(p.loud, p.captions), loudPreset: p.loud, captions: p.captions, checkinMin: 99 };
  let n = 0;
  now = 1000;
  const coach = new Coach({ emit: (c) => { if (c.id === "loud") n++; }, getSettings: () => settings });
  let next = 1000;
  for (const r of clip.series) {
    if (r.spike) continue;
    now = 1000 + r.t * 1000;
    coach.onEnvironment({ level: Math.min(1, Math.max(0, r.l + gain)), motion: 0 });
    while (next <= now) { coach.tick(); next += 1000; }
  }
  return n;
}

// With a sound check: the phone measures the library clip (a quiet room) through its own mic offset,
// and the correction it computes is added back to everything it hears.
const library = data.find((d) => d.clip === "library").series.filter((r) => !r.spike && r.t > 1).map((r) => r.l);
const rows = [];
for (const gain of [-0.1, -0.05, 0, 0.05, 0.1]) {
  const correction = micOffsetFrom(library.map((l) => l + gain)) ?? 0;
  for (const checked of [false, true]) {
    const g = gain + (checked ? correction : 0);
    for (const id of ["social", "sensory", "listening"]) {
      const falseAlarms = QUIET.filter((c) => loudCues(data.find((d) => d.clip === c), id, g) > 0);
      const missed = LOUD.filter((c) => loudCues(data.find((d) => d.clip === c), id, g) === 0);
      rows.push({ "mic offset": `${gain > 0 ? "+" : ""}${Math.round(gain * 60)} dB`, "sound check": checked ? "yes" : "no", profile: id, "false alarms (quiet)": falseAlarms.join(", ") || "none", "missed (loud)": missed.join(", ") || "none" });
    }
  }
}
console.table(rows);
