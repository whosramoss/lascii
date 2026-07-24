import LasciiImageEffect from "./core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "./core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./adapters/dom/initDom.js";

export { LasciiImageEffect, LasciiTextEffect, initDom as init, autoInitDom };
export default {
  LasciiImageEffect,
  LasciiTextEffect,
  init: initDom,
  autoInitDom,
};
