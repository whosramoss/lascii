import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";

export function initDom() {
  LasciiImageEffect.init("[data-lascii-image]");
  LasciiTextEffect.init("[data-lascii-text]");
}

export function autoInitDom() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDom);
    return;
  }

  initDom();
}
