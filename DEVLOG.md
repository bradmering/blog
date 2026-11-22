# DEVLOG

## 2026-11-21 — security patches
- npm audit: 20 vulns (1 critical, 8 high, 11 moderate) -> 0. Dependabot alerts disabled on repo (403).
- next + eslint-config-next 16.2.9 -> 16.4.6 (same major; latest); `npm audit fix` for transitive deps (sharp, zod, brace-expansion, browserslist, js-yaml, etc.).
- Added `overrides.postcss-selector-parser: ^7.1.1` (typography's only "fix" was a downgrade to 0.5.4).
- Checks: tsc clean, build OK. `npm run lint` has pre-existing no-explicit-any errors (39) in source, unrelated.
