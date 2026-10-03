// WCAG contrast check for Grover's colour tokens (light, dark, discreet).
// Usage: node tools/contrast.js   — exits 1 if any text pair is below its minimum.
const fs = require("fs");
const path = require("path");
const css = fs.readFileSync(path.join(__dirname, "../public/styles.css"), "utf8");

const block = (re) => Object.fromEntries([...(css.match(re)?.[1] ?? "").matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
const light = block(/:root\s*\{([^}]*)\}/);
const dark = { ...light, ...block(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/) };
const discreet = { ...dark, ...block(/body\.discreet\s*\{([^}]*)\}/) };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// [foreground, background, minimum]  4.5 = body text, 3 = large text / UI parts
const PAIRS = [
  ["ink", "bg", 4.5], ["ink", "panel", 4.5], ["muted", "bg", 4.5], ["muted", "panel", 4.5],
  ["ink", "accent-soft", 4.5], ["ink", "info-soft", 4.5], ["ink", "warn-soft", 4.5], ["ink", "care-soft", 4.5],
  ["muted", "accent-soft", 4.5], ["muted", "info-soft", 4.5], ["muted", "warn-soft", 4.5], ["muted", "care-soft", 4.5],
  ["accent", "bg", 4.5], ["accent", "panel", 4.5],            // links
  ["on-accent", "accent", 4.5],                                // primary button text
  ["accent", "bg", 3], ["line", "panel", 1.0],                 // focus ring / borders (informational)
];

let failed = 0;
for (const [name, t] of Object.entries({ light, dark, discreet })) {
  console.log(`\n${name}`);
  for (const [f, b, min] of PAIRS) {
    const fg = f.startsWith("#") ? f : t[f], bg = t[b];
    if (!fg || !bg) continue;
    const r = ratio(fg, bg);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(`  ${ok ? "ok  " : "FAIL"} ${f.padEnd(8)} on ${b.padEnd(12)} ${r.toFixed(2)}:1  (min ${min})`);
  }
}
console.log(failed ? `\n${failed} pair(s) below minimum` : "\nAll pairs pass");
process.exit(failed ? 1 : 0);
