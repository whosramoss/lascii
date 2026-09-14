import { beforeEach, describe, expect, it, vi } from "vitest";
import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./initDom.js";

describe("initDom", () => {
  beforeEach(() => {
    vi.spyOn(LasciiTextEffect, "init").mockReturnValue([]);
    vi.spyOn(LasciiImageEffect, "init").mockReturnValue([]);
  });

  it("initializes image and text effects eagerly", () => {
    initDom();
    expect(LasciiImageEffect.init).toHaveBeenCalledWith("[data-lascii-image]");
    expect(LasciiTextEffect.init).toHaveBeenCalledWith("[data-lascii-text]");
  });

  it("falls back to eager init when IntersectionObserver is missing", () => {
    const original = globalThis.IntersectionObserver;
    // @ts-expect-error jsdom has no IntersectionObserver by default
    delete globalThis.IntersectionObserver;

    initDom({ lazy: true });
    expect(LasciiImageEffect.init).toHaveBeenCalledWith("[data-lascii-image]");
    expect(LasciiTextEffect.init).toHaveBeenCalledWith("[data-lascii-text]");

    globalThis.IntersectionObserver = original;
  });

  it("autoInitDom runs immediately when the document is ready", () => {
    autoInitDom();
    expect(LasciiTextEffect.init).toHaveBeenCalled();
    expect(LasciiImageEffect.init).toHaveBeenCalled();
  });

  it("autoInitDom waits for DOMContentLoaded while loading", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const add = vi.spyOn(document, "addEventListener");

    autoInitDom({ lazy: false });
    expect(LasciiTextEffect.init).not.toHaveBeenCalled();

    const listener = add.mock.calls.find(
      ([event]) => event === "DOMContentLoaded",
    )?.[1] as EventListener;
    expect(listener).toEqual(expect.any(Function));
    listener(new Event("DOMContentLoaded"));
    expect(LasciiTextEffect.init).toHaveBeenCalled();
  });
});
