import { afterEach, describe, expect, it, vi } from "vitest";
import LasciiImageEffect from "./LasciiImageEffect.js";

describe("LasciiImageEffect", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the original image when a 2d context is unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const img = document.createElement("img");
    img.src = "https://example.com/photo.jpg";
    document.body.append(img);

    const effect = new LasciiImageEffect(img, 0);
    const errors: Error[] = [];
    effect.addEventListener("error", (event) => {
      errors.push(event.detail.error);
    });

    await Promise.resolve();
    expect(effect.failed).toBe(true);
    expect(img.style.opacity).toBe("1");
    expect(effect.canvas.isConnected).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/2d rendering context/);

    effect.dispose();
    expect(effect.disposed).toBe(true);
  });

  it("init() wraps matching images", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML =
      '<img data-lascii-image src="a.jpg" alt="" /><img src="skip.jpg" alt="" />';
    const effects = LasciiImageEffect.init();
    expect(effects).toHaveLength(1);
    await Promise.resolve();
    effects.forEach((effect) => effect.dispose());
  });

  it("skips the ASCII animation when reducedMotion is set", async () => {
    const img = document.createElement("img");
    img.alt = "Portrait";
    img.src = "https://example.com/photo.jpg";
    document.body.append(img);

    const effect = new LasciiImageEffect(img, 0, { reducedMotion: true });
    const started: string[] = [];
    const completed: string[] = [];
    effect.addEventListener("start", (event) => started.push(event.detail.text));
    effect.addEventListener("complete", (event) => {
      completed.push(event.detail.text);
    });

    await Promise.resolve();
    expect(effect.failed).toBe(false);
    expect(img.style.opacity).toBe("1");
    expect(img.hasAttribute("aria-busy")).toBe(false);
    expect(effect.canvas.getAttribute("aria-hidden")).toBe("true");
    expect(started).toEqual(["Portrait"]);
    expect(completed).toEqual(["Portrait"]);
    effect.dispose();
  });
});
