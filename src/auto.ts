/**
 * Side-effect entry: auto-initializes DOM effects on import.
 * Prefer this over the main entry when you want declarative `data-lascii-*` setup.
 */
import { autoInitDom } from "./adapters/dom/initDom.js";

autoInitDom();

export { autoInitDom, initDom as init } from "./adapters/dom/initDom.js";
