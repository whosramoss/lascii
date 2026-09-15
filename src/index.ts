import LasciiImageEffect from "./core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "./core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./adapters/dom/initDom.js";

export type { Disposable } from "./core/disposable.js";
export type { InitDomOptions } from "./adapters/dom/initDom.js";
export type {
  LasciiCompleteDetail,
  LasciiErrorDetail,
  LasciiEventName,
  LasciiProgressDetail,
  LasciiStartDetail,
} from "./core/events.js";
export { LasciiEvent } from "./core/events.js";
export { LasciiImageEffect, LasciiTextEffect, initDom as init, autoInitDom };
export default {
  LasciiImageEffect,
  LasciiTextEffect,
  init: initDom,
  autoInitDom,
};
