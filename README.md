<h1>
  <p align="center">
    <img src="https://lascii.whosramoss.com/icons/android-chrome-512x512.png" alt="logo" width="128">
    <br>LASCII
  </p>
</h1>

<p align="center">
 Lightweight ASCII animation effects for the web. Transform images and text into living character art.
  <br /> <br />
  <a href="#how-to-install">Install</a>
  ·
  <a href="#usage">Usage</a>
  ·
  <a href="#effects">Effects</a>
</p>

<p align="center">
  <a href="https://lascii.whosramoss.com">Live demo</a>
</p>

## How to install

```bash
npm install lascii
```

## Usage

Add `data-lascii-text` or `data-lascii-image` attributes to your elements and import the auto-init entry:

```html
<script type="module">
  import "lascii/auto";
</script>

<p data-lascii-text>Hello World</p>
<p data-lascii-text>First|:|Second|:|Third</p>

<div style="position: relative; aspect-ratio: 4/5; overflow: hidden;">
  <img data-lascii-image src="photo.jpg" alt="photo" />
</div>
```

The effect auto-initializes on DOM ready. No configuration needed.

## Effects

### Text effect

| Feature       | How                                                  |
| ------------- | ---------------------------------------------------- |
| Single reveal | `<p data-lascii-text>Hello</p>`                      |
| Loop phrases  | Separate with `\|:\|` — `First\|:\|Second\|:\|Third` |

### Image effect

Wrap an `<img>` with `data-lascii-image` inside a positioned container with `overflow: hidden`. The effect samples the image, renders an ASCII canvas animation, then fades to the original.

### Configuration

By default, `import "lascii/auto"` runs `init()` on DOM ready and uses built-in defaults. To customize behavior, import the effect classes from `lascii` (side-effect free), pass an options object to the constructor (merged over `DEFAULTS`), and wire elements yourself.

See the **[API reference](./docs/API.md)** for all options, exports, and TypeScript types.

### Manual setup

```js
import LasciiTextEffect from "lascii/core/text";
import LasciiImageEffect from "lascii/core/image";

document.querySelectorAll("[data-lascii-image]").forEach((img, index) => {
  new LasciiImageEffect(img, index, { SCRAMBLE_COUNT: 20 });
});

new LasciiTextEffect(document.querySelector(".headline"), {
  phraseDelay: 1200,
  revealOrigin: LasciiTextEffect.RevealOrigin.MIDDLE,
});
```

For auto-init without pulling unused effect code into your bundle, use `import "lascii/auto"`. For manual control, use `lascii/core/*` and call `.init()` yourself — details in [API](./docs/API.md).

## TypeScript

Declaration files ship with the package. No separate `@types` package required.

```ts
import { LasciiTextEffect, LasciiImageEffect } from "lascii";
```
