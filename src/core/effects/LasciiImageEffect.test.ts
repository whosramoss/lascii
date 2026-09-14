import { afterEach, describe, expect, it, vi } from "vitest";
import LasciiImageEffect from "./LasciiImageEffect.js";

describe("LasciiImageEffect", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the original image when a 2d context is unavailable", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const img = document.createElement("img");
    img.src = "https://example.com/photo.jpg";
    document.body.append(img);

    const effect = new LasciiImageEffect(img, 0);
    expect(effect.failed).toBe(true);
    expect(img.style.opacity).toBe("1");
    expect(effect.canvas.isConnected).toBe(false);

    effect.dispose();
    expect(effect.disposed).toBe(true);
  });

  it("init() wraps matching images", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    document.body.innerHTML =
      '<img data-lascii-image src="a.jpg" alt="" /><img src="skip.jpg" alt="" />';
    const effects = LasciiImageEffect.init();
    expect(effects).toHaveLength(1);
    effects.forEach((effect) => effect.dispose());
  });
});
