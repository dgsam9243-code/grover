// Support profiles: presets of which cues fire and how. They describe kinds of
// support, not people — the user picks one, then adjusts anything.

export const CUE_TYPES = [
  { id: "name", label: "Someone says my name" },
  { id: "question", label: "Someone asks me a question" },
  { id: "pause", label: "Reassurance when there's a pause" },
  { id: "idiom", label: "Explain sayings" },
  { id: "spike", label: "Sudden loud sounds" },
  { id: "loud", label: "Long loud periods" },
  { id: "busy", label: "Lots of movement" },
  { id: "arrival", label: "Someone arrives" },
  { id: "pace", label: "People talking fast" },
  { id: "checkin", label: "Regular calm check-ins" },
  { id: "scene", label: "Where I am (the setting)" },
  { id: "faces", label: "Facial expressions" },
  { id: "body", label: "Waving and gestures" },
  { id: "lights", label: "Flashing lights" },
  { id: "sounds", label: "Sirens, alarms and sharp sounds" },
];

// How loud counts as "loud" (0..1 relative level).
export const LOUD_LEVELS = { early: 0.6, normal: 0.72, late: 0.82 };
// "Early" also warns when a place stays noisy (8-second average), even without loud peaks:
// cafeterias, cafés and classrooms. Tuned on real footage, see SENSOR-TUNING.md round 4.
export const NOISY_LEVELS = { early: 0.52, normal: 0.6 };
// People using captions are trying to follow speech, and steady background noise is what
// makes that hard (auditory processing differences), so they hear about noise sooner too.
export const SPEECH_NOISY = 0.55;
export function noisyLevel(loudPreset, captions) {
  const levels = [NOISY_LEVELS[loudPreset], captions ? SPEECH_NOISY : undefined].filter((v) => v != null);
  return levels.length ? Math.min(...levels) : undefined;
}

const on = (...ids) => Object.fromEntries(CUE_TYPES.map((c) => [c.id, ids.includes(c.id)]));

export const PROFILES = {
  social: {
    label: "Social clarity",
    desc: "Explains what is happening in plain words. Tells you when someone says your name or asks you something, and explains sayings.",
    cues: on("name", "question", "pause", "idiom", "spike", "loud", "busy", "arrival", "checkin", "scene", "faces", "body", "lights", "sounds"),
    loud: "normal", output: "buzz", checkinMin: 4, captions: false,
  },
  focus: {
    label: "Focus",
    desc: "Only the most important things: your name, a question, a sudden sound. Short and quick.",
    cues: on("name", "question", "spike", "checkin", "body", "sounds"),
    loud: "normal", output: "buzz", checkinMin: 10, captions: false,
  },
  sensory: {
    label: "Sensory comfort",
    desc: "Warns you early about noise, sudden sounds and crowds, and offers calming tools.",
    cues: on("name", "spike", "loud", "busy", "arrival", "checkin", "scene", "lights", "sounds"),
    loud: "early", output: "buzz", checkinMin: 4, captions: false,
  },
  listening: {
    label: "Listening support",
    desc: "Large live captions on the main screen, plus alerts for questions and fast talking.",
    cues: on("name", "question", "pause", "idiom", "pace", "loud", "scene", "faces", "body", "lights", "sounds"),
    loud: "normal", output: "buzz", checkinMin: 6, captions: true,
  },
  custom: {
    label: "Custom",
    desc: "You choose exactly what I tell you about.",
    cues: on(...CUE_TYPES.map((c) => c.id)),
    loud: "normal", output: "buzz", checkinMin: 4, captions: false,
  },
};

export const DEFAULT_PROFILE = "social";

// Which cue type a coach cue id belongs to. Cues without a type (mood, errors) always show.
export function cueTypeOf(id) {
  if (id.startsWith("idiom-")) return "idiom";
  // "safety" (emergency lights) has no cue type, so no profile can switch it off.
  return { "how-are-you": "question", "faces-up": "arrival", wave: "body", smile: "faces", "face-tense": "faces", siren: "sounds", shrill: "sounds", flashing: "lights" }[id] ?? id;
}
