[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Menma1993/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Menma1993/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Heat — Cover Studio

Turn your own photos into GTA 6-style poster art: multi-panel comic collages,
a giant striped-gradient title with a brush-script subtitle, press quote,
character name tags, a location ribbon, the starburst seal, a palm tagline
strip, credits and a barcode — exported as a PNG in all three post sizes.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Pick photos (or drop your own in), pick a layout, a grade and a size, tweak
the captions, then **Export PNG** or **Export all 3 sizes**. Click a panel in
the preview to select it; drag to pan its photo, scroll to zoom, double-click
to swap its photo. **Surprise Me** shuffles layout, grade and captions.

## What is inside

- **Layouts** — Hero (tall hero panel + five trapezoid panels), Comic 6,
  9 Panels, 1 / 2 / 3 / 4 Panels. Panels are cut as trapezoids with cream
  gutters and face-safe crops, so faces stay in frame.
- **Grades** — Vice Sunset, Neon Night, Golden Hour, Comic Ink (halftone),
  Dusk Teal, with Strength / Contrast / Saturation / Grain / Vignette sliders
  and a halftone print-dots toggle.
- **Sizes** — 1920 × 1080 landscape, 1080 × 1350 portrait, 1080 × 1080 square.
- **Chrome** — five gold stars + press quote, VOL. tab, character name tags,
  location ribbon, "ORIGINAL COVER ART" seal, palm tagline strip, credits
  line and barcode. All lettering and the seal are original.
- **Offline** — plain static files, no network requests, no libraries.
  Fonts ship under `app/fonts/`; sample photos under `app/samples/`.

## Screenshots

`shots.json` lists the four shots the app renders itself:

1. `1-cover.png` — the exported landscape cover (Vice Sunset)
2. `2-editor.png` — the editor with photos loaded
3. `3-golden.png` — the exported portrait cover (Golden Hour)
4. `4-midnight.png` — the exported square cover (Neon Night)

## Photos & fonts

- `boulevard.jpg`, `pier.jpg` — sample photos made for make.fun with an
  image model, free to use (from the competition kit).
- `gas.jpg`, `moto.jpg`, `tower.jpg`, `boat.jpg` — CC0 photos from Rawpixel
  via Openverse: gas station at night; motorcycle rider riding into a sunset;
  lifeguard tower at sunset; speedboat on open sea.
- Fonts are SIL OFL 1.1: **Anton** (titles) and **Oswald** (tags, quotes,
  credits), both from Google Fonts. **Yellowtail** (script subtitle) is
  Apache 2.0 per the license declared in the font file's own name table
  (Copyright 2011 Brian J. Bonislawsky DBA Astigmatic); its full license
  text is in `app/fonts/LICENSE-Yellowtail.txt`.

No Rockstar Games logo, artwork or font is used anywhere in this entry.
