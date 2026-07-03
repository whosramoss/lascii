import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";

export function initDom(): void {
  LasciiImageEffect.init("[data-lascii-image]");
  LasciiTextEffect.init("[data-lascii-text]");
}

export function autoInitDom(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDom);
    return;
  }

  initDom();
}
