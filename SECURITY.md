# Security Policy

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue with exploit details.

Instead, use one of the following:

1. **[GitHub Security Advisories](https://github.com/whosramoss/lascii/security/advisories/new)** (preferred) — private report on the repository.
2. Contact the maintainer via the email listed on the [npm package page](https://www.npmjs.com/package/lascii) if you cannot use GitHub.

Include:

- A description of the issue and impact
- Steps to reproduce
- Affected versions
- Any suggested fix (optional)

We aim to acknowledge reports within **7 days** and will coordinate disclosure and a fix before publishing details when appropriate.

## Scope

This library runs in the browser and processes DOM content and images. Reports related to:

- Cross-origin image handling / canvas tainting
- XSS via unsanitized HTML injected around effect markup (e.g. `.dud` spans)
- Unexpected script execution from malformed inputs

are in scope when they stem from **library behavior**, not from application misuse (e.g. passing untrusted HTML as element content without sanitization).

Out of scope: vulnerabilities in the demo site hosting, third-party CDNs, or consumer applications that embed `lascii` incorrectly.
