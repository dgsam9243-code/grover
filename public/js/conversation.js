// "My conversation style": who the user is and how they communicate, in their own words,
// turned into a card they can show the person they are talking to.
// Each conversation difference pairs a "please know" line (what it looks like) with a
// "what helps" line (what the other person can do). Drawn from guidance by autistic-led and
// disability organisations: National Autistic Society, Reframing Autism, STAMMA, selective
// mutism and auditory processing guidance (sources in ITERATIONS.md). Everything is optional,
// stays on this phone, and can be reworded or added to.

export const DISABILITIES = [
  "Autistic", "ADHD", "Anxiety", "Auditory processing differences", "Sensory processing differences",
  "Dyslexia", "Dyspraxia", "Tourette's or tics", "A stammer", "Hard of hearing", "Selective mutism",
];

// Tips for the other person that each condition commonly calls for, added to the card
// when the user chooses that condition (they can switch this off). `covers` lists the
// conversation differences that already say the same thing, so the card never repeats itself.
const tip = (text, ...covers) => ({ text, covers });
export const DISABILITY_TIPS = {
  "Autistic": [tip("Please use plain words and say exactly what you mean.", "literal", "direct"), tip("Please give me time, and don't ask for eye contact.", "time", "eyes")],
  "ADHD": [tip("Short, clear points help me keep track.", "oneThing"), tip("It's okay to bring me back to the topic.", "lose", "topic")],
  "Anxiety": [tip("A calm, unhurried pace helps me.", "time"), tip("Please tell me what will happen next, if you can.")],
  "Auditory processing differences": [tip("Please face me, speak clearly and use short sentences.", "faceMe", "oneThing"), tip("Rephrase or write it down if I don't follow.", "repeat", "written")],
  "Sensory processing differences": [tip("Quieter, calmer places help me a lot.", "noise")],
  "Dyslexia": [tip("Please don't ask me to read things quickly in front of you.")],
  "Dyspraxia": [tip("I may need a little longer with movements or tasks.")],
  "Tourette's or tics": [tip("If I tic, please carry on as normal.", "tics")],
  "A stammer": [tip("Please let me finish. Don't finish my sentences for me.", "finish")],
  "Hard of hearing": [tip("Please face me and speak clearly. You don't need to shout.", "faceMe")],
  "Selective mutism": [tip("Sometimes I can't speak. I may write, type or point instead.", "words"), tip("Please don't pressure me to talk.")],
};

export const QUIRKS = [
  { id: "time", label: "I need extra time to think before I answer",
    know: "If I take a while to answer, I'm still listening and thinking.",
    helps: "Please give me time to answer. Silence is okay." },
  { id: "eyes", label: "Eye contact is hard or distracting for me",
    know: "I may not look at your face. I'm still paying attention.",
    helps: "Please don't ask me to look at you." },
  { id: "literal", label: "I take words literally",
    know: "I take words literally. Sarcasm, hints and sayings can confuse me.",
    helps: "Please say exactly what you mean." },
  { id: "repeat", label: "I may need things said again",
    know: "I may ask you to say something again. I want to get it right.",
    helps: "Please repeat or rephrase if I ask. Writing it down helps too." },
  { id: "noise", label: "Background noise makes it hard to follow",
    know: "In noisy places I can't follow speech well.",
    helps: "Somewhere quieter helps, or facing me when you talk." },
  { id: "oneThing", label: "Long or many questions are hard to follow",
    know: "Long questions, or several at once, are hard for me to follow.",
    helps: "One question at a time, please." },
  { id: "groups", label: "Group conversations are hard for me",
    know: "In a group, I find it hard to know when it's my turn to talk.",
    helps: "It helps if you invite me in: “What do you think?”" },
  { id: "finish", label: "I need to finish my own sentences",
    know: "Sometimes my words take longer to come out.",
    helps: "Please let me finish. Don't finish my sentences for me." },
  { id: "interrupt", label: "I may interrupt or talk over people by accident",
    know: "I sometimes interrupt by accident. I'm not trying to be rude.",
    helps: "It's okay to tell me kindly that you weren't finished." },
  { id: "lose", label: "I can lose track of what I was saying",
    know: "I can lose my train of thought.",
    helps: "Please remind me what we were talking about." },
  { id: "topic", label: "I may talk a lot about things I care about",
    know: "When I care about something, I may talk about it a lot.",
    helps: "It's okay to tell me if you want to change the subject." },
  { id: "direct", label: "I'm very direct",
    know: "I'm direct. I'm being honest, not rude.",
    helps: "Please take my words at face value." },
  { id: "smalltalk", label: "Small talk is hard for me",
    know: "Small talk is hard for me.",
    helps: "I'm happy to talk about something specific." },
  { id: "face", label: "My face or voice may not show what I feel",
    know: "My face or tone of voice may not match how I feel.",
    helps: "If you're not sure how I feel, please ask me." },
  { id: "stim", label: "I move or fidget to help me focus",
    know: "I may fidget, rock or move my hands. It helps me focus.",
    helps: "Please don't ask me to stop." },
  { id: "tics", label: "I have tics",
    know: "I have tics. I can't always control them.",
    helps: "Please carry on as normal if I tic." },
  { id: "words", label: "Sometimes I can't speak",
    know: "Sometimes I can't get words out, especially when stressed.",
    helps: "I may type, write or point instead. Please wait for me." },
  { id: "faceMe", label: "I need to see your face to follow",
    know: "I follow better when I can see your face.",
    helps: "Please face me and don't cover your mouth." },
  { id: "touch", label: "I don't like unexpected touch",
    know: "Unexpected touch is hard for me.",
    helps: "Please ask before touching me." },
  { id: "breaks", label: "I may need a break, sometimes suddenly",
    know: "I may need to step away suddenly. It's not about you.",
    helps: "Please let me go without asking why. I'll come back." },
  { id: "written", label: "I understand better in writing",
    know: "I understand things better when they're written down.",
    helps: "Plans or instructions in a message help me." },
];

// Communication cards the user can show in big letters when talking is hard (an alternative to
// speech recommended for selective mutism, shutdown and stammering). The user chooses them.
export const QUICK_CARDS = [
  "Please give me a moment.",
  "Can you say that again, please?",
  "Can you write it down, please?",
  "I can't talk right now. I can type.",
  "I need a short break.",
  "Yes", "No", "I'm not sure",
];

export const DEFAULT_STRESS = "I'm feeling overwhelmed right now. My brain is taking in too much. " +
  "I need a few minutes of quiet. It's not about you, and I'll come back when I'm ready.";

const ME_KEY = "grover.me";

// { name, disabilities: [], ownDisabilities: [], quirks: [ids], ownKnow: [], ownHelps: [], tips, stress }
export function loadMe() {
  let me = {};
  try { me = JSON.parse(localStorage.getItem(ME_KEY) || "{}"); } catch {}
  return { name: "", disabilities: [], quirks: [], ownKnow: [], ownHelps: [], tips: true, stress: DEFAULT_STRESS, ...me };
}

export function saveMe(me) {
  try { localStorage.setItem(ME_KEY, JSON.stringify(me)); } catch {}
}

export function hasMe(me) {
  return Boolean(me.name || me.disabilities.length || me.quirks.length || me.ownKnow.length || me.ownHelps.length);
}

// The lines on the card: what it looks like, then what helps (the user's picks, their own
// words, then tips for the conditions they chose), without repeats.
export function meLines(me) {
  const picked = QUIRKS.filter((q) => me.quirks.includes(q.id));
  // A tip is left out when any difference the user picked already says the same thing.
  const tips = me.tips ? me.disabilities.flatMap((d) => DISABILITY_TIPS[d] ?? [])
    .filter((t) => !t.covers.some((id) => me.quirks.includes(id))).map((t) => t.text) : [];
  return {
    know: [...picked.map((q) => q.know), ...me.ownKnow],
    helps: [...new Set([...picked.map((q) => q.helps), ...me.ownHelps, ...tips])],
  };
}

// The card itself, built from text nodes only (everything here is the user's own words).
export function renderMeCard(el, me, { big = false } = {}) {
  const make = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  el.replaceChildren();
  if (!hasMe(me)) {
    el.append(make("p", "me-empty", "Nothing here yet. Press Edit to say how you like to talk, and what helps."));
    return;
  }
  el.append(make("p", "me-hello", me.name ? `Hi, I'm ${me.name}.` : "Hi."));
  if (me.disabilities.length) el.append(make("p", "me-about", `About me: ${me.disabilities.join(" · ")}`));
  const { know, helps } = meLines(me);
  const section = (title, lines) => {
    if (!lines.length) return;
    el.append(make(big ? "h2" : "h3", "me-h", title));
    const ul = make("ul", "me-list");
    for (const l of lines) ul.append(make("li", null, l));
    el.append(ul);
  };
  section("Please know", know);
  section("What helps me", helps);
  el.append(make("p", "me-thanks", "Thank you for reading this."));
}
