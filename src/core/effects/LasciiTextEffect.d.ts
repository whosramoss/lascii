export type RevealOriginValue = "start" | "middle";

export interface LasciiTextEffectOptions {
  introChars?: string;
  introPhaseFrames?: number;
  chars?: string;
  frameStartMax?: number;
  frameEndMax?: number;
  randomCharChance?: number;
  phraseDelay?: number;
  separator?: string;
  revealOrigin?: RevealOriginValue;
}

export interface LasciiTextEffectDefaults extends Required<LasciiTextEffectOptions> {}

declare class LasciiTextEffect {
  static readonly RevealOrigin: Readonly<{
    readonly START: "start";
    readonly MIDDLE: "middle";
  }>;

  static readonly DEFAULTS: LasciiTextEffectDefaults;

  readonly el: HTMLElement;
  readonly config: LasciiTextEffectDefaults;

  constructor(element: HTMLElement, options?: LasciiTextEffectOptions);

  setText(newText: string): Promise<void>;

  static init(selector?: string): void;
}

export default LasciiTextEffect;
export { LasciiTextEffect };
