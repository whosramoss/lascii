import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./initDom.js";

export { LasciiImageEffect, LasciiTextEffect, initDom, autoInitDom };

declare const lasciiDom: {
  LasciiImageEffect: typeof LasciiImageEffect;
  LasciiTextEffect: typeof LasciiTextEffect;
  initDom: typeof initDom;
  autoInitDom: typeof autoInitDom;
};

export default lasciiDom;
