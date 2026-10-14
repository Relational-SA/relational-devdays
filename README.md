# Relational @ DevDays

Booth app for the DevDays recruitment event: one Ionic + Angular progressive web app (PWA) that
runs installed and pinned on the booth tablets and opens on visitors' phones from a QR code.

This repository is **public** (GitHub Pages on GitHub Free). Never commit secrets, internal
documents or internal URLs. Brand assets are committed only in their derived, public form
(fonts, logo, colours).

## Stack

- Angular 22 (standalone components, zone.js change detection)
- Ionic 9 (`@ionic/angular`, Material mode on every platform)
- `@angular/service-worker`: offline app shell; installed apps poll for new versions every
  15 minutes and offer a reload

## Develop

```bash
npm ci
npm start          # http://localhost:4200 (service worker disabled in dev mode)
npm test           # unit tests (Vitest)
npm run build      # production build in dist/relational-devdays/browser, plus 404.html
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
