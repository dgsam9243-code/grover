// The coaching brain. Turns raw signals (sound, speech, camera) into short,
// gentle cues. Rule-based for this proof of concept; see ai.js for where a
// multimodal model would plug in.

import { cueTypeOf } from "./profiles.js";
import { MANY_FLASHES } from "./vision.js";

const QUESTION_START = /^(who|what|when|where|why|how|do|does|did|are|is|was|were|can|could|would|will|should|have|has|any|you)\b/i;
// Share of the scene moving on its own (see frameMotion in vision.js) that counts as "a lot".
export const BUSY_MOTION = 0.25;

const SCENE_PHRASE = {
  party: "It looks like a party.", restaurant: "It looks like a restaurant or café.", shop: "It looks like a shop.",
  street: "It looks like a street or a bus stop.", transit: "It looks like you are on a train or bus.", car: "It looks like you are in a car.",
  emergency: "I see flashing emergency lights. It may be the police.", concert: "It looks like a concert or show.",
  quiet: "It looks like a quiet place.", home: "It looks like home.", outdoors: "You seem to be outdoors.", crowd: "There is a crowd here.",
};
// How much the 8-second average must rise above the settled level before "It is getting louder."
export const ESCALATE = 0.06;

const HOW_ARE_YOU = /\b(how are you|how're you|how have you been|how's it going|how is it going|how are things|what's up|how you doing)\b/i;

// Figures of speech that are easy to take literally.
const IDIOMS = [
  [/break a leg/i, "“Break a leg” means “good luck.”"],
  [/piece of cake/i, "“Piece of cake” means something is easy."],
  [/pulling (your|my) leg/i, "“Pulling your leg” means joking or teasing, not serious."],
  [/under the weather/i, "“Under the weather” means feeling a bit sick."],
  [/hit the (hay|sack)/i, "“Hit the hay” means going to sleep."],
  [/on the fence/i, "“On the fence” means they haven't decided yet."],
  [/cost(s)? an arm and a leg/i, "“Costs an arm and a leg” means very expensive."],
  [/spill the beans/i, "“Spill the beans” means tell a secret."],
  [/raining cats and dogs/i, "“Raining cats and dogs” means raining heavily."],
  [/no worries/i, "“No worries” means “it's fine, don't feel bad.”"],
  [/(it'?s|that'?s) not rocket science/i, "“Not rocket science” means it's not hard to understand."],
  [/beat around the bush/i, "“Beat around the bush” means avoid saying something directly."],
  [/hang in there/i, "“Hang in there” means keep going, it'll get better."],
  [/(i'?m|i am) all ears/i, "“All ears” means they are listening closely."],
  [/let'?s touch base/i, "“Touch base” means check in with each other later."],
  [/my bad/i, "“My bad” means “that was my mistake, sorry.”"],
];


export function analyzeUtterance(text, myName = "") {
  const t = text.trim();
  const tags = new Set();
  if (t.endsWith("?") || QUESTION_START.test(t)) tags.add("question");
  if (myName && new RegExp(`\\b${myName.replace(/[^\w]/g, "")}\\b`, "i").test(t)) tags.add("name");
  const idioms = IDIOMS.filter(([re]) => re.test(t)).map(([, explain]) => explain);
  return { tags, idioms };
}

export class Coach {
  constructor({ emit, getSettings }) {
    this.emit = emit;               // (cue) => void
    this.getSettings = getSettings; // () => { cues, loud, checkinMin, name, ... } from the support profile
    this.lastFired = {};
    this.counts = {}; // how often each kind of cue was shown, for the end-of-session summary
    this.mood = "okay";
    this.env = { level: 0, motion: 0, brightness: 0.5, faces: null, wpm: 0 };
    this.loudSince = null;
    this.busySince = null;
    this.fastSince = null;
    this.lastQuestionAt = null;
    this.episodes = {};
    this.lastSpeechAt = Date.now();
    this.startedAt = Date.now();
    this.lastCheckin = Date.now();
  }

  // cue: { id, kind, priority (1-3), msg, tip?, say?, cooldown (s) }
  // msg = what is happening, tip = optional advice, say = only the exact words the user could say.
  fire(cue) {
    const now = Date.now();
    const s = this.getSettings();
    // The support profile decides which kinds of cue are wanted.
    const type = cueTypeOf(cue.id);
    if (s.cues && type in s.cues && !s.cues[type]) return;
    if (this.mood === "overwhelmed" && cue.priority < 3) return; // keep it very quiet
    const cd = (cue.cooldown ?? 30) * 1000;
    if (this.lastFired[cue.id] && now - this.lastFired[cue.id] < cd) return;
    this.lastFired[cue.id] = now;
    this.counts[type] = (this.counts[type] ?? 0) + 1;
    this.emit(cue);
  }

  setMood(mood) {
    this.mood = mood;
    if (mood === "overwhelmed") {
      this.fire({ id: "mood-over", kind: "care", priority: 3, cooldown: 5,
        msg: "Thank you for telling me. You are not doing anything wrong. I will stay quiet unless something is important.",
        tip: "You have full permission to take a break or leave.",
        say: "I need a quick break. I'll be right back.", offerBreathing: true });
    } else if (mood === "calm") {
      this.fire({ id: "mood-calm", kind: "calm", priority: 1, cooldown: 5, msg: "Good. You are doing well." });
    } else {
      this.fire({ id: "mood-okay", kind: "calm", priority: 1, cooldown: 5, msg: "Okay. I am here if things change." });
    }
  }

  onUtterance(text) {
    this.lastSpeechAt = Date.now();
    const { tags, idioms } = analyzeUtterance(text, this.getSettings().name);
    const quote = text.length > 80 ? text.slice(0, 77) + "…" : text;

    if (tags.has("name")) {
      this.fire({ id: "name", kind: "heads-up", priority: 3, cooldown: 10,
        msg: "Someone said your name. They may want your attention.",
        tip: "Eye contact is not needed.",
        say: "Yes?" });
    }
    // "How are you?" is small talk, not a real question: it has a usual, short answer.
    const smallTalk = tags.has("question") && HOW_ARE_YOU.test(text);
    if (smallTalk) {
      this.lastQuestionAt = Date.now();
      this.fire({ id: "how-are-you", kind: "info", priority: 3, cooldown: 20,
        msg: "Someone asked how you are. It is a friendly greeting.",
        tip: "A short answer is normal.",
        say: "I'm good, thanks. How about you?" });
    } else if (tags.has("question")) {
      this.lastQuestionAt = Date.now();
      this.fire({ id: "question", kind: "info", priority: 3, cooldown: 8,
        msg: `Someone may have asked a question: “${quote}”`,
        tip: "Take your time. If you missed it, you can ask them to repeat it.",
        say: "Sorry, can you say that again?" });
    }
    idioms.forEach((explain) =>
      this.fire({ id: `idiom-${explain}`, kind: "info", priority: 2, cooldown: 60,
        msg: explain, tip: "This is a saying. It is not meant literally." }));
  }

  onEnvironment(patch) {
    Object.assign(this.env, patch);
    if (patch.spike) {
      this.fire({ id: "spike", kind: "heads-up", priority: 2, cooldown: 20,
        msg: "A sudden loud sound. It is probably nothing to worry about." });
    }
    // Stressful sounds (audio.js) and lots of light flashes (vision.js). Name the stressor,
    // say it is a normal reaction, and give permission to cover ears, look away or step out.
    if (patch.sound === "siren" || patch.sound === "alarm") {
      this.fire({ id: "siren", kind: "heads-up", priority: 3, cooldown: 60,
        msg: "A siren or alarm is sounding.",
        tip: "It is probably not about you. If it is a fire alarm, follow other people calmly to the exit. Covering your ears is okay.",
        offerBreathing: true });
    } else if (patch.sound === "shrill") {
      this.fire({ id: "shrill", kind: "heads-up", priority: 2, cooldown: 120,
        msg: "There is a sharp, high-pitched sound.", tip: "Covering your ears or using ear plugs is okay." });
    }
    if (patch.flashes != null && this.episode("flashing", patch.flashes >= MANY_FLASHES, Date.now(), 2000, 60000)) {
      this.fire({ id: "flashing", kind: "heads-up", priority: 2, cooldown: 0,
        msg: "There are a lot of flashing lights here.", tip: "Looking down or away can help. It is okay to step out.", offerBreathing: true });
    }
    if (patch.faces != null && this.prevFaces != null && patch.faces > this.prevFaces) {
      this.fire({ id: "faces-up", kind: "info", priority: 2, cooldown: 20,
        msg: patch.faces === 1 ? "Someone has come into view." : `Someone new is here. I can see ${patch.faces} people.` });
    }
    if (patch.faces != null) this.prevFaces = patch.faces;
  }

  // Tell once per stretch: a condition must hold for holdMs before a cue fires, and it won't
  // fire again until the condition has been clear for clearMs. Informs without nagging.
  episode(key, active, now, holdMs, clearMs = 30000) {
    const e = (this.episodes[key] ??= { since: null, clearSince: now, told: false });
    if (active) {
      e.since ??= now;
      e.clearSince = null;
    } else {
      e.since = null;
      e.clearSince ??= now;
      if (now - e.clearSince > clearMs) e.told = false;
    }
    if (active && !e.told && now - e.since > holdMs) {
      e.told = true;
      return true;
    }
    return false;
  }

// What the camera understands (perception.js + scene.js), turned into a few calm cues.
  onPerception(live) {
    const now = Date.now();
    const s = live.scene;
    if (s?.sure === "you chose this") this.sceneAnnounced = s.id; // the user already knows
    // Only announce a setting when fairly sure (emergency lights: maybe is enough). Weaker guesses stay on the card.
    if (s && (s.sure === "fairly sure" || (s.safety && s.sure === "maybe"))) {
      if (this.sceneCandidate !== s.id) { this.sceneCandidate = s.id; this.sceneSince = now; }
      // Announce a new setting once it has held: 8 s (2 s for emergency lights).
      if (s.id !== this.sceneAnnounced && now - this.sceneSince > (s.safety ? 2000 : 8000)) {
        this.sceneAnnounced = s.id;
        this.fire({ id: s.safety ? "safety" : "scene", kind: s.safety ? "care" : "info", priority: s.safety ? 3 : 2, cooldown: 0,
          msg: SCENE_PHRASE[s.id] ?? `It looks like: ${s.label}.`, tip: s.guide?.[0], say: s.say || undefined });
      }
    }
    const p = live.people;
    if (!p) return;
    if (p.body.includes("waving")) {
      this.fire({ id: "wave", kind: "heads-up", priority: 3, cooldown: 20,
        msg: "Someone is waving. They may be saying hello to you.", tip: "A wave back is enough.", say: "Hi!" });
    }
    if (p.expression === "smiling" && p.lookingAtYou) {
      this.fire({ id: "smile", kind: "calm", priority: 1, cooldown: 45,
        msg: "The person facing you is smiling.", tip: "That usually means they are being friendly." });
    }
    if ((p.expression === "tense" || p.expression === "frowning") && p.lookingAtYou) {
      this.fire({ id: "face-tense", kind: "care", priority: 1, cooldown: 60,
        msg: "The person facing you looks tense.", tip: "It may not be about you. Faces can look tense for many reasons.", say: "Is everything okay?" });
    }
  }

  // Called once per second for time-based rules.
  tick() {
    const now = Date.now();
    const { level, motion, wpm } = this.env;
    const { loud = 0.72, noisy, checkinMin = 4, captions } = this.getSettings();

    // Slow (≈8 s) average of the sound level: a place can be tiring without loud peaks.
    if (level != null) this.slowLevel = this.slowLevel == null ? level : this.slowLevel + (level - this.slowLevel) * (1 - Math.exp(-1 / 8));
    const noisyNow = noisy != null && this.slowLevel > noisy;
    // Once loud, it stays loud until clearly quieter, so brief dips in music or chatter don't reset it.
    const loudNow = level > (this.episodes.loud?.since != null ? loud - 0.05 : loud);
    // "Tell once" must still speak up when it gets clearly louder (a café, then a concert),
    // even if it never got quiet in between. Found by replaying a whole day: tools/day.mjs.
    // The reference is the level the place settles at in the minute after a warning,
    // so the average catching up isn't mistaken for things getting louder.
    if (this.episodes.loud?.told && now - this.loudToldTime < 60000) this.loudToldAt = Math.max(this.loudToldAt, this.slowLevel);
    const escalated = this.episodes.loud?.told && now - this.loudToldTime >= 60000 && this.slowLevel > this.loudToldAt + ESCALATE;
    if (escalated) this.episodes.loud.told = false;
    // A new noisy stretch needs 90 s of calm first: streets go quiet and noisy again within a minute.
    if (this.episode("loud", loudNow || noisyNow, now, 6000, 90000)) {
      this.loudToldAt = this.slowLevel ?? level;
      this.loudToldTime = now;
      this.fire({ id: "loud", kind: "heads-up", priority: 2, cooldown: 0,
        msg: escalated ? "It is getting louder."
          : loudNow ? "It has been loud for a while. That can be tiring."
          : captions ? "It is noisy here. Speech may be harder to follow."
          : "It has been noisy for a while. That can be tiring.",
        // Listening support: noise is what makes speech hard to follow.
        tip: captions ? "Noise makes speech harder to follow. Your captions can help." : "This place is a lot, not you. It is okay to step outside, use earplugs or leave.",
        say: "I'm going to step outside for a minute.", offerBreathing: true });
    }

    if (this.episode("busy", motion > BUSY_MOTION, now, 5000)) {
      this.fire({ id: "busy", kind: "heads-up", priority: 2, cooldown: 0,
        msg: "There is a lot of movement around you.",
        tip: "It can help to look at one person or one spot." });
    }

    this.fastSince = wpm >= 170 ? this.fastSince ?? now : null;
    if (this.fastSince && now - this.fastSince > 5000) {
      this.fire({ id: "pace", kind: "info", priority: 2, cooldown: 90,
        msg: "People are talking fast.",
        tip: "It is okay to ask them to slow down.",
        say: "Could you slow down a little, please?" });
    }

    if (this.lastQuestionAt && now - this.lastQuestionAt > 6000 && now - this.lastSpeechAt > 6000) {
      this.lastQuestionAt = null;
      this.fire({ id: "pause", kind: "care", priority: 2, cooldown: 60,
        msg: "There is a pause after the question. That is okay.",
        tip: "If you are not sure what to say, you can buy time.",
        say: "Hmm, let me think about that." });
    }

    if (now - this.lastCheckin > checkinMin * 60 * 1000) {
      this.lastCheckin = now;
      this.fire({ id: "checkin", kind: "calm", priority: 2, cooldown: 0,
        msg: "Check-in: you are doing well. Relax your shoulders. Take one slow breath." });
    }
  }
}
