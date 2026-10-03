// Grover lab: run the real sensors and coach on a recorded video instead of the
// phone's camera and mic, record what they measure, and summarise it.
// For tuning thresholds on real-world footage. Not part of the app itself.

import { AudioSensor, loudThreshold } from "./audio.js";
import { VisionSensor } from "./vision.js";
import { Coach } from "./coach.js";
import { PROFILES, LOUD_LEVELS, noisyLevel, cueTypeOf } from "./profiles.js";
import { Perception, readExpression, readBody, lookingAtCamera, eyesDown } from "./perception.js";
import { emergencyColours } from "./scene.js";

// Faces, bodies, objects and scene labels, recorded per clip when perception is on.
let percepts = [];
const perception = new Perception((p) => percepts.push({ ...p, vt: +video.currentTime.toFixed(2) }));

// Openly licensed clips from Wikimedia Commons (see the credits shown on the page).
export const CLIPS = [
  { id: "eyetracker", kind: "walk (head-mounted)", title: "Eyetracker walk through CITEC Bielefeld", lic: "CC BY-SA 3.0 · Rüdiger Müller", url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Eyetracker_Walk_through_CITEC_Bielefeld.webm" },
  { id: "underpass", kind: "walk (handheld)", title: "A walk through the Rongankatu underpass, Tampere", lic: "CC BY 3.0 · Laura Vaara", url: "https://upload.wikimedia.org/wikipedia/commons/9/9a/A_Walk_Through_the_Rongankatu_Underpass%2C_Tampere.webm" },
  { id: "docklands", kind: "walk (handheld)", title: "Canada Water and Rafter Walk, London Docklands", lic: "CC BY-SA 4.0 · Acabashi", url: "https://upload.wikimedia.org/wikipedia/commons/8/86/Canada_Water_and_Rafter_Walk_in_Southwark%2C_London_Docklands.webm" },
  { id: "riverside", kind: "walk (quiet)", title: "Walking along a rural riverside path in Japan", lic: "CC BY 4.0 · Shironsilentpond", url: "https://upload.wikimedia.org/wikipedia/commons/e/e2/Walking_along_a_rural_riverside_path_in_Japan_June2025.webm" },
  { id: "xmas", kind: "crowd + music", title: "Christmas market in Ljubljana city centre (part 3)", lic: "CC BY 3.0 · barbara.grilc, Dušan Oblak", url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Christmas_market_in_Ljubljana_city_centre_-_part_3.webm" },
  { id: "subway", kind: "crowd", title: "Crowd in the subway station", lic: "CC BY-SA 3.0 · Nicholas Gemini", url: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Crowd_in_the_subway_station.webm" },
  { id: "square", kind: "square, people", title: "Knäppingsborg shopping square", lic: "CC BY 3.0 · Sounds of Changes", url: "https://upload.wikimedia.org/wikipedia/commons/0/00/Kn%C3%A4ppingsborg_shopping_square..webm" },
  { id: "eatery", kind: "café / eatery", title: "In a street eatery (Mazar-i-Sharif)", lic: "CC BY-SA 4.0 · Виктор Пинчук", url: "https://upload.wikimedia.org/wikipedia/commons/d/df/In_a_street_eatery_%28Mazar-I-Sharif%29.webm" },
  { id: "traffic", kind: "street traffic", title: "Traffic on a cobbled street (soundscape)", lic: "CC BY 3.0 · Sounds of Changes", url: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Traffic_on_a_cobbled_street_-_soundscape.webm" },
  { id: "beatbox", kind: "loud music", title: "Beatboxer at West 4th St subway station, NYC", lic: "CC BY-SA 4.0 · Subhashish Panigrahi", url: "https://upload.wikimedia.org/wikipedia/commons/7/7c/A_beatboxer_making_beats_at_West_Fourth_Street_%E2%80%93_Washington_Square_Subway_station%2C_New_York_City.webm" },
  { id: "pedestrian", kind: "fixed camera, people", title: "Pedestrian area (codec test)", lic: "CC0 · Taurus Media Technik", url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Video_Codec_Test_pedestrian_area_1080p25.y4m.webm" },
  // Everyday places many neurodivergent people find hardest (added in tuning round 4).
  { id: "cafe", kind: "café interior", title: "Interior of the Paragon Café, Katoomba", lic: "CC BY-SA 3.0 · Bluedawe", url: "https://upload.wikimedia.org/wikipedia/commons/7/7f/Interior_Paragon_Caf%C3%A9_Katoomba.ogv" },
  { id: "schoollunch", kind: "school lunch", title: "Lunch at the Astha Hannas Senior High School", lic: "CC0 · Jeromi Mikhael", url: "https://upload.wikimedia.org/wikipedia/commons/0/06/Lunch_at_the_Astha_Hannas_Senior_High_School.webm" },
  { id: "classroom", kind: "classroom", title: "Ghanaian students learning in a classroom", lic: "CC BY-SA 4.0 · Christian Yakubu", url: "https://upload.wikimedia.org/wikipedia/commons/a/af/Ghanaian_students_learning_in_a_dilapidated_classroom.webm" },
  { id: "mall", kind: "shopping centre", title: "Christmas shopping centre in Ljubljana", lic: "CC BY 3.0 · barbara.grilc, Dušan Oblak", url: "https://upload.wikimedia.org/wikipedia/commons/7/72/Christmas_shopping_Centre_in_Ljubljana.webm" },
  { id: "foodcourt", kind: "food court", title: "Food court, Gran Plaza Mazatlán", lic: "CC0 · DogeGamer2015MZT", url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Video_de_la_secci%C3%B3n_de_comida_r%C3%A1pida_en_la_Gran_Plaza_Mazatl%C3%A1n%2C_17_de_febrero_de_2018.webm" },
  { id: "concert", kind: "concert crowd", title: "Concert in Zenica (Saša Kovačević)", lic: "CC BY-SA 4.0 · Obsuser", url: "https://upload.wikimedia.org/wikipedia/commons/6/67/%D0%97%D0%B5%D0%BD%D0%B8%D1%86%D0%B0_%D0%A1%D0%B0%D1%88%D0%B0_%D0%9A%D0%BE%D0%B2%D0%B0%D1%87%D0%B5%D0%B2%D0%B8%D1%9B_02.ogv" },
  { id: "library", kind: "library (quiet)", title: "A Boston Public Library minute", lic: "CC BY 3.0 · Rob Van", url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/A_boston_public_library_minute.webm" },
  // Stressful sounds and flashing lights (added for overload testing).
  { id: "ambulance", kind: "siren", title: "Ambulance responding, Edinburgh", lic: "CC BY-SA 4.0", url: "https://upload.wikimedia.org/wikipedia/commons/d/d0/Ambulance_responding_sirens_in_Edinburgh_%282019%29.webm" },
  { id: "firetruck", kind: "siren", title: "A fire truck running the Q siren", lic: "CC BY-SA 4.0", url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/A_fire_truck_running_the_Q_siren.webm" },
  { id: "policesiren", kind: "siren (audio only)", title: "American police siren", lic: "Public domain", url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/American_police_siren_i.ogg" },
  { id: "firealarm1", kind: "fire alarm (audio only)", title: "NFPA fire alarm", lic: "Public domain", url: "https://upload.wikimedia.org/wikipedia/commons/d/db/NFPA_Fire_Alarm.ogg" },
  { id: "firealarm2", kind: "fire alarm (audio only)", title: "Activated fire alarm", lic: "CC BY-SA 3.0 au", url: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Activated_fire_alarm_%28sound%29.ogg" },
  { id: "policelights", kind: "police lights flashing", title: "Las Vegas police car, lights on (Code 3)", lic: "CC BY-SA 3.0", url: "https://upload.wikimedia.org/wikipedia/commons/1/14/Las_Vegas_Metropolitan_Police_Department_FPIU_Code_3.webm" },
  { id: "strobes", kind: "strobe lights", title: "Funchal Airport with strobes", lic: "CC BY 3.0", url: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Funchal_Airport_with_strobes.webm" },
  // Settings, faces and body language (added for perception testing).
  { id: "party1", kind: "party", truth: "party", title: "Birthday party, Maracay (Venezuela)", lic: "CC BY 4.0 · Bobjgalindo", url: "https://upload.wikimedia.org/wikipedia/commons/d/dd/Birthday_party_family_in_northern_Maracay%2C_Venezuela.webm" },
  { id: "party2", kind: "party", truth: "party", title: "18th birthday party", lic: "CC BY-SA 3.0 · Nicholas Gemini", url: "https://upload.wikimedia.org/wikipedia/commons/c/c2/18th_Birthday_Party.webm" },
  { id: "diner1", kind: "diner", truth: "restaurant", title: "Butter Cream Bakery & Diner", lic: "CC BY 4.0 · Missvain", url: "https://upload.wikimedia.org/wikipedia/commons/d/d6/Butter_Cream_Bakery_%26_Diner_-_February_2024_-_Sarah_Stierch.webm" },
  { id: "diner2", kind: "diner, person talking", truth: "restaurant", title: "Arianna Brown at the Moran Square Diner", lic: "CC BY 3.0 · DaTechGuyBlog", url: "https://upload.wikimedia.org/wikipedia/commons/6/61/Arianna_Brown_at_the_Moran_Square_Diner_Fitchburg_11-5-12.webm" },
  { id: "diner3", kind: "diner", truth: "restaurant", title: "Het Diner", lic: "CC BY-SA 3.0 · Punch Creative", url: "https://upload.wikimedia.org/wikipedia/commons/7/7e/Het_Diner.webm" },
  { id: "busstop1", kind: "bus stop", truth: "busstop", title: "Waiting for a bus", lic: "CC0 · Joshua Adela", url: "https://upload.wikimedia.org/wikipedia/commons/f/ff/Waiting_for_a_Bus.webm" },
  { id: "busstop2", kind: "bus stop", truth: "busstop", title: "Preobrazhenskaya Ploshchad bus stop", lic: "CC BY 4.0 · Zeliotvankaizer", url: "https://upload.wikimedia.org/wikipedia/commons/1/15/Preobrazhenskaya_Ploshchad_bus_stop_near_the_metro.webm" },
  { id: "busstop3", kind: "bus stop", truth: "busstop", title: "London bus pulls in", lic: "CC BY 3.0 · Christopher Parker", url: "https://upload.wikimedia.org/wikipedia/commons/1/17/London_Bus_pulls_in.webm" },
  { id: "onbus", kind: "riding a bus", truth: "bus", title: "SF Muni route 15 ride", lic: "CC BY-SA 4.0 · Evan0512", url: "https://upload.wikimedia.org/wikipedia/commons/c/c1/SF_Muni_5010_LFSe%2B_rte_15_ride.webm" },
  { id: "train", kind: "inside a train", truth: "train", title: "Inside the EDSA MRT 3 train", lic: "Public domain · Philippine Dept. of Transportation", url: "https://upload.wikimedia.org/wikipedia/commons/0/02/Philippines_President_Marcos_Jr_and_family_inside_the_EDSA_MRT_3_train_and_talks_to_passengers_-_1_June_2025.webm" },
  { id: "trafficstop", kind: "police traffic stop", truth: "policestop", title: "MPD traffic stop", lic: "CC BY-SA 3.0 · Thomas R Machnitzki", url: "https://upload.wikimedia.org/wikipedia/commons/8/80/MPD_traffic_stop_video.ogv" },
  { id: "dashcam", kind: "police dashcam, lights", truth: "street", title: "Pinellas County dashcam (own lights not in view)", lic: "Public domain · PoliceActivity", url: "https://upload.wikimedia.org/wikipedia/commons/8/81/Dashcam_of_Pinellas_County_Deputy_Wayne_Wagner_arresting_woman_on_25_March_2016.webm" },
  { id: "waving", kind: "waving, smiling, crowd", truth: "crowd", title: "Bernie Sanders waves farewell to a crowd", lic: "CC BY 3.0 · NextGenNoise", url: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Bernie_Sanders_waves_farewell_to_an_uproarious_crowd_where_he_grew_up_in_Brooklyn_New_York.webm" },
  { id: "laughing", kind: "laughing audience", truth: "crowd", title: "Ig Nobel favourite moment", lic: "CC BY 3.0 · Improbable Research", url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/%22We_Couldn%27t_Find_Our_Miss_Sweetie_Poo%22%E2%80%93_an_Ig_Nobel_Prize_favorite_moment.webm" },
  { id: "dialogue", kind: "two people talking", truth: "indoors", title: "Dialogue (Dominique Bovy, 1983)", lic: "CC BY-SA 3.0 fr · Rama", url: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Dialogue-Dominique_Bovy-1983-001-0001-0250.ogv" },
  // Faces of many kinds of people, close and far, alone and in groups (added for face-box testing).
  { id: "dzarma", kind: "interview, close face", truth: "indoors", title: "Interview with Dr. Grace Saleh Dzarma (Nigeria)", lic: "CC BY-SA 4.0 · Danjuma Anthony", url: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Interview_with_Dr._Grace_Saleh_Dzarma.webm" },
  { id: "baiga", kind: "interview, older man", truth: "outdoors", title: "Interview of Lakhan Lal of the Baiga tribe (India)", lic: "CC BY-SA 4.0 · Suyash Dwivedi", url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Interview_of_a_Baiga_tribe_named_Lakhan_Lal_in_Hindi_Language_by_Suyash_Dwivedi.webm" },
  { id: "sattriya", kind: "group interview, stage make-up", truth: "indoors", title: "Sattriya dancers interview, Wiki Loves Folklore photowalk (India)", lic: "CC BY-SA 4.0 · Suyash Dwivedi", url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Sattriya_Dancers_Interview_During_Wiki_Loves_Folklore_Photowalk.webm" },
  { id: "groupdisc", kind: "meeting room, many people", truth: "indoors", title: "Presentations of group discussions (CDC)", lic: "Public domain · CDC", url: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Presentations_of_Group_Discussions.webm" },
  { id: "rwic", kind: "interview, low resolution", truth: "indoors", title: "RWIC interview 3 (Nigeria)", lic: "CC BY-SA 4.0 · Onyinyeonuoha", url: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Rwicinterview3.webm" },
  { id: "hijab", kind: "interviews, headscarves", truth: "indoors", title: "Muslim women in Minnesota talk about harassment", lic: "CC BY 3.0 · 100ProofPolitics", url: "https://upload.wikimedia.org/wikipedia/commons/2/28/REAL_Story_behind_Breitbart_%26_Harassment_of_Hijab-Wearing_Muslim_Women_in_MN.webm" },
  { id: "ginoza", kind: "family visit, children", truth: "indoors", title: "7th Communication Battalion hosts a Ginoza family (Okinawa)", lic: "Public domain · U.S. Air Force, SSgt Magen Reeves", url: "https://upload.wikimedia.org/wikipedia/commons/f/f9/7th_Communication_Battalion_hosts_local_Ginoza_Family_%28991470%29.webm" },
  { id: "nairobi", kind: "panel and audience", truth: "indoors", title: "Can Teachers Help Teachers with AI, Wikimania 2025 Nairobi", lic: "CC BY-SA 4.0 · Wikimania 2025 East African Organising Team", url: "https://upload.wikimedia.org/wikipedia/commons/3/32/Can_Teachers_Help_Teachers_with_AI_%E2%80%93_Wikimania_2025_in_Nairobi%2C_Kenya.webm" },
];

// The true setting of the earlier clips, for scoring scene recognition.
const TRUTH = { cafe: "restaurant", eatery: "restaurant", foodcourt: "restaurant", schoollunch: "restaurant", classroom: "classroom",
  mall: "shop", concert: "concert", library: "quiet", subway: "train", xmas: "crowd", square: "street", traffic: "street",
  pedestrian: "street", underpass: "street", docklands: "street", riverside: "outdoors", eyetracker: "indoors", beatbox: "concert" };
for (const c of CLIPS) c.truth ??= TRUTH[c.id];

const $ = (id) => document.getElementById(id);
let video = $("labVideo");
const canvas = $("labCanvas");
let audio, vision, coach, ticker;
let samples = [], frames = [], cues = [], env = {}, baseline = null, profileId = "social";

const settingsFor = (id) => {
  const p = PROFILES[id];
  return { cues: p.cues, loud: LOUD_LEVELS[p.loud], noisy: noisyLevel(p.loud, p.captions), loudPreset: p.loud, captions: p.captions, checkinMin: p.checkinMin, name: "Sam" };
};

for (const c of CLIPS) $("clip").add(new Option(`${c.title} — ${c.kind}`, c.id));
for (const [id, p] of Object.entries(PROFILES)) $("profile").add(new Option(p.label, id));

function stopAll() {
  clearInterval(ticker);
  perception.stop();
  audio?.stop();
  vision?.stop();
  audio = vision = null;
}

export function run(clipId = $("clip").value, profile = $("profile").value) {
  stopAll();
  const clip = CLIPS.find((c) => c.id === clipId);
  profileId = profile;
  samples = []; frames = []; cues = []; env = {}; baseline = null; percepts = [];
  $("log").textContent = "";
  $("credit").textContent = `${clip.title}. ${clip.lic}. Wikimedia Commons.`;
  // A media element can only be wired into Web Audio once, so use a fresh one per clip.
  const fresh = video.cloneNode(false);
  fresh.removeAttribute("src");
  video.replaceWith(fresh);
  video = fresh;
  video.crossOrigin = "anonymous";
  video.src = clip.url;
  video.muted = false;
  video.volume = 1;
  return new Promise((resolve) => {
    video.onended = () => resolve(finish(clip));
    video.oncanplay = () => {
      video.oncanplay = null;
      const getSettings = () => settingsFor(profileId);
      coach = new Coach({
        emit: (cue) => {
          const t = video.currentTime.toFixed(1);
          cues.push({ t: +t, id: cue.id, type: cueTypeOf(cue.id), msg: cue.msg });
          $("log").textContent += `${t}s  ${cue.msg}\n`;
        },
        getSettings,
      });
      audio = new AudioSensor(function ({ level, spike, instant }) {
        env.level = level; env.instant = instant;
        if (spike) samples.push({ t: video.currentTime, spike: true });
        const ft = arguments[0].features; if (ft && Math.random() < 0.15) (window.__labFeat ??= []).push({ clip: clipId, t: +video.currentTime.toFixed(1), p: Math.round(ft.pitch), pr: Math.round(ft.prominence), hs: +ft.highShare.toFixed(2), pu: +ft.purity.toFixed(2), l: +level.toFixed(2) });
        if (arguments[0].sound) (window.__labSounds ??= []).push({ clip: clipId, t: +video.currentTime.toFixed(1), sound: arguments[0].sound });
        coach.onEnvironment({ level, spike });
      }, (b) => { baseline = b; });
      audio.startFromElement(video);
      vision = new VisionSensor(video, canvas, (v) => {
        if (v.frame?.q) frames.push({ t: +video.currentTime.toFixed(2), s: +v.frame.shift.toFixed(1), q: v.frame.q });
        if (v.flashes >= 3) (window.__labLights ??= []).push({ clip: clipId, t: +video.currentTime.toFixed(1), flashes: v.flashes, red: v.colours?.red, blue: v.colours?.blue });
        const { frame, ...rest } = v;
        Object.assign(env, rest);
        coach.onEnvironment(v);
      });
      vision.start();
      if (window.groverLab.perceive) perception.start(video);
      ticker = setInterval(() => {
        coach.tick();
        samples.push({ t: video.currentTime, level: env.level ?? 0, instant: env.instant ?? 0, motion: env.motion ?? 0, brightness: env.brightness ?? 0 });
        $("live").textContent = `t=${video.currentTime.toFixed(0)}s  level=${(env.level ?? 0).toFixed(2)}  motion=${(env.motion ?? 0).toFixed(2)}  baseline=${baseline?.toFixed(2) ?? "…"}`;
      }, 250);
      video.play().catch((e) => resolve({ clip: clip.id, error: String(e) }));
    };
    video.onerror = () => resolve({ clip: clip.id, error: "could not load video" });
  });
}

const pct = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };

function finish(clip) {
  stopAll();
  const rows = samples.filter((s) => !s.spike);
  const levels = rows.map((s) => s.level), motion = rows.map((s) => s.motion);
  const set = settingsFor(profileId);
  const loudAt = loudThreshold(set.loud);
  const result = {
    clip: clip.id, kind: clip.kind, truth: clip.truth, profile: profileId, seconds: Math.round(video.duration),
    audio: {
      baseline: +(baseline ?? 0).toFixed(3),
      median: +pct(levels, 0.5).toFixed(3), p90: +pct(levels, 0.9).toFixed(3), max: +Math.max(0, ...levels).toFixed(3),
      loudThreshold: +loudAt.toFixed(3),
      pctTimeLoud: Math.round((100 * levels.filter((l) => l > loudAt).length) / Math.max(1, levels.length)),
      spikes: samples.filter((s) => s.spike).length,
      silent: Math.max(0, ...levels) < 0.05,
    },
    video: {
      motionMedian: +pct(motion, 0.5).toFixed(3), motionP90: +pct(motion, 0.9).toFixed(3),
      pctTimeBusy: Math.round((100 * motion.filter((m) => m > 0.25).length) / Math.max(1, motion.length)),
    },
    cues: Object.entries(cues.reduce((m, c) => ((m[c.type] = (m[c.type] ?? 0) + 1), m), {})).map(([k, v]) => `${k}×${v}`).join(", ") || "none",
    cueTimes: cues.map((c) => `${c.t}s ${c.type}`),
    // Raw readings (every 250 ms) so every support profile can be replayed offline: tools/replay.mjs
    frames,
    percepts,
    series: samples.map((x) => x.spike ? { t: +x.t.toFixed(2), spike: 1 } : { t: +x.t.toFixed(2), l: +x.level.toFixed(3), m: +x.motion.toFixed(3) }),
  };
  $("result").textContent = JSON.stringify({ ...result, series: `${result.series.length} readings`, frames: `${frames.length} frames`, percepts: `${percepts.length} perception readings` }, null, 2);
  (window.__labResults ??= []).push(result);
  return result;
}

$("btnRun").onclick = () => run();
// Fast frame probe: jump to n points in a clip, run every model on each frame, and save a
// small snapshot so readings can be checked by eye. Much faster than playing in real time.
async function probe(id, n = 6, seekMs = 15000) {
  await perception.load();
  const clip = CLIPS.find((c) => c.id === id);
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto"; v.src = clip.url;
  const within = (ms, p) => Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error("timed out")), ms))]);
  await within(30000, new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error("load failed")); }));
  const shot = document.createElement("canvas");
  const rows = [];
  for (let k = 1; k <= n; k++) {
    v.currentTime = (v.duration * k) / (n + 1);
    try { await within(seekMs, new Promise((r) => (v.onseeked = r))); } catch { rows.push({ t: +v.currentTime.toFixed(1), error: "seek timed out" }); continue; }
    // Wait until the new frame is actually drawn, or frames come out empty.
    await within(5000, new Promise((r) => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => r()) : setTimeout(r, 300)))).catch(() => {});
    if (!v.videoHeight) { rows.push({ t: +v.currentTime.toFixed(1), error: "no frame" }); continue; }
    const ts = (probe.ts = Math.max((probe.ts ?? 0) + 50, performance.now()));
    const T = perception.tasks, row = { t: +v.currentTime.toFixed(1) };
    try {
      perception.faceTracks = [];
      row.faces = perception.readFaces(v, ts).map((f) => {
        const cats = f.shapes ?? [];
        const g = (n) => cats.find((c) => c.categoryName === n)?.score ?? 0;
        return { expr: f.readable && f.shapes ? readExpression(cats) : null, looking: f.lookingAtYou, size: +(f.box.w * 100).toFixed(0),
          raw: { smile: +((g("mouthSmileLeft") + g("mouthSmileRight")) / 2).toFixed(2), frown: +((g("mouthFrownLeft") + g("mouthFrownRight")) / 2).toFixed(2),
            browDown: +((g("browDownLeft") + g("browDownRight")) / 2).toFixed(2), browUp: +g("browInnerUp").toFixed(2), jaw: +g("jawOpen").toFixed(2),
            squint: +((g("eyeSquintLeft") + g("eyeSquintRight")) / 2).toFixed(2), cheek: +((g("cheekSquintLeft") + g("cheekSquintRight")) / 2).toFixed(2) } };
      });
      row.bodies = (T.pose.detectForVideo(v, ts).landmarks ?? []).map((lm) => readBody(lm, []));
      row.objects = {};
      for (const d of T.objects.detectForVideo(v, ts).detections ?? []) { const nm = d.categories?.[0]?.categoryName; if (nm) row.objects[nm] = (row.objects[nm] ?? 0) + 1; }
      row.labels = (T.scene.classifyForVideo(v, ts).classifications?.[0]?.categories ?? []).map((c) => `${c.categoryName} ${c.score.toFixed(2)}`);
    } catch (e) { row.error = String(e).slice(0, 150); }
    shot.width = 320; shot.height = Math.round((320 * v.videoHeight) / v.videoWidth);
    const sctx = shot.getContext("2d", { willReadFrequently: true });
    sctx.drawImage(v, 0, 0, shot.width, shot.height);
    const col = emergencyColours(sctx.getImageData(0, 0, shot.width, shot.height).data);
    row.colours = { red: +col.red.toFixed(4), blue: +col.blue.toFixed(4) };
    const blob = await new Promise((r) => shot.toBlob(r, "image/jpeg", 0.7));
    await fetch(`/lab-frame?name=${id}-${k}.jpg`, { method: "POST", body: blob });
    rows.push(row);
  }
  return { id, truth: clip.truth, kind: clip.kind, rows };
}

// Face probe: jump to n points in a clip and find faces two ways: with the app's face reader
// (perception.readFaces: full-range face finder, expressions read from zoomed-in crops) and
// with the old one (the face landmarker on the whole frame, up to 4 faces, selfie range only).
// Each frame is saved with boxes drawn on: green = new reader (with its expression),
// dashed orange = old reader. Count faces by eye against the people really visible.
let oldFace = null;
async function faceProbe(id, n = 6, seekMs = 15000) {
  await perception.load();
  if (!oldFace) {
    const mp = await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/vision_bundle.mjs");
    const files = await mp.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
    oldFace = await mp.FaceLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task", delegate: "CPU" }, runningMode: "VIDEO", numFaces: 4, outputFaceBlendshapes: true });
  }
  const clip = CLIPS.find((c) => c.id === id);
  const v = document.createElement("video");
  v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto"; v.src = clip.url;
  const within = (ms, p) => Promise.race([p, new Promise((_, j) => setTimeout(() => j(new Error("timed out")), ms))]);
  await within(30000, new Promise((r, j) => { v.onloadeddata = r; v.onerror = () => j(new Error("load failed")); }));
  const shot = document.createElement("canvas");
  const rows = [];
  for (let k = 1; k <= n; k++) {
    v.currentTime = (v.duration * k) / (n + 1);
    try { await within(seekMs, new Promise((r) => (v.onseeked = r))); } catch { rows.push({ k, error: "seek timed out" }); continue; }
    await within(5000, new Promise((r) => (v.requestVideoFrameCallback ? v.requestVideoFrameCallback(() => r()) : setTimeout(r, 300)))).catch(() => {});
    if (!v.videoHeight) { rows.push({ k, error: "no frame" }); continue; }
    const ts = (probe.ts = Math.max((probe.ts ?? 0) + 50, performance.now()));
    perception.faceTracks = [];
    const now = perception.readFaces(v, ts).map((f) => ({ ...f, expr: f.readable && f.shapes ? readExpression(f.shapes) : null }));
    const old = (oldFace.detectForVideo(v, ts).faceLandmarks ?? []).map((lm) => {
      const xs = lm.map((p) => p.x), ys = lm.map((p) => p.y);
      return { box: { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) } };
    });
    shot.width = 640; shot.height = Math.round((640 * v.videoHeight) / v.videoWidth);
    const g = shot.getContext("2d");
    g.drawImage(v, 0, 0, shot.width, shot.height);
    const W = shot.width, H = shot.height;
    g.setLineDash([3, 3]); g.strokeStyle = "#ff9f1c"; g.lineWidth = 1;
    for (const f of old) g.strokeRect(f.box.x * W - 3, f.box.y * H - 3, f.box.w * W + 6, f.box.h * H + 6);
    g.setLineDash([]); g.strokeStyle = "#4ade80"; g.lineWidth = 1.5; g.font = "500 11px system-ui";
    now.forEach((f, i) => {
      g.strokeRect(f.box.x * W, f.box.y * H, f.box.w * W, f.box.h * H);
      const label = `${i + 1} ${f.readable ? f.expr ?? "?" : "small"}${f.lookingAtYou ? " L" : ""}`;
      g.fillStyle = "rgba(0,0,0,.6)"; g.fillRect(f.box.x * W, f.box.y * H - 14, g.measureText(label).width + 6, 14);
      g.fillStyle = "#4ade80"; g.fillText(label, f.box.x * W + 3, f.box.y * H - 3);
    });
    const blob = await new Promise((r) => shot.toBlob(r, "image/jpeg", 0.8));
    await fetch(`/lab-frame?name=faces-${id}-${k}.jpg`, { method: "POST", body: blob });
    rows.push({ k, t: +v.currentTime.toFixed(1), old: old.length, now: now.length, readable: now.filter((f) => f.readable).length,
      px: now.map((f) => Math.round(f.box.w * v.videoWidth)), exprs: now.map((f) => (f.readable ? f.expr ?? "?" : "small")),
      down: now.map((f) => { if (!f.shapes) return null; const g = (n) => f.shapes.find((c) => c.categoryName === n)?.score ?? 0;
        return `${((g("eyeLookDownLeft") + g("eyeLookDownRight")) / 2).toFixed(2)} p${f.head?.pitch} y${f.head?.yaw}`; }), looking: now.map((f) => f.lookingAtYou) });
  }
  return { id, rows };
}

window.groverLab = { run, probe, faceProbe, CLIPS, perception, perceive: false };
