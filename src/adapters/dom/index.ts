import LasciiImageEffect from "../../core/effects/LasciiImageEffect.js";
import LasciiTextEffect from "../../core/effects/LasciiTextEffect.js";
import { autoInitDom, initDom } from "./initDom.js";

export type { Disposable } from "../../core/disposable.js";
export type { InitDomOptions } from "./initDom.js";
export type {
  LasciiCompleteDetail,
  LasciiErrorDetail,
  LasciiEventName,
  LasciiProgressDetail,
  LasciiStartDetail,
} from "../../core/events.js";
export { LasciiEvent } from "../../core/events.js";
export { LasciiImageEffect, LasciiTextEffect, initDom, autoInitDom };
export default { LasciiImageEffect, LasciiTextEffect, initDom, autoInitDom };
