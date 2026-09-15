import { describe, expect, it, vi } from "vitest";
import { ResourceTracker } from "./disposable.js";

describe("ResourceTracker", () => {
  it("runs tracked cleanups on dispose", () => {
    const tracker = new ResourceTracker();
    const cleanup = vi.fn();
    tracker.track(cleanup);
    expect(tracker.isDisposed).toBe(false);
    tracker.dispose();
    expect(tracker.isDisposed).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("is safe to dispose more than once", () => {
    const tracker = new ResourceTracker();
    const cleanup = vi.fn();
    tracker.track(cleanup);
    tracker.dispose();
    tracker.dispose();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("runs cleanup immediately when already disposed", () => {
    const tracker = new ResourceTracker();
    tracker.dispose();
    const cleanup = vi.fn();
    tracker.track(cleanup);
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("swallows cleanup errors so remaining resources still run", () => {
    const tracker = new ResourceTracker();
    const later = vi.fn();
    tracker.track(() => {
      throw new Error("boom");
    });
    tracker.track(later);
    expect(() => tracker.dispose()).not.toThrow();
    expect(later).toHaveBeenCalledOnce();
  });
});
