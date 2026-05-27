class LasciiImageEffect {
  static DEFAULTS = {
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

  constructor(img, index = 0, options = {}) {
    this.img = img;
    this.img.style.opacity = "0";
    this.index = index;
    this.config = { ...LasciiImageEffect.DEFAULTS, ...options };
    this._minAsciiColumns = this.config.ASCII_COLUMNS;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.staggerDelay = this.index * this.config.IMAGE_STAGGER_MS;
    this.load();
  }

  applyDisplayScaledColumns() {
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

  measureCharacters() {
    const measureCtx = document.createElement("canvas").getContext("2d");
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

  prepareCanvas() {
    this.canvas.width = this.config.ASCII_COLUMNS * this.charWidth;
    this.canvas.height = this.ASCII_ROWS * this.charHeight;
    this.ctx.font = `${this.charHeight}px monospace`;
    this.ctx.textBaseline = "top";
  }

  attachCanvas() {
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

  load() {
    this.samplingImg = new Image();
    this.samplingImg.crossOrigin = "anonymous";
    this.samplingImg.onload = () => {
      const kickoff = () => {
        try {
          this.applyDisplayScaledColumns();
          this.measureCharacters();
          this.prepareCanvas();
          this.attachCanvas();
          this.start();
        } catch (error) {
          this.img.style.opacity = "1";
          this.canvas.remove();
        }
      };
      requestAnimationFrame(() => {
        requestAnimationFrame(kickoff);
      });
    };
    this.samplingImg.onerror = () => {
      this.img.style.opacity = "1";
      this.canvas.remove();
    };
    this.samplingImg.src = this.img.src;
  }

  start() {
    const { asciiGrid, brightnessGrid } = this.imageToAsciiGrid();
    this.animateCells(asciiGrid, brightnessGrid);
  }

  imageToAsciiGrid() {
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
    const asciiGrid = [];
    const brightnessGrid = [];

    for (let row = 0; row < this.ASCII_ROWS; row++) {
      const asciiRow = [];
      const brightnessRow = [];
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

  animateCells(asciiGrid, brightnessGrid) {
    const totalCells = this.config.ASCII_COLUMNS * this.ASCII_ROWS;
    const scrambleState = new Array(totalCells).fill(null);
    let settledCount = 0;

    const cellOrder = this.shuffleArray(
      Array.from({ length: totalCells }, (_, i) => i),
    );

    cellOrder.forEach((cellIndex, i) => {
      setTimeout(
        () => {
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
        },
        this.staggerDelay + i * this.config.CELL_APPEAR_MS,
      );
    });

    const scrambleTicker = setInterval(() => {
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
        clearInterval(scrambleTicker);
      }
    }, this.config.SCRAMBLE_SPEED_MS);
  }

  drawCharacter(col, row, char) {
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

  randomDenseCharacter() {
    return this.denseChars[Math.floor(Math.random() * this.denseChars.length)];
  }

  revealImage() {
    setTimeout(() => {
      this.canvas.style.transition = "opacity 0.5s ease";
      this.canvas.style.opacity = "0";
      this.img.style.transition = "opacity 0.5s ease";
      this.img.style.opacity = "1";
      setTimeout(() => {
        this.canvas.remove();
      }, 500);
    }, this.config.REVEAL_DELAY_MS);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  static init(selector = "[data-lascii-image]") {
    const images = document.querySelectorAll(selector);
    images.forEach((img, index) => {
      new LasciiImageEffect(img, index);
    });
  }
}

export default LasciiImageEffect;
