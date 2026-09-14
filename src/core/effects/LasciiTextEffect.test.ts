import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LasciiTextEffect, {
  type LasciiTextEffectOptions,
} from "./LasciiTextEffect.js";

const FAST: LasciiTextEffectOptions = {
  frameStartMax: 0,
  frameEndMax: 1,
  introChars: "",
  introPhaseFrames: 0,
  phraseDelay: 25,
};

const live: LasciiTextEffect[] = [];

function mount(text: string, options: LasciiTextEffectOptions = {}) {
  const el = document.createElement("p");
  el.textContent = text;
  document.body.append(el);
  const effect = new LasciiTextEffect(el, { ...FAST, ...options });
  live.push(effect);
  return { el, effect };
}

async function reveal(el: HTMLElement, expected: string): Promise<void> {
  await Promise.resolve();
  for (let i = 0; i < 80; i++) {
    if (el.textContent === expected) {
      await Promise.resolve();
      return;
    }
    await vi.advanceTimersByTimeAsync(16);
  }
  expect(el.textContent).toBe(expected);
}

describe("LasciiTextEffect", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.stubGlobal(
      "requestAnimationFrame",
      (cb: FrameRequestCallback): number => {
        return setTimeout(() => cb(Date.now()), 16) as unknown as number;
      },
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    while (live.length > 0) {
      live.pop()?.dispose();
    }
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe("extractPhrases", () => {
    it("keeps a single phrase intact", () => {
      const { effect } = mount("Hello World");
      expect(effect.phrases).toEqual(["Hello World"]);
      expect(effect.shouldLoop).toBe(false);
    });

    it("splits on the default separator and trims whitespace", () => {
      const { effect } = mount("  First  |:|  Second  |:|Third ");
      expect(effect.phrases).toEqual(["First", "Second", "Third"]);
    });

    it("drops empty segments between separators", () => {
      const { effect } = mount("Alpha|:||:|Beta|:|");
      expect(effect.phrases).toEqual(["Alpha", "Beta"]);
    });

    it("honors a custom separator", () => {
      const { effect } = mount("One /// Two", { separator: "///" });
      expect(effect.phrases).toEqual(["One", "Two"]);
      expect(effect.shouldLoop).toBe(true);
    });

    it("yields no phrases for blank content", () => {
      const { effect } = mount("   ");
      expect(effect.phrases).toEqual([]);
      expect(effect.shouldLoop).toBe(false);
    });
  });

  describe("looping", () => {
    it("does not loop when the separator is absent", () => {
      const { effect } = mount("Static");
      expect(effect.shouldLoop).toBe(false);
      expect(effect.rawText.includes(effect.config.separator)).toBe(false);
    });

    it("loops when the raw text includes the separator", () => {
      const { effect } = mount("A|:|B");
      expect(effect.shouldLoop).toBe(true);
    });

    it("wraps the phrase counter", () => {
      const { effect } = mount("A|:|B|:|C");
      expect(effect.counter).toBe(0);
      effect.updateCounter();
      effect.updateCounter();
      expect(effect.counter).toBe(2);
      effect.updateCounter();
      expect(effect.counter).toBe(0);
    });

    it("advances to the next phrase after phraseDelay", async () => {
      const { el, effect } = mount("Alpha|:|Beta|:|Gamma");
      await reveal(el, "Alpha");
      expect(effect.counter).toBe(0);

      await vi.advanceTimersByTimeAsync(25);
      await reveal(el, "Beta");
      expect(effect.counter).toBe(1);

      await vi.advanceTimersByTimeAsync(25);
      await reveal(el, "Gamma");
      await vi.advanceTimersByTimeAsync(25);
      await reveal(el, "Alpha");
      expect(effect.counter).toBe(0);
    });
  });

  describe("animation", () => {
    it("reveals a single phrase", async () => {
      const { el } = mount("Hello");
      await reveal(el, "Hello");
    });

    it("resolves setText when the scramble finishes", async () => {
      const { el, effect } = mount("Hi");
      await reveal(el, "Hi");
      const done = effect.setText("Bye");
      await reveal(el, "Bye");
      await expect(done).resolves.toBeUndefined();
    });

    it("builds a start-origin queue that delays later characters", () => {
      const { effect } = mount("abcd", { frameStartMax: 10, frameEndMax: 1 });
      const queue = effect.buildQueue("", "abcd", 4);
      expect(queue.map((item) => item.start)).toEqual([0, 3, 6, 10]);
      expect(queue.every((item) => item.to.length <= 1)).toBe(true);
    });

    it("builds a middle-origin queue that reveals the center first", () => {
      const { effect } = mount("abcd", {
        frameStartMax: 10,
        frameEndMax: 1,
        revealOrigin: LasciiTextEffect.RevealOrigin.MIDDLE,
      });
      const queue = effect.buildQueue("", "abcd", 4);
      const starts = queue.map((item) => item.start);
      expect(starts[1]).toBeLessThan(starts[0]);
      expect(starts[2]).toBeLessThan(starts[3]);
    });
  });

  describe("lifecycle", () => {
    it("merges constructor options over DEFAULTS", () => {
      const { effect } = mount("Hi", { phraseDelay: 1200, chars: "ab" });
      expect(effect.config.phraseDelay).toBe(1200);
      expect(effect.config.chars).toBe("ab");
      expect(effect.config.separator).toBe(LasciiTextEffect.DEFAULTS.separator);
    });

    it("init() creates one instance per matching element", () => {
      document.body.innerHTML =
        '<p data-lascii-text>One</p><p data-lascii-text>Two</p><p>Skip</p>';
      const effects = LasciiTextEffect.init();
      live.push(...effects);
      expect(effects).toHaveLength(2);
      expect(effects[0].phrases).toEqual(["One"]);
      expect(effects[1].phrases).toEqual(["Two"]);
    });

    it("dispose() stops work and is idempotent", async () => {
      const { el, effect } = mount("Keep");
      effect.dispose();
      expect(effect.disposed).toBe(true);
      expect(effect.failed).toBe(true);
      await vi.advanceTimersByTimeAsync(200);
      expect(() => effect.setText("Nope")).toThrow(/disposed/);
      effect.dispose();
      expect(el.isConnected).toBe(true);
    });
  });

  describe("events", () => {
    it("emits start, progress, and complete for a reveal", async () => {
      const el = document.createElement("p");
      el.textContent = "Hello";
      document.body.append(el);
      const effect = new LasciiTextEffect(el, FAST);
      live.push(effect);

      const started: string[] = [];
      const progress: number[] = [];
      const completed: string[] = [];
      effect.addEventListener("start", (event) => {
        started.push(event.detail.text);
      });
      effect.addEventListener("progress", (event) => {
        progress.push(event.detail.progress);
      });
      effect.addEventListener("complete", (event) => {
        completed.push(event.detail.text);
      });

      await reveal(el, "Hello");
      expect(started).toEqual(["Hello"]);
      expect(completed).toEqual(["Hello"]);
      expect(progress[0]).toBe(0);
      expect(progress.at(-1)).toBe(1);
      expect(progress.every((value) => value >= 0 && value <= 1)).toBe(true);
    });

    it("emits complete for each looped phrase", async () => {
      const { el, effect } = mount("Alpha|:|Beta");
      const completed: string[] = [];
      effect.addEventListener("complete", (event) => {
        completed.push(event.detail.text);
      });

      await reveal(el, "Alpha");
      await vi.advanceTimersByTimeAsync(25);
      await reveal(el, "Beta");
      expect(completed).toEqual(["Alpha", "Beta"]);
    });

    it("emits error when the animation throws", async () => {
      const el = document.createElement("p");
      el.textContent = "Hi";
      document.body.append(el);
      const effect = new LasciiTextEffect(el, FAST);
      live.push(effect);

      const errors: Error[] = [];
      effect.addEventListener("error", (event) => {
        errors.push(event.detail.error);
      });
      vi.spyOn(console, "warn").mockImplementation(() => {});
      Object.defineProperty(el, "innerText", {
        configurable: true,
        get() {
          throw new Error("boom");
        },
      });

      await Promise.resolve();
      expect(effect.failed).toBe(true);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("boom");
    });
  });
});
