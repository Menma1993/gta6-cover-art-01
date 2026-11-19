// Vice Heat Cover Studio — the entry program for gta6-cover-art-01 (Node 22,
// standard library only). The app is plain static files under app/ (index.html
// plus ES modules, fonts and sample photos, nothing fetched over the network),
// so handing the entry in is just copying two folders and writing the dossier
// the judge reads. vendor/makefun-app.ts is the kit's library, untouched.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// writes out/app, out/screenshots and out/dossier.json. Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output; the grader runs this program
// twice and both runs must write the same bytes.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps, mirrored here so a bad bundle fails loudly at build time
// instead of at the gate: at most 4 screenshots of 256 KiB each, app/ at most
// 993 files and 48 MiB in total, no path under app/ over 1000 bytes, and the
// dossier text capped at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
