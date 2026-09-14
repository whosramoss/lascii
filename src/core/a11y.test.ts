import { describe, expect, it, vi } from "vitest";
import {
  beginAccessibleTransition,
  endAccessibleTransition,
  ensureLiveRegion,
  prefersReducedMotion,
} from "./a11y.js";

describe("prefersReducedMotion", () => {
  it("honors an explicit override", () => {
    expect(prefersReducedMotion(true)).toBe(true);
    expect(prefersReducedMotion(false)).toBe(false);
  });

  it("reads matchMedia when no override is given", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
    expect(prefersReducedMotion()).toBe(true);
    vi.unstubAllGlobals();
  });

  it("is false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
    vi.unstubAllGlobals();
  });
});

describe("live region helpers", () => {
  it("sets polite live and atomic attributes when missing", () => {
    const el = document.createElement("p");
    ensureLiveRegion(el);
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
  });

  it("does not overwrite an existing aria-live value", () => {
    const el = document.createElement("p");
    el.setAttribute("aria-live", "assertive");
    ensureLiveRegion(el);
    expect(el.getAttribute("aria-live")).toBe("assertive");
  });

  it("labels the element during a transition and clears it after", () => {
    const el = document.createElement("p");
    beginAccessibleTransition(el, "Hello");
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.getAttribute("aria-label")).toBe("Hello");
    endAccessibleTransition(el);
    expect(el.hasAttribute("aria-busy")).toBe(false);
    expect(el.hasAttribute("aria-label")).toBe(false);
  });
});
