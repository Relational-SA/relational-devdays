// The production build writes the licences of the bundled npm packages to 3rdpartylicenses.txt
// next to the browser folder, which Pages does not serve. Copying it into the site publishes the
// notices with the code they cover. Runs automatically after `npm run build`.
import { copyFileSync, existsSync } from 'node:fs';

const distDir = 'dist/relational-devdays';
const licenses = `${distDir}/3rdpartylicenses.txt`;

if (!existsSync(licenses)) {
  console.error(`third-party-licenses: ${licenses} not found; run the production build first.`);
  process.exit(1);
}

copyFileSync(licenses, `${distDir}/browser/3rdpartylicenses.txt`);
console.log(`third-party-licenses: copied 3rdpartylicenses.txt to ${distDir}/browser`);
