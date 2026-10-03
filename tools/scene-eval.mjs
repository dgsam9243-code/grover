// Score setting recognition on probed frames (tools/probe.json, from lab.html's probe()).
// Each clip's frames are fed to the scene reader 2 s apart, with the clip's real sound
// level (tools/lab-data.json) where it was recorded. Usage: node tools/scene-eval.mjs
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const { SceneReader } = await import(pathToFileURL(path.join(root, "public/js/scene.js")).href);
// probe2.json (re-probed with drawn frames) replaces probe.json clip by clip.
const read = (f) => (fs.existsSync(path.join(root, f)) ? JSON.parse(fs.readFileSync(path.join(root, f), "utf8")) : []);
const merged = new Map(read("tools/probe.json").map((c) => [c.id, c]));
for (const c of [...read("tools/probe2.json"), ...read("tools/probe3.json")]) if (!c.error && c.rows?.some((r) => !r.error)) merged.set(c.id, c);
const probe = [...merged.values()];
const audio = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "tools/lab-data.json"), "utf8")).map((c) => [c.clip, c.audio]));

// What counts as a right (or acceptable) answer for each true setting. null = "not sure yet".
const OK = {
  party: ["party"], restaurant: ["restaurant"], shop: ["shop"], busstop: ["street"], street: ["street", "crowd", "outdoors", null],
  bus: ["transit"], train: ["transit"], policestop: ["emergency"], crowd: ["crowd", "party", "concert"],
  concert: ["concert", "party", "crowd"], quiet: ["quiet", null], classroom: [null, "crowd", "quiet"],
  indoors: [null, "quiet", "home"], outdoors: ["outdoors", "street", null],
};

let right = 0, total = 0, announced = 0, announcedRight = 0;
const rows = [];
for (const clip of probe) {
  if (clip.error || !clip.rows) { rows.push({ clip: clip.id, truth: clip.truth, result: "skipped: " + (clip.error ?? "") }); continue; }
  const r = new SceneReader();
  let t = 1000;
  const slowLevel = audio[clip.id] && !audio[clip.id].silent ? audio[clip.id].median : null;
  for (const f of clip.rows) {
    if (f.error) continue;
    const labels = (f.labels ?? []).map((s) => { const i = s.lastIndexOf(" "); return { name: s.slice(0, i), score: Number(s.slice(i + 1)) }; });
    r.update({ objects: f.objects, labels, bodies: f.bodies }, { slowLevel, colours: f.colours }, t);
    t += 2000;
  }
  let cur = r.current();
  // What Grover would actually say out loud: only "fairly sure" (or "maybe" for emergency lights).
  if (cur && (cur.sure === "fairly sure" || (cur.safety && cur.sure === "maybe"))) {
    announced++;
    if ((OK[clip.truth] ?? []).includes(cur.id)) announcedRight++;
  }
  if (cur?.sure === "not sure") cur = null; // the app shows "Not sure yet" and announces nothing
  const ok = (OK[clip.truth] ?? []).includes(cur?.id ?? null);
  total++; if (ok) right++;
  rows.push({ clip: clip.id, truth: clip.truth, result: cur ? `${cur.emoji} ${cur.id} (${cur.sure})` : "not sure yet", ok: ok ? "✓" : "✗", why: cur?.why.join(", ") ?? "" });
}
console.table(rows);
console.log(`Right or acceptable: ${right}/${total} (${Math.round((100 * right) / total)}%)`);
console.log(`Announced out loud: ${announced} clips, right ${announcedRight}/${announced} (${Math.round((100 * announcedRight) / Math.max(1, announced))}%)`);
