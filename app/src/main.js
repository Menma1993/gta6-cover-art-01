// Vice Heat — boot. A ?shot= query renders one fixed scene for a screenshot;
// otherwise the full editor starts with the six sample photos loaded.

import { SAMPLES, defaultState } from './cover.js';
import { bootEditor } from './editor.js';
import { runShot } from './shots.js';

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  const out = [];
  for (const s of SAMPLES) {
    out.push(await loadImage(`samples/${s.file}`));
  }
  return out;
}

function markReady() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    resolve();
  })));
}

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

if (shot === 'editor') {
  await bootEditor();
  await markReady();
} else if (shot) {
  const state = defaultState();
  const photos = await loadSamples();
  await runShot(shot, params, state, photos);
} else {
  bootEditor();
}
