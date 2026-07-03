export type RevealOriginValue = "start" | "middle";

export interface LasciiTextEffectOptions {
  introChars?: string;
  introPhaseFrames?: number;
  chars?: string;
  frameStartMax?: number;
  frameEndMax?: number;
  randomCharChance?: number;
  phraseDelay?: number;
  separator?: string;
  revealOrigin?: RevealOriginValue;
}

export interface LasciiTextEffectDefaults
  extends Required<LasciiTextEffectOptions> {}

interface QueueItem {
  from: string;
  to: string;
  start: number;
  end: number;
  char: string;
}

class LasciiTextEffect {
  static RevealOrigin = Object.freeze({
    START: "start",
    MIDDLE: "middle",
  }) as Readonly<{
    readonly START: "start";
    readonly MIDDLE: "middle";
  }>;

  static DEFAULTS: LasciiTextEffectDefaults = {
    introChars: "█▓▒░x92",
    introPhaseFrames: 10,
    chars: "!<>-_\\/[]{}—=+*^?#________",
    frameStartMax: 40,
    frameEndMax: 40,
    randomCharChance: 0.28,
    phraseDelay: 800,
    separator: "|:|",
    revealOrigin: LasciiTextEffect.RevealOrigin.START,
  };

  el: HTMLElement;
  config: LasciiTextEffectDefaults;
  queue: QueueItem[];
  frame: number;
  frameRequest: number | null;
  resolve: (() => void) | null;
  safetyTimeout: ReturnType<typeof setTimeout> | null;
  rawText: string;
  phrases: string[];
  shouldLoop: boolean;
  counter: number;

  constructor(element: HTMLElement, options: LasciiTextEffectOptions = {}) {
    this.el = element;
    this.config = { ...LasciiTextEffect.DEFAULTS, ...options };
    this.queue = [];
    this.frame = 0;
    this.frameRequest = null;
    this.resolve = null;
    this.safetyTimeout = null;
    this.rawText = (this.el.textContent ?? "").trim();
    this.phrases = this.extractPhrases();
    this.shouldLoop = this.rawText.includes(this.config.separator);
    this.counter = 0;
    this.clearInitialText();
    this.start();
  }

  extractPhrases(): string[] {
    return this.rawText
      .split(this.config.separator)
      .map((text) => text.trim())
      .filter(Boolean);
  }

  clearInitialText(): void {
    this.el.textContent = "";
  }

  start(): void {
    if (!this.phrases.length) return;
    if (this.shouldLoop) {
      this.displayNextPhrase();
    } else {
      this.setText(this.phrases[0]);
    }
  }

  displayNextPhrase(): void {
    const currentPhrase = this.phrases[this.counter];
    this.setText(currentPhrase).then(() => {
      setTimeout(() => {
        this.updateCounter();
        this.displayNextPhrase();
      }, this.config.phraseDelay);
    });
  }

  updateCounter(): void {
    this.counter = (this.counter + 1) % this.phrases.length;
  }

  setText(newText: string): Promise<void> {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((resolve) => {
      this.resolve = resolve;
    });
    this.queue = this.buildQueue(oldText, newText, length);
    this.resetAnimation();

    this.safetyTimeout = setTimeout(() => {
      if (this.frameRequest) {
        cancelAnimationFrame(this.frameRequest);
        this.frameRequest = null;
        this.el.textContent = newText;
        this.resolve?.();
      }
    }, 3000);

    return promise;
  }

  buildQueue(oldText: string, newText: string, length: number): QueueItem[] {
    const queue: QueueItem[] = [];
    const origin =
      this.config.revealOrigin ?? LasciiTextEffect.RevealOrigin.START;
    const cap = this.config.frameStartMax;
    const scrambleLen = Math.max(
      1,
      Math.floor(Math.random() * this.config.frameEndMax),
    );

    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      let start = 0;

      if (origin === LasciiTextEffect.RevealOrigin.MIDDLE) {
        const mid = (length - 1) / 2;
        const dist = Math.abs(i - mid);
        const maxDist = Math.max(mid, length - 1 - mid) || 1;
        start = Math.floor((dist / maxDist) * cap);
      } else if (length > 1) {
        start = Math.floor((i / (length - 1)) * cap);
      }

      const end = start + scrambleLen;
      queue.push({ from, to, start, end, char: "" });
    }
    return queue;
  }

  resetAnimation(): void {
    cancelAnimationFrame(this.frameRequest!);
    this.frame = 0;
    this.update();
  }

  update = (): void => {
    let output = "";
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      const { from, to, start, end } = item;
      let char = item.char;
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        const local = this.frame - start;
        const intro = this.config.introChars ?? "";
        const introPhase = this.config.introPhaseFrames ?? 10;
        if (intro.length && local < introPhase) {
          const last = intro.length - 1;
          const idx =
            last <= 0
              ? 0
              : Math.min(
                  last,
                  Math.floor((local / Math.max(introPhase - 1, 1)) * last),
                );
          char = intro[idx];
          this.queue[i].char = char;
        } else if (!char || Math.random() < this.config.randomCharChance) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.el.textContent = this.queue.map((item) => item.to).join("");
      clearTimeout(this.safetyTimeout!);
      this.resolve?.();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  };

  randomChar(): string {
    return this.config.chars[
      Math.floor(Math.random() * this.config.chars.length)
    ];
  }

  static init(selector = "[data-lascii-text]"): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      new LasciiTextEffect(element as HTMLElement);
    });
  }
}

export default LasciiTextEffect;
