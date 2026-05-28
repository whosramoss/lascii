# Contributing to lascii

Thank you for your interest in contributing. This project is a small, focused library — keep changes scoped and well-tested in the demo when possible.

## Getting started

1. Fork and clone the repository.
2. Install dependencies for the demo app (the npm package itself has no runtime dependencies):

   ```bash
   cd www
   npm install
   npm run dev
   ```

3. The library source lives in `src/` at the repository root. The `www/` folder is a Vite demo and is **not** published to npm.

## Development workflow

1. Create a branch from `main`.
2. Make your changes in `src/`.
3. Verify behavior in `www/` (text and image effects).
4. Update `CHANGELOG.md` under **Unreleased** (or the appropriate version) for user-facing changes.
5. Open a pull request with a clear description and, if relevant, a link to the demo behavior you changed.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/) in English:

- `feat:` — new behavior
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code change without behavior change
- `chore:` — tooling, metadata

Examples:

```
feat(core): add reveal easing option to text effect
fix(dom): skip elements with empty text content
docs: clarify image wrapper requirements in API
```

## Code guidelines

- Match existing style: ES modules, native classes, minimal dependencies.
- Prefer extending `DEFAULTS` over one-off magic numbers.
- Browser APIs only — no Node-specific APIs in `src/`.
- Keep files focused; split when a module grows beyond ~300 lines.

## Pull requests

- One logical change per PR when possible.
- Do not include unrelated formatting or drive-by refactors.
- Ensure `npm pack --dry-run` still lists only intended files (`src/`, docs ship via `files` in `package.json`).

## Questions

Open a [GitHub Discussion](https://github.com/whosramoss/lascii/discussions) or an issue for questions before large refactors.
