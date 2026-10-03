import { AudioSensor, describeLevel, loudThreshold, micOffsetFrom } from "./audio.js";
import { VisionSensor, describeMotion, describeLight } from "./vision.js";
import { SpeechSensor, speechSupported, describePace } from "./speech.js";
import { Coach, analyzeUtterance, BUSY_MOTION } from "./coach.js";
import { Calm } from "./calm.js";
import { DEMO_SCRIPT } from "./demo.js";
import { Perception, EXPRESSIONS, BODY } from "./perception.js";
import { SceneReader, SCENES } from "./scene.js";
import { CameraOverlay } from "./overlay.js";
import { DISABILITIES, QUIRKS, QUICK_CARDS, loadMe, saveMe, hasMe, renderMeCard } from "./conversation.js";
import { ConversationLog } from "./summary.js";
import { CUE_TYPES, PROFILES, DEFAULT_PROFILE, LOUD_LEVELS, noisyLevel } from "./profiles.js";

const $ = (id) => document.getElementById(id);
const els = {
  start: $("btnStart"), demo: $("btnDemo"), settingsBtn: $("btnSettings"), settings: $("settings"),
  video: $("video"), canvas: $("frameCanvas"), placeholder: $("videoPlaceholder"),
  transcript: $("transcript"), interim: $("interim"), feed: $("feed"), summary: $("settingSummary"),
  optProfile: $("optProfile"), profileDesc: $("profileDesc"), optOutput: $("optOutput"),
  cueToggles: $("cueToggles"), optLoud: $("optLoud"), optCaptions: $("optCaptions"), captions: $("captions"),
  optCamera: $("optCamera"), optFacing: $("optFacing"), optName: $("optName"),
  optDiscreet: $("optDiscreet"), discreetBtn: $("btnDiscreet"), optTextSize: $("optTextSize"), optSuggest: $("optSuggest"),
};

// ---------- settings (remembered locally) ----------
const SETTINGS_KEY = "grover.settings";

// Build the profile picker and one checkbox per cue type.
for (const [id, p] of Object.entries(PROFILES)) els.optProfile.add(new Option(p.label, id));
for (const c of CUE_TYPES) {
  const label = document.createElement("label");
  label.innerHTML = `<input type="checkbox" data-cue="${c.id}" /> `;
  label.append(c.label);
  els.cueToggles.append(label);
}
const cueBoxes = [...els.cueToggles.querySelectorAll("input[data-cue]")];

// Put a profile's preset into the controls.
function applyProfile(id) {
  const p = PROFILES[id] ?? PROFILES[DEFAULT_PROFILE];
  els.optProfile.value = id in PROFILES ? id : DEFAULT_PROFILE;
  cueBoxes.forEach((box) => (box.checked = Boolean(p.cues[box.dataset.cue])));
  els.optLoud.value = p.loud;
  els.optOutput.value = p.output;
  els.optCaptions.checked = Boolean(p.captions);
  els.profileDesc.textContent = p.desc;
}

// Text size scales the whole app from the root font size.
const TEXT_SIZES = { normal: "100%", large: "115%", xl: "130%" };
function applyTextSize() {
  document.documentElement.style.fontSize = TEXT_SIZES[els.optTextSize.value] ?? "100%";
}

function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch {}
  applyProfile(s.profile ?? DEFAULT_PROFILE);
  // A saved Custom profile keeps the user's own choices.
  if (s.profile === "custom") {
    if (s.cues) cueBoxes.forEach((box) => (box.checked = Boolean(s.cues[box.dataset.cue])));
    if (s.loudPreset) els.optLoud.value = s.loudPreset;
    if (s.captions != null) els.optCaptions.checked = s.captions;
  }
  if (s.output) els.optOutput.value = s.output;
  if (s.camera != null) els.optCamera.checked = s.camera;
  if (s.facing) els.optFacing.value = s.facing;
  if (s.name) els.optName.value = s.name;
  if (s.discreet != null) els.optDiscreet.checked = s.discreet;
  if (s.textSize) els.optTextSize.value = s.textSize;
  els.optSuggest.checked = Boolean(s.suggest);
  applyTextSize();
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(getSettings())); } catch {}
}
function getSettings() {
  const output = els.optOutput.value;
  const profile = els.optProfile.value;
  return {
    profile,
    output,
    voice: output === "voice" || output === "both",
    buzz: output === "buzz" || output === "both",
    cues: Object.fromEntries(cueBoxes.map((box) => [box.dataset.cue, box.checked])),
    loudPreset: els.optLoud.value,
    loud: LOUD_LEVELS[els.optLoud.value] ?? LOUD_LEVELS.normal,
    noisy: noisyLevel(els.optLoud.value, els.optCaptions.checked),
    checkinMin: PROFILES[profile]?.checkinMin ?? 4,
    captions: els.optCaptions.checked,
    camera: els.optCamera.checked,
    facing: els.optFacing.value,
    name: els.optName.value.trim(),
    discreet: els.optDiscreet.checked,
    textSize: els.optTextSize.value,
    // Scripting what someone says can take their voice away, so suggested words are opt-in.
    suggest: els.optSuggest.checked,
  };
}
loadSettings();

els.settings.addEventListener("change", (e) => {
  if (e.target === els.optProfile) applyProfile(els.optProfile.value);
  // Fine-tuning a preset makes it the user's own Custom profile.
  else if (e.target.dataset.cue || e.target === els.optLoud || e.target === els.optCaptions) {
    els.optProfile.value = "custom";
    els.profileDesc.textContent = PROFILES.custom.desc;
  }
  saveSettings();
  applyDiscreet();
  applyTextSize();
  updateCaptions();
});

// ---------- share a setup ----------
// A short, readable code: GRV1.<profile>.<cues bitmask>.<loudness>.<output>.<captions>
// e.g. "GRV1.custom.ky.e.b.1". It never contains the user's name.
const OUTPUTS = ["screen", "buzz", "voice", "both"];
const LOUDS = ["early", "normal", "late"];
function setupCode() {
  const s = getSettings();
  const mask = CUE_TYPES.reduce((m, c, i) => (s.cues[c.id] ? m | (1 << i) : m), 0);
  return ["GRV1", s.profile, mask.toString(36), s.loudPreset[0], s.output[0], s.captions ? 1 : 0].join(".");
}
function applySetupCode(code) {
  const [tag, profile, mask36, l, o, cap] = code.trim().split(".");
  const mask = parseInt(mask36, 36);
  const loud = LOUDS.find((x) => x[0] === l);
  const output = OUTPUTS.find((x) => x[0] === o);
  if (tag !== "GRV1" || !(profile in PROFILES) || Number.isNaN(mask) || !loud || !output || !["0", "1"].includes(cap)) return false;
  applyProfile(profile);
  const preset = setupCode();
  cueBoxes.forEach((box, i) => (box.checked = Boolean(mask & (1 << i))));
  els.optLoud.value = loud;
  els.optOutput.value = output;
  els.optCaptions.checked = cap === "1";
  // Any difference from the named preset makes it a Custom setup.
  if (setupCode().split(".").slice(2).join(".") !== preset.split(".").slice(2).join(".")) {
    els.optProfile.value = "custom";
    els.profileDesc.textContent = PROFILES.custom.desc;
  }
  saveSettings();
  return true;
}
$("btnCopySetup").onclick = async () => {
  const code = setupCode();
  const box = $("setupCode");
  box.value = code;
  box.select();
  let copied = false;
  try { await navigator.clipboard.writeText(code); copied = true; } catch {}
  $("setupStatus").textContent = copied ? `Copied: ${code}` : `Your code is in the box above: ${code}`;
};
$("btnUseSetup").onclick = () => {
  const ok = applySetupCode($("setupCode").value);
  $("setupStatus").textContent = ok
    ? `Done. You are now using: ${PROFILES[getSettings().profile].label}.`
    : "That code doesn't look right. Check it and try again.";
};

// Discreet mode: nothing on screen that a bystander could easily read.
function applyDiscreet() {
  const on = getSettings().discreet;
  document.body.classList.toggle("discreet", on);
  els.discreetBtn.setAttribute("aria-pressed", String(on));
  els.discreetBtn.textContent = on ? "Full view" : "Discreet";
  // A neutral label nobody nearby would read into; the button does the same thing.
  for (const breathe of document.querySelectorAll(".need-moment")) {
    breathe.textContent = on ? "Pause" : "I need a moment";
    if (on) breathe.setAttribute("aria-label", "Pause: I need a moment"); else breathe.removeAttribute("aria-label");
  }
}
els.discreetBtn.onclick = () => {
  els.optDiscreet.checked = !els.optDiscreet.checked;
  saveSettings();
  applyDiscreet();
};
applyDiscreet();
// Settings is its own full screen with a clear Done button.
function openSettings() {
  els.settings.hidden = false;
  els.settingsBtn.setAttribute("aria-expanded", "true");
  els.settings.scrollTop = 0;
  $("btnSettingsDone").focus();
}
function closeSettings() {
  els.settings.hidden = true;
  els.settingsBtn.setAttribute("aria-expanded", "false");
  els.settingsBtn.focus();
}
els.settingsBtn.onclick = () => (els.settings.hidden ? openSettings() : closeSettings());
$("btnSettingsDone").onclick = closeSettings;
els.settings.addEventListener("keydown", (e) => e.key === "Escape" && closeSettings());

// ---------- voice output ----------
let speech = null;

// Spoken tips wait for a gap in the conversation so Grover never talks over anyone.
// Only the newest tip is kept; anything older than STALE_MS is dropped, never read out as a backlog.
const GAP_MS = 1500;
const STALE_MS = 8000;
let lastHeardAt = 0;
let pending = null;
const heardSpeech = () => (lastHeardAt = Date.now());

function speak(text) {
  if (!getSettings().voice || !("speechSynthesis" in window)) return;
  pending = { text, at: Date.now() };
}

setInterval(() => {
  if (!pending) return;
  const now = Date.now();
  if (now - pending.at > STALE_MS) { pending = null; return; }
  if (now - lastHeardAt < GAP_MS || speechSynthesis.speaking) return;
  sayNow(pending.text);
  pending = null;
}, 250);

// Immediate speech, only for things the user asked for (e.g. the breathing exercise).
function sayNow(text) {
  if (!getSettings().voice || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  u.pitch = 1;
  u.volume = getSettings().discreet ? 0.6 : 1;
  u.onstart = () => speech?.setPaused(true);
  u.onend = () => setTimeout(() => speech?.setPaused(false), 300);
  speechSynthesis.speak(u);
}

// ---------- coaching feed ----------
// Literal labels: no idioms in Grover's own wording.
// Literal labels, each paired with an icon (a visual support).
const KIND_LABEL = { info: "💬 Conversation", "heads-up": "🔔 Notice", care: "💚 Care", calm: "🌿 Calm" };
const quoted = (s) => `“${s}”`;

// One or two words per cue for discreet mode, so a glance (or one spoken word) is enough.
const SHORT = {
  name: "Your name", question: "Question", "how-are-you": "How are you?",
  spike: "Loud sound", "faces-up": "Someone new", loud: "Loud", busy: "Busy", pace: "Fast talk",
  pause: "Pause is okay", checkin: "Breathe", "mood-over": "Quiet mode", summary: "Done",
  siren: "Siren or alarm", shrill: "Sharp sound", flashing: "Flashing lights",
  scene: "New place", wave: "Waving", smile: "Smiling", "face-tense": "Tense face", safety: "Emergency lights",
};
const shortLabel = (cue) => SHORT[cue.id] ?? (cue.id.startsWith("idiom-") ? "Saying" : cue.msg);

// Distinct vibration rhythms per cue kind (phones only; ignored elsewhere).
const BUZZ = { info: [70, 80, 70], "heads-up": [350], care: [60, 70, 60, 70, 60], calm: [30] };
let userHasTapped = false;
// Only real taps and typing keys count (browsers ignore Escape and script-made events for this).
addEventListener("pointerdown", (e) => { if (e.isTrusted) userHasTapped = true; }, { capture: true });
addEventListener("keydown", (e) => { if (e.isTrusted && e.key !== "Escape") userHasTapped = true; }, { capture: true });
function buzz(kind) {
  // Browsers block vibration until the user has tapped the page once.
  if (!userHasTapped) return;
  try { navigator.vibrate?.(BUZZ[kind] ?? [50]); } catch {}
}
// Messages to hold up for cues where the user might want to ask something.
const CUE_CARDS = {
  question: "Can you say that again, please?",
  pace: "Could you slow down a little, please?",
  pause: "Please give me a moment.",
};
const NOW_IDLE_MS = 25000;
const nowEl = $("now");
let nowCue = null;
let nowTimer = null;

// The newest cue gets the big "Right now" spot; the previous one moves to "Earlier".
function showCue(cue) {
  if (running && ["name", "loud", "spike", "siren"].includes(cue.id)) convo.mark(cue.id);
  cue.time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  archiveNow();
  nowCue = cue;
  nowEl.className = `now ${cue.kind}`;
  nowEl.querySelector(".now-label").textContent = `Right now · ${KIND_LABEL[cue.kind] ?? ""}`;
  const discreet = getSettings().discreet;
  nowEl.querySelector(".now-msg").textContent = discreet ? shortLabel(cue) : cue.msg;
  const tip = nowEl.querySelector(".now-tip");
  tip.hidden = !cue.tip || discreet;
  tip.textContent = cue.tip ?? "";
  // The phrase box only ever holds exact words the user could say, and only if they asked for them.
  const say = nowEl.querySelector(".now-say");
  const suggest = getSettings().suggest;
  say.hidden = !cue.say || !suggest;
  say.innerHTML = "<b>You could say</b>";
  if (cue.say && suggest) say.append(quoted(cue.say));
  const actions = nowEl.querySelector(".now-actions");
  actions.replaceChildren();
  if (cue.offerBreathing) {
    const b = document.createElement("button");
    b.textContent = "Take a moment";
    b.onclick = () => openCalm();
    actions.append(b);
  }
  // Instead of having to say it, the user can hold up a message in big letters (their choice).
  const card = CUE_CARDS[cue.id];
  if (card) {
    const b = document.createElement("button");
    b.textContent = `🪧 Show: “${card}”`;
    b.onclick = () => showText(card);
    actions.append(b);
  }
  clearTimeout(nowTimer);
  nowTimer = setTimeout(resetNow, NOW_IDLE_MS);
  showCueBar(cue);

  // How the cue reaches the user is set by "How should I tell you?" in Settings.
  if (getSettings().buzz) buzz(cue.kind);
  if (cue.priority >= 2) {
    const sayIt = cue.say && suggest;
    if (discreet) speak(sayIt ? `${shortLabel(cue)}. ${cue.say}` : shortLabel(cue));
    else speak(sayIt ? `${cue.msg} You could say: ${cue.say}` : cue.msg);
  }
}

function archiveNow() {
  if (!nowCue) return;
  els.feed.prepend(buildCard(nowCue));
  while (els.feed.children.length > 30) els.feed.lastChild.remove();
  nowCue = null;
}

function resetNow() {
  archiveNow();
  clearTimeout(nowTimer);
  nowEl.className = "now idle";
  nowEl.querySelector(".now-label").textContent = "Right now";
  nowEl.querySelector(".now-say").hidden = true;
  nowEl.querySelector(".now-actions").replaceChildren();
  renderIdle();
}

// With no cue showing, "Right now" describes the room in one plain line,
// so the user always has a picture of their surroundings at a glance.
function roomStatus() {
  if (!running) return { msg: "Not listening right now.", tip: "Press Start when you are ready." };
  if (calibrating) return { msg: "Listening to the room…", tip: "This takes a few seconds." };
  const parts = [];
  const level = env.level;
  const loudAt = loudThreshold(getSettings().loud);
  parts.push(level > loudAt ? "Loud" : level > 0.55 ? "Busy" : level > 0.3 ? "Some noise" : "Quiet");
  if (env.faces != null) parts.push(env.faces === 0 ? "No one close" : `${env.faces} ${env.faces === 1 ? "person" : "people"} nearby`);
  if (env.motion != null && env.motion > BUSY_MOTION) parts.push("Lots of movement");
  const tip = level > loudAt ? "Nothing needs you. Breaks are okay." : "Nothing needs you right now.";
  return { msg: parts.join(" · "), tip };
}
function renderIdle() {
  if (nowCue) return;
  const { msg, tip } = roomStatus();
  const msgEl = nowEl.querySelector(".now-msg");
  const tipEl = nowEl.querySelector(".now-tip");
  // Only touch the text when it changes: "Right now" is a live region, and rewriting
  // the same words every second would make screen readers repeat them.
  if (msgEl.textContent !== msg) msgEl.textContent = msg;
  if (tipEl.textContent !== tip) tipEl.textContent = tip;
  tipEl.hidden = false;
}

function buildCard(cue) {
  const card = document.createElement("div");
  card.className = `card ${cue.kind}`;
  card.innerHTML = `<div class="kind"><span>${KIND_LABEL[cue.kind] ?? ""}</span><span>${cue.time}</span></div>`;
  const msg = document.createElement("div");
  msg.className = "msg";
  msg.textContent = cue.msg;
  card.append(msg);
  if (cue.tip) {
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.textContent = cue.tip;
    card.append(tip);
  }
  if (cue.say && getSettings().suggest) {
    const say = document.createElement("div");
    say.className = "say";
    say.innerHTML = "<b>You could say: </b>";
    say.append(quoted(cue.say));
    card.append(say);
  }
  return card;
}

let coach = new Coach({ emit: showCue, getSettings });
const calm = new Calm($("calm"), $("calmText"), sayNow);
// The breathing exercise takes keyboard focus while open and gives it back afterwards.
let focusBeforeCalm = null;
function openCalm(tab = "breathe") {
  showCalmTab(tab);
  $("calm").querySelector(".calm-say").hidden = !getSettings().suggest;
  if (running) { sessionBreaks++; convo.mark("break"); }
  focusBeforeCalm = document.activeElement;
  calm.open();
  $("btnCalmDone").focus();
}
function closeCalm() {
  if ($("calm").hidden) return;
  calm.close();
  focusBeforeCalm?.focus?.();
}
document.querySelectorAll(".need-moment").forEach((b) => (b.onclick = () => openCalm()));
document.querySelectorAll("[data-calm]").forEach((b) => (b.onclick = () => openCalm(b.dataset.calm)));
$("btnCalmDone").onclick = () => {
  closeCalm();
  showCue({ id: "after-calm", kind: "calm", priority: 1, msg: "Welcome back. Go at your own pace." });
};
$("calm").addEventListener("keydown", (e) => e.key === "Escape" && closeCalm());

// Calm space: Breathe / Ground / Step away.
const calmTabs = [...document.querySelectorAll(".calm-tabs [data-tab]")];
function showCalmTab(name) {
  for (const t of calmTabs) t.setAttribute("aria-selected", String(t.dataset.tab === name));
  for (const p of document.querySelectorAll(".calm-panel")) p.hidden = p.dataset.panel !== name;
}
calmTabs.forEach((t) => (t.onclick = () => showCalmTab(t.dataset.tab)));

document.querySelectorAll(".mood button").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll(".mood button").forEach((x) => {
      x.classList.toggle("active", x === b);
      x.setAttribute("aria-pressed", String(x === b));
    });
    coach.setMood(b.dataset.mood);
    if (b.dataset.mood === "overwhelmed") openCalm();
  };
});

// ---------- meters + setting summary ----------
const env = { level: 0, wpm: 0, motion: null, brightness: null, faces: null };
function setMeter(id, frac, label, high) {
  const m = $(id);
  m.querySelector("i").style.width = `${Math.round(Math.min(1, frac) * 100)}%`;
  m.querySelector(".value").textContent = label;
  m.classList.toggle("high", Boolean(high));
}
function renderEnv() {
  setMeter("mSound", env.level, describeLevel(env.level), env.level > 0.72);
  setMeter("mPace", env.wpm / 220, env.wpm ? `${describePace(env.wpm)}` : "Silent", env.wpm >= 170);
  if (env.motion != null) setMeter("mActivity", env.motion / 0.4, describeMotion(env.motion), env.motion > BUSY_MOTION);
  if (env.brightness != null) setMeter("mLight", env.brightness, describeLight(env.brightness), false);

  const parts = [describeLevel(env.level).toLowerCase()];
  if (env.motion != null) parts.push(describeMotion(env.motion) === "Lots" ? "lots of movement" : "fairly still");
  if (env.faces != null) parts.push(env.faces === 0 ? "no one in view" : `${env.faces} ${env.faces === 1 ? "person" : "people"} in view`);
  parts.push(env.wpm ? `conversation is ${describePace(env.wpm).toLowerCase()}` : "no one talking right now");
  els.summary.textContent = `Setting: ${parts.join(" · ")}`;
  renderIdle();
}

// Large live captions on the main screen (Listening support): the last two lines plus what is being said now.
let captionLines = [];
function updateCaptions() {
  els.captions.hidden = !(getSettings().captions && running);
}
function captionInterim(text) {
  els.captions.querySelector(".cap-interim").textContent = text;
}
function captionFinal(text) {
  captionLines = [...captionLines, text].filter(Boolean).slice(-2);
  els.captions.querySelector(".cap-final").textContent = captionLines.join(" ");
  captionInterim("");
}

function addTranscript(text) {
  captionFinal(text);
  const p = document.createElement("p");
  p.textContent = text;
  const tags = analyzeUtterance(text, getSettings().name).tags;
  convo.add(text, { question: tags.has("question") });
  renderConvo();
  if (tags.has("question")) p.className = "q";
  els.transcript.append(p);
  els.transcript.scrollTop = els.transcript.scrollHeight;
}

// ---------- live mode ----------
let running = false;
let calibrating = false;
let sensors = [];
let ticker = null;

// Problems are explained in one plain sentence, plus what to do next. Never error codes.
function showProblem(msg, tip) {
  showCue({ id: "problem", kind: "heads-up", priority: 1, msg, tip });
}
function explainMediaError(err) {
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return ["I am not allowed to use the microphone yet.", "Allow the microphone in your browser or phone settings, then try again."];
    case "NotFoundError":
    case "OverconstrainedError":
      return ["I can't find a microphone on this device.", "Connect a microphone or headset, then try again."];
    case "NotReadableError":
    case "AbortError":
      return ["Another app is using the microphone.", "Close the other app, then try again."];
    default:
      return ["I couldn't start the microphone.", "Press Start to try again."];
  }
}

async function startLive() {
  const { camera, facing } = getSettings();
  if (!navigator.mediaDevices?.getUserMedia) {
    showProblem("This link can't use the microphone.", "Open Grover from a secure (https) link, or from the installed app.");
    return;
  }
  const video = camera ? { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } } : false;
  let stream;
  const notes = []; // shown with the "I'm listening" message so they aren't lost
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
  } catch (err) {
    // No camera, or the camera is busy: carry on with sound only rather than failing.
    if (camera && ["NotFoundError", "NotReadableError", "OverconstrainedError"].includes(err.name)) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        notes.push("I can't use the camera, so I am using sound only.");
      } catch (err2) {
        err = err2;
      }
    }
    if (!stream) {
      showProblem(...explainMediaError(err));
      return;
    }
  }

  calibrating = true;
  const audio = new AudioSensor(({ level, spike, sound }) => {
    env.level = level;
    coach.onEnvironment({ level, spike, sound });
  }, (baseline) => {
    calibrating = false;
    renderIdle();
  });
  audio.micOffset = getMicOffset();
  audio.start(stream);
  sensors.push(audio);

  if (stream.getVideoTracks().length) {
    els.video.srcObject = stream;
    els.video.classList.toggle("mirror", facing === "user");
    els.placeholder.hidden = true;
    const vision = new VisionSensor(els.video, els.canvas, (v) => {
      Object.assign(env, v);
      coach.onEnvironment(v);
    });
    vision.start();
    sensors.push(vision);
    startPerception(els.video);
    camOverlay.start(() => (perceptionOn && perception ? perception : { status: "off" }));
  }

  if (speechSupported) {
    speech = new SpeechSensor({
      onFinal: (t) => { heardSpeech(); addTranscript(t); coach.onUtterance(t); },
      onInterim: (t) => { if (t.trim()) heardSpeech(); els.interim.textContent = t; captionInterim(t); },
      onPace: (wpm) => { env.wpm = wpm; coach.onEnvironment({ wpm }); },
    });
    speech.start();
    sensors.push(speech);
  } else {
    notes.push("Captions and name alerts don't work in this browser. Chrome or Edge support everything.");
  }

  sensors.push({ stop: () => stream.getTracks().forEach((t) => t.stop()) });
  beginSession();
  const usual = getSettings().voice ? "Voice is on. Use earbuds so only you hear it. I wait for a pause before I speak." : `Profile: ${PROFILES[getSettings().profile]?.label}. You can tap “I need a moment” any time.`;
  showCue({ id: "hello", kind: notes.length ? "heads-up" : "calm", priority: 2, msg: "I'm listening. I will give you short tips as things happen.",
    tip: notes.length ? notes.join(" ") : usual });
}

// Keep the phone screen on while Grover is listening (where supported).
let wakeLock = null;
async function keepAwake() {
  try { wakeLock = await navigator.wakeLock?.request("screen"); } catch {}
}
document.addEventListener("visibilitychange", () => {
  if (running && document.visibilityState === "visible") keepAwake();
});

// ---------- end-of-session summary ----------
// A short, kind recap after Stop. Counts only; nothing is saved.
let sessionStart = 0;
let sessionBreaks = 0;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
function sessionSummary() {
  const mins = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));
  const c = coach.counts;
  const parts = [];
  if (c.loud) parts.push(plural(c.loud, "loud period", "loud periods"));
  if (c.spike) parts.push(plural(c.spike, "sudden sound", "sudden sounds"));
  if (c.question) parts.push(plural(c.question, "question", "questions"));
  if (c.name) parts.push(c.name === 1 ? "your name once" : `your name ${c.name} times`);
  if (sessionBreaks) parts.push(plural(sessionBreaks, "break", "breaks"));
  return {
    id: "summary", kind: "calm", priority: 1,
    msg: `Session done: ${plural(mins, "minute", "minutes")}.`,
    tip: parts.length ? `${parts.join(" · ")}. You did well.` : "It was a calm session. You did well.",
  };
}

function beginSession() {
  convo.reset();
  convoDone = false;
  els.transcript.replaceChildren();
  renderConvo();
  sessionStart = Date.now();
  sessionBreaks = 0;
  keepAwake();
  coach = new Coach({ emit: showCue, getSettings });
  running = true;
  document.body.classList.add("live");
  els.start.textContent = "Stop";
  ticker = setInterval(() => { coach.tick(); renderEnv(); }, 1000);
  captionLines = [];
  captionFinal("");
  updateCaptions();
  renderEnv();
}

function stopAll() {
  stopPerception();
  camOverlay.stop();
  const showSummary = running && Date.now() - sessionStart > 20000;
  running = false;
  calibrating = false;
  sensors.forEach((s) => s.stop());
  sensors = [];
  speech = null;
  clearInterval(ticker);
  demoTimers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  demoSee = null;
  demoMode = false;
  demoTimers = [];
  pending = null;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
  speechSynthesis?.cancel();
  els.video.srcObject = null;
  els.placeholder.hidden = false;
  els.interim.textContent = "";
  document.body.classList.remove("live");
  updateCaptions();
  els.start.textContent = "Start listening";
  els.summary.textContent = "Setting: paused";
  resetNow();
  if (showSummary) showCue(sessionSummary());
  if (convo.lines.length) { convoDone = true; renderConvo(); }
}

// Consent: the first time, explain plainly what the mic and camera are used for before asking the browser.
const CONSENT_KEY = "grover.consent";
const consentEl = $("consent");
function hasConsent() {
  try { return localStorage.getItem(CONSENT_KEY) === "1"; } catch { return false; }
}
let afterConsent = startLive;
$("btnConsentYes").onclick = () => {
  try { localStorage.setItem(CONSENT_KEY, "1"); } catch {}
  consentEl.hidden = true;
  afterConsent();
  afterConsent = startLive;
};
$("btnConsentNo").onclick = () => {
  consentEl.hidden = true;
  els.start.focus();
};
consentEl.addEventListener("keydown", (e) => e.key === "Escape" && $("btnConsentNo").click());

els.start.onclick = () => {
  if (running) return stopAll();
  if (!hasConsent()) {
    consentEl.hidden = false;
    $("btnConsentYes").focus();
    return;
  }
  startLive();
};

// ---------- demo mode (scripted, no devices needed) ----------
let demoTimers = [];
els.demo.onclick = () => {
  if (running) stopAll();
  els.settings.hidden = true;
  els.settingsBtn.setAttribute("aria-expanded", "false");
  els.transcript.innerHTML = "";
  nowCue = null;
  resetNow();
  els.feed.innerHTML = "";
  if (!getSettings().name) els.optName.value = "Sam";
  const profileName = PROFILES[getSettings().profile]?.label ?? "";
  beginSession();
  sensors.push({ stop: () => {} });
  showCue({ id: "demo", kind: "calm", priority: 1, msg: `Demo: arriving at a friend's birthday get-together. Profile: ${profileName}.` });
  for (const step of DEMO_SCRIPT) {
    demoTimers.push(setTimeout(() => {
      if (step.env) {
        Object.assign(env, step.env);
        coach.onEnvironment(step.env);
      }
      if (step.say) {
        els.interim.textContent = "";
        heardSpeech();
        addTranscript(step.say);
        coach.onUtterance(step.say);
      }
      if (step.see) demoSee = step.see;
      if (step.end) stopAll();
    }, step.at));
  }
  // The demo's camera readings repeat every second, like the real reader does.
  demoMode = true;
  demoTimers.push(setInterval(() => { if (demoSee) onPercept(structuredClone(demoSee)); }, 1000));
};
let demoSee = null, demoMode = false;

// ---------- first-run setup ----------
// A few short steps, every one optional: name, (only if they want) disability, how they talk
// and listen, then a support profile. Builds the conversation card shown on the Me page.
const WELCOME_KEY = "grover.welcomed";
const welcomeEl = $("welcome");
const PICKABLE = ["social", "focus", "sensory", "listening"];
const STEPS = 5;
let wzStep = 0, wzMe = null, wzProfile = null, wzDisPick = null, wzQuirkPick = null;
for (const id of PICKABLE) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "welcome-choice";
  b.dataset.profile = id;
  b.setAttribute("aria-pressed", "false");
  b.innerHTML = `<b></b><span></span>`;
  b.querySelector("b").textContent = PROFILES[id].label;
  b.querySelector("span").textContent = PROFILES[id].desc;
  b.onclick = () => {
    wzProfile = id;
    for (const x of $("welcomeChoices").children) x.setAttribute("aria-pressed", String(x === b));
    showStep(4);
  };
  $("welcomeChoices").append(b);
}
function openSetup() {
  wzMe = loadMe();
  wzProfile = getSettings().profile;
  $("wzName").value = wzMe.name || getSettings().name;
  wzDisPick = makePicker($("wzDis"), DISABILITIES.map((d) => ({ id: d, label: d })), wzMe.disabilities, { addLabel: "Add my own" });
  wzQuirkPick = makePicker($("wzQuirks"), QUIRKS, wzMe.quirks, { addLabel: "Add something else about how I talk", own: wzMe.ownKnow });
  for (const x of $("welcomeChoices").children) x.setAttribute("aria-pressed", String(x.dataset.profile === wzProfile));
  welcomeEl.hidden = false;
  showStep(0);
}
function collectSetup() {
  wzMe.name = $("wzName").value.trim();
  wzMe.disabilities = wzDisPick.value();
  wzMe.quirks = wzQuirkPick.value().filter((id) => QUIRKS.some((q) => q.id === id));
  wzMe.ownKnow = wzQuirkPick.own();
}
function showStep(n) {
  collectSetup();
  wzStep = Math.max(0, Math.min(STEPS - 1, n));
  for (const sec of welcomeEl.querySelectorAll(".wz-step")) sec.hidden = Number(sec.dataset.step) !== wzStep;
  welcomeEl.querySelector(".wz-progress").textContent = `Step ${wzStep + 1} of ${STEPS}`;
  $("wzBack").hidden = wzStep === 0;
  $("wzSkip").hidden = wzStep === STEPS - 1;
  $("wzNext").textContent = wzStep === STEPS - 1 ? "Done" : "Next";
  if (wzStep === 4) renderMeCard($("wzPreview"), wzMe);
  welcomeEl.scrollTop = 0;
  // Focus the step's heading (read out by screen readers), never a choice: nothing gets picked by accident.
  const step = welcomeEl.querySelector(`.wz-step[data-step="${wzStep}"]`);
  const target = wzStep === 0 ? $("wzName") : step.querySelector("h2");
  if (target.tagName === "H2") target.tabIndex = -1;
  target.focus();
}
function finishSetup() {
  collectSetup();
  saveMe(wzMe);
  if (wzMe.name) els.optName.value = wzMe.name;
  if (wzProfile && wzProfile !== getSettings().profile) applyProfile(wzProfile);
  saveSettings();
  try { localStorage.setItem(WELCOME_KEY, "1"); } catch {}
  welcomeEl.hidden = true;
  renderMe();
  els.start.focus();
}
$("wzBack").onclick = () => showStep(wzStep - 1);
$("wzNext").onclick = () => (wzStep === STEPS - 1 ? finishSetup() : showStep(wzStep + 1));
$("wzSkip").onclick = () => showStep(wzStep + 1);
$("wzName").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); showStep(1); } });
welcomeEl.addEventListener("keydown", (e) => e.key === "Escape" && finishSetup());
$("btnSetupAgain").onclick = () => { closeSettings(); openSetup(); };

// A list of choices as toggle buttons (several can be on), plus "add my own" for anything missing.
// Returns { value(): ids chosen, own(): the user's own extra lines }.
function makePicker(el, options, chosen, { addLabel, own } = {}) {
  el.replaceChildren();
  const ownLines = [...(own ?? [])];
  const known = new Set(options.map((o) => o.id));
  // The user's own additions to a fixed list (e.g. a condition not listed) show as chips too.
  const extra = chosen.filter((c) => !known.has(c));
  const all = [...options, ...extra.map((c) => ({ id: c, label: c })), ...ownLines.map((l) => ({ id: `own:${l}`, label: l }))];
  const picked = new Set([...chosen, ...ownLines.map((l) => `own:${l}`)]);
  const list = document.createElement("div");
  list.className = "pick-list";
  const addChip = (o) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pick";
    b.textContent = o.label;
    b.dataset.id = o.id;
    b.setAttribute("aria-pressed", String(picked.has(o.id)));
    b.onclick = () => {
      if (picked.has(o.id)) picked.delete(o.id); else picked.add(o.id);
      b.setAttribute("aria-pressed", String(picked.has(o.id)));
    };
    list.append(b);
  };
  all.forEach(addChip);
  const add = document.createElement("div");
  add.className = "pick-add";
  const input = Object.assign(document.createElement("input"), { type: "text", placeholder: addLabel ?? "Add my own", autocomplete: "off" });
  input.setAttribute("aria-label", addLabel ?? "Add my own");
  const btn = Object.assign(document.createElement("button"), { type: "button", textContent: "Add" });
  const doAdd = () => {
    const text = input.value.trim();
    if (!text) return;
    const id = own ? `own:${text}` : text;
    if (!picked.has(id)) { picked.add(id); addChip({ id, label: text }); }
    input.value = "";
    input.focus();
  };
  btn.onclick = doAdd;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doAdd(); } });
  add.append(input, btn);
  el.append(list, add);
  return {
    value: () => [...picked].filter((id) => !id.startsWith("own:")),
    own: () => [...picked].filter((id) => id.startsWith("own:")).map((id) => id.slice(4)),
  };
}

let welcomed = true;
try { welcomed = localStorage.getItem(WELCOME_KEY) === "1"; } catch {}
if (!welcomed) openSetup();

// ---------- dialogs: keep keyboard focus inside while open ----------
function trapFocus(dialog) {
  dialog.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const items = [...dialog.querySelectorAll("button, [href], input, select, summary")]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
["welcome", "consent", "settings", "calm", "showCard"].forEach((id) => trapFocus($(id)));

// ---------- camera check: the live picture, with boxes on the faces Grover finds ----------
// On its own page, so it's easy to check the camera is on and being read.
const camOverlay = new CameraOverlay(els.video, $("camOverlay"), $("camStatus"));

// ---------- pages: swipe sideways, or tap the tab bar ----------
// Each page is one screen. The phone is meant to stay down most of the time: pages are for
// a quick look, and cues reach the user by buzz, voice or the one-line cue bar.
const pager = $("pager");
const tabs = [...document.querySelectorAll("#tabbar [data-tab]")];
const pageIds = tabs.map((t) => t.dataset.tab);
let currentPage = "home";
function goTo(id, smooth = true) {
  const i = pageIds.indexOf(id);
  if (i < 0) return;
  pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
  setPage(id);
}
function setPage(id) {
  if (id === currentPage && tabs.some((t) => t.getAttribute("aria-selected") === "true")) return;
  currentPage = id;
  for (const t of tabs) {
    const on = t.dataset.tab === id;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  }
  for (const pg of pager.querySelectorAll(".page")) pg.inert = pg.dataset.page !== id;
  camOverlay.visible = id === "camera";
  updateCueBar();
}
tabs.forEach((t) => (t.onclick = () => goTo(t.dataset.tab)));
// Arrow keys move between tabs, as screen-reader and keyboard users expect.
$("tabbar").addEventListener("keydown", (e) => {
  const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
  if (!step) return;
  const i = (pageIds.indexOf(currentPage) + step + pageIds.length) % pageIds.length;
  goTo(pageIds[i]);
  tabs[i].focus();
});
// Swiping: whichever page is mostly in view becomes the current one.
let scrollIdle = null;
pager.addEventListener("scroll", () => {
  clearTimeout(scrollIdle);
  scrollIdle = setTimeout(() => setPage(pageIds[Math.round(pager.scrollLeft / pager.clientWidth)] ?? "home"), 80);
}, { passive: true });
addEventListener("resize", () => goTo(currentPage, false));
document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => {
  goTo(b.dataset.go);
  if (b.dataset.focus) setTimeout(() => $(b.dataset.focus)?.focus({ preventScroll: false }), 350);
}));

// ---------- cue bar: the newest cue, one line, on every page but Conversation help ----------
const cueBar = $("cueBar");
let barCue = null, barTimer = null;
function showCueBar(cue) {
  // Session-start and summary messages don't need to chase the user around.
  if (["hello", "summary", "after-calm", "demo"].includes(cue.id)) return;
  barCue = cue;
  clearTimeout(barTimer);
  // Gone after 12 s: a glance is enough, and the screen goes back to being still.
  barTimer = setTimeout(() => { barCue = null; updateCueBar(); }, 12000);
  updateCueBar();
}
function updateCueBar() {
  cueBar.hidden = !barCue || currentPage === "assist";
  if (!barCue) return;
  cueBar.className = `cue-bar ${barCue.kind}`;
  cueBar.textContent = getSettings().discreet ? shortLabel(barCue) : barCue.msg;
}
cueBar.onclick = () => goTo("assist");

// ---------- Home: is everything working? ----------
const homeChecks = $("homeChecks");
function setCheck(name, state, ok) {
  const li = homeChecks.querySelector(`[data-check="${name}"]`);
  li.querySelector(".hc-state").textContent = state;
  li.className = ok === true ? "ok" : ok === false ? "bad" : "";
}
function renderHome() {
  const r = perception && perceptionOn ? perception : null;
  const fps = running && !demoMode ? camOverlay.fps() : 0;
  if (demoMode) {
    setCheck("mic", "Demo (not used)"); setCheck("camera", "Demo (not used)"); setCheck("faces", "Demo");
  } else if (!running) {
    setCheck("mic", "Off"); setCheck("camera", "Off"); setCheck("faces", "Off");
  } else {
    setCheck("mic", calibrating ? "Getting used to the room…" : "Listening", true);
    if (!getSettings().camera) setCheck("camera", "Turned off in Settings");
    else if (!els.video.srcObject) setCheck("camera", "Not available", false);
    else setCheck("camera", fps > 0 ? "Working" : "No picture yet", fps > 0);
    if (!r) setCheck("faces", getSettings().camera ? "Not used by this profile" : "Off");
    else if (r.status === "loading") setCheck("faces", `Getting ready… ${Math.round(r.progress * 100)}%`);
    else if (r.status === "error") setCheck("faces", "Couldn't load", false);
    else setCheck("faces", r.rate ? `Working · ${live.people?.count ?? 0} ${live.people?.count === 1 ? "person" : "people"} in view` : "Waiting for the camera", Boolean(r.rate));
  }
  const { msg } = roomStatus();
  const homeNow = $("homeNow");
  if (homeNow.textContent !== msg) homeNow.textContent = msg;
  els.start.classList.toggle("stop", running);
  document.querySelector(".phone-down").hidden = !running;
}

// ---------- Social setting: expressions seen in the last 10 seconds ----------
function renderExpressions() {
  const box = document.querySelector("#exprCard .expr-bars");
  const log = live.exprLog;
  if (!log.length) {
    const text = !running && !demoMode ? "Starts when the camera is on" : "No faces close enough to read right now";
    if (box.textContent !== text) box.replaceChildren(Object.assign(document.createElement("span"), { className: "chip muted", textContent: text }));
    return;
  }
  const counts = {};
  for (const x of log) counts[x.e] = (counts[x.e] ?? 0) + 1;
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([e, n]) => {
    const pct = Math.round((100 * n) / log.length);
    const row = document.createElement("div");
    row.className = "expr-row";
    row.innerHTML = `<span class="er-label"></span><span class="bar"><i></i></span><span class="er-pct"></span>`;
    row.querySelector(".er-label").textContent = `${EXPRESSIONS[e]?.emoji ?? ""} ${EXPRESSIONS[e]?.label ?? e}`;
    row.querySelector("i").style.width = `${pct}%`;
    row.querySelector(".er-pct").textContent = `${pct}%`;
    return row;
  });
  const looking = Math.round((100 * log.filter((x) => x.look).length) / log.length);
  const look = document.createElement("p");
  look.className = "er-look";
  look.textContent = `👀 Looking at you: ${looking}% of the time`;
  box.replaceChildren(...rows, look);
}

// ---------- My conversation style ----------
let me = loadMe();
// The name in Settings and on the card are the same name.
if (!me.name && getSettings().name) me.name = getSettings().name;
const meEdit = $("meEdit");
let meDisPick = null, meQuirkPick = null;
function renderMe() {
  me = loadMe();
  renderMeCard($("meCard"), me);
}
renderMe();
$("btnEditMe").onclick = () => {
  me = loadMe();
  $("meName").value = me.name || getSettings().name;
  meDisPick = makePicker($("meDis"), DISABILITIES.map((d) => ({ id: d, label: d })), me.disabilities, { addLabel: "Add my own" });
  meQuirkPick = makePicker($("meQuirks"), QUIRKS, me.quirks, { addLabel: "Add something else about how I talk", own: me.ownKnow });
  $("meTips").checked = me.tips !== false;
  $("meStress").value = me.stress;
  meEdit.hidden = false;
  $("btnEditMe").hidden = true;
  $("meName").focus();
};
function closeMeEdit() {
  meEdit.hidden = true;
  $("btnEditMe").hidden = false;
  $("btnEditMe").focus();
}
$("btnMeCancel").onclick = closeMeEdit;
// Deleting takes two taps, so it never happens by accident.
const delBtn = $("btnMeDelete");
let delArmed = null;
delBtn.onclick = () => {
  if (!delArmed) {
    delBtn.textContent = "Tap again to delete";
    delArmed = setTimeout(() => { delArmed = null; delBtn.textContent = "Delete my card"; }, 4000);
    return;
  }
  clearTimeout(delArmed);
  delArmed = null;
  delBtn.textContent = "Delete my card";
  saveMe({});
  try { localStorage.removeItem("grover.me"); } catch {}
  renderMe();
  closeMeEdit();
};
meEdit.onsubmit = (e) => {
  e.preventDefault();
  me = {
    ...me,
    name: $("meName").value.trim(),
    disabilities: meDisPick.value(),
    quirks: meQuirkPick.value(),
    ownKnow: meQuirkPick.own(),
    tips: $("meTips").checked,
    stress: $("meStress").value.trim(),
  };
  saveMe(me);
  if (me.name) { els.optName.value = me.name; saveSettings(); }
  renderMe();
  closeMeEdit();
};

// ---------- show the other person: big letters, full screen ----------
const showEl = $("showCard");
let focusBeforeShow = null;
function showBig(build) {
  const body = showEl.querySelector(".show-body");
  body.replaceChildren();
  build(body);
  focusBeforeShow = document.activeElement;
  showEl.hidden = false;
  showEl.scrollTop = 0;
  $("btnShowDone").focus();
}
function showText(text) {
  showBig((body) => body.append(Object.assign(document.createElement("p"), { className: "show-text", textContent: text })));
}
function closeShow() {
  showEl.hidden = true;
  focusBeforeShow?.focus?.();
}
$("btnShowDone").onclick = closeShow;
showEl.addEventListener("keydown", (e) => e.key === "Escape" && closeShow());
document.querySelectorAll("[data-show]").forEach((b) => (b.onclick = () => {
  if (b.dataset.show === "me") {
    me = loadMe();
    if (!hasMe(me)) { goTo("me"); $("btnEditMe").click(); return; }
    showBig((body) => renderMeCard(body, me, { big: true }));
  } else {
    showText(loadMe().stress || "I need a few minutes. It's not about you.");
  }
}));

// Messages to show when talking is hard: the user picks or types them (communication cards).
const qcGrid = document.querySelector("#quickCards .qc-grid");
for (const text of QUICK_CARDS) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.onclick = () => showText(text);
  qcGrid.append(b);
}
$("typeShow").onsubmit = (e) => {
  e.preventDefault();
  const text = $("typeShowText").value.trim();
  if (text) showText(text);
};

// ---------- conversation summary and ideas (Conversation help) ----------
const convo = new ConversationLog();
let convoDone = false;
function renderConvo() {
  const card = $("convSummary");
  const body = card.querySelector(".cs-body");
  $("convTitle").textContent = convoDone ? "Conversation summary" : "Conversation so far";
  if (!convo.lines.length) {
    body.replaceChildren(Object.assign(document.createElement("p"), { className: "hint", textContent: running ? "A short summary appears here once people start talking." : "Start listening to see a summary of the conversation here." }));
    card.querySelector(".cs-ideas").replaceChildren();
    card.querySelector(".cs-ideas-title").hidden = true;
    $("convWhen").textContent = "";
    return;
  }
  const sum = convo.summary(getSettings().name);
  $("convWhen").textContent = `${sum.minutes} min`;
  const rows = [];
  const row = (label, text) => {
    const p = document.createElement("p");
    p.className = "cs-row";
    p.append(Object.assign(document.createElement("b"), { textContent: label }), document.createTextNode(text));
    rows.push(p);
  };
  // "Topics" came up more than once; "Words that came up" is the honest fallback for short talks.
  if (sum.topics.length) row("Topics: ", sum.topics.join(", "));
  if (sum.words.length) row(sum.topics.length ? "Also mentioned: " : "Words that came up: ", sum.words.join(", "));
  if (!sum.topics.length && !sum.words.length) row("Topics: ", "not clear yet");
  if (sum.questions.length) row("Questions asked: ", sum.questions.map((q) => `“${q}”`).join(" "));
  const m = sum.moments;
  const bits = [];
  if (m.name) bits.push(m.name === 1 ? "your name once" : `your name ${m.name} times`);
  if (m.loud || m.spike || m.siren) bits.push("some loud moments");
  if (m.break) bits.push(m.break === 1 ? "1 break" : `${m.break} breaks`);
  if (bits.length) row("Also: ", bits.join(" · "));
  body.replaceChildren(...rows);
  // While talking: ideas to keep it going. After Stop: the summary only.
  const ideas = card.querySelector(".cs-ideas");
  card.querySelector(".cs-ideas-title").hidden = convoDone;
  ideas.replaceChildren(...(convoDone ? [] : convo.ideas(sum).map((t) => Object.assign(document.createElement("li"), { textContent: t }))));
}
renderConvo();

// Nothing from a conversation outlives the app: when it is closed or put away, the captions,
// summary and earlier tips are wiped from memory (they were never written to storage).
function forgetConversation() {
  convo.reset();
  convoDone = false;
  els.transcript.replaceChildren();
  els.feed.replaceChildren();
  captionLines = [];
  live.exprLog = [];
  renderConvo();
}
addEventListener("pagehide", () => { if (running) stopAll(); forgetConversation(); });
setPage("home");

// ---------- installable app: offline support ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// ---------- sound check: adjust to this phone's microphone ----------
const MIC_KEY = "grover.micOffset";
function getMicOffset() {
  try { return Number(localStorage.getItem(MIC_KEY)) || 0; } catch { return 0; }
}
function describeOffset(o) {
  const db = Math.round(Math.abs(o) * 60);
  if (db < 2) return "This phone hears like the standard. No change needed.";
  return `This phone records about ${db} dB ${o > 0 ? "quieter" : "louder"} than standard. Grover has adjusted.`;
}
const soundStatus = $("soundCheckStatus");
soundStatus.textContent = localStorage.getItem?.(MIC_KEY) != null ? describeOffset(getMicOffset()) : "Not done yet. Grover uses standard levels.";
async function runSoundCheck() {
  if (running) { soundStatus.textContent = "Press Stop first, then run the sound check."; return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (err) { soundStatus.textContent = explainMediaError(err).join(" "); return; }
  soundStatus.textContent = "Listening… keep the room quiet for 5 seconds.";
  const readings = [];
  const sensor = new AudioSensor(({ instant }) => readings.push(instant));
  sensor.start(stream);
  await new Promise((r) => setTimeout(r, 5000));
  sensor.stop();
  stream.getTracks().forEach((t) => t.stop());
  const offset = micOffsetFrom(readings.slice(10));
  if (offset == null) { soundStatus.textContent = "That room sounds too busy to measure. Try again somewhere quieter."; return; }
  try { localStorage.setItem(MIC_KEY, String(offset)); } catch {}
  soundStatus.textContent = describeOffset(offset);
}
$("btnSoundCheck").onclick = () => {
  if (!hasConsent()) { afterConsent = runSoundCheck; consentEl.hidden = false; $("btnConsentYes").focus(); return; }
  runSoundCheck();
};

// ---------- live understanding: where you are, and the people near you ----------
// Faces, bodies and objects are read on this phone by MediaPipe (perception.js); the setting
// is worked out from those plus sound (scene.js). The cards show when each was last updated,
// so it is always clear that Grover is working, and how fresh its reading is.
const live = { scene: null, sceneAt: 0, people: null, peopleAt: 0, exprHistory: [], exprLog: [] };
let perception = null, perceptionOn = false, sceneReader = new SceneReader();
const sceneCard = $("sceneCard"), sceneGuide = $("sceneGuide"), peopleCard = $("peopleCard"), liveStatus = $("liveStatus");

function ago(t) {
  if (!t) return "";
  const s = Math.round((Date.now() - t) / 1000);
  return s < 2 ? "updated just now" : s < 60 ? `updated ${s} s ago` : `updated ${Math.round(s / 60)} min ago`;
}

// Takes one reading (from the real camera, or from the demo) and updates scene and people.
function onPercept(p) {
  const now = Date.now();
  for (const f of p.faces ?? []) if (f.readable && f.expression) live.exprLog.push({ t: now, e: f.expression, look: Boolean(f.lookingAtYou) });
  live.exprLog = live.exprLog.filter((x) => now - x.t < 10000);
  sceneReader.update(p, { slowLevel: coach.slowLevel ?? env.level, colours: env.colours });
  // The user's own choice of setting wins for 10 minutes: they know where they are.
  const cur = live.override && Date.now() < live.override.until ? { ...SCENES[live.override.id], id: live.override.id, sure: "you chose this", why: [] } : sceneReader.current();
  if (p.objects || p.labels) { live.scene = cur; live.sceneAt = Date.now(); }
  if (p.faces || p.bodies) {
    const main = p.faces?.find((f) => f.readable);
    // Only show an expression once it has held for about a second, so it doesn't flicker.
    live.exprHistory = [...live.exprHistory, main?.expression ?? null].slice(-4);
    const counts = live.exprHistory.reduce((m, e) => ((m[e] = (m[e] ?? 0) + 1), m), {});
    const steady = Object.entries(counts).find(([e, n]) => e !== "null" && n >= 3)?.[0] ?? null;
    live.people = {
      // The object finder can miss people sitting close together; every face found is a person too.
      count: Math.max(p.objects?.person ?? live.people?.count ?? (p.bodies?.length || 0), p.faces?.length ?? 0),
      expression: steady,
      lookingAtYou: Boolean(main?.lookingAtYou),
      tooFar: (p.faces?.length ?? 0) > 0 && !main,
      body: [...new Set((p.bodies ?? []).flat())].filter((b) => b !== "facing"),
    };
    live.peopleAt = Date.now();
  }
  coach.onPerception?.(live);
  renderLive();
}

function renderLive() {
  const s = live.scene;
  sceneCard.querySelector('[data-time="scene"]').textContent = ago(live.sceneAt);
  sceneCard.querySelector('[data-time="scene"]').classList.toggle("fresh", Date.now() - live.sceneAt < 3000);
  sceneCard.classList.toggle("safety", Boolean(s?.safety));
  sceneCard.querySelector(".lc-emoji").textContent = s ? s.emoji : "📍";
  sceneCard.querySelector(".lc-text").innerHTML = "";
  // Honest about uncertainty: a weak guess is shown as "Not sure yet · maybe …", never as a fact.
  const unsure = s?.sure === "not sure";
  sceneCard.querySelector(".lc-emoji").textContent = s && !unsure ? s.emoji : "📍";
  sceneCard.querySelector(".lc-text").append(s && !unsure ? s.label : running || demoMode ? "Not sure yet" : "Starts when the camera is on");
  if (s) { const sm = document.createElement("small"); sm.textContent = unsure ? `maybe: ${s.label.toLowerCase()}` : s.sure; sceneCard.querySelector(".lc-text").append(sm); }
  sceneCard.querySelector(".lc-why").textContent = s?.why?.length ? `Because I notice: ${s.why.join(", ")}` : "";
  sceneGuide.querySelector(".sg-steps").replaceChildren(...(s?.guide ?? []).map((g) => Object.assign(document.createElement("li"), { textContent: g })));
  const say = sceneGuide.querySelector(".sg-say");
  say.hidden = !s?.say || !getSettings().suggest;
  say.querySelector("span").textContent = s?.say ? `“${s.say}”` : "";
  if (!s && !running) sceneGuide.hidden = true;

  const p = live.people;
  peopleCard.querySelector('[data-time="people"]').textContent = ago(live.peopleAt);
  peopleCard.querySelector('[data-time="people"]').classList.toggle("fresh", Date.now() - live.peopleAt < 3000);
  const chips = [];
  const chip = (emoji, text, muted) => { const c = document.createElement("span"); c.className = "chip" + (muted ? " muted" : ""); c.textContent = `${emoji} ${text}`.trim(); return c; };
  if (!p) chips.push(chip("", running ? "Looking…" : "Starts when the camera is on", true));
  else {
    chips.push(chip("👥", p.count === 0 ? "No one in view" : p.count === 1 ? "1 person" : `${p.count} people`));
    if (p.expression) chips.push(chip(EXPRESSIONS[p.expression].emoji, EXPRESSIONS[p.expression].label));
    else if (p.tooFar) chips.push(chip("🔍", "Faces too far to read", true));
    if (p.lookingAtYou) chips.push(chip("👀", "Looking at you"));
    for (const b of p.body) if (BODY[b]) chips.push(chip(BODY[b].emoji, BODY[b].label));
  }
  peopleCard.querySelector(".lc-chips").replaceChildren(...chips);
  renderExpressions();
  renderHome();

  // Is Grover working? Always say so at the top.
  const t = liveStatus.querySelector(".ls-text");
  liveStatus.classList.toggle("loading", perception?.status === "loading");
  // One short word up top; Home shows the details (microphone, camera, face reader).
  const status = !running ? "Paused" : demoMode ? "Demo" : perception?.status === "loading" ? "Getting ready" : "Live 🔒";
  if (t.textContent !== status) t.textContent = status;
  liveStatus.title = running ? "Listening. Everything is checked on this phone." : "Not listening";
}
setInterval(renderLive, 1000);

// "Not right? Choose where you are": a short visual list of settings.
const choices = sceneGuide.querySelector(".sg-choices");
for (const [id, s] of Object.entries(SCENES)) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = `${s.emoji} ${s.label}`;
  b.onclick = () => {
    live.override = { id, until: Date.now() + 10 * 60 * 1000 };
    sceneGuide.querySelector(".sg-fix").open = false;
    onPercept({ objects: {} });
  };
  choices.append(b);
}

sceneCard.onclick = () => {
  sceneGuide.hidden = !sceneGuide.hidden;
  sceneCard.setAttribute("aria-expanded", String(!sceneGuide.hidden));
};

// Start reading faces, bodies and the setting from the camera, if this profile uses them.
async function startPerception(video) {
  const s = getSettings();
  perceptionOn = s.camera && ["scene", "faces", "body"].some((c) => s.cues[c]);
  if (!perceptionOn) return;
  perception ??= new Perception((p) => { camOverlay.update(p); onPercept(p); });
  try { await perception.load(); } catch { showProblem("I couldn't load the face and body reader.", "Sound alerts still work. Check the internet connection and try again."); return; }
  if (running) perception.start(video, (faces) => camOverlay.track(faces));
}
function stopPerception() {
  perceptionOn = false;
  perception?.stop();
  sceneReader = new SceneReader();
  Object.assign(live, { scene: null, sceneAt: 0, people: null, peopleAt: 0, exprHistory: [], exprLog: [] });
  renderLive();
}
