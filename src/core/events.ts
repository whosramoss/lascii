export const LasciiEvent = {
  Start: "start",
  Progress: "progress",
  Complete: "complete",
  Error: "error",
} as const;

export type LasciiEventName = (typeof LasciiEvent)[keyof typeof LasciiEvent];

export interface LasciiStartDetail {
  text: string;
}

export interface LasciiProgressDetail {
  progress: number;
}

export interface LasciiCompleteDetail {
  text: string;
}

export interface LasciiErrorDetail {
  error: Error;
}

export interface LasciiEventDetailMap {
  start: LasciiStartDetail;
  progress: LasciiProgressDetail;
  complete: LasciiCompleteDetail;
  error: LasciiErrorDetail;
}

type LasciiListener<K extends keyof LasciiEventDetailMap> = (
  event: CustomEvent<LasciiEventDetailMap[K]>,
) => void;

/**
 * Typed EventTarget used by lascii effects.
 * Listeners can be attached after construction; the first animation
 * frame is scheduled on a microtask.
 */
export class LasciiEmitter extends EventTarget {
  addEventListener<K extends keyof LasciiEventDetailMap>(
    type: K,
    listener: LasciiListener<K>,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void;
  addEventListener(
    type: string,
    listener: unknown,
    options?: boolean | AddEventListenerOptions,
  ): void {
    super.addEventListener(
      type,
      listener as EventListenerOrEventListenerObject | null,
      options,
    );
  }

  removeEventListener<K extends keyof LasciiEventDetailMap>(
    type: K,
    listener: LasciiListener<K>,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    listener: unknown,
    options?: boolean | EventListenerOptions,
  ): void {
    super.removeEventListener(
      type,
      listener as EventListenerOrEventListenerObject | null,
      options,
    );
  }

  protected emit<K extends keyof LasciiEventDetailMap>(
    type: K,
    detail: LasciiEventDetailMap[K],
  ): void {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
