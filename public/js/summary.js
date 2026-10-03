// Conversation summary, made on this phone from the live captions: the topics that came up,
// the questions asked, and moments that mattered (your name, loud spells, breaks). No AI
// service and nothing saved: it lives in memory until the next session starts.
// "Ideas" are topics to come back to, never scripted words (see the "Suggest words" setting).

const STOP = new Set(`a about above after again all also am an and any are aren't as at be because been
before being below between both but by can can't cannot could couldn't did didn't do does doesn't doing
don't down during each few for from further get got gonna had hadn't has hasn't have haven't having he
he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is
isn't it it's its itself just know let's like me more most mustn't my myself no nor not now of off on
once only or other ought our ours ourselves out over own really right same say said see shan't she she'd
she'll she's should shouldn't so some such than that that's the their theirs them themselves then there
there's these they they'd they'll they're they've thing things think this those through to too under
until up very want was wasn't way we we'd we'll we're we've well were weren't what what's when when's
where where's which while who who's whom why why's will with won't would wouldn't yeah yes you you'd
you'll you're you've your yours yourself yourselves okay ok oh um uh hmm going go come good great
maybe actually basically something anything everything mean kind sort lot little bit one two time
today tomorrow yesterday thanks thank please sorry hello hi hey bye honestly gotta ugh gosh wow
seriously literally totally nice much many still even later soon good bad great awesome cool`.split(/\s+/));

export class ConversationLog {
  constructor() { this.reset(); }

  reset() {
    this.lines = [];      // { t, text, question, toMe }
    this.moments = [];    // { t, kind }
    this.start = Date.now();
  }

  add(text, { question = false, toMe = false } = {}) {
    if (text.trim()) this.lines.push({ t: Date.now(), text: text.trim(), question, toMe });
  }

  mark(kind) {
    this.moments.push({ t: Date.now(), kind });
  }

  // { minutes, lines, topics: [word], questions: [text], nameCount, moments: {kind: n} }
  summary(name = "") {
    const own = new Set(name.toLowerCase().split(/\s+/).filter(Boolean));
    const counts = new Map();
    for (const l of this.lines) {
      const seen = new Set();
      for (const w of l.text.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? []) {
        if (STOP.has(w) || own.has(w) || seen.has(w)) continue;
        seen.add(w);
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
    // A topic is a word that came up in at least 2 different lines.
    const topics = [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
    // Short talks rarely repeat a word, so also list single content words, in the order they came
    // up: skipping words that end like describing words (-ly, -ing, -ed), which are rarely topics.
    const words = [...counts.keys()].filter((w) => !topics.includes(w) && !/(ly|ing|ed)$/.test(w)).slice(0, 4);
    const questions = this.lines.filter((l) => l.question).slice(-3).map((l) => l.text);
    const moments = {};
    for (const m of this.moments) moments[m.kind] = (moments[m.kind] ?? 0) + 1;
    return {
      minutes: Math.max(1, Math.round((Date.now() - this.start) / 60000)),
      lines: this.lines.length, topics, words, questions, moments,
      nameCount: moments.name ?? 0,
    };
  }

  // Topics to come back to: ideas, not words to say.
  ideas(sum) {
    const ideas = [];
    const about = [...sum.topics, ...sum.words];
    // Keywords are quoted, because they are single words, not tidy topic names.
    if (about[0]) ideas.push(`“${about[0]}” came up. Asking more about it can keep things going.`);
    if (about[1]) ideas.push(`You can share your own side of “${about[1]}”.`);
    const lastQ = this.lines.filter((l) => l.question).at(-1);
    if (lastQ && Date.now() - lastQ.t < 120000) ideas.push("Come back to the last question if you didn't get to answer it.");
    if (!ideas.length) ideas.push("Ideas will appear once people have talked for a little while.");
    return ideas;
  }
}
