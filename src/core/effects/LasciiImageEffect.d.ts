export interface LasciiImageEffectOptions {
  ASCII_CHARS?: string;
  FONT_SIZE?: number;
  ASPECT_WIDTH?: number;
  ASPECT_HEIGHT?: number;
  ASCII_COLUMNS?: number;
  MAX_ASCII_COLUMNS?: number;
  TARGET_CELL_CSS_PX?: number;
  IMAGE_STAGGER_MS?: number;
  CELL_APPEAR_MS?: number;
  SCRAMBLE_COUNT?: number;
  SCRAMBLE_SPEED_MS?: number;
  REVEAL_DELAY_MS?: number;
  BACKGROUND_COLOR?: string;
  TEXT_COLOR?: string;
}

export interface LasciiImageEffectDefaults
  extends Required<LasciiImageEffectOptions> {}

declare class LasciiImageEffect {
  static readonly DEFAULTS: LasciiImageEffectDefaults;

  readonly img: HTMLImageElement;
  readonly index: number;
  readonly config: LasciiImageEffectDefaults;

  constructor(
    img: HTMLImageElement,
    index?: number,
    options?: LasciiImageEffectOptions,
  );

  static init(selector?: string): void;
}

export default LasciiImageEffect;
export { LasciiImageEffect };
