import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const isDev = process.env.npm_lifecycle_event === "dev";

  return {
    entry: {
      index: "src/index.ts",
      auto: "src/auto.ts",
      "dom/index": "src/adapters/dom/index.ts",
      "core/text/index": "src/core/effects/LasciiTextEffect.ts",
      "core/image/index": "src/core/effects/LasciiImageEffect.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    minify: !isDev,
    treeshake: true,
    target: "es2020",
    platform: "browser",
    splitting: true,
    clean: !options.watch,
    outDir: "dist",
  };
});
