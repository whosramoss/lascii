<h1>
  <p align="center">
    <img src="https://lascii.whosramoss.com/icons/android-chrome-512x512.png" alt="logo" width="128">
    <br>LASCII
  </p>
</h1>

<p align="center">
 Lightweight ASCII animation effects for the web. Transform images and text into living character art.
  <br /> <br />
  <a href="#how-to-install">How to install</a> 
  ·
  <a href="#usage">Usage</a>
   ·
  <a href="#effects">Effects</a>
</p>

<p align="center">
  <a href="https://lascii.whosramoss.com">Learn More</a>
</p>

## How to install

```bash
npm install lascii
```

## Usage

Add `data-lascii-text` or `data-lascii-image` attributes to your elements and import the module:

```html
<script type="module">
  import "lascii";
</script>

<p data-lascii-text>Hello World</p>
<p data-lascii-text>First|:|Second|:|Third</p>

<div style="position: relative; aspect-ratio: 4/5; overflow: hidden;">
  <img data-lascii-image src="photo.jpg" alt="photo" />
</div>
```

The effect auto-initializes on DOM ready. No configuration needed.

## Effects

### Text Effect

| Feature       | How                                                  |
| ------------- | ---------------------------------------------------- |
| Single reveal | `<p data-lascii-text>Hello</p>`                      |
| Loop phrases  | Separate with `\|:\|` — `First\|:\|Second\|:\|Third` |

### Image Effect

Wrap an `<img>` with `data-lascii-image` inside a positioned container with `overflow: hidden`. The effect samples the image, renders an ASCII canvas animation, then fades to the original.

### Configuration

By default, `import "lascii"` runs `init()` on DOM ready and uses built-in defaults. To customize behavior, use the programmatic API: import the effect classes, pass an options object to the constructor (merged over `DEFAULTS`), and wire elements yourself.

### Manual setup

```js
import { LasciiImageEffect, LasciiTextEffect, init } from "lascii";

// Optional: skip auto-init and control everything
document.querySelectorAll("[data-lascii-image]").forEach((img, index) => {
  new LasciiImageEffect(img, index, { SCRAMBLE_COUNT: 20 });
});

new LasciiTextEffect(document.querySelector(".headline"), {
  phraseDelay: 1200,
  revealOrigin: LasciiTextEffect.RevealOrigin.MIDDLE,
});
```
