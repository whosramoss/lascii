# API Reference

## Package entry points

| Import | Description |
| ------ | ----------- |
| `lascii` | Main entry. Auto-initializes on `DOMContentLoaded` via `autoInitDom()`. |
| `lascii/dom` | Same exports as main, but scoped to the DOM adapter (also auto-inits on import). |
| `lascii/core/text` | `LasciiTextEffect` only (no auto-init). |
| `lascii/core/image` | `LasciiImageEffect` only (no auto-init). |

Use `lascii/core/*` when you want full control and no side effects on import.

---

## `lascii` exports

```ts
import lascii, {
  LasciiTextEffect,
  LasciiImageEffect,
  init,
  autoInitDom,
} from "lascii";
```

| Export | Type | Description |
| ------ | ---- | ----------- |
| `LasciiTextEffect` | `class` | Scramble/reveal text animation. |
| `LasciiImageEffect` | `class` | ASCII canvas reveal for images. |
| `init` | `function` | Scans the DOM and starts effects (`initDom`). |
| `autoInitDom` | `function` | Registers `init` on `DOMContentLoaded`, or runs immediately if the document is ready. |
| `default` | `object` | `{ LasciiTextEffect, LasciiImageEffect, init, autoInitDom }`. |

### `init()` / `autoInitDom()`

`init()` (alias of `initDom`) runs:

- `LasciiImageEffect.init("[data-lascii-image]")`
- `LasciiTextEffect.init("[data-lascii-text]")`

`autoInitDom()` calls `init()` when the document is ready.

To avoid auto-init on import, use subpath imports:

```js
import { LasciiTextEffect } from "lascii/core/text";
import { LasciiImageEffect } from "lascii/core/image";
```

---

## Data attributes

| Attribute | Element | Behavior |
| --------- | ------- | -------- |
| `data-lascii-text` | Any text container | Reads `textContent`, runs text scramble effect. |
| `data-lascii-image` | `<img>` | Samples image, ASCII animation, then fades to original. |

### Text: phrase separator

Multiple phrases in one element are separated by `|:|` (configurable via `separator`):

```html
<p data-lascii-text>First|:|Second|:|Third</p>
```

When the separator is present, phrases loop with `phraseDelay` between transitions.

### Image: layout requirements

Place the image inside a **positioned** wrapper with **overflow hidden** and a defined aspect ratio (e.g. `aspect-ratio: 4/5`):

```html
<div style="position: relative; aspect-ratio: 4/5; overflow: hidden;">
  <img data-lascii-image src="photo.jpg" alt="photo" />
</div>
```

Cross-origin images need CORS headers on the image server (`crossOrigin = "anonymous"` is set internally).

---

## `LasciiTextEffect`

```js
import { LasciiTextEffect } from "lascii";
// or
import LasciiTextEffect from "lascii/core/text";
```

### Constructor

```js
new LasciiTextEffect(element, options?)
```

- **element** — DOM node whose `textContent` is the source string.
- **options** — Partial override of `LasciiTextEffect.DEFAULTS`.

On construction, the element’s text is cleared and the animation starts.

### Static members

#### `LasciiTextEffect.RevealOrigin`

| Key | Value | Effect |
| --- | ----- | ------ |
| `START` | `"start"` | Reveal progresses from the start of the string. |
| `MIDDLE` | `"middle"` | Reveal radiates from the center outward. |

#### `LasciiTextEffect.DEFAULTS`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `introChars` | `string` | `"█▓▒░x92"` | Character sequence shown at the start of each cell’s scramble. |
| `introPhaseFrames` | `number` | `10` | Frames to step through `introChars` before random chars. |
| `chars` | `string` | `"!<>-_\\/[]{}—=+*^?#________"` | Pool of random scramble characters. |
| `frameStartMax` | `number` | `40` | Max frames before a character begins scrambling (spread along string). |
| `frameEndMax` | `number` | `40` | Random extra scramble length cap per character. |
| `randomCharChance` | `number` | `0.28` | Probability of picking a new random char each frame. |
| `phraseDelay` | `number` | `800` | Ms between phrases when looping (`|:|`). |
| `separator` | `string` | `"\|:|"` | Delimiter between phrases in `textContent`. |
| `revealOrigin` | `string` | `"start"` | `"start"` or `"middle"` (`RevealOrigin`). |

Scramble characters are rendered in `<span class="dud">` — style `.dud` in your CSS if needed.

### Instance methods

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `setText(newText)` | `Promise<void>` | Animates from current text to `newText`. Resolves when complete (3s safety timeout). |

### Static methods

```js
LasciiTextEffect.init(selector = "[data-lascii-text]")
```

Creates one `LasciiTextEffect` per matching element.

### Example

```js
const effect = new LasciiTextEffect(document.querySelector(".headline"), {
  phraseDelay: 1200,
  revealOrigin: LasciiTextEffect.RevealOrigin.MIDDLE,
});

await effect.setText("Updated copy");
```

---

## `LasciiImageEffect`

```js
import { LasciiImageEffect } from "lascii";
// or
import LasciiImageEffect from "lascii/core/image";
```

### Constructor

```js
new LasciiImageEffect(img, index = 0, options?)
```

- **img** — `<img>` element. Opacity is set to `0` until reveal; a canvas is appended to the parent.
- **index** — Stagger index: delay = `index * IMAGE_STAGGER_MS`.
- **options** — Partial override of `LasciiImageEffect.DEFAULTS`.

### `LasciiImageEffect.DEFAULTS`

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `ASCII_CHARS` | `string` | `" . . . . . . :::=+xX#0369"` | Light-to-dark character ramp for luminance mapping. |
| `FONT_SIZE` | `number` | `40` | Monospace font size used for measurement and drawing. |
| `ASPECT_WIDTH` | `number` | `4` | Target crop aspect (width). |
| `ASPECT_HEIGHT` | `number` | `5` | Target crop aspect (height). |
| `ASCII_COLUMNS` | `number` | `25` | Minimum column count (may increase with container width). |
| `MAX_ASCII_COLUMNS` | `number` | `96` | Upper cap when scaling to container width. |
| `TARGET_CELL_CSS_PX` | `number` | `9` | Target cell size in CSS pixels for column scaling. |
| `IMAGE_STAGGER_MS` | `number` | `100` | Delay multiplier per image `index`. |
| `CELL_APPEAR_MS` | `number` | `0.5` | Delay between starting each cell animation. |
| `SCRAMBLE_COUNT` | `number` | `10` | Scramble frames for “dense” (dark) cells. |
| `SCRAMBLE_SPEED_MS` | `number` | `50` | Interval between scramble frame updates. |
| `REVEAL_DELAY_MS` | `number` | `0` | Delay before fading canvas out and showing the image. |
| `BACKGROUND_COLOR` | `string` | `"transparent"` | Canvas cell background. |
| `TEXT_COLOR` | `string` | `"#c8c8c8"` | ASCII character color. |

Column count is recalculated from the image’s displayed width:  
`cols = clamp(ASCII_COLUMNS, round(width / TARGET_CELL_CSS_PX), MAX_ASCII_COLUMNS)`.

### Static methods

```js
LasciiImageEffect.init(selector = "[data-lascii-image]")
```

Creates one `LasciiImageEffect` per matching image, with `index` from `forEach` order.

### Example

```js
document.querySelectorAll("[data-lascii-image]").forEach((img, index) => {
  new LasciiImageEffect(img, index, {
    SCRAMBLE_COUNT: 20,
    TEXT_COLOR: "#ffffff",
  });
});
```

---

## Import patterns

### Declarative (auto-init)

```html
<script type="module">
  import "lascii";
</script>
```

### Manual init (no constructor side effects until you call `init`)

```js
import { LasciiImageEffect, LasciiTextEffect, init } from "lascii";

// If you imported from "lascii", autoInitDom may already have run.
// Prefer core/* subpaths to avoid double init:

import LasciiTextEffect from "lascii/core/text";
import LasciiImageEffect from "lascii/core/image";
import { initDom } from "lascii/dom"; // note: lascii/dom still auto-inits on import

initDom();
```

To import DOM helpers without auto-init, import from `initDom` via a future dedicated export or duplicate `initDom` in your bundle by importing only from `lascii/core/*` and calling `.init()` yourself.

### Tree-shaking / side effects

`package.json` marks these as side-effectful:

- `./src/index.js`
- `./src/adapters/dom/index.js`

Bundlers will not drop them if imported. Use `lascii/core/text` and `lascii/core/image` for side-effect-free imports.
