import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";

const IMAGE_SELECTOR = "[data-lascii-image]";
const TEXT_SELECTOR = "[data-lascii-text]";
const LAZY_ROOT_MARGIN = "100px";

const lazyStarted = new WeakSet<Element>();

export interface InitDomOptions {
  lazy?: boolean;
}

export function initDom(options: InitDomOptions = {}): void {
  if (options.lazy) {
    initLazyEffects();
    return;
  }

  LasciiImageEffect.init(IMAGE_SELECTOR);
  LasciiTextEffect.init(TEXT_SELECTOR);
}

export function autoInitDom(options: InitDomOptions = {}): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => initDom(options));
    return;
  }

  initDom(options);
}

function initLazyEffects(): void {
  if (typeof IntersectionObserver === "undefined") {
    LasciiImageEffect.init(IMAGE_SELECTOR);
    LasciiTextEffect.init(TEXT_SELECTOR);
    return;
  }

  const elements = document.querySelectorAll(
    `${IMAGE_SELECTOR}, ${TEXT_SELECTOR}`,
  );
  if (elements.length === 0) return;

  let remaining = 0;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        initLazyElement(entry.target);
        remaining -= 1;
        if (remaining === 0) {
          observer.disconnect();
        }
      }
    },
    { rootMargin: LAZY_ROOT_MARGIN },
  );

  elements.forEach((element) => {
    if (lazyStarted.has(element)) return;
    remaining += 1;
    observer.observe(element);
  });

  if (remaining === 0) {
    observer.disconnect();
  }
}

function initLazyElement(element: Element): void {
  if (lazyStarted.has(element)) return;
  lazyStarted.add(element);

  if (
    element instanceof HTMLImageElement &&
    element.matches(IMAGE_SELECTOR)
  ) {
    new LasciiImageEffect(element, 0);
    return;
  }

  if (element instanceof HTMLElement && element.matches(TEXT_SELECTOR)) {
    new LasciiTextEffect(element);
  }
}
