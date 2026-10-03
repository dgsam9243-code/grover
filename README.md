# Grover

**A calm, discreet helper that notices what's going on around you and tells you only what matters.**

Grover listens and watches through a phone's microphone and camera. It tells the user about the few moments that really need their attention (their name, a question to them, a sudden or ongoing loud noise, someone arriving), describes the room in one plain line, and helps them calm down. The rest of the time it stays quiet.

*Status: working proof of concept (installable web app). Not a medical device.*

---

## The problem

Many people with neurological differences (autistic people, ADHD, sensory processing differences, auditory processing differences, anxiety) find busy social settings tiring. The hard part often isn't the conversation itself. It's the constant background effort:

- Did someone just say my name? Was that a question to me?
- Is this getting too loud? Is it okay that I need a break?
- What does "piece of cake" mean here?
- People are talking fast and I've lost the thread.

That effort builds up into stress and exhaustion, and often makes people avoid situations they would otherwise enjoy.

## What Grover does

| | |
|---|---|
| **Notices the moments that matter** | Your name, a question to you, a pause after a question, a sudden loud sound, a long loud period, lots of movement, someone arriving, people talking fast, a figure of speech |
| **Describes the room at a glance** | "Busy · 3 people nearby · Nothing needs you right now." |
| **Gives one short, exact phrase when useful** | "You could say: *Sorry, can you say that again?*" |
| **Sees expressions and body language** | "😊 Smiling · 👀 Looking at you · 👋 Waving": it describes what faces and bodies are doing, never claims to know feelings, and says "faces too far to read" rather than guess |
| **Understands the setting** | Party, restaurant or café, shop, street or bus stop, train or bus, car, police or emergency lights, concert, quiet place, home, outdoors, crowd. Each has a short "what usually happens here" guide and words to use. It only announces a setting when fairly sure (right 14 of 14 times on test footage) |
| **Notices overload triggers** | Sirens and alarms (including low-pitch fire alarms), sharp high-pitched sounds, and lots of flashing lights. Each comes with permission to cover your ears, look away or step out. Tested on real recordings: sirens and alarms found, music and traffic ignored |
| **Helps you calm down** | "I need a moment" opens a Calm space: it names the overload ("your brain has run out of space"), says it is not your fault, then offers 🌬️ Breathe, 🦶 Ground, or 🚪 Step away (full permission to leave, with words to say). Energy check-in on a green / yellow / red scale |
| **Stays discreet** | Vibration patterns, earbud voice that waits for a pause, a dim one-word screen mode with no app name and a neutral "Pause" button |
| **Sound check** | In Settings: 5 seconds in a quiet room adjusts Grover to this phone's microphone (phones differ by up to ±6 dB) |
| **Tuned on real footage** | Loud places are reported once per loud stretch, not nagged about. Walking with the phone isn't mistaken for "lots of movement". Sudden-sound alerts only fire for sounds that really get loud. See [SENSOR-TUNING.md](SENSOR-TUNING.md) |
| **Kind recap** | After Stop: "Session done: 12 minutes. 1 loud period · 3 questions · 1 break. You did well." Counts only, nothing saved |

### Support profiles

People need different things, so the user picks a **support profile** and then adjusts anything:

- **Social clarity:** plain explanations, name and question alerts, explains sayings.
- **Focus:** only the essentials (your name, a question, a sudden sound). Short and quick.
- **Sensory comfort:** early warnings for noise and crowds, calming tools first.
- **Listening support:** large live captions on the main screen, alerts for fast talking.
- **Custom:** everything adjustable.

Profiles describe kinds of support, not people. A profile can be shared as a short **setup code** (for example `GRV1.focus.er.n.b.0`), so a teacher or therapist can set Grover up once. The code never includes the user's name.

### Accessibility

- Text size: Normal, Large or Extra large.
- Every text colour passes WCAG AA (4.5:1) in light, dark and discreet modes. This is checked by `tools/contrast.js`.
- Full keyboard use. Dialogs keep focus inside and give it back when they close.
- Screen-reader friendly: the live "Right now" card announces each change once, without repeating.
- Respects "reduce motion".

### Design principles

Grover follows established practice in neurodivergence support. The full rubric is in [ITERATIONS.md](ITERATIONS.md).

- **Plain, literal language.** Short sentences, no idioms in Grover's own words.
- **One thing at a time.** One card, one button. Details are hidden until asked for.
- **Affirming, not corrective.** Tips are options. It never asks for eye contact or "acting normal". Breaks are always okay.
- **Discreet.** Other people shouldn't be able to tell.
- **Quiet by default.** A good helper speaks rarely, so that when it does, it matters.

## Who it's for

| User | How they'd use it |
|---|---|
| **Individuals** (teens and adults) | Their own phone and earbuds: at school, work, parties, shops, appointments |
| **Schools and special education** | A teacher or support worker sets up a profile with a student. It's a gentler alternative to a staff member hovering nearby. |
| **Occupational therapists, speech therapists, counsellors** | Configure a profile for a client, practise in sessions, and use it between sessions |
| **Workplaces** (disability and neurodiversity support) | A low-cost, private adjustment for meetings and open offices |
| **Families** | Help someone get through busy family events |

## Why it's different

- **Private by design.** Sound and video are checked on the device and never recorded or uploaded. See the [privacy note](public/privacy.html).
- **Discreet.** Vibration, earbud voice that waits for a pause, and a one-word dim screen.
- **Does a few things well.** It's not a chatbot or a social-skills course, and it doesn't coach every sentence.
- **Works on the phone people already have.** No special hardware, and it installs from the browser.

## Business model (options to test)

These are hypotheses to test with users and buyers, not decisions:

1. **Free core app** for individuals. The core features stay free.
2. **Grover for organisations:** schools, clinics and employers pay for setup tools (share a profile with a student or client), multi-device management and training.
3. **Professional tier:** therapists get client profile sharing and opt-in session summaries the user chooses to share.

Principles: never sell data, and never put safety or calming features behind a paywall.

## Limitations (honest)

- **Cues come from simple rules, not AI.** Grover can't yet read facial expressions, tone of voice or sarcasm. `public/js/ai.js` marks where a multimodal model would plug in, through a backend that holds the API key.
- **It doesn't know who is speaking.** Cues say "someone may…".
- **Speech-to-text uses the browser's service**, which may send audio to the browser's company. Everything else stays on the device.
- **Not yet tested with real users.** Thresholds and wording must be set with neurodivergent people, not guessed.
- **Not a medical device.** It doesn't diagnose or treat anything and can make mistakes.

---

## Run it

```bash
npm start
```

Then open http://localhost:5173 in **Chrome or Edge** (needed for live speech-to-text). Choose a profile on the welcome screen. To try it without a camera or mic, open **Settings → Play demo scenario**.

Check colour contrast after changing colours:

```bash
node tools/contrast.js
```

## Use it on a phone

Grover is an installable web app (PWA). It uses the phone's mic, camera (back camera by default), vibration and screen wake lock, and works offline once it has loaded.

Phones only allow mic and camera access over **HTTPS**. Plain `http://localhost` works only on the computer running the server. To try it on a phone, put the `public/` folder on any static HTTPS host (GitHub Pages, Netlify, Cloudflare Pages), open it in Chrome (Android) or Safari (iPhone), and choose **Add to Home Screen** or **Install app**.

Phone support:
- **Android Chrome:** supports everything, including vibration and live captions.
- **iPhone Safari:** has no vibration. Speech recognition depends on the iOS version.

## How it works

| Input | How | What it notices |
|---|---|---|
| Microphone | Web Audio API, 30 Hz, time-based smoothing | Loudness (once per loud stretch), sudden sounds that really get loud, a 4-second warm-up |
| Speech | Web Speech API | Live captions, talk pace, questions to you (including "How are you?"), your name, sayings, pauses after a question |
| Camera | 160×120 frames, shake-cancelled block comparison | Local movement (people), knowing when the phone itself is moving, light, faces (only with `FaceDetector`) |
| User | Mood check-in, "I need a moment" | Quiet mode and a breathing exercise |

## Layout

```
server.js                 zero-dependency static server
public/index.html         app shell: welcome, consent, main card, settings
public/privacy.html       privacy note
public/styles.css         low-stimulation theme (light/dark, discreet mode, reduced motion)
public/manifest.webmanifest, public/sw.js, public/icons/   installable app + offline
public/js/app.js          UI, settings, output (screen/vibrate/voice), demo runner
public/js/profiles.js     support profiles and cue types
public/js/coach.js        rules that turn signals into short cues
public/js/audio.js        loudness, sudden sounds, room calibration
public/js/vision.js       camera: movement, light, faces
public/js/speech.js       speech-to-text and talk pace
public/js/calm.js         breathing exercise
public/js/demo.js         scripted demo scene
public/js/ai.js           where an AI model would plug in (not implemented)
public/lab.html           sensor lab: runs the real detectors on openly licensed walking videos
tools/replay.mjs          replays recorded readings through every support profile
tools/motion-tune.mjs     compares movement rules offline
tools/day.mjs             replays a realistic 58-minute day through every profile
tools/gain-check.mjs      checks robustness to phone mics that record ±3–6 dB louder or quieter
SENSOR-TUNING.md          findings from tuning on real footage
public/js/perception.js   on-device face, body, object and scene readers (MediaPipe)
public/js/scene.js        works out the setting; social-narrative guides; emergency-light detector
tools/scene-eval.mjs      scores setting recognition on labelled footage
tools/contrast.js         WCAG contrast check for the colour tokens (node tools/contrast.js)
docs/user-testing.md      plan for testing with neurodivergent participants
docs/store-plan.md        plan for Google Play (TWA) and App Store (Capacitor)
ITERATIONS.md             design rubric, scores, roadmap and change log
```
