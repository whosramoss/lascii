import { afterEach } from "vitest";

Object.defineProperty(HTMLElement.prototype, "innerText", {
  configurable: true,
  get(this: HTMLElement) {
    return this.textContent ?? "";
  },
  set(this: HTMLElement, value: string) {
    this.textContent = value;
  },
});

HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  document.body.replaceChildren();
});
