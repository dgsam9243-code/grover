// Understanding the setting: combines what the camera sees (objects, a whole-image
// classifier, people sitting, flashing lights) with what the mic hears, over the last
// ~20 seconds, into one plain answer: "🍽️ Restaurant or café — fairly sure".
// Each setting also has a short guide of what usually happens there and words to use:
// a social narrative, a widely used support for predictability.

// Evidence weights. objects: COCO object detector names. labels: ImageNet classifier names.
export const SCENES = {
  party: {
    emoji: "🎉", label: "Party or celebration",
    objects: { cake: 3, "wine glass": 1, bottle: 0.6, cup: 0.3 },
    labels: { candle: 3.5, balloon: 3, "birthday cake": 3 },
    loud: 1, crowd: 0.6,
    guide: ["People talk in small groups and move around.", "There may be food, music and a lot of noise.", "It is fine to stay near one person or take breaks."],
    say: "Hi, how do you know the host?",
  },
  restaurant: {
    emoji: "🍽️", label: "Restaurant or café",
    objects: { "dining table": 1.5, cup: 1, fork: 1.5, knife: 1, spoon: 1, bowl: 0.8, "wine glass": 0.8, pizza: 1, sandwich: 1, donut: 0.8, cake: 0.3, chair: 0.4 },
    labels: { restaurant: 3, bakery: 2.5, "dining table": 2, plate: 1.5, espresso: 1.5, "coffee mug": 1, menu: 2, cup: 0.5, "beer glass": 0.8 },
    guide: ["A server may show you to a table or you order at the counter.", "Take your time with the menu.", "You usually pay at the end, or at the counter first."],
    say: "Could I have a minute to decide, please?",
  },
  shop: {
    emoji: "🛍️", label: "Shop",
    labels: { "grocery store": 3, toyshop: 3, bookshop: 2, "shoe shop": 3, confectionery: 2, "tobacco shop": 1, "butcher shop": 1.5, "shopping cart": 3, "shopping basket": 2, cinema: 1.5 },
    objects: { bottle: 0.2 },
    guide: ["Shops can be bright and busy.", "Staff can help you find things.", "You pay at the till or a self-checkout."],
    say: "Excuse me, where can I find …?",
  },
  street: {
    emoji: "🚏", label: "Street or bus stop",
    objects: { bus: 1.5, car: 0.8, "traffic light": 1.5, "stop sign": 2, bench: 0.6, truck: 0.5, bicycle: 0.4, motorcycle: 0.5 },
    labels: { "parking meter": 1.5, "traffic light": 1.5, "street sign": 1.5, cab: 1, trolleybus: 0.8, "school bus": 0.8, "fire engine": 0.4 },
    guide: ["Traffic can be loud and sudden.", "At a bus stop, the number and destination are on the front of the bus.", "Wave or step forward so the driver knows you want this bus."],
    say: "Excuse me, does this bus go to …?",
  },
  transit: {
    emoji: "🚆", label: "On a train or bus",
    labels: { "passenger car": 2.5, streetcar: 1.5, "bullet train": 2, minibus: 1.2, limousine: 1.2, "electric locomotive": 2, trolleybus: 0.6 },
    seated: 1,
    guide: ["Hold on when it starts and stops.", "Announcements or screens tell you the next stop.", "Headphones are a good way to keep the noise down."],
    say: "Excuse me, is this seat free?",
  },
  car: {
    emoji: "🚗", label: "In a car",
    labels: { "seat belt": 2, "car mirror": 2.5, minivan: 0.6, "sports car": 0.4, convertible: 0.4 },
    guide: ["Cars can feel small and loud.", "It is okay to ask for the music to be quieter."],
    say: "Could we turn the music down a little?",
  },
  emergency: {
    emoji: "🚨", label: "Police or emergency lights",
    labels: { "police van": 2.5, ambulance: 1.5 },
    lights: 4,
    safety: true,
    guide: ["Stay calm and keep your hands where they can be seen.", "Move slowly. Say what you are going to do before you reach for anything.", "You can tell them you need more time to answer."],
    say: "I have a disability that affects communication. I may need more time to answer.",
  },
  concert: {
    emoji: "🎤", label: "Concert or show",
    labels: { stage: 2.5, "theater curtain": 1.5, loudspeaker: 1.5, spotlight: 1, "electric guitar": 2, microphone: 1.5 },
    loud: 1.5,
    guide: ["Shows are loud and bright, then quiet between parts.", "Ear plugs help a lot.", "Find the exit and the toilets early, so you know where to go."],
    say: "Excuse me, could I get past, please?",
  },
  quiet: {
    emoji: "📚", label: "Quiet place (library, church…)",
    // Grand reading rooms read as "church / vault / altar" on real footage: same quiet expectation.
    labels: { library: 3, bookshop: 1.5, bookcase: 2, church: 2, vault: 1, altar: 1.5, monastery: 1.5, "prayer rug": 1 },
    quiet: 1,
    guide: ["People keep voices low here.", "It is a good place to rest from noise."],
    say: "(quietly) Excuse me, …",
  },
  home: {
    emoji: "🏠", label: "Home",
    objects: { couch: 2, bed: 2, tv: 1.2, "potted plant": 0.4 },
    labels: { "studio couch": 2, "home theater": 2, quilt: 1, "four-poster": 1 },
    guide: ["A familiar place. Nothing needs you right now."],
    say: "",
  },
  outdoors: {
    emoji: "🌳", label: "Outdoors",
    labels: { lakeside: 2, valley: 2, alp: 2, seashore: 2, "park bench": 1.5, cliff: 1, boathouse: 1 },
    objects: { bench: 0.4, dog: 0.3, bird: 0.3 },
    guide: ["Open space. A good place for a break."],
    say: "",
  },
  crowd: {
    emoji: "👥", label: "Crowd of people",
    crowd: 2,
    guide: ["Crowds move and can be noisy.", "Stay near the edge, where there is more space."],
    say: "Excuse me, could I get past, please?",
  },
};

const FOOD_DRINK = ["cup", "fork", "knife", "spoon", "bowl", "wine glass", "pizza", "sandwich", "donut", "cake", "hot dog", "banana", "apple", "orange"];
const HALF_LIFE = 20; // seconds: older evidence fades so the setting can change

export class SceneReader {
  constructor() {
    this.scores = Object.fromEntries(Object.keys(SCENES).map((k) => [k, 0]));
    this.why = Object.fromEntries(Object.keys(SCENES).map((k) => [k, {}]));
    this.lastT = null;
    this.lightHistory = [];
  }

  // p: one perception reading ({objects?, labels?, bodies?}); env: {slowLevel, colours?}.
  update(p, env, now = Date.now()) {
    const dt = this.lastT == null ? 0 : (now - this.lastT) / 1000;
    this.lastT = now;
    const decay = Math.pow(0.5, dt / HALF_LIFE);
    for (const k in this.scores) {
      this.scores[k] *= decay;
      for (const w in this.why[k]) { this.why[k][w] *= decay; if (this.why[k][w] < 0.05) delete this.why[k][w]; }
    }
    const add = (k, amount, reason) => {
      this.scores[k] += amount;
      this.why[k][reason] = (this.why[k][reason] ?? 0) + amount;
    };
    if (p.objects) {
      // Tables and chairs alone are a library or an office too (found on real footage):
      // for "restaurant" they only count when food or drink is also in view.
      const foodOrDrink = FOOD_DRINK.some((o) => p.objects[o]);
      for (const [k, s] of Object.entries(SCENES)) {
        for (const [name, w] of Object.entries(s.objects ?? {})) {
          const n = p.objects[name] ?? 0;
          const furniture = k === "restaurant" && (name === "dining table" || name === "chair") && !foodOrDrink;
          if (n) add(k, w * Math.sqrt(Math.min(n, 4)) * (furniture ? 0.2 : 1), PLAIN[name] ?? name);
        }
      }
      const people = p.objects.person ?? 0;
      for (const [k, s] of Object.entries(SCENES)) if (s.crowd && people >= 6) add(k, s.crowd * (people >= 10 ? 2 : 1), "many people");
    }
    if (p.labels) {
      // Tuned on real footage: shopping centres also look "restaurant" to the classifier, so that
      // label counts half unless restaurant things (tables, cups, cutlery, chairs) are actually seen.
      const tableware = ["dining table", ...FOOD_DRINK].some((o) => p.objects?.[o]);
      const outsideTraffic = ["car", "traffic light", "stop sign", "truck"].some((o) => p.objects?.[o]);
      for (const [k, s] of Object.entries(SCENES)) {
        for (const { name, score } of p.labels) {
          const w = s.labels?.[name];
          // Tuned on real footage: a glass bus shelter looks like a vehicle inside, and old town
          // squares look like churches. Discount those clues when the rest of the picture disagrees.
          let factor = 1;
          if (k === "restaurant" && !tableware) factor = 0.5;
          if (k === "transit" && outsideTraffic) factor = 0.5;
          if (k === "quiet" && env.slowLevel != null && env.slowLevel > 0.35) factor = 0.3;
          if (w) add(k, w * score * 3 * factor, PLAIN[name] ?? name);
        }
      }
    }
    if (p.bodies) {
      const seated = p.bodies.filter((b) => b.includes("sitting")).length;
      if (seated >= 2) add("transit", SCENES.transit.seated * 0.5, "people sitting in rows");
    }
    const lvl = env.slowLevel;
    if (lvl != null && p.labels) { // count sound at the classifier's pace, so it doesn't swamp the picture
      for (const [k, s] of Object.entries(SCENES)) {
        // Sound only supports a setting the camera already has some evidence for: a loud
        // classroom isn't a concert (found on real footage).
        if (this.scores[k] < 1) continue;
        if (s.loud && lvl > 0.6) add(k, s.loud * 0.6, "loud sound");
        if (s.quiet && lvl < 0.3) add(k, s.quiet * 0.8, "quiet");
      }
    }
    if (env.colours) {
      this.lightHistory = [...this.lightHistory.filter((h) => now - h.t < 3000), { t: now, ...env.colours }];
      if (flashing(this.lightHistory)) add("emergency", SCENES.emergency.lights, "flashing red and blue lights");
    }
  }

  // The most likely setting, how sure, and why, in plain words.
  current() {
    const ranked = Object.entries(this.scores).sort((a, b) => b[1] - a[1]);
    const [top, s1] = ranked[0];
    const s2 = ranked[1][1];
    if (s1 < 1.5) return null; // not enough evidence yet
    const share = s1 / (s1 + s2 + 1);
    const sure = share > 0.6 && s1 > 4 ? "fairly sure" : share > 0.45 ? "maybe" : "not sure";
    const why = Object.entries(this.why[top]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
    return { id: top, ...SCENES[top], sure, score: +s1.toFixed(2), why };
  }
}

// Flashing emergency lights: strong red AND strong blue within the last few seconds,
// and the colour keeps changing (on/off), unlike a red sign or a blue wall.
export function flashing(history) {
  if (history.length < 6) return false;
  const reds = history.map((h) => h.red), blues = history.map((h) => h.blue);
  const range = (a) => Math.max(...a) - Math.min(...a);
  return Math.max(...reds) > 0.004 && Math.max(...blues) > 0.004 && range(reds) > 0.003 && range(blues) > 0.003;
}

// Share of the frame that is bright, saturated red or blue (emergency-light colours).
export function emergencyColours(data) {
  let red = 0, blue = 0;
  const n = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (r > 200 && g < 90 && b < 110) red++;
    else if (b > 200 && r < 90 && g < 170) blue++;
  }
  return { red: red / n, blue: blue / n };
}

// Plain words for the "why" line.
const PLAIN = {
  "dining table": "tables", cup: "cups", fork: "cutlery", knife: "cutlery", spoon: "cutlery", bowl: "bowls", "wine glass": "glasses",
  cake: "cake", candle: "candles", balloon: "balloons", bus: "a bus", car: "cars", "traffic light": "traffic lights", "stop sign": "a stop sign",
  "parking meter": "street things", "street sign": "street signs", cab: "cars", streetcar: "a vehicle inside", "passenger car": "a train carriage",
  "bullet train": "a train", minibus: "a vehicle inside", limousine: "a vehicle inside", "seat belt": "a seat belt", "car mirror": "a car mirror",
  restaurant: "a restaurant", bakery: "a bakery or café", church: "a high ceiling", vault: "a high ceiling", altar: "a high ceiling", stage: "a stage", library: "books", couch: "a sofa", bed: "a bed", tv: "a TV",
  "grocery store": "shop shelves", "police van": "a police vehicle", ambulance: "an emergency vehicle",
};
