# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-02

### Changed

- Migrated library source from JavaScript to TypeScript.
- Build output is now compiled to `dist/` with generated `.d.ts` and source maps.
- TypeScript declarations are generated from source instead of hand-written files.

### Added

- `npm run build` script and `prepare` hook for automatic compilation on install.

## [1.0.0] - 2026-05-27

### Added

- Initial public release of `lascii`.
- `LasciiTextEffect` — scramble/reveal text with optional phrase looping (`|:|` separator).
- `LasciiImageEffect` — ASCII canvas animation with staggered cell reveal and image fade-in.
- DOM adapter with `data-lascii-text` and `data-lascii-image` attributes.
- Auto-initialization on `DOMContentLoaded` when importing `lascii` or `lascii/dom`.
- Subpath exports: `lascii/dom`, `lascii/core/text`, `lascii/core/image`.
- TypeScript declaration files for all public entry points.
- Documentation: README, API reference, contributing and security policies.

[1.1.0]: https://github.com/whosramoss/lascii/releases/tag/v1.1.0
[1.0.0]: https://github.com/whosramoss/lascii/releases/tag/v1.0.0
