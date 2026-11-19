# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Menma1993/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Menma1993/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Entry for make.fun bounty `gta6-cover-art-01`: "Vice Heat Cover Studio" — a static offline web app that turns any photo into a GTA 6-style cover art poster. Upload photos, pick a layout, grade and caption, and export the cover as a PNG in three sizes (1920×1080 landscape, 1080×1350 portrait, 1080×1080 square).

- **Multi-panel comic collage:** Hero, Comic 6, 9-panel, 1 / 2 / 3 / 4-panel layouts with cream gutters, per-panel click-to-select, drag to pan, scroll to zoom, double-click to re-center, replace, "fill all panels" and "spread all photos".
- **Poster lettering:** giant skewed gradient title (Anton) with layered black outline and magenta drop shadow, pink brush-script subtitle (Yellowtail), 5 gold stars + press quote bar, starburst "ORIGINAL COVER ART" seal, palm-silhouette tagline strip, credits line and deterministic barcode.
- **4 grades that actually differ:** Vice Sunset, Neon Night, Golden Hour, Comic Ink halftone — plus Strength / Contrast / Saturation / Grain / Vignette sliders and a halftone toggle, all live in the preview.
- **Fast and easy:** 3-step header (add photos → pick a size → export PNG), one-click "Export all 3 sizes" with saved-filename status.
- **Offline, no Rockstar assets:** fonts are OFL (Anton / Oswald / Yellowtail) shipped under `app/fonts/`; all sample photos are original or kit samples.

## Run it

```sh
npx serve app
```

or open `app/index.html` directly in a browser. No network requests, no build step.

## Screenshots

- `screenshots/1-cover.jpg` — exported landscape cover "VICE HEAT / Neon Palms" (Vice Sunset, Hero)
- `screenshots/2-editor.jpg` — the editor with 6 photos loaded
- `screenshots/3-cover-portrait.jpg` — exported portrait cover "GOLDEN HEIST / Coastline Run" (Golden Hour, Comic 6)
- `screenshots/4-cover-square.jpg` — exported square cover "MIDNIGHT RUN / After Dark" (Neon Night, Comic 6)
