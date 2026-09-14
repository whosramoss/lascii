const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(override?: boolean): boolean {
  if (typeof override === "boolean") return override;
  if (typeof matchMedia !== "function") return false;
  return matchMedia(REDUCE_MOTION_QUERY).matches;
}

export function ensureLiveRegion(element: HTMLElement): void {
  if (!element.hasAttribute("aria-live")) {
    element.setAttribute("aria-live", "polite");
  }
  if (!element.hasAttribute("aria-atomic")) {
    element.setAttribute("aria-atomic", "true");
  }
}

export function beginAccessibleTransition(
  element: HTMLElement,
  label: string,
): void {
  element.setAttribute("aria-busy", "true");
  element.setAttribute("aria-label", label);
}

export function endAccessibleTransition(element: HTMLElement): void {
  element.removeAttribute("aria-busy");
  element.removeAttribute("aria-label");
}
