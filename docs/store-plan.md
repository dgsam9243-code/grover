# Grover in the app stores: plan

Grover already works as an installable web app (PWA). Store versions add discoverability, trust, and access to native features (reliable vibration on iPhone, on-device speech). This is a **plan only**: both routes need build tools, which the proof of concept deliberately doesn't use yet.

**Before either store:** host `public/` on a real HTTPS domain (for example `grover.app`), and publish `privacy.html` at a stable URL. Both stores require a privacy policy link.

---

## Android: Trusted Web Activity (TWA)

The lightest route. A TWA is a thin Android app that opens the PWA full-screen in Chrome, so the same code keeps working.

1. Use Google's **Bubblewrap** CLI to generate the Android project from `manifest.webmanifest`.
2. Publish **Digital Asset Links** (`/.well-known/assetlinks.json`) on the domain so Android trusts the app and hides the browser bar.
3. Permissions (requested at runtime, after Grover's own consent screen): `RECORD_AUDIO`, `CAMERA`, `VIBRATE`, `WAKE_LOCK`.
4. Speech recognition, vibration and wake lock already work in Chrome on Android, so no native code is needed for v1.
5. Google Play Console has a one-time developer fee.

**Risk:** low. Most of the work is store listing and the Data safety form.

## iPhone: Capacitor wrapper

Apple is stricter, and a plain website wrapper risks rejection under the App Store's "minimum functionality" guideline. Grover needs to offer real native value:

1. Wrap `public/` with **Capacitor** (iOS project, WKWebView).
2. Replace web features that are weak or missing on iOS with native plugins:
   - **Haptics** plugin: iPhone Safari has no web vibration, so this unlocks discreet buzz cues on iPhone.
   - **Speech recognition**: use Apple's native speech framework through a plugin. Prefer **on-device recognition** where available, so audio stays on the phone. That would also improve the privacy story everywhere.
   - Keep screen awake through a plugin.
3. Add the required permission explanations to `Info.plist`, in Grover's plain voice:
   - Microphone: "Grover listens for loud sounds, your name and questions. Nothing is recorded."
   - Camera: "Grover notices movement and people nearby. Nothing is recorded."
   - Speech recognition: "Grover turns speech into captions so it can tell you about questions and your name."
4. Apple Developer Program has an annual fee.

**Risk:** medium. The extra native features help with review. Native speech is the main engineering task.

---

## Store listing (both stores)

- **Name:** Grover: calm social helper
- **Short description:** Notices what's going on around you and tells you only what matters. Discreet, private, calm.
- **Category:** Lifestyle or Productivity. **Avoid Medical**, because Grover is not a medical device and makes no medical claims.
- **Screenshots:** the welcome, the main card with a cue, the room status line, discreet mode, and Settings profiles. Use the demo scene so there are no real people in the screenshots.
- **Wording rules:** say "support tool". Never say "treats", "diagnoses" or "therapy". Describe kinds of support, not people ("Focus", not "for ADHD patients").

## Privacy answers

| Question | Answer, as built today |
|---|---|
| Data collected by the developer | **None.** No accounts, no analytics, no server. |
| Data shared with third parties | **None by Grover.** Note: web speech recognition on Android Chrome is provided by Google. Switching to on-device recognition would remove this. |
| Audio and camera | Processed on the device in real time, never stored or transmitted by Grover. |
| Data on device | Settings only (profile, name, choices). Cleared by uninstalling. |

On Google Play, fill in the **Data safety** form. On Apple, the **App Privacy** label. Re-check both if any analytics, accounts or cloud AI (see `ai.js`) are ever added, because those would change the answers.

## Age rating

- No user-generated content, chat, purchases or ads → general audiences.
- For under-18 users, keep Grover free of accounts and data collection. That avoids most children's-privacy obligations. Note in the listing that schools should set it up with families.

## Order of work

1. HTTPS hosting and a stable privacy URL.
2. Android TWA, then Play internal testing with the user-testing participants (see `user-testing.md`).
3. iOS Capacitor with native haptics and on-device speech, then TestFlight with participants.
4. Public release once the user testing success criteria are met.
