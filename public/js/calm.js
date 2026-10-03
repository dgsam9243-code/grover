// Breathing exercise overlay: in 4s, hold 4s, out 6s.

const STEPS = [
  { cls: "in", text: "Breathe in…", ms: 4000 },
  { cls: "hold", text: "Hold…", ms: 4000 },
  { cls: "out", text: "Breathe out slowly…", ms: 6000 },
];

export class Calm {
  constructor(el, textEl, onSpeak) {
    this.el = el;
    this.textEl = textEl;
    this.onSpeak = onSpeak;
  }

  open() {
    if (!this.el.hidden) return;
    this.el.hidden = false;
    this.i = 0;
    this.onSpeak?.("You are not doing anything wrong. Let's take a moment.");
    this.step();
  }

  step = () => {
    const s = STEPS[this.i % STEPS.length];
    this.el.classList.remove("in", "hold", "out");
    // Force reflow so the transition restarts.
    void this.el.offsetWidth;
    this.el.classList.add(s.cls);
    this.textEl.textContent = s.text;
    this.i++;
    this.timer = setTimeout(this.step, s.ms);
  };

  close() {
    clearTimeout(this.timer);
    this.el.hidden = true;
    this.el.classList.remove("in", "hold", "out");
  }
}
