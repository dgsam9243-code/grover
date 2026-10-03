# Grover iteration log

Concept and goals stay fixed: live camera and mic in, gentle social-cue, setting-awareness and calming coaching out.
**Direction (updated by the user, 2026-10-02, round 5): simple and effective.** Do a few core things very well. No conversation-coaching features. Prefer removing and polishing over adding.
**Core job:** tell me simply what's going on around me, warn me about the few things that really matter (my name, a question to me, sudden or ongoing loudness, someone arriving), and help me stay calm, discreetly.
Each iteration picks one backlog item, makes it, checks it in the browser, scores it against the rubric, and logs it here.

## Roadmap (set by the user, 2026-10-02)

Work through the phases in order. Move to the next phase only when the current phase's exit check passes. "Simple and effective" applies in every phase.

| Phase | Goal | Exit check |
|---|---|---|
| **1. Benefit for people with neurological differences** *(done, round 12)* | **Support profiles** in Settings that the user can adjust, each a preset of which cues fire, thresholds and output style. Built **phone-first** as an installable web app (PWA) that uses the phone's mic, camera and vibration. | Every profile scores at least 1.5 on average across R1–R10; the PWA installs on a phone; the core flow works one-handed at 400px |
| **2. Business and application readiness** *(done, round 16)* | Privacy and data story, consent, onboarding, settings export, a clear pitch, and use cases (schools, workplaces, therapists). Wrapping it as a store app (e.g. Capacitor) is a later step that needs a build. | A privacy page, consent flow and onboarding exist; the README has the pitch and use cases |
| **3. Interface, accessibility and value** *(exit check met, round 19)* | WCAG 2.2 AA, screen-reader pass, text size, contrast, and testing the value claims against the rubric | Automated accessibility check is clean; manual keyboard and screen-reader pass done |

### Planned support profiles (Phase 1)

Profiles are presets, not labels for people. The user picks one or more, then adjusts each part. Wording in the app says "support profile" and uses neutral, affirming names.

| Profile | Emphasis | Typical preset |
|---|---|---|
| **Social clarity** (often helpful for autistic people) | Literal explanations, name and question alerts, explaining sayings, pause reassurance | Idioms on, questions on, sensory alerts medium |
| **Focus** (often helpful for ADHD) | Short, glanceable cues, a gentle refocus when someone says your name or asks a question, keeping track of time | Fewer cue types, buzz-first, check-in every 10 minutes |
| **Sensory comfort** (sensory processing differences, anxiety) | Early warnings for loudness, sudden sounds and crowds; calming tools first | Lower loudness threshold, breathing offered sooner, voice off by default |
| **Listening support** (auditory processing differences) | Large live captions, a talk-pace alert, "can you say that again" phrase | Captions on the main screen, pace alert on |
| **Custom** | Everything adjustable | User-set |

## Evidence-based rubric

Each criterion is scored 0 (missing or harmful), 1 (partial) or 2 (solid). The principles come from established practice in autism and neurodivergence support:
- the NCAEP evidence-based practices review (Steinbrenner et al., 2020): visual supports, social narratives and scripting, prompting with fading, self-management, technology-aided support, antecedent-based support
- plain-language and easy-read guidance
- neurodiversity-affirming research: the double empathy problem (Milton, 2012), and camouflaging/masking studies that link masking to exhaustion and poorer wellbeing

| # | Criterion | What "2" looks like |
|---|---|---|
| R1 | **Plain, literal language** | Short sentences (about 12 words or fewer), no idioms or sarcasm in Grover's own words, concrete wording |
| R2 | **Low cognitive load** | One thing at a time, quick to scan, history out of the way, nothing flashing |
| R3 | **Processing time and predictability** | Never rushes the user, gives time-buying phrases, keeps a consistent structure, doesn't surprise |
| R4 | **Affirming, not corrective** | Gives options, not rules. Never asks for eye contact, masking or stopping stimming. Treats misunderstandings as two-way. |
| R5 | **Discretion** | Others can't easily tell. Earbud and haptic output, a glanceable minimal screen, no attention-drawing UI |
| R6 | **Help at key moments** | At the few moments that matter (your name, a question to you, a pause), one short exact phrase. Not ongoing conversation coaching. |
| R7 | **Awareness and context** | A clear picture of the setting and the people, and why it matters ("it's loud, so you may feel tense") |
| R8 | **Self-regulation support** | Breaks, breathing, mood check-ins, a quiet mode the user controls |
| R9 | **Accuracy and trust** | Few false cues, hedged wording when unsure ("may"), the user can correct or mute cues |
| R10 | **Simplicity** | Few cue types, few controls, one obvious thing to look at. A new user understands the screen in 5 seconds. |

## Score history

| Iteration | R1 | R2 | R3 | R4 | R5 | R6 | R7 | R8 | R9 | R10 | Total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Baseline (proof of concept) | 1 | 0 | 1 | 1 | 0 | 1 | 1 | 2 | 1 | – | 8/18 |
| #1 Right now card | 1 | 2 | 1 | 1 | 0 | 1 | 1 | 2 | 1 | – | 10/18 |
| #2 Language audit | 2 | 2 | 2 | 2 | 0 | 1 | 1 | 2 | 2 | – | 14/18 |
| #3 Discreet mode | 2 | 2 | 2 | 2 | 1 | 1 | 1 | 2 | 2 | – | 15/18 |
| #4 Wait for a pause + small talk | 2 | 2 | 2 | 2 | 2 | 1 | 1 | 2 | 2 | – | 16/18 |
| #5 Re-scope: cut to core cues (R6 redefined, R10 added) | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 18/20 |
| #6 Support profiles | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 18/20 |
| #7 Installable phone app (PWA) | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 1 | 18/20 |
| #8 One-screen layout | 2 | 2 | 2 | 2 | 2 | 2 | 1 | 2 | 2 | 2 | 19/20 |
| #9 Calm status line | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #10 Listening captions | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #11 First-run profile picker | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #12 Room calibration | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #13 Consent + privacy page (Phase 2) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #14 README product section (Phase 2) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #15 Clear error states (Phase 2) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #16 Share a setup (Phase 2) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #17 Settings screen (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #18 Screen-reader + keyboard pass (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #19 WCAG contrast (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #20 Text size (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #21 Discreet polish (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #22 Session summary (Phase 3) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #23 README refresh | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #24 User testing plan (docs) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |
| #25 Store plan (docs) | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 2 | 20/20 |

**Phase 1 complete (round 12).** The exit check was met in round 8, and the high-value polish was finished in rounds 9–12: status line, captions, welcome and calibration. All criteria are at 2. **Phase 2 exit check met (round 14):** privacy page, consent flow, onboarding, and the README pitch and use cases are all done. **Decision:** finish the two high-value Phase 2 items, clear error states (done in round 15) and share a setup (backlog 1), then move to Phase 3. Session summary and the store plan carry over as optional.
**Phase 3 exit check met (round 19):** contrast passes AA in all three themes (script), keyboard ✓, screen-reader basics ✓. The remaining backlog is optional polish and value work (text size, discreet polish, session summary). A real VoiceOver or TalkBack session and testing with real users are the recommended next steps outside this loop.
**Phase 2 complete (round 16).** **Now in Phase 3: interface, accessibility and value.** Exit check: an accessibility check is clean (contrast ratios computed with a script, since no new dependencies are allowed), and a manual keyboard and screen-reader pass is done. The same rubric still applies, so no regressions are allowed. Phase 2 work is judged by its exit check: privacy page, consent flow, onboarding, and a pitch and use cases in the README.

## Backlog (Phase 3: value and readiness to test with real people)

The app work for all three phases is done. What's left is mostly about **proving value with real users** and getting ready to ship:

*Backlog is empty.* The app work and readiness docs are done. Next steps need things this loop can't do: real users (`docs/user-testing.md`), HTTPS hosting, and native build tools (`docs/store-plan.md`). Further loop rounds would be low-value polish, so the loop should stop here.
Dropped, because they don't fit the simple direction: conversation flow helper, phrase bank, extra small-talk scripts, per-cue feedback.
Dropped, because they don't fit the simple direction: conversation flow helper, phrase bank, extra small-talk scripts, per-cue feedback.

## Log

### #1 "Right now" focus card (2026-10-02)
- Added a large "Right now" panel at the top of the coaching side. It shows the newest cue. Older cues move into a smaller "Earlier" list.
- After 25 seconds with no new cues, it relaxes back to "All calm — nothing needs your attention."
- On phones, coaching now comes before the camera, and the camera tile is shorter.
- Checked: the demo runs, no console errors, dark mode at 400px, no sideways scrolling.

### #2 Language audit and cue structure (2026-10-02)
- **Separated advice from words to say.** Each cue now has `msg` (what is happening), an optional `tip` (advice) and an optional `say` (only the exact words, shown quoted under "You could say"). Before, the "Try saying:" box held advice like "Looking toward them and…", which is confusing if you read it literally.
- **No idioms in Grover's own wording.** Category labels changed: "Heads up" → "Notice", "Social cue" → "Conversation", "Take care" → "Care", "You're okay" → "Calm". The idiom explainer now leads with the literal meaning.
- **Affirming wording.** Removed nudges toward eye contact, nodding and smiling (masking pressure). Added "Eye contact is not needed." Waving is offered as an option. Messages were shortened to plain sentences.
- **Accuracy fix (R9).** "Good to see you" was being read as a goodbye, because the pattern matched "see you". Now it only matches "see you later/soon/around/tomorrow/next…". Tested with sample phrases in Node.
- Checked: the demo runs, no console errors, light mode at 400px, no sideways scrolling.

### #3 Discreet mode (2026-10-02)
- Added a **Discreet** toggle in the top bar (also in Settings, remembered between visits). It switches to a dim palette that is the same in light and dark, so the screen never lights up.
- Only the "Right now" card shows, with a **one- or two-word label** ("Question", "Hello", "Pause is okay") plus the exact phrase. The camera, meters, transcript and history are hidden.
- The mood buttons become unlabelled coloured dots (their names stay available to screen readers). Settings shows a legend.
- **Phone vibration rhythms per cue kind:** 2 short = conversation, 1 long = notice, 3 short = care, 1 tiny = calm. They only start after the user's first real tap, which browsers require.
- Spoken output in discreet mode is the short label plus the phrase, at 60% volume.
- Checked: the demo runs in discreet mode at 400px in light and dark, the full view still works after toggling off, no sideways scrolling, and no new console errors.
- Scores: R5 0→1. No regressions. R5 isn't 2 yet because of voice timing and readable labels (backlog items 1 and 6).

### #4 Don't talk over people, plus a small-talk script (2026-10-02)
- **Spoken tips wait for a pause.** Spoken tips are held until nobody has spoken for 1.5 seconds; live mode also counts partial captions as speech. Only the newest tip is kept, and anything older than 8 seconds is dropped instead of being read out as a backlog. The breathing exercise, which the user starts themselves, still speaks right away.
- **Measured** by recording when each tip would be spoken and when the demo "people" talk. Every spoken tip came 1.5 seconds or more after the last thing said, so nothing overlapped. Stale tips were dropped.
- The start message now says "Voice is on. Use earbuds so only you hear it. I wait for a pause before I speak."
- **Finding from the measurement (R6):** after "How are you doing?", Grover suggested "Sorry, can you say that again?", which is an unnatural reply to small talk. Added a small-talk rule: Grover explains that "How are you?" is usually a friendly greeting, not a request for details, and suggests "I'm good, thanks. How about you?" This is the usual answer plus asking it back, a turn-taking script. The duplicate "hello" cue is skipped in that case.
- Checked: the demo at 400px in light and dark, no sideways scrolling, and no new console errors (only the leftover vibration messages from round 3).
- Scores: R5 1→2. No regressions.

### #5 Re-scope to simple and effective: cut to core cues (2026-10-02)
- **Direction change from the user:** "easy and simple and effective"; the conversation-coaching style isn't the best play; better to execute a simple problem well. The conversation flow helper planned for this round was dropped before any code was written.
- **Removed cues:** greeting, goodbye, "someone may be sad", "someone sounds happy", thanks, and "it is dark". Also removed their detectors and short labels.
- **Kept:** your name, a question to you (including the "How are you?" answer), the pause after a question, sudden sound, ongoing loudness, lots of movement, someone arriving, the idiom explainer, mood and breathing, and the 4-minute check-in.
- "Someone arrived" no longer suggests saying "Hi". It just reports what happened.
- **Measured on the demo:** the "Right now" card changed 10 times in 66 seconds, down from about 16. Grover now stays quiet through "bad day", "congratulations" and "thanks".
- **Rubric updated:** R6 changed from "conversation support" to "help at key moments". Added R10 Simplicity. Totals are now out of 20.
- Checked: the demo at 400px in light and dark, no sideways scrolling, and no new console errors.

### #6 Support profiles (2026-10-02)
- **New `js/profiles.js` with 5 presets.** Social clarity, Focus, Sensory comfort, Listening support and Custom. Each preset sets which of 10 cue types fire, how early loudness is flagged, how cues are delivered, and how often check-ins come. App wording describes kinds of support, not people.
- **Settings now has:**
  - a **Support profile** picker with a plain one-line description
  - **How should I tell you?** (screen, + vibrate, + voice, or both)
  - **Adjust what I tell you about:** per-cue checkboxes and the loudness sensitivity. Changing any of them switches to Custom, and the choices are remembered.
- **Removed** the "Coaching amount" setting and the "Speak aloud" checkbox; profiles replace them. Every profile defaults to screen + vibrate, so voice is opt-in, which is more discreet by default.
- **`coach.js` reads its rules from the profile:** enabled cue types, the loudness threshold and the check-in interval. Added one cue for the Listening profile: "People are talking fast", with "Could you slow down a little, please?"
- **Measured** by running the demo script through each profile on a simulated clock. Number of cues: Focus 4, Listening 6, Sensory 7, Social 11, Custom 12. The profiles behave clearly differently on the same scene.
- Checked: picking a profile applies its preset, ticking a box switches to Custom, and settings survive a reload. The demo runs at 400px in light and dark, with no new console errors.
- **Scores unchanged at 18/20.** Profiles add choices, but the old verbosity and voice controls are gone and everything sits in Settings, so R10 holds at 1 rather than going down.

### #7 Installable phone app (PWA) (2026-10-02)
- **Install support:** added `manifest.webmanifest` (standalone, portrait, dark theme colour) and app icons at 180, 192 and 512 px. The icons are a calm sage ring, generated with Node built-ins, so no new dependencies. Added the iPhone home-screen meta tags.
- **Offline support:** added `sw.js`, which caches the app shell. It tries the network first, so updates appear straight away when online, and falls back to the cache offline.
- **Phone behaviour:**
  - **Screen wake lock** while listening, re-acquired when the app comes back to the foreground and released on Stop.
  - **Which camera** setting, defaulting to the **back camera (sees the room)**. Only the front camera is mirrored.
- `server.js` now serves `.webmanifest` and `.png` with the right content types.
- **README:** added "Use it on a phone". Phones need HTTPS for mic and camera, so deploy `public/` to any static HTTPS host and use "Add to Home Screen". Notes the differences between Android and iPhone.
- **Checked:** the service worker is active with scope `/`, all 16 shell files are cached, the manifest and icons are served with the right types, and the demo runs at 400px in light and dark with no new console errors. Not yet checked on a real phone; that needs an HTTPS deployment.
- **Scores unchanged at 18/20.** This is a platform step: it unlocks phone use but doesn't change the rubric criteria themselves.

### #8 One-screen layout (2026-10-02)
- **Main screen:** the main view is now just the mood check, the "Right now" card, **I need a moment**, and a quiet **Show details** button. The camera, meters, setting summary, captions and earlier tips sit behind Show details. It's closed by default and remembered between visits.
- **Phones:** "I need a moment" is pinned within thumb reach (sticky at the bottom, respecting the safe area).
- **Top bar:** down to **Start, Discreet and Settings**. "Demo scenario" moved into Settings as "Play demo scenario", and starting it closes Settings.
- **Measured at 400×820:** the page height equals the screen height (820px), so no scrolling. "I need a moment" ends at y=574, in the lower 70%. Details opens and closes, and the label switches between Show and Hide. Light and dark both fine, no sideways scrolling, no new console errors.
- **Scores:** R10 1→2, because a new user sees one card and one button. **19/20.** No regressions. Discreet mode still hides details, and the details button is hidden in discreet mode.
- **Phase 1 exit check met.** Staying in Phase 1 for backlog items 1–4 before Phase 2 (see the decision above).

### #9 Calm status line (2026-10-02)
- **Status line when idle:** with no cue showing, "Right now" describes the room in one plain line, updated every second. For example: **"Busy · 3 people nearby"** with "Nothing needs you right now." When it's over the profile's loudness threshold, it says "Loud …" with "Nothing needs you. Breaks are okay." This tells the user both the context and that it's okay.
- **Stopped state:** before starting, or after Stop, the card reads "Not listening right now. Press Start when you are ready." That replaces the misleading "All calm", which showed even when Grover wasn't listening. Stop now also clears the last tip from the card.
- **Room line rules:** sound is Quiet, Some noise, Busy or Loud; then the number of people when the camera can count them; then "Lots of movement" only when it's high. No numbers or jargon.
- **Measured:** in the Sensory profile, demo at about 31 seconds, the card showed "Busy · 3 people nearby / Nothing needs you right now." That matches the demo's sound level (0.6) and 3 faces. Before Start it showed "Not listening right now." Checked at 400px in light and dark, no new console errors.
- **Scores:** R7 1→2. The user now always has the room at a glance, with why it's fine. **20/20.** No regressions. The room line is muted in the idle style, so it doesn't compete with real cues.

### #10 Large live captions for Listening support (2026-10-02)
- **Captions on the main screen:** a large caption box (1.35rem) sits under "Right now". It shows the last two finished lines, plus the words being said now in a muted colour. It's only visible while listening, and only when captions are on.
- **Profiles:** each profile has a `captions` flag, on only for **Listening support**. There's also a checkbox under Adjust ("Large live captions on the main screen"). Changing it switches to Custom, like the other adjustments.
- **Listening support description** rewritten to lead with its main feature: "Large live captions on the main screen, plus alerts for questions and fast talking."
- **Plain-language fix (R1):** the "How are you?" cue was 16 words over 3 lines. It's now "Someone asked how you are. It is a friendly greeting." plus the tip "A short answer is normal."
- **Measured:** with Listening support plus the demo, the captions showed "Hey Sam, good to see you! How are you doing?" at about 9 seconds. Switching to Social clarity hid them, and Stop hid them. Checked at 400px in light and dark, with no sideways scrolling and no new console errors.
- **Scores:** 20/20, no regressions. Captions add one element to the main screen, but only in the profile that needs it, so R10 holds.

### #11 First-run profile picker (2026-10-02)
- **Welcome screen on first open:** a full-screen welcome with one choice. "Hi, I'm Grover. I notice what is happening around you and tell you about the few things that matter. The rest of the time I stay quiet." Then **"What would help most?"** with 4 large buttons (Social clarity, Focus, Sensory comfort, Listening support), each with its one-line description.
- **Under the buttons:** "You can change this any time in Settings", and an honest privacy line: sound and camera are checked on the device and nothing is recorded, but live captions may use the browser's speech service.
- **After picking:** the profile is applied and saved, the welcome is remembered so it never shows again, and focus moves to Start. Escape picks the default (Social clarity). The first choice gets keyboard focus when the welcome opens.
- **Fix found while checking:** the welcome's background was 97% opaque, so the main screen faintly showed through. It's now solid.
- **Measured:** after clearing storage, the welcome appears and fits one 400×820 screen with no sideways scrolling. A real tap on "Focus" set the profile to focus, saved it, and closed the welcome; it stayed closed after a reload. Light and dark both fine, no new console errors.
- **Scores:** 20/20, no regressions. Mainly strengthens R3 (predictability: the user knows what Grover will and won't do before it starts) and R10 (one choice, not a settings form).

### #12 Room calibration (2026-10-02)
- **Learns the room first:** for the first 4 seconds of a live session, Grover learns the room's usual sound level. It uses the median, so one door slam doesn't skew it. Meanwhile "Right now" shows "Listening to the room… This takes a few seconds." No sudden-sound alerts fire during calibration, and the level starts at the baseline instead of slowly rising from 0.
- **"Loud" now adapts to the room:** loud means the profile's threshold, raised to at least 0.12 above the room's usual level (capped at 0.92). This is in `audio.js` as `loudThreshold()`, used by both the coach and the status line.
- **Judgement call (R8, R4):** the **"Early" loudness setting (Sensory comfort) keeps using real loudness**, because for sensory overload a loud café really is too loud, even if it's normal for that café. Every other setting adapts.
- **Measured, using a synthetic tone in place of the mic:**
  - With a moderate hum, the baseline was 0.52 and the threshold stayed 0.72. No calibration-time spikes.
  - In a **noisy café** (level 0.776), the old logic would have flagged "Loud" constantly and fired "loud for a while" after 6 seconds. With calibration (baseline 0.775, threshold 0.895), Grover stays quiet.
  - Coach on a simulated clock: Normal setting → stays quiet; Early setting → warns "loud", as intended.
- Demo unaffected (it doesn't use the mic). Checked at 400px in light and dark, no new console errors.
- **Scores:** 20/20. R9 accuracy is strengthened: far fewer false "loud" cues in naturally noisy places.
- **Phase 1 complete.** Moving to Phase 2.

### #13 Consent screen and privacy page (2026-10-02, Phase 2)
- **Consent before the browser asks:** the first time the user presses Start, a plain screen appears titled **"Before I start listening"**, with four points:
  - what the mic and camera are used for
  - that it's checked on this device and nothing is recorded, saved or uploaded
  - the honest exception: live captions use the browser's speech service, which may send audio to the browser's company
  - "Grover is a support tool. It is not a medical device and can make mistakes."
- **Buttons:** **Allow and start** saves consent and starts. **Not now** saves nothing and returns focus to Start. Escape works as Not now.
- **New `privacy.html`:** the short version first, then what's used, what happens to it, the speech-to-text exception, the user's controls (Stop, camera off, revoking permissions, clearing data) and the not-a-medical-device statement. No contact details invented. It's linked from the consent screen, the welcome and Settings, and Settings also carries the not-a-medical-device note.
- **Offline cache:** the service worker cache moved to `grover-v2` and now includes `privacy.html`.
- **Measured at 400×820:**
  - Start opens the consent screen, which fits one screen with focus on "Allow and start".
  - A real tap on "Not now" closed it, with no consent stored and no session started.
  - "Allow and start" stored consent and started. In the preview, which blocks devices, the error was handled and shown.
  - The privacy page reads cleanly in dark mode, with no sideways scrolling and no new console errors.
- **Scores:** 20/20, no regressions. It adds one screen, but only once, before the first Start (R3 predictability: no surprise permission prompt).
- **Phase 2 exit check progress:** privacy page ✓, consent flow ✓, onboarding ✓ (round 11 welcome). Remaining: the README pitch and use cases.

### #14 Product section in the README (2026-10-02, Phase 2)
- **Rewrote README.md product-first.** One-line pitch, the problem (the constant background effort in busy social settings), what Grover does, support profiles, design principles (linked to the rubric), who it's for (individuals, schools and special education, therapists, workplaces, families), why it's different (private, discreet, focused, no new hardware), and a business model written as **hypotheses to test**.
- **Business model principles:** free core app, organisations pay for setup and management, never sell data, never paywall calming or safety features.
- **Honest limitations:** rule-based (not AI), doesn't know who is speaking, speech-to-text uses the browser's service, **not yet tested with real users**, not a medical device. No market statistics or claims that can't be checked.
- **Fixed outdated technical sections:** the demo now lives in Settings; the README covers profiles, calibration and the welcome; the file layout includes profiles, privacy, PWA files and ITERATIONS.md; and the old "suggests things to say" and "Try:" wording, which came from the dropped coaching direction, is gone.
- **Checked:** documentation only, no app code changed. Every file the README links to or names exists. No browser check needed.
- **Scores:** 20/20, no change to the app.
- **Phase 2 exit check met.**

### #15 Clear error states (2026-10-02, Phase 2)
- **Plain messages instead of error codes.** Device errors now show one plain sentence plus what to do next. They used to show the browser's message, for example "Permission denied".

  | Problem | What the user sees |
  |---|---|
  | Permission blocked | "I am not allowed to use the microphone yet." → "Allow the microphone in your browser or phone settings, then press Start again." |
  | No microphone | "I can't find a microphone on this device." → "Connect a microphone or headset…" |
  | Microphone busy | "Another app is using the microphone." → "Close the other app…" |
  | Anything else | "I couldn't start the microphone." → "Press Start to try again." |
  | Not on a secure link | "This link can't use the microphone." → "Open Grover from a secure (https) link, or from the installed app." |

- **Camera fallback:** if the camera is missing or busy but the mic works, Grover **carries on with sound only** instead of failing, and says so.
- **Notes stay visible.** The camera note and "Captions and name alerts don't work in this browser" are folded into the "I'm listening" message. That message turns into a Notice when there are notes. Before, these notes were pushed out of view by the greeting straight away; this was found while testing.
- **Measured** by replacing the browser's mic/camera request with versions that fail in each way. All four error messages came out as expected. A missing camera with a working mic started a session (live=true, two requests) and showed "I can't use the camera, so I am using sound only." The demo still works. Checked at 400px in light and dark, no new console errors.
- **Scores:** 20/20, no regressions. Strengthens R1 (plain language everywhere, including errors) and R9 (trust: Grover explains what isn't working).

### #16 Share a setup (2026-10-02, Phase 2)
- **New "Share a setup" section in Settings:** **Copy my setup code**, plus a box to **paste a setup code** and **Use this setup**. Lets a teacher, therapist or friend configure Grover once and share it, with no account and no server.
- **The code is short and readable:** `GRV1.<profile>.<cue bitmask>.<loudness>.<output>.<captions>`, for example `GRV1.focus.er.n.b.0`. Easy to text or read aloud. It **never includes the user's name**. Device-specific choices (camera, discreet mode) aren't included.
- **Applying a code:** if it exactly matches a named preset, it stays that preset (Focus). Any difference makes it **Custom**. Invalid codes say "That code doesn't look right. Check it and try again." and change nothing. If the clipboard isn't available, the code is shown and selected in the box so it can be copied by hand.
- **Measured:**
  - Focus preset → code → applied while on Social → became Focus with the identical settings.
  - Sensory with "sudden sounds" off and captions on → `GRV1.custom.kh.e.b.1` → applied while on Listening → **exactly the same settings** (profile, cues, loudness, output, captions), saved as Custom.
  - "hello world" was rejected, nothing changed.
  - Checked in dark at 400px with no sideways scrolling. Demo still works, no new console errors.
- **Scores:** 20/20, no regressions. The section is collapsed by default, so Settings doesn't get busier.
- **Phase 2 complete.** Moving to Phase 3. A layout issue was found while checking (Settings pushes the main card down, and the pinned button overlaps it when scrolled); it's now Phase 3 backlog item 1.

### #17 Settings as its own screen (2026-10-02, Phase 3)
- **A full-screen sheet:** Settings is now a full-screen sheet (`role="dialog"`). It no longer opens above the main card and pushes it down. It has a **sticky header with "Done"**, so Done stays reachable while scrolling.
- **Five labelled groups:** **Support profile** (picker, description, adjustments) · **How I tell you** (output, discreet mode, vibration legend) · **You** (name) · **Camera** · **Share and try** (share a setup, demo). Privacy and the not-a-medical-device note are at the bottom.
- **Keyboard:** opening Settings moves focus to Done. Done or Escape closes it and returns focus to the Settings button. The demo button still closes Settings before the scene starts.
- **Fix found while checking:** a script-made Escape keypress unlocked vibration, which caused 2 new "vibrate blocked" console errors. A real Escape press would do the same, because browsers don't count Escape for this. Now only trusted taps and non-Escape keys count. The same test then added no new errors.
- **Measured:** the sheet is fixed full screen at 400×820 with no sideways scrolling, and Done stays pinned while scrolling. Escape closes it and focus returns. Changing the profile still saves (focus). The demo from Settings closes the sheet and runs. Light and dark both fine.
- **Scores:** 20/20, no regressions. R2 and R10 improved in practice: the main screen is never pushed around, and settings are grouped into five plain sections.

### #18 Screen-reader and keyboard pass (2026-10-02, Phase 3)
- **Live region fix:** "Right now" is a live region and is now `aria-atomic`, so a new cue is read as one complete message. The idle room line was rewritten every second; it now only changes when the words change, so screen readers don't repeat "Busy · 3 people nearby" over and over.
- **Focus stays inside dialogs:** the welcome, consent, Settings and breathing dialogs keep keyboard focus inside while open. Tab and Shift+Tab wrap at the edges.
- **Breathing exercise:** opening it moves focus to "I'm ready". Closing it, by button or Escape, returns focus to wherever the user was (for example "I need a moment"). Escape now only acts when the exercise is actually open; it used to listen on the whole page.
- **Mood buttons** now report their state with `aria-pressed`, which also works for the colour dots in discreet mode, because their names stay available to screen readers.
- **Visible focus** added for links and the Settings expanders. Buttons, selects and inputs already had it.
- **Measured:**
  - Settings: Tab from the last control → Done; Shift+Tab from Done → the last control; Done → focus back on Settings.
  - Breathing: focus on "I'm ready"; Escape → closed, focus back on "I need a moment".
  - Mood: "okay" pressed, others not.
  - **Live-region text changes during a steady 6 seconds of the demo: 3, from a single tip-to-idle switch, then 0.** Before, the line was rewritten every second.
  - Dark mode at 400px, no new console errors.
- **Scores:** 20/20, no regressions. Phase 3 exit progress: keyboard ✓, screen-reader basics ✓ (code-level; a real VoiceOver or TalkBack session is still recommended). Remaining: the contrast check.

### #19 WCAG contrast check (2026-10-02, Phase 3)
- **New `tools/contrast.js`:** a Node script with no dependencies. It reads the colour tokens straight from `styles.css` for **light, dark and discreet**, computes WCAG contrast ratios for 17 text/background pairs per theme (51 total), and exits 1 if any pair fails, so it can run in CI later.
- **First run: 17 failures.**
  - Light: grey hint text 4.20–4.49:1 on tinted cards, green links 3.5:1, white on the green button 3.9:1.
  - Dark: **white on the light-green button 2.37:1**, the worst case.
  - Discreet: grey text 3.3–3.7:1.
- **Fixes:** all keep the calm palette.
  - Light: grey `#6b6f7a → #5a5e68`, green `#5b8a7a → #3f6e5f`.
  - Discreet: grey `#6c7078 → #8a8e96`, green `#5f8577 → #6f9a8a`. Still dim, now readable.
  - New `--on-accent` token: primary buttons use dark text in dark and discreet modes instead of hard-coded white.
- **Result: all 51 pairs pass** (≥ 4.5:1). Screenshots in light, dark and discreet at 400px show the same look and feel, with the Stop button now clearly readable in dark mode. No new console errors.
- **Scores:** 20/20, no regressions. **Phase 3 exit check met.**

### #20 Text size (2026-10-02, Phase 3)
- **New "Text size" setting** under Settings → How I tell you: **Normal / Large / Extra large** (100% / 115% / 130%). It's remembered on the device and isn't included in shared setup codes, because it's personal to the device.
- **How it works:** the body font was a fixed `16px`. It's now `1rem`, and every other size was already in rem, so one root setting scales the whole app evenly: cards, buttons, captions, Settings and dialogs.
- **Measured at Extra large, 400×820:** root 130%, the "Right now" message at 28px (from about 21.6px). The main screen still fits one screen with "I need a moment" visible. No sideways scrolling on the main screen or in Settings. The setting survives a reload. Light and dark both fine, no new console errors.
- **Scores:** 20/20, no regressions. Supports R1 and R2 for users who need bigger text, without layout breakage.

### #21 Discreet polish (2026-10-02, Phase 3)
- **No app name on screen:** in discreet mode, the "Grover" name is hidden. Only a small status dot remains in the top bar.
- **Neutral button label:** "I need a moment" becomes **"Pause"**, a neutral word that bystanders won't read into. The button works the same, and screen readers still hear the full meaning ("Pause: I need a moment"). Switching back to Full view restores the original label and removes the extra screen-reader label.
- **Measured:** with discreet on and the setting saved, after a reload the button reads "Pause" and the name is hidden. Toggling off restores "I need a moment", the name is shown, and `aria-label` is removed. Dark at 400px: the screen shows only the dots, the room line and "Pause". No new console errors.
- **Scores:** 20/20, no regressions. R5 discretion strengthened further.

### #22 End-of-session summary (2026-10-02, Phase 3)
- **A recap after Stop:** for sessions longer than 20 seconds, the "Right now" card shows a short, kind recap. For example: **"Session done: 1 minute."** with "1 loud period · 1 sudden sound · 2 questions · your name once · 1 break. You did well." It only lists counts that aren't zero. A session with nothing in it says "It was a calm session. You did well." In discreet mode the short label is "Done".
- **How it counts:** `coach.js` counts each cue type it actually shows, after profile filtering and cooldowns, so the summary matches what the user saw. Breaks are counted when "I need a moment"/"Pause" or "Overwhelmed" opens the breathing exercise. **Nothing is stored or sent**; the counts vanish with the session.
- **Not spoken** (priority 1): it's for looking back, not an alert.
- **Measured:**
  - Full demo with one break → "1 loud period · 1 sudden sound · 2 questions · your name once · 1 break", which matches the script exactly.
  - A 5-second session showed no summary ("Not listening right now").
  - A 22-second session gave "1 question · your name once".
  - Wording fix while checking: "your name 1 time" → "your name once".
  - Light and dark at 400px, no new console errors.
- **Scores:** 20/20, no regressions. Adds value through self-reflection (R8: self-management is an NCAEP evidence-based practice) without adding anything to the screen during use.

### #23 README refresh (2026-10-02)
- **"What Grover does":** added rows for **Adapts to the room** (calibration, with the Sensory comfort exception) and **Kind recap** (session summary). Updated **Stays discreet** to mention no app name and the "Pause" label.
- **Profiles section:** now mentions shareable **setup codes**, with an example and the fact that they never include a name.
- **New "Accessibility" section:** text size, WCAG AA in all three themes (with the script), keyboard and focus handling in dialogs, screen-reader-friendly live updates, and reduced motion.
- **Run section:** added the `node tools/contrast.js` command.
- **Checked:** documentation only. Re-ran the contrast script (all pairs pass) and confirmed `prefers-reduced-motion` handling exists, so every new README claim is backed by the code.
- **Scores:** 20/20, no app change.

### #24 User testing plan (2026-10-02, docs)
- **New `docs/user-testing.md`:** a short, ethical plan to test Grover **with** 5–8 neurodivergent participants per round. It covers:
  - **Recruitment:** adults first, a mix across profiles, recruited through neurodivergent-led groups, paid, with ethics approval where needed. Teens only with guardian consent plus the teen's own agreement.
  - **Accessible sessions:** quiet room, agenda in advance, breaks on request with a break card, choice of how to answer, a support person allowed, under 45 minutes.
  - **Plain-language consent**, with separate yes/no choices for recordings.
  - **7 tasks**, each mapped to a rubric criterion: profile choice, understanding a cue at a glance, finding the phrase, "I need a moment", discreet mode, turning off an alert, sharing a setup.
  - **Light measures:** task success, glance time, literal misreadings, false or annoying cues, a 1–5 calm rating, the SUS with plain wording, and "where would you use it?".
  - **Interview questions,** including "Did anything make you feel judged or corrected?", where the target is zero (R4).
  - **Optional 1-week field try,** with no data leaving the phone.
  - **Co-design:** keep 2–3 participants on as paid advisors.
  - **Analysis:** observed evidence overrides the self-scores in this log.
- **Success criteria:** most people understand a cue in under 3 seconds, no one feels judged, calm ratings hold or improve, and at least half name a real place they'd use it.
- **Checked:** documentation only, no app change. **Important note: every score in this log so far is the developer's self-assessment against the rubric; real-user testing is how they should be confirmed.**

### #25 App store plan (2026-10-02, docs)
- **New `docs/store-plan.md`:**
  - **Android via a Trusted Web Activity:** Bubblewrap, Digital Asset Links, runtime permissions, no native code needed for v1, low risk.
  - **iPhone via Capacitor:** to pass Apple's minimum-functionality bar, add real native value: a Haptics plugin (vibration cues on iPhone), native speech recognition that prefers on-device processing (better privacy too), and plain-voice permission text for `Info.plist`.
  - **Store listing:** name, short description, Lifestyle/Productivity category and **not Medical**, screenshots from the demo scene so no real people appear, and wording rules ("support tool", never "treats" or "diagnoses").
  - **Privacy answers** for the Data safety form and the App Privacy label, including the honest note about Google's web speech service and when the answers would change.
  - **Age rating notes** and an order of work tied to the user-testing plan.
- **Checked:** documentation only, no app change.
- **Backlog now empty → the loop stops** (see the note above the backlog).

### Sensor tuning on real footage (2026-10-03)
- Tuned the audio and video detectors on 11 openly licensed Wikimedia Commons clips of people walking, crowds, markets and traffic. Details in **SENSOR-TUNING.md**.
- **Reverses round 12's room calibration.** Raising "loud" to the room's level hid genuinely loud places from Social, Focus and Listening. "Loud" is now absolute, reported once per loud stretch.

### #26 Pages, conversation card, and phone-down design (2026-10-03)
- **Why:** user research and the team's own review: scripting what someone says can take their voice away, and a phone that has to be watched pulls attention out of the conversation.
- **Suggested words are now opt-in** (Settings → "Suggest words I could say", off by default). Every "You could say…" (Right now, Earlier, voice, setting guide, Step away) follows it. Grover describes what is happening; the person chooses their own words.
- **Pages instead of one long screen**, by swiping or a bottom tab bar (icon and a word on every tab):
  - **Home:** a big Start/Stop, a one-line room status, a ✓/! check for microphone, camera and face reader, and "You can put the phone down and talk. I'll buzz when something needs you."
  - **Me (My conversation style):** a card to show the other person, with name, an optional "about me", "please know" and "what helps me". A full-screen "Show" mode in big letters.
  - **Setting:** place, people and body language, expressions as percentages over the last 10 seconds (described as expressions, not feelings), and the room meters.
  - **Camera:** the whole picture with face boxes, labelled as a check ("You don't need to watch it while you talk"). Drawing stops when the page is out of view.
  - **Help:** Right now, a **conversation summary** with **ideas to keep it going**, "Show a message" (communication cards and type-to-show), captions, what was heard, and earlier tips.
  - **Calm:** the energy check-in, plus Breathe, **Press**, Ground (5-4-3-2-1) and Step away, "Show the other person what is happening", and a short list of sensory tools.
- **First-open setup:** 5 short, optional steps: name, about me (common conditions or your own), how I talk and listen (pick several or add your own), support profile, then a preview of the card.
- **Conversation differences** (21), each pairing "please know" with "what helps". Choosing a condition adds its tips, unless a chosen difference already says the same thing.
- **Phone down by design:** the newest cue shows as one line above the tabs for 12 s, then the screen goes still. The top status is one word.
- **Conversation data is never kept:** the summary is built on the phone from captions (keywords, questions, moments, no AI service), lives in memory only, and is wiped on Start and when the app closes. Only the conversation card is stored, and it has a two-tap delete.
- **Sources** for the conversation differences, tips and coping strategies:
  - National Autistic Society, [accessible services](https://www.autism.org.uk/what-we-do/autism-know-how/autism-accreditation/autism-friendly-award/guides-and-resources/accessible-service); [SF.gov tips](https://www.sf.gov/information--tips-communicating-people-autism-spectrum); Reframing Autism, [communicating respectfully](https://reframingautism.org.au/how-to-communicate-effectively-and-respectfully-with-autistic-individuals/) and [communication differences](https://reframingautism.org.au/autistic-communication-differences-a-primer/)
  - STAMMA, [in conversation with someone who stammers](https://stamma.org/about-stammering/conversation-someone-stammers)
  - Selective mutism in adults ([Prosper Health](https://www.prosperhealth.io/blog/selective-mutism-in-adults)): alternatives to speech, no pressure to talk
  - Auditory processing ([NHS Scotland](https://www.acquiredbraininjury-education.scot.nhs.uk/impact-of-abi/communication-problems/auditory-processing-disorder/how-to-help-the-person-with-auditory-processing-disorder/)): face the person, short chunks, rephrase, less noise
  - Workplace accommodations for autism and AuDHD ([AbsenceSoft](https://absencesoft.com/resources/what-do-accommodations-for-autism-and-audhd-look-like-a-practical-guide-for-hr/)): processing time, written follow-ups
  - Sensory overload coping ([ADHD & Autism Clinic](https://adhdandautismclinic.co.uk/understanding-and-managing-sensory-overload/), [Prosper Health](https://www.prosperhealth.io/blog/how-to-deal-with-sensory-overload-in-autistic-adults)): paced breathing with a long breath out, pressure (proprioceptive input), 5-4-3-2-1 grounding, headphones, stimming, a quiet space
- **Checked in the browser** (phone size): setup end to end, card with no repeated lines, every page in the demo, the summary after Stop, big-letters view, the camera page on real footage, and discreet mode with extra-large text (no sideways scrolling).
- **Bugs found and fixed while testing:** Enter on the name step selected the first condition; repeated lines on the card; a too-wide top bar shifted every page; clumsy idea wording.
- **Needs real people:** whether the card's wording feels right to the people it describes, and whether the pages really let people keep their eyes on the conversation.
