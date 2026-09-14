import { type Disposable, ResourceTracker } from "../disposable.js";
import {
  type LasciiErrorContext,
  type LasciiErrorType,
  logLasciiError,
  toError,
} from "../errors.js";
import { LasciiEmitter } from "../events.js";

export type {
  LasciiCompleteDetail,
  LasciiErrorDetail,
  LasciiProgressDetail,
  LasciiStartDetail,
} from "../events.js";
export { LasciiEvent } from "../events.js";

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

class LasciiTextEffect extends LasciiEmitter implements Disposable {
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
  phraseTimeout: ReturnType<typeof setTimeout> | null;
  rawText: string;
  phrases: string[];
  shouldLoop: boolean;
  counter: number;
  failed: boolean;
  private readonly tracker = new ResourceTracker();

  constructor(element: HTMLElement, options: LasciiTextEffectOptions = {}) {
    super();
    this.el = element;
    this.config = { ...LasciiTextEffect.DEFAULTS, ...options };
    this.queue = [];
    this.frame = 0;
    this.frameRequest = null;
    this.resolve = null;
    this.safetyTimeout = null;
    this.phraseTimeout = null;
    this.rawText = (this.el.textContent ?? "").trim();
    this.phrases = [];
    this.shouldLoop = false;
    this.counter = 0;
    this.failed = false;

    this.tracker.track(() => this.stopActiveWork());

    try {
      this.phrases = this.extractPhrases();
      this.shouldLoop = this.rawText.includes(this.config.separator);
      this.clearInitialText();
    } catch (error) {
      this.handleError("text_effect_initialization_failed", error);
      return;
    }

    queueMicrotask(() => {
      if (this.failed || this.tracker.isDisposed) return;
      try {
        this.start();
      } catch (error) {
        this.handleError("text_effect_initialization_failed", error);
      }
    });
  }

  get disposed(): boolean {
    return this.tracker.isDisposed;
  }

  dispose(): void {
    if (this.tracker.isDisposed) return;
    this.failed = true;
    this.tracker.dispose();
  }

  private ensureNotDisposed(): void {
    if (this.tracker.isDisposed) {
      throw new Error("LasciiTextEffect has been disposed");
    }
  }

  private handleError(
    type: LasciiErrorType | string,
    error: unknown,
    context: LasciiErrorContext = {},
  ): void {
    if (this.failed || this.tracker.isDisposed) return;
    this.failed = true;
    const err = toError(error);
    logLasciiError(type, err, {
      element: this.el,
      config: this.config,
      ...context,
    });
    this.stopActiveWork();
    this.fallbackToOriginal();
    this.emit("error", { error: err });
  }

  private stopActiveWork(): void {
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    if (this.safetyTimeout !== null) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    if (this.phraseTimeout !== null) {
      clearTimeout(this.phraseTimeout);
      this.phraseTimeout = null;
    }
    this.resolve?.();
    this.resolve = null;
  }

  private fallbackToOriginal(): void {
    const fallbackText = this.phrases[0] ?? this.rawText;
    this.el.textContent = fallbackText;
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
    this.ensureNotDisposed();
    if (this.failed || !this.phrases.length) return;
    if (this.shouldLoop) {
      this.displayNextPhrase();
    } else {
      this.setText(this.phrases[0]);
    }
  }

  displayNextPhrase(): void {
    if (this.failed || this.tracker.isDisposed) return;
    const currentPhrase = this.phrases[this.counter];
    this.setText(currentPhrase).then(() => {
      if (this.failed || this.tracker.isDisposed) return;
      this.phraseTimeout = setTimeout(() => {
        this.phraseTimeout = null;
        if (this.failed || this.tracker.isDisposed) return;
        this.updateCounter();
        this.displayNextPhrase();
      }, this.config.phraseDelay);
    });
  }

  updateCounter(): void {
    this.counter = (this.counter + 1) % this.phrases.length;
  }

  setText(newText: string): Promise<void> {
    this.ensureNotDisposed();
    if (this.failed) {
      return Promise.resolve();
    }

    try {
      const oldText = this.el.innerText;
      const length = Math.max(oldText.length, newText.length);
      const promise = new Promise<void>((resolve) => {
        this.resolve = resolve;
      });
      this.queue = this.buildQueue(oldText, newText, length);
      this.emit("start", { text: newText });
      this.emit("progress", { progress: 0 });
      this.resetAnimation();

      this.safetyTimeout = setTimeout(() => {
        this.safetyTimeout = null;
        if (this.frameRequest) {
          cancelAnimationFrame(this.frameRequest);
          this.frameRequest = null;
          this.completeAnimation(newText);
        }
      }, 3000);

      return promise;
    } catch (error) {
      this.handleError("text_effect_animation_failed", error, { newText });
      return Promise.resolve();
    }
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
    if (this.frameRequest !== null) {
      cancelAnimationFrame(this.frameRequest);
      this.frameRequest = null;
    }
    this.frame = 0;
    this.update();
  }

  update = (): void => {
    if (this.failed || this.tracker.isDisposed) return;

    try {
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
      const progress =
        this.queue.length === 0 ? 1 : complete / this.queue.length;
      this.emit("progress", { progress });
      if (complete === this.queue.length) {
        this.completeAnimation(this.queue.map((item) => item.to).join(""));
      } else {
        this.frameRequest = requestAnimationFrame(this.update);
        this.frame++;
      }
    } catch (error) {
      this.handleError("text_effect_animation_failed", error);
    }
  };

  randomChar(): string {
    return this.config.chars[
      Math.floor(Math.random() * this.config.chars.length)
    ];
  }

  private completeAnimation(text: string): void {
    if (this.failed || this.tracker.isDisposed) {
      this.resolve?.();
      this.resolve = null;
      return;
    }
    this.el.textContent = text;
    if (this.safetyTimeout !== null) {
      clearTimeout(this.safetyTimeout);
      this.safetyTimeout = null;
    }
    this.emit("progress", { progress: 1 });
    this.emit("complete", { text });
    this.resolve?.();
    this.resolve = null;
  }

  static init(selector = "[data-lascii-text]"): LasciiTextEffect[] {
    const elements = document.querySelectorAll(selector);
    return Array.from(
      elements,
      (element) => new LasciiTextEffect(element as HTMLElement),
    );
  }
}

export default LasciiTextEffect;
