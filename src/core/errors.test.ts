import { describe, expect, it, vi } from "vitest";
import { logLasciiError, toError } from "./errors.js";

describe("toError", () => {
  it("returns Error values unchanged", () => {
    const error = new Error("kept");
    expect(toError(error)).toBe(error);
  });

  it("wraps non-Error values", () => {
    const error = toError("fail");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("fail");
  });
});

describe("logLasciiError", () => {
  it("writes a structured warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    logLasciiError("text_effect_animation_failed", new Error("nope"), {
      newText: "Hi",
    });
    expect(warn).toHaveBeenCalledWith(
      "[lascii] text_effect_animation_failed:",
      "nope",
      { newText: "Hi" },
    );
  });
});
