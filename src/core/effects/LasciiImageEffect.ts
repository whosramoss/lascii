import { type Disposable, ResourceTracker } from "../disposable.js";
import {
  type LasciiErrorContext,
  type LasciiErrorType,
  logLasciiError,
  toError,
} from "../errors.js";

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

class LasciiImageEffect implements Disposable {
  static DEFAULTS: LasciiImageEffectDefaults = {
    ASCII_CHARS: " . . . . . . :::=+xX#0369",
    FONT_SIZE: 40,
    ASPECT_WIDTH: 4,
    ASPECT_HEIGHT: 5,
    ASCII_COLUMNS: 25,
    MAX_ASCII_COLUMNS: 96,
    TARGET_CELL_CSS_PX: 9,
    IMAGE_STAGGER_MS: 100,
    CELL_APPEAR_MS: 0.5,
    SCRAMBLE_COUNT: 10,
    SCRAMBLE_SPEED_MS: 50,
    REVEAL_DELAY_MS: 0,
    BACKGROUND_COLOR: "transparent",
    TEXT_COLOR: "#c8c8c8",
  };

  img: HTMLImageElement;
  index: number;
  config: LasciiImageEffectDefaults;
  _minAsciiColumns: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D | null;
  staggerDelay: number;
  failed: boolean;
  charWidth!: number;
  charHeight!: number;
  ASCII_ROWS!: number;
  denseCharIndex!: number;
  denseChars!: string[];
  samplingImg!: HTMLImageElement;
  private readonly tracker = new ResourceTracker();
  private readonly activeTimeouts: Array<ReturnType<typeof setTimeout>> = [];
  private scrambleTicker: ReturnType<typeof setInterval> | null = null;

  constructor(
    img: HTMLImageElement,
    index = 0,
    options: LasciiImageEffectOptions = {},
  ) {
    this.img = img;
    this.img.style.opacity = "0";
    this.index = index;
    this.config = { ...LasciiImageEffect.DEFAULTS, ...options };
    this._minAsciiColumns = this.config.ASCII_COLUMNS;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.staggerDelay = this.index * this.config.IMAGE_STAGGER_MS;
    this.failed = false;

    this.tracker.track(() => {
      this.clearTimers();
      this.canvas.remove();
      this.clearSamplingImage();
    });

    if (!this.ctx) {
      this.handleError(
        "canvas_context_unavailable",
        new Error("Unable to acquire 2d rendering context"),
      );
      return;
    }

    this.load();
  }

  get disposed(): boolean {
    return this.tracker.isDisposed;
  }

  dispose(): void {
    if (this.tracker.isDisposed) return;
    this.failed = true;
    this.tracker.dispose();
    this.img.style.opacity = "1";
  }

  private ensureNotDisposed(): void {
    if (this.tracker.isDisposed) {
      throw new Error("LasciiImageEffect has been disposed");
    }
  }

  private clearSamplingImage(): void {
    if (!this.samplingImg) return;
    this.samplingImg.onload = null;
    this.samplingImg.onerror = null;
    this.samplingImg.src = "";
  }

  private clearTimers(): void {
    for (const id of this.activeTimeouts) {
      clearTimeout(id);
    }
    this.activeTimeouts.length = 0;
    if (this.scrambleTicker !== null) {
      clearInterval(this.scrambleTicker);
      this.scrambleTicker = null;
    }
  }

  private trackTimeout(
    handler: () => void,
    delay: number,
  ): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      const index = this.activeTimeouts.indexOf(id);
      if (index >= 0) this.activeTimeouts.splice(index, 1);
      handler();
    }, delay);
    this.activeTimeouts.push(id);
    return id;
  }

  private trackAnimationFrame(handler: FrameRequestCallback): number {
    const id = requestAnimationFrame((time) => {
      handler(time);
    });
    this.tracker.track(() => cancelAnimationFrame(id));
    return id;
  }

  private handleError(
    type: LasciiErrorType | string,
    error: unknown,
    context: LasciiErrorContext = {},
  ): void {
    if (this.failed || this.tracker.isDisposed) return;
    this.failed = true;
    logLasciiError(type, error, {
      element: this.img,
      config: this.config,
      ...context,
    });
    this.clearTimers();
    this.cleanup();
    this.fallbackToOriginal();
  }

  private cleanup(): void {
    this.canvas.remove();
    this.clearSamplingImage();
  }

  private fallbackToOriginal(): void {
    this.img.style.opacity = "1";
  }

  applyDisplayScaledColumns(): void {
    const rect = this.img.getBoundingClientRect();
    const width = rect.width;
    if (width < 8) return;
    const target = this.config.TARGET_CELL_CSS_PX;
    const maxCols = this.config.MAX_ASCII_COLUMNS;
    const cols = Math.min(
      maxCols,
      Math.max(this._minAsciiColumns, Math.round(width / target)),
    );
    this.config.ASCII_COLUMNS = cols;
  }

  measureCharacters(): void {
    const measureCtx = document.createElement("canvas").getContext("2d");
    if (!measureCtx) {
      throw new Error("Unable to acquire 2d context for character measurement");
    }
    measureCtx.font = `${this.config.FONT_SIZE}px monospace`;
    this.charWidth = Math.ceil(measureCtx.measureText("M").width);
    this.charHeight = this.config.FONT_SIZE;
    this.ASCII_ROWS = Math.round(
      this.config.ASCII_COLUMNS *
        (this.config.ASPECT_HEIGHT / this.config.ASPECT_WIDTH) *
        (this.charWidth / this.charHeight),
    );
    this.denseCharIndex = this.config.ASCII_CHARS.lastIndexOf(".");
    this.denseChars = this.config.ASCII_CHARS.slice(
      this.denseCharIndex + 1,
    ).split("");
  }

  prepareCanvas(): void {
    if (!this.ctx) {
      throw new Error("Canvas 2d context is not available");
    }
    this.canvas.width = this.config.ASCII_COLUMNS * this.charWidth;
    this.canvas.height = this.ASCII_ROWS * this.charHeight;
    this.ctx.font = `${this.charHeight}px monospace`;
    this.ctx.textBaseline = "top";
  }

  attachCanvas(): void {
    const wrapper = this.img.parentElement;
    if (wrapper) {
      this.img.style.opacity = "0";
      this.canvas.style.position = "absolute";
      this.canvas.style.top = "0";
      this.canvas.style.left = "0";
      this.canvas.style.width = "100%";
      this.canvas.style.height = "100%";
      this.canvas.style.objectFit = "cover";
      const computedPosition = getComputedStyle(wrapper).position;
      if (computedPosition === "static") {
        wrapper.style.position = "relative";
      }
      if (!this.canvas.isConnected) {
        wrapper.appendChild(this.canvas);
      }
    }
  }

  load(): void {
    if (this.failed || this.tracker.isDisposed) return;

    this.samplingImg = new Image();
    this.samplingImg.crossOrigin = "anonymous";
    this.samplingImg.onload = () => {
      if (this.failed || this.tracker.isDisposed) return;
      this.trackAnimationFrame(() => {
        if (this.failed || this.tracker.isDisposed) return;
        this.trackAnimationFrame(() => {
          if (this.failed || this.tracker.isDisposed) return;
          try {
            this.applyDisplayScaledColumns();
            this.measureCharacters();
            this.prepareCanvas();
            this.attachCanvas();
            this.start();
          } catch (error) {
            this.handleError("canvas_initialization_failed", error);
          }
        });
      });
    };
    this.samplingImg.onerror = () => {
      this.handleError(
        "image_load_failed",
        new Error("Failed to load sampling image"),
        { src: this.img.src },
      );
    };
    this.samplingImg.src = this.img.src;
  }

  start(): void {
    this.ensureNotDisposed();
    if (this.failed || !this.ctx) return;
    try {
      const { asciiGrid, brightnessGrid } = this.imageToAsciiGrid();
      this.animateCells(asciiGrid, brightnessGrid);
    } catch (error) {
      this.handleError("image_animation_failed", error);
    }
  }

  imageToAsciiGrid(): {
    asciiGrid: string[][];
    brightnessGrid: number[][];
  } {
    const img = this.samplingImg;
    const imageAspect = img.naturalWidth / img.naturalHeight;
    const itemAspect = this.config.ASPECT_WIDTH / this.config.ASPECT_HEIGHT;
    let cropX = 0;
    let cropY = 0;
    let cropW = img.naturalWidth;
    let cropH = img.naturalHeight;

    if (imageAspect > itemAspect) {
      cropW = img.naturalHeight * itemAspect;
      cropX = (img.naturalWidth - cropW) / 2;
    } else {
      cropH = img.naturalWidth / itemAspect;
      cropY = (img.naturalHeight - cropH) / 2;
    }

    const samplingCanvas = document.createElement("canvas");
    const samplingCtx = samplingCanvas.getContext("2d");
    if (!samplingCtx) {
      throw new Error("Unable to acquire 2d context for image sampling");
    }
    samplingCanvas.width = this.config.ASCII_COLUMNS;
    samplingCanvas.height = this.ASCII_ROWS;
    samplingCtx.drawImage(
      img,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      this.config.ASCII_COLUMNS,
      this.ASCII_ROWS,
    );

    const { data } = samplingCtx.getImageData(
      0,
      0,
      this.config.ASCII_COLUMNS,
      this.ASCII_ROWS,
    );
    const asciiGrid: string[][] = [];
    const brightnessGrid: number[][] = [];

    for (let row = 0; row < this.ASCII_ROWS; row++) {
      const asciiRow: string[] = [];
      const brightnessRow: number[] = [];
      for (let col = 0; col < this.config.ASCII_COLUMNS; col++) {
        const pixelIndex = (row * this.config.ASCII_COLUMNS + col) * 4;
        const brightness =
          (data[pixelIndex] * 0.299 +
            data[pixelIndex + 1] * 0.587 +
            data[pixelIndex + 2] * 0.114) /
          255;
        const charIndex = Math.min(
          this.config.ASCII_CHARS.length - 1,
          Math.floor((1 - brightness) * this.config.ASCII_CHARS.length),
        );
        asciiRow.push(this.config.ASCII_CHARS[charIndex]);
        brightnessRow.push(charIndex);
      }
      asciiGrid.push(asciiRow);
      brightnessGrid.push(brightnessRow);
    }

    return { asciiGrid, brightnessGrid };
  }

  animateCells(
    asciiGrid: string[][],
    brightnessGrid: number[][],
  ): void {
    const totalCells = this.config.ASCII_COLUMNS * this.ASCII_ROWS;
    const scrambleState: (number | null)[] = new Array(totalCells).fill(null);
    let settledCount = 0;

    const cellOrder = this.shuffleArray(
      Array.from({ length: totalCells }, (_, i) => i),
    );

    const failAnimation = (error: unknown): void => {
      this.clearTimers();
      this.handleError("image_animation_failed", toError(error));
    };

    this.scrambleTicker = setInterval(() => {
      if (this.failed || this.tracker.isDisposed) {
        this.clearTimers();
        return;
      }
      try {
        let stillScrambling = false;
        for (let cellIndex = 0; cellIndex < totalCells; cellIndex++) {
          const remaining = scrambleState[cellIndex];
          if (remaining === null || remaining <= 0) continue;
          stillScrambling = true;
          const row = Math.floor(cellIndex / this.config.ASCII_COLUMNS);
          const col = cellIndex % this.config.ASCII_COLUMNS;

          if (remaining === 1) {
            this.drawCharacter(col, row, asciiGrid[row][col]);
            scrambleState[cellIndex] = 0;
            settledCount++;
            if (settledCount === totalCells) this.revealImage();
          } else {
            this.drawCharacter(col, row, this.randomDenseCharacter());
            scrambleState[cellIndex] = remaining - 1;
          }
        }
        if (!stillScrambling && settledCount === totalCells) {
          if (this.scrambleTicker !== null) {
            clearInterval(this.scrambleTicker);
            this.scrambleTicker = null;
          }
        }
      } catch (error) {
        failAnimation(error);
      }
    }, this.config.SCRAMBLE_SPEED_MS);

    cellOrder.forEach((cellIndex, i) => {
      this.trackTimeout(() => {
        if (this.failed || this.tracker.isDisposed) return;
        try {
          const row = Math.floor(cellIndex / this.config.ASCII_COLUMNS);
          const col = cellIndex % this.config.ASCII_COLUMNS;
          const isDark = brightnessGrid[row][col] > this.denseCharIndex;

          if (!isDark) {
            this.drawCharacter(col, row, asciiGrid[row][col]);
            scrambleState[cellIndex] = 0;
            settledCount++;
            if (settledCount === totalCells) this.revealImage();
          } else {
            scrambleState[cellIndex] = this.config.SCRAMBLE_COUNT;
          }
        } catch (error) {
          failAnimation(error);
        }
      }, this.staggerDelay + i * this.config.CELL_APPEAR_MS);
    });
  }

  drawCharacter(col: number, row: number, char: string): void {
    if (!this.ctx) {
      throw new Error("Canvas 2d context is not available");
    }
    this.ctx.fillStyle = this.config.BACKGROUND_COLOR;
    this.ctx.fillRect(
      col * this.charWidth,
      row * this.charHeight,
      this.charWidth,
      this.charHeight,
    );
    this.ctx.fillStyle = this.config.TEXT_COLOR;
    this.ctx.fillText(char, col * this.charWidth, row * this.charHeight);
  }

  randomDenseCharacter(): string {
    return this.denseChars[Math.floor(Math.random() * this.denseChars.length)];
  }

  revealImage(): void {
    if (this.failed || this.tracker.isDisposed) return;
    this.trackTimeout(() => {
      if (this.failed || this.tracker.isDisposed) return;
      this.canvas.style.transition = "opacity 0.5s ease";
      this.canvas.style.opacity = "0";
      this.img.style.transition = "opacity 0.5s ease";
      this.img.style.opacity = "1";
      this.trackTimeout(() => {
        this.canvas.remove();
      }, 500);
    }, this.config.REVEAL_DELAY_MS);
  }

  shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static init(selector = "[data-lascii-image]"): LasciiImageEffect[] {
    const images = document.querySelectorAll(selector);
    return Array.from(
      images,
      (img, index) => new LasciiImageEffect(img as HTMLImageElement, index),
    );
  }
}

export default LasciiImageEffect;
