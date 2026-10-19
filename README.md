# Relational @ DevDays

Booth app for the DevDays recruitment event: **Big O**, a Higher or Lower game about software
development. One Ionic + Angular progressive web app (PWA) runs installed and pinned on the booth
tablets and opens on visitors' phones from a QR code.

This repository is **public** (GitHub Pages on GitHub Free). Never commit secrets, internal
documents or internal URLs. Brand assets are committed only in their derived, public form
(fonts, logo, colours).

## Stack

- Angular 22 (standalone components, signals, zoneless change detection)
- Ionic 9 (`@ionic/angular`, Material mode on every platform)
- `@angular/service-worker`: offline app shell; installed apps poll for new versions every
  15 minutes and offer a reload
- Relational brand (colours, Sofia Sans, logo, icons): see [docs/brand.md](docs/brand.md). The
  fonts are under the SIL Open Font License ([src/theme/fonts/OFL.txt](src/theme/fonts/OFL.txt)).

## The game

Two cards, one question: is the second number higher or lower than the first? The questions are
data ([src/app/game/packs/devdays-2026.json](src/app/game/packs/devdays-2026.json)), every number
has a public source and a date, and a unit test checks the pack before each deploy. The best score
is kept per device, with no names and no server. See [docs/game.md](docs/game.md) for the rules,
the pack format, booth mode and setting up a tablet.

## Develop

```bash
npm ci
npm start          # http://localhost:4200 (service worker disabled in dev mode; ?booth / ?booth=off switch booth mode)
npm test           # unit tests (Vitest)
npm run build      # production build in dist/relational-devdays/browser, plus 404.html and 3rdpartylicenses.txt
```

To try the service worker and install prompt locally, serve the production build over HTTP, for
example `npx http-server dist/relational-devdays/browser -p 8080 -c-1`, and open
`http://localhost:8080`.

## Routing on GitHub Pages

Pages has no SPA rewrites. `npm run build` copies `index.html` to `404.html` (see
[scripts/spa-fallback.mjs](scripts/spa-fallback.mjs)), so a deep link loads the app on a first
visit; after that the service worker serves every navigation.

## Hosting

Every push to `main` deploys to <https://relational-sa.github.io/relational-devdays/>
([.github/workflows/deploy.yml](.github/workflows/deploy.yml)). See [docs/hosting.md](docs/hosting.md)
for the repository rules, the QR code, and an optional custom subdomain.

## Copyright

© 2026 Relational S.A. All rights reserved.

This repository is public only so that GitHub Pages can serve the app. No licence is granted to
use, copy, modify or distribute its contents, beyond what the GitHub Terms of Service allow for
viewing and forking public repositories on GitHub. Relational, the Relational logo and other
Relational marks are trademarks of Relational S.A. and may not be used without its written
permission.

Third-party components keep their own licences: Sofia Sans is under the SIL Open Font License 1.1
([src/theme/fonts/OFL.txt](src/theme/fonts/OFL.txt)), and the site publishes the licences of the
npm packages it bundles at
<https://relational-sa.github.io/relational-devdays/3rdpartylicenses.txt>
([scripts/third-party-licenses.mjs](scripts/third-party-licenses.mjs)).
