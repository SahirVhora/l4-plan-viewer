# Development dependency maintenance

Vitest and its UI are kept on the patched 4.1.12 line. Workbox's glob dependency
is overridden to 14.0.6, whose dependency chain includes patched minimatch 11.
The override is limited to Workbox and leaves ExcelJS's older glob implementation
unchanged. The PWA production build still generates its service worker and
precache manifest successfully.

Sources:
- https://github.com/advisories/GHSA-qxg6-89mg-rqv8
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
- https://github.com/advisories/GHSA-g3hv-75wg-m249

The remaining low-severity advisory, GHSA-gcqx-w48m-w2h4, affects deepmerge through
the Workbox/Rollup build chain. The latest upstream release is 4.3.1 and the
advisory lists no patched version. No audit finding is suppressed. Avoid feeding
untrusted configuration objects into this build tooling and review the upstream
fix when one is published.

Source: https://github.com/advisories/GHSA-gcqx-w48m-w2h4

Validation: clean installation, lint, all 21 unit tests, production/PWA build and
npm audit. Remove the Workbox override once its dependency floor includes the fix.
