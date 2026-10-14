// GitHub Pages has no SPA rewrites: serving the app shell as 404.html makes deep links
// (e.g. a QR code pointing at /some/route) load the app on first visit, before the
// service worker is installed. Runs automatically after `npm run build`.
import { copyFileSync, existsSync } from 'node:fs';

const outDir = 'dist/relational-devdays/browser';
const index = `${outDir}/index.html`;

if (!existsSync(index)) {
  console.error(`spa-fallback: ${index} not found; run the production build first.`);
  process.exit(1);
}

copyFileSync(index, `${outDir}/404.html`);
console.log(`spa-fallback: copied index.html to ${outDir}/404.html`);
