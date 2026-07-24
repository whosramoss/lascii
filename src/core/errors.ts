export type LasciiErrorType =
  | "canvas_context_unavailable"
  | "canvas_initialization_failed"
  | "image_load_failed"
  | "image_animation_failed"
  | "text_effect_initialization_failed"
  | "text_effect_animation_failed";

export interface LasciiErrorContext {
  [key: string]: unknown;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}

/**
 * Structured logging for recoverable lascii failures.
 * Keeps production debugging possible without throwing to the page.
 */
export function logLasciiError(
  type: LasciiErrorType | string,
  error: unknown,
  context: LasciiErrorContext = {},
): void {
  const err = toError(error);
  console.warn(`[lascii] ${type}:`, err.message, context);
}
