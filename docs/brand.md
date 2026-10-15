# Brand

The app follows the Relational Brand Manual 2025. The manual is an internal document: get it from
Marketing and never commit it to this public repository. This page records what the app takes
from it.

## Colours

| Token (`src/theme/variables.css`) | Ionic colour | Hex | Pantone | Role |
|---|---|---|---|---|
| `--rel-navy` | `primary` | `#25384a` | 7546 C | Primary colour: toolbar, text; white text on it |
| `--rel-aqua` | `secondary` | `#86cac6` | 564 C | Primary colour, the main background; navy text on it |
| `--rel-orange` | `tertiary` | `#f2ba44` | 7549 C | Secondary colour, highlights only |
| `--rel-purple` | - | `#ae19b7` | 253 C | Secondary colour, highlights only |

Secondary colours cover at most 15% of the area the primary colours cover. The app has a light
theme only: the manual defines no dark variant.

## Typography

Sofia Sans (SIL Open Font License 1.1), self-hosted from `src/theme/fonts/` in the four weights
the manual uses (`src/styles.scss`): Extra Bold (800) titles, Semi Bold (600) subtitles, Regular
(400) main copy and Light (300) small copy. Light and Regular come from the brand assets, Semi Bold
and Extra Bold from the [Sofia Sans repository](https://github.com/lettersoup/Sofia-Sans); all are
version 4.101.

## Logo

- `public/brand/relational-logo-primary.svg` (navy box, aqua chevrons, navy wordmark) goes on
  white or aqua; `relational-logo-secondary.svg` (aqua box, navy chevrons, aqua wordmark) goes on
  navy or black. Both are converted from the Illustrator masters with their shapes and colours
  unchanged; `relational-symbol.svg` is the box alone.
- Show the logo with `<app-brand-logo variant="primary | secondary">` and size it with the
  `--brand-logo-width` CSS property. The component keeps the clear space (2x on every side, where
  x is the gap between the box and the R) and the 3 cm minimum width.
- Never recolour, stretch, rotate or rearrange the logo, and never put it on photos, gradients or
  other colours.

## Icons and splash

| File | Content |
|---|---|
| `public/icons/icon-192.png`, `icon-512.png` | The symbol on a transparent background (purpose `any`) |
| `public/icons/icon-maskable-192.png`, `icon-maskable-512.png` | The symbol on aqua, inside the maskable safe zone (purpose `maskable`) |
| `public/icons/apple-touch-icon.png` | 180 px, the symbol on aqua |
| `public/favicon.ico`, `public/brand/relational-symbol.svg` | Favicons |

- Android draws the install splash from the manifest: the aqua `background_color` and the icon.
  While the app boots, `index.html` shows the primary logo on aqua.
- There are no iOS startup images; the booth tablets run Android.
- The service worker prefetches every asset (`ngsw-config.json`), so installed apps have the
  fonts, logos and icons offline after their first load.
