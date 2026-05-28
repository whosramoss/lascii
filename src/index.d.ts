import LasciiImageEffect from "./core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "./core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./adapters/dom/initDom.js";

export { LasciiImageEffect, LasciiTextEffect };
export { initDom as init, autoInitDom };

declare const lascii: {
  LasciiImageEffect: typeof LasciiImageEffect;
  LasciiTextEffect: typeof LasciiTextEffect;
  init: typeof initDom;
  autoInitDom: typeof autoInitDom;
};

export default lascii;
