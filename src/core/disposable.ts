/**
 * Contract for effects that own timers, animation frames, or DOM resources.
 */
export interface Disposable {
  dispose(): void;
}

/**
 * Tracks cleanup callbacks for timers, rAF, listeners, and DOM nodes.
 * Safe to call dispose() multiple times.
 */
export class ResourceTracker {
  private readonly resources: Array<() => void> = [];
  private disposed = false;

  get isDisposed(): boolean {
    return this.disposed;
  }

  track(cleanup: () => void): void {
    if (this.disposed) {
      cleanup();
      return;
    }
    this.resources.push(cleanup);
  }

  trackTimeout(id: ReturnType<typeof setTimeout>): ReturnType<typeof setTimeout> {
    this.track(() => clearTimeout(id));
    return id;
  }

  trackInterval(
    id: ReturnType<typeof setInterval>,
  ): ReturnType<typeof setInterval> {
    this.track(() => clearInterval(id));
    return id;
  }

  trackAnimationFrame(id: number): number {
    this.track(() => cancelAnimationFrame(id));
    return id;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const cleanup of this.resources.splice(0)) {
      try {
        cleanup();
      } catch {
        // Cleanup must not throw; ignore individual failures.
      }
    }
  }
}
