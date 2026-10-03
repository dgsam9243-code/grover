# Sensor tuning on real footage

Grover's sound and camera detectors were first tuned on a scripted demo. This log tunes them on **real, openly licensed footage** of people walking around: Wikimedia Commons clips, credited in `public/js/lab.js`.

**Tools**
- `public/lab.html`: runs the real sensors and coach on a clip and records readings every 250 ms.
- `tools/lab-data.json`: the recorded readings.
- `node tools/replay.mjs`: replays the readings through every support profile and counts the cues each one would show.

**Limits of this method (be honest about them)**
- Recorded video has been processed by the camera (auto-gain, compression), so absolute loudness differs from a phone mic held in a pocket. Relative measures (calibration, sudden jumps) carry over better than absolute thresholds.
- Speech cues (name, questions, captions, talk pace) **can't be tested this way**: browser speech recognition only listens to a real microphone.
- Face counting needs the browser's FaceDetector, which desktop Chrome doesn't enable by default, so "someone arrives" isn't exercised here.
- 11 clips, mostly European, Asian and US cities. It's a start, not a representative sample.

## What "good" means for each group

The same detector reading means different things to different people. These are the targets every change is checked against:

| Profile | Who it often helps | What they need from sound and camera |
|---|---|---|
| **Sensory comfort** | Sensory processing differences, anxiety, many autistic people | **Early** warning in genuinely loud or hectic places, sudden-sound warnings, and **zero** false alarms in calm places. False alarms raise anxiety. |
| **Social clarity** | Many autistic people | Awareness of the setting without overload: a "loud" or "busy" note only when it really is, so the cue stays meaningful. |
| **Focus** | ADHD | Only the essentials, fewer than about 1 environment cue per minute. Every unnecessary interruption costs focus. |
| **Listening support** | Auditory processing differences | Mostly quiet about the environment, but noise matters because it makes speech harder to follow. |

**For everyone:** walking with the phone must **not** look like "lots of movement". And the same calm street shouldn't produce different cues every time.

## Scenes

| Clip | Scene | Expected |
|---|---|---|
| riverside | quiet rural walk | no noise or movement cues for anyone |
| eyetracker | indoor walk, head-mounted camera | no cues (moving camera, calm building) |
| underpass, docklands | handheld city walks | at most a mild note; not "lots of movement" just from walking |
| xmas, beatbox | loud music, crowds | Sensory warns early; Social warns; Focus only on sudden sounds |
| subway, square, eatery | busy public places | "busy" is reasonable; loudness depends on the actual level |
| traffic | street traffic | sudden-sound alerts for loud vehicles are reasonable for Sensory |
| pedestrian | fixed camera, people walking | some movement, but not "lots" all the time |

## Log

### Round 0: baseline measurement (2026-10-03)
- Built the lab and recorded the first clips.
- **Bug found and fixed (lab):** a video element can only be connected to Web Audio once, so the lab now uses a fresh element per clip.
- **Sensor fix:** the audio sensor ran on `requestAnimationFrame`, so smoothing depended on screen refresh rate (30/60/120 Hz) and it stopped in background tabs. It's now a fixed ~30 Hz timer with time-based smoothing (about 0.2 s).
- **First readings:**
  - traffic (16 s): "busy" 86% of the time.
  - pedestrian, fixed camera (15 s): **"busy" 95% of the time, movement reading ≈ 0.97 (saturated).**
  - The movement detector can't tell calm from hectic, which matters for every group.

**Baseline across all 11 clips** (old detectors; `tools/lab-data-v0-baseline.json`):

| Clip | Loud % (calibrated / real) | Sudden sounds | "Busy" % |
|---|---|---|---|
| riverside (quiet walk) | silent clip | 0 | **98** |
| eyetracker (indoor walk) | 0 / 0 | 0 | **99** |
| underpass, docklands (walks) | 0 / 0 | 0 | **99 / 98** |
| xmas (market music) | **0 / 43** | 0 | 72 |
| beatbox (very loud) | **0 / 76** | 0 | 97 |
| eatery | 29 / 31 | 0 | 95 |
| subway crowd | 3 / 3 | 8 | 98 |
| square | 0 / 0 | 1 | 88 |
| traffic | 10 / 10 | 0 | 90 |
| pedestrian (fixed camera) | silent clip | 0 | 95 |

Replayed per profile:
- **Social clarity and Sensory comfort** got "lots of movement" in **every** clip, including the quiet riverside walk.
- **Social clarity, Focus and Listening support** were **never** told the beatbox or market was loud.
- **Listening support** got no environment information at all.

### Round 1: movement detector rewrite (done)
- **Problem (all groups):** the old detector counted pixels that changed by more than 28 grey levels, multiplied by 4. It saturated near 1.0 whenever the camera moved or the video was busy.
- **New `frameMotion()` in `vision.js`:**
  1. Find the small shift (±4 px) that best lines up consecutive frames, which cancels hand shake and panning.
  2. Measure change in 8×8 blocks after that shift.
  3. Count only blocks that change well above the frame's typical change (30th percentile × 2 + 6), so "everything changed a bit" (walking, flicker, compression) doesn't count.
  4. The result is the share of the scene moving on its own (0–1).
- **Synthetic check:** phone shake → 0.00; one person → 0.06; three people → 0.15; one person during shake → 0.07.
- **On real footage:** fixed-camera pedestrian area 0.40 (genuinely busy; about 40% of blocks have people moving). The indoor head-mounted walk is still about 0.41: walking **forward** makes the view expand outward, which a shift can't cancel. Re-recording with per-frame change quantiles so movement rules can be tuned offline.

### Round 2: loudness, from the data (done, replayed offline)
- **Problem:** calibration raised "loud" to the room's starting level, so starting Grover in a loud place erased the warning (market 43% → 0%, beatbox 76% → 0%) for Social, Focus and Listening. This reverses the round-12 design in `ITERATIONS.md`.
- **Fixes:**
  - "Loud" uses the profile's **absolute** level again. Calibration is now only a warm-up: the level starts at the room's level, with no sudden-sound alerts in the first 4 s.
  - **Tell once per stretch:** loud and busy cues fire once, then not again until it has been calmer for 30 s. This solves the original nagging worry without hiding information.
  - **Hysteresis:** once loud, it stays loud until 0.05 below the threshold, so music dips don't reset the 6 s timer.
  - **Listening support now gets the loud cue**, worded for them: "Noise makes speech harder to follow. Your captions can help."

**Result (baseline data replayed through each profile):**

| Scene | Social | Focus | Sensory | Listening |
|---|---|---|---|---|
| beatbox, xmas (loud music) | warned at ~8 s ✓ | — (essentials only) | warned ✓ | warned, captions tip ✓ |
| eatery, traffic, docklands city walk | — | — | warned (early setting) ✓ | — |
| quiet and indoor walks | — ✓ | — ✓ | — ✓ | — ✓ |

### Round 1, finished: telling "the phone is moving" apart from "the scene is busy"
- **Recorded per-frame data:** 20 quantiles of block change plus the camera shift, for all 11 clips (`tools/lab-data-v1.json`). `node tools/motion-tune.mjs` compares movement rules offline.
- **Finding:** with a moving camera, a phone can't reliably separate people moving from its own movement. Every rule that caught the moving-camera crowds (subway, market) also raised false alarms on calm walks.
- **Decision: prefer quiet over false alarms when the phone moves.**
  - The camera sensor tracks whether the phone itself is moving: frames shift, or even the calmest 15% of the frame changes, smoothed over about 2 s.
  - **Phone still:** sensitive rule (blocks changing more than 2× the 30th percentile + 6).
  - **Phone moving:** strict rule (more than 2× the median + 6).

| Clip | "Busy" % old | "Busy" % now | Expected |
|---|---|---|---|
| riverside walk | 98 | **0** | calm ✓ |
| indoor walk (head-mounted) | 99 | **4** | calm ✓ |
| underpass walk | 99 | **0** | calm ✓ |
| docklands walk | 98 | **4** | calm ✓ |
| pedestrian area, fixed camera | 95 | **86** | busy ✓ |
| eatery | 95 | 4 | some |
| subway crowd (moving camera) | 98 | 4 | busy ✗ (known limit) |
| xmas market (moving camera) | 72 | 0 | busy ✗ (known limit; the loudness cue still informs) |

- **Known limit:** a crowded place is only reported as "busy" when the phone is held still, for example on a table. On a real phone, the motion sensor (`DeviceMotion`) could confirm walking more reliably than the camera can. That can't be tested with footage, so it's left for real-device testing.

### Round 3: "sudden loud sound" only when it really gets loud
- **Problem (Focus, Sensory):** the subway clip produced 9 raw "sudden sound" events (2 alerts after cooldown, 2.8 per minute for Focus). Inspection showed jumps from about 0.2 to about 0.5: voices or doors near the mic that never became loud. Calling those "a sudden loud sound" is a false alarm.
- **Fix in `audio.js`:** a sudden jump is confirmed only if the smoothed level reaches 0.6 within 0.75 s.
- **Real footage:** subway 2 → **0** alerts, square 1 → **0**.
- **Synthetic check through the real sensor:**

| Sound | Alert? |
|---|---|
| Bang, 0.9 for 120 ms | ✓ |
| Bang, 0.9 for 300 ms | ✓ |
| Medium knock, 0.5 for 150 ms | ✓ |
| Moderate voice-like 400 ms burst | no ✓ |

- **Main app check:** the demo runs to the end-of-session summary with no new errors.

### Round 4: everyday places, and "noisy for a while" for Sensory comfort
- **New footage:** 7 openly licensed clips of places many neurodivergent people find hardest: indoor café, school lunch, classroom, Christmas shopping centre, food court, concert, plus a library as a quiet control. **18 clips in total** (`tools/lab-data.json`, with the new clips in `lab-data-v2-places.json`).

| Clip | Level median | p90 | Loud % |
|---|---|---|---|
| library | 0.20 | 0.22 | 0 |
| school lunch | 0.51 | 0.68 | 7 |
| café | 0.54 | 0.67 | 5 |
| food court | 0.57 | 0.61 | 0 |
| classroom | 0.61 | 0.71 | 7 |
| shopping centre | 0.67 | 0.70 | 1 |
| concert | 0.70 | 0.74 | 33 |

- **Problem:** the café, school lunch and food court gave **Sensory comfort no warning at all**. They are steadily noisy (0.5–0.67) but keep dipping below the early threshold, so the 6-second hold never completes. The camera can't help, because all were filmed by people moving.
- **Fix:**
  - The coach tracks an **8-second average** of the sound level.
  - For the **Early** loudness setting only (Sensory comfort), an average above **0.52** counts as "noisy for a while". It uses the same tell-once rule and the honest wording "It has been noisy for a while" instead of "loud".
  - Other profiles are unchanged, so Focus isn't interrupted.
- **8-second averages:**
  - Calm places: library 0.20, indoor walk 0.19, square 0.36, underpass 0.43, traffic 0.47 (max 0.49).
  - Noisy places: café 0.53, eatery 0.56, classroom 0.58, city walk 0.59.
  - The threshold separates them.
- **Result for Sensory comfort:**
  - **Now warned:** café (at 42 s), classroom (11 s), subway (39 s), eatery, city walk.
  - **Still nothing:** library, quiet walks, underpass, square.
  - **Borderline:** school lunch (a 26-second clip that only briefly crosses) and food court (15 s, too short for an 8-second average). Real lunch breaks last much longer.
- **Other profiles on the new clips:** concert and shopping centre → "loud" for Social, Sensory and Listening. Library → nothing for anyone. Focus → nothing (essentials only).
- **Main app check:** the demo in Sensory comfort shows every expected cue, with no new errors.
- **Next problem:** the school-lunch and food-court results are inconclusive because the clips are short. Longer cafeteria footage would settle it. Moving-camera crowds are still only covered by sound.

### Round 5: a whole day, not just short clips
- **New tool `tools/day.mjs`:** stitches the recorded readings into a realistic **58-minute day out** and replays it through every profile. Each clip loops for as long as someone would really stay:
  - 2 min walk
  - 10 min café
  - 3 min city walk
  - 15 min school lunch
  - 5 min subway
  - 10 min concert
  - 10 min library
  - 3 min walk home

  This tests what short clips can't: nagging over long stays, and noise that builds slowly.
- **Problem found:** **Sensory comfort was warned once (café, 2.6 min) and never again, not even at the concert (35 min).** The day never had 30 quiet seconds, so "tell once per loud stretch" treated everything from café to concert as one stretch. For sensory sensitivities, a missed concert warning is the worst miss.
- **Fix in `coach.js`:**
  - **"It is getting louder."** Grover warns again when the 8-second average rises **0.06** above the level the place settled at in the minute after the last warning.
  - **Regression caught and fixed:** a first version compared against the not-yet-settled average and repeated "getting louder" up to 3 times in a 54-second concert clip. The settling window removed that.

| Profile | Environment cues over the 58-minute day |
|---|---|
| Social clarity | 1: concert "loud" |
| Focus | **0** (essentials only) |
| Sensory comfort | **2:** café "loud", concert "**getting louder**" (was 1, missing the concert) |
| Listening support | 1: concert "loud", with the captions tip |

- **Short clips:** no profile gets a repeated loud cue on any single clip. Margin check: 0.04 adds an extra city-walk warning; 0.06 and 0.08 give the same clean result, so 0.06 was kept.
- **Main app check:** the Sensory comfort demo gives one loud warning, one sudden sound and one busy cue, with no errors.
- **Next problem:** Sensory comfort gets no new cue on moving from the café (0.53) into school lunch (0.44 average), which is correct because it's quieter. But this hasn't been checked with a **reminder for long stays**: should someone with sensory sensitivities get a gentle nudge after, say, 20 minutes in a noisy place? That's a question for real users (see `docs/user-testing.md`), not something to guess.

### Round 6: telling caption users when noise makes speech hard
- **Problem (Listening support):** difficulty following speech in background noise is a core part of auditory processing differences. But steadily noisy places (café 0.53, classroom 0.58 on the 8-second average) gave Listening support nothing, because only the Early setting had the noisy check.
- **Fix:**
  - Anyone with **large captions on** (Listening support by default, or Custom) also gets the noisy check, at **0.55** (`noisyLevel()` in `profiles.js`).
  - The message says why it matters to them: **"It is noisy here. Speech may be harder to follow."** with "Your captions can help."
  - It uses the same tell-once and getting-louder rules.
- **Short clips, Listening support:**
  - **Now warned:** classroom (21 s), shopping centre (22 s), subway (40 s), city walk.
  - Already warned: concert, market, beatbox.
  - **Still nothing:** library, quiet walks, underpass, square.
  - No repeated warnings on any clip.
- **58-minute day, Listening support:** 3 cues, well spaced:
  - café at 3.1 min: "noisy, speech harder"
  - subway at 30.6 min: "noisy, speech harder"
  - concert at 35.1 min: "getting louder"

  Other profiles are unchanged (Social 1, Focus 0, Sensory 2).
- **Main app check:** the Listening support demo shows captions and all expected cues, with no new errors.
- **Next problem:** every threshold is an absolute level, and real phones differ in mic sensitivity. Check how robust the results are to a phone that records a few dB louder or quieter.

### Round 7: robustness to different phone microphones
- **New tool `tools/gain-check.mjs`:** replays every clip as if recorded by a phone up to 6 dB quieter or louder. On Grover's 0–1 scale, 0.1 ≈ 6 dB. It reports false alarms in quiet places (library, indoor walk, square, underpass) and missed warnings in loud ones (concert, beatbox, market, shopping centre).
- **Problem (Social clarity):** a phone just **3 dB quieter** missed the concert, market and shopping centre. Their sound sits right at the 0.72 line (concert median about 0.70). Sensory and Listening were already protected by their 8-second noisy check.
- **Fixes:**
  1. The **Normal** setting also gets the 8-second backstop, at **0.60**.
  2. A replay of the day then showed Social getting "noisy" twice in 90 s on a street that goes quiet and noisy again. A tolerance band (tried first) made it worse (4 cues, plus a false alarm on a louder phone), so it was reverted. Instead, **a new loud or noisy stretch now needs 90 s of calm** first (was 30 s).

| Mic offset | Social: missed | Social: false alarms | Sensory and Listening |
|---|---|---|---|
| −6 dB | concert, market, mall | none | no misses, no false alarms |
| −3 dB | **none** (was 3 misses) | none | clean |
| 0 dB | none | none | clean |
| +3 dB | none | none | Sensory: underpass |
| +6 dB | none | underpass | Sensory, Listening: underpass |

**58-minute day, now:**

| Profile | Environment cues |
|---|---|
| Social clarity | 2: noisy street, concert "getting louder" |
| Focus | 0 |
| Sensory comfort | 2: café, concert |
| Listening support | 2: café ("noisy, speech harder"), concert |

- No single clip repeats a warning. The main app demo (Social clarity) shows a sudden sound, busy and loud cues, with no errors.
- **Remaining limit:** absolute thresholds can't absorb a full ±6 dB spread between phones. **Next step, on a real phone:** a one-time "sound check" in a quiet room to measure each phone's mic offset, or learning it from weeks of use (the quietest 20% of the user's own sessions). That needs real devices to test.

### Round 8: sound check, adjusting to each phone's microphone
- **Problem:** absolute thresholds can't absorb the ±6 dB spread between phone microphones (round 7).
- **Fix:**
  - New **Settings → Sound check**: hold the phone still in a quiet room for 5 seconds.
  - `micOffsetFrom()` in `audio.js` compares the median reading with **0.20**, the quiet-room level measured on the reference footage (library, calm indoor walk). It saves a correction, capped at ±9 dB, that the audio sensor adds from then on.
  - If the room reads too busy (median above 0.42), nothing is saved: "That room sounds too busy to measure. Try again somewhere quieter."
  - It respects the consent screen: if consent isn't given yet, the consent screen appears first, then the sound check runs.
- **Unit check:**

| Case | Result |
|---|---|
| Standard phone | 0 dB |
| Mic 6 dB quieter | +6 dB correction |
| Mic 6 dB louder | −6 dB correction |
| Mic 12 dB quieter | +9 dB (capped) |
| Noisy room | not saved |

- **Simulated phones** (`tools/gain-check.mjs`, with the library clip as the quiet room):
  - **Without** a sound check: 6 failures across ±6 dB (Social misses at −6 dB; underpass false alarms at +3/+6 dB).
  - **With** a sound check: **0 false alarms and 0 misses for every profile from −6 to +6 dB.**
  - Honest caveat: the library is both the calibration room and one of the quiet test scenes, so that one result is circular. The other three quiet scenes and all four loud scenes are independent.
- **Wording fix:** permission errors now end "then try again", which fits both Start and the sound check.
- **Main app check:** Settings shows the new group at 400 px; a blocked mic gives the plain message; the demo runs; no new errors.
- **Next problem:** the remaining open questions need **real phones and real people**. They can't be answered from footage:
  - speech cues (name, questions, captions, talk pace)
  - "someone arrives" (needs face detection)
  - a real mic in a pocket or hand
  - the phone's motion sensor to confirm walking
  - whether 0.20 is the right quiet-room reference on real devices
  - whether a long-stay reminder helps Sensory comfort users

  See `docs/user-testing.md`.

## Results now, per profile (all 11 clips replayed)

| Scene | Social clarity | Focus | Sensory comfort | Listening support |
|---|---|---|---|---|
| Quiet, indoor and underpass walks | nothing ✓ | nothing ✓ | nothing ✓ | nothing ✓ |
| City walk with traffic | nothing | nothing | "loud" once (early setting) | nothing |
| Busy pedestrian area (phone still) | "busy" ✓ | nothing ✓ | "busy" ✓ | nothing |
| Loud music (market, beatbox) | "loud" ✓ | nothing (essentials only) | "loud" ✓ | "loud" + captions tip ✓ |
| Eatery, traffic | nothing | nothing | "loud" (early) ✓ | nothing |
| Subway, square | nothing | nothing | nothing | nothing |
| **Highest environment-cue rate** | 2/min | **0/min** | 4/min (14 s clip, 1 cue) | 2/min |

**Before these rounds**, every walk gave Social and Sensory a false "lots of movement", and loud music reached only Sensory.

## Still not tested (needs a real phone and real people)
- Speech cues (name, questions, captions, pace): need a live microphone.
- "Someone arrives": needs `FaceDetector` (Android Chrome) or a face model.
- Absolute loudness on a real phone mic in a pocket or hand: recorded video is gain-adjusted.
- Phone motion sensor to confirm walking.
- Whether these cues feel right to the people they're for (see `docs/user-testing.md`).

---

# Perception: expressions, body language and settings

Grover reads faces, body language, objects and the type of place with Google's open **MediaPipe** models (`public/js/perception.js`), on the device. It combines those with sound into a setting (`public/js/scene.js`). Tested on **28 openly licensed clips** with known settings. `lab.html`'s `probe()` reads 8 frames per clip and saves a snapshot of each (`tools/frames/`) so readings can be checked by eye. `node tools/scene-eval.mjs` scores settings.

### Expressions (checked frame by frame)
- **Smiling at the camera:** correct (a smile score of 0.82 read as "smiling, looking at you").
- **Wrong labels found by eye, then fixed:**
  - A dim, tilted face read as **"tense"** (brows score 0.49).
  - A woman **talking** with expressive raised brows read as **"worried"** (0.54).
  - Fix: negative expressions now need strong evidence (tense brows > 0.6, worried brows > 0.65 plus a slight frown). **A wrong emotion label is worse than none.**
- **Small faces** (crowds, low-resolution video) aren't read. The panel says "Faces too far to read" instead of guessing. Faces must be at least 12% of the frame wide. *(Since replaced: faces are now found up to ~5 m away and read from a zoomed-in crop when at least 56 px wide. See "Face boxes" below.)*
- **Steady display:** an expression is only shown after it holds for 3 of the last 4 readings (about a second), so it doesn't flicker.
- **Wording:** expressions are described, not feelings ("😊 Smiling", not "happy"). A tense face gets "It may not be about you."

### Body language
- **Waving** was detected on the farewell-to-a-crowd clip ("waving + facing").
- **Sitting** was detected for seated train passengers.
- Crossed arms and pointing are implemented but rare in this footage, so they're **untested on real footage**.

### Settings: what the footage taught
| Finding | Fix |
|---|---|
| The classifier's labels are object names, not places; useful ones: candle, bakery, restaurant, streetcar, parking meter, traffic light | Evidence is weighted per setting and gathered over about 20 s |
| Shopping centre read as "restaurant" (malls look like food courts) | "Restaurant" label counts half without tables or tableware |
| Library and university building read as "restaurant" (tables and chairs) | Furniture only counts for restaurant when **food or drink** is seen |
| Grand library reading room reads as "church / vault / altar" | Those count toward **Quiet place (library, church…)**, the same social expectation |
| Old town square also reads "church / monastery" | Quiet-place clues count 30% when the sound isn't quiet |
| Loud classroom read as "concert" | Sound only supports a setting the camera already has evidence for |
| Birthday party read as "restaurant" | Cake plus candles weighted strongest (celebration); cake counts little for restaurant |
| Glass bus shelter read as "inside a train" | Inside-a-vehicle clues count half when cars or traffic lights are in view |
| Police dashcam: the car's own lights are never in view | Relabelled honestly as a street. The light detector was tested on synthetic frames instead |

**Flashing emergency lights** (synthetic frames):

| Case | Result |
|---|---|
| Alternating red/blue | detected ✓ |
| Pulsing red/blue | detected ✓ |
| Steady red stop sign | not detected ✓ |
| Red and blue poster (not flashing) | not detected ✓ |
| Plain street at night | not detected ✓ |

### Result
- **19 of 28 clips right or acceptable (68%).** Most of the rest are an honest "not sure yet" (dark subway, a busker, a diner booth, a classroom).
- **When Grover announces a setting out loud, it was right 14 of 14 times (100%)**, because it only announces when "fairly sure". Emergency lights are the exception: "maybe" is enough to announce them. Weaker guesses show on the card as "Not sure yet · maybe …".
- **The user can correct it:** "Not right? Choose where you are" overrides Grover for 10 minutes.

### Not yet tested
- Real phone cameras: footage here is filmed differently, often in low resolution.
- `.ogv` clips (café, concert, traffic stop, dialogue) won't play in current Chrome.
- A real police stop seen from the driver's seat.
- Face reading across skin tones, ages and lighting conditions. This must be checked with real users before release (see `docs/user-testing.md`).

---

# Stressful sounds and flashing lights

**Sound** (`audio.js`, `SoundEvents`): per frame, the strongest pitch, how much it stands out (*prominence*), how pure it is (*purity*: energy right at that pitch), and the share of energy above 4 kHz.
- **Siren:** a pure tone that glides (compared over 0.17 s, because pitch steps are about 47 Hz), or jumps between exactly two steady pitches.
- **Alarm:** one steady pitch beeping on and off (400–4000 Hz), or a steady tone at 2.5 kHz or above.
- **Shrill:** loud, with a lot of energy above 4 kHz.

**Light** (`vision.js`): brightness of a 16×12 copy of the picture, 10 times a second. **Lots of flashes** means at least 5 big jumps in 3 s. It's separate from the red/blue emergency-light check.

### What real recordings taught

| Version | Finding |
|---|---|
| 1 (high beeps only) | Missed a real fire alarm: it is a **low 516 Hz** pulsing sounder. Alarm is now "same pitch switching on and off", at any pitch from 400 to 4000 Hz |
| 2 (pitch sweeps) | **Accordion music read as a siren 643 times**, the beatboxer 39 times, traffic 43 times |
| 3 (must glide, frame to frame) | Music fixed, but **real sirens missed**: pitch is measured in about 47 Hz steps |
| 4 (glide over 0.17 s) | Sirens found again, but the accordion was back (597) |
| 5 (**purity > 0.5**) | Sirens 0.59–0.71, fire alarm 0.81, accordion **0.38**. Final: **fire alarm ✓, US police siren ✓, fire truck ✓, accordion, beatbox and traffic all quiet ✓**. UK two-tone ambulance missed ✗ |

**Synthetic tests** (through the real sensor, before the purity rule):
- detected: siren sweep, 3 kHz beeping alarm, hand dryer (shrill)
- ignored: a music chord, chatter

Those synthetic tones are pure, so the purity rule shouldn't change them, but they **haven't been re-run since**.

**Flashing lights:**
- The airport strobe clip gave some flashes (3–4 jumps in 3 s, below the "lots" line of 5).
- The Christmas market's twinkling lights gave "lots" 5 times.
- A daytime street with steady red traffic lights and brake lights gave none.
- Both police clips were filmed from **inside** the police car, so their lights weren't in view and couldn't be tested.
- The flashing-light threshold still needs testing on footage of real strobes or club lighting.

**Tips:** "A siren or alarm is sounding" (priority 3, with "Take a moment"), "There is a sharp, high-pitched sound" and "There are a lot of flashing lights here". They're adjustable as **Flashing lights** and **Sirens, alarms and sharp sounds**, and on by default for every profile; Focus gets only sirens and alarms.

---

# Face boxes: finding everyone at conversation distance

The camera check view draws a box on every face Grover finds, labelled with the expression in words (with the emoji beside it). Testing that view on real footage showed the face reader itself was missing most people.

**Footage:** 18 openly licensed clips of people from many backgrounds: Nigeria, India, Indonesia, Ghana, the Philippines, Afghanistan, Kenya, Okinawa (Japan), the US and Europe. They include dark and light skin, headscarves and headwraps, glasses, beards, stage make-up, teenagers and older people, close interviews and groups. 8 were added for this (credited in `public/js/lab.js`). `lab.html`'s `faceProbe(id)` reads frames with the old and the new reader and saves each one with the boxes drawn on (`tools/frames/faces-*.jpg`), so every result was checked by eye.

### What the footage showed

| Scene | Old reader | New reader |
|---|---|---|
| 4 dancers facing the camera, ~2 m (India) | 0 of 4 (1 in one frame) | **4 of 4, every frame** |
| 5 people posing in a row (Okinawa) | 0 | **5 of 5**, all "smiling · looking at you" (correct) |
| Train carriage (Philippines) | 0 | 2–4 per frame |
| Classroom (Ghana) | 0 | the student facing the camera, "smiling" (correct) |
| School canteen (Indonesia) | 0–1 | 1–2 per frame, including a large face the old one missed |
| Close interviews (Nigeria, India, US) | found | found (no change) |

- **Why the old reader failed:** the face landmarker finds faces with a *short-range* detector, built for selfie distance. At conversation distance (1–2.5 m) a face is only about 5–12% of a phone camera's picture, and it found almost none of them. Raising its 4-face limit made no difference.
- **Fix:** MediaPipe's **full-range** face detector finds the faces (no limit on how many). Each face big enough to read is then cut out, zoomed to 256 px and read by the face landmarker on its own. The camera picture is now requested at 1280×720, so faces at conversation distance have enough pixels.
- **Readable size:** at least **56 px** wide (about 2.5 m away at 1280×720). Faces of 62–69 px in a 640×480 café clip read sensibly.
- **Crop size:** no one zoom works for every face. If the face reader can't place the face in the first crop (1.8× the face), it tries 1.4×, then 2.4×. This recovered about half the faces the first crop missed. Faces still not read (mostly side-on or looking down) are labelled "Face" with no expression, not a guess.
- **Brightening dark frames:** tried on every clip, found **no** extra faces. Not used.

### "Looking at you"

- The old check (nose between the eye corners) said a man eating and glancing sideways at his plate was looking at you, and also an interviewee looking at the interviewer beside the camera.
- **Fix:** the head's turn (yaw) from the face model's 3D pose must be **under 20°** (people facing the camera: 0–14°; the man eating: 26–56°), and the eyes must not be looking down (score under **0.6**; facing the camera up to 0.49, looking at a phone 0.66–0.75).
- **Catch:** a broad smile narrows the eyes, which the model reads as looking down (0.71 for a dancer smiling straight at the camera). So the eyes-down rule is skipped when someone is smiling.

### Still missed

- Faces in full **side profile**, or **turned well away** and looking down.
- **Dim light:** at a dark party, a smiling woman about 10% of the frame wide wasn't found by either reader.
- **Tiny faces** far in the background (under ~40 px): by design, the focus is conversation distance.
- A face in a **painting or poster** can be found for a moment. The view only draws a face once it has been seen twice in a row (a quarter of a second).
- The camera check was tested with footage fed in as the camera, not yet on a real phone.

