// Placeholder for the "smart" layer.
//
// The rule-based coach catches obvious cues (questions, greetings, loudness).
// The real product would periodically send a snapshot frame + recent
// transcript to a multimodal model (e.g. Claude via a small backend that
// holds the API key — never put keys in the browser) and ask for:
//   - facial expression / body language read ("they look confused", "they're smiling")
//   - turn-taking hints ("they've paused — it's your turn to speak")
//   - setting description ("a busy café, 6–8 people, music playing")
//   - tone / sarcasm detection that keyword rules can't catch
//
// Expected return shape, so coach.js can render it like any other cue:
//   [{ id, kind: "info" | "heads-up" | "care" | "calm", priority: 1-3, msg, tip?, say? }]

export async function analyzeSnapshot(/* { frameDataUrl, transcript, env } */) {
  return []; // not implemented in the proof of concept
}
