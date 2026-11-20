// Vice Heat — fixed scenes for screenshots. ?shot=cover shows the exported
// cover alone; ?shot=editor shows the full app with a photo loaded;
// ?shot=golden / ?shot=midnight show the other two export sizes in their
// grades. window.__shotReady is set once the paint is done.

import { SIZES, renderCover, buildPanels } from './cover.js';

const SCENES = {
  cover: { size: 'landscape', grade: 'sunset', title: 'VICE HEAT', script: 'Neon Palms', tagline: 'ONE COAST · NO RULES · COMING SOON' },
  golden: { size: 'portrait', grade: 'golden', title: 'VICE HEAT', script: 'Golden Hour', tagline: 'ONE COAST · SIX STORIES · NO CURFEW' },
  midnight: { size: 'square', grade: 'neon', title: 'VICE HEAT', script: 'Night Drive', tagline: 'THREE FACES · ONE LONG NIGHT' },
};

export async function runShot(shot, query, state, photos) {
  const scene = SCENES[shot] || SCENES.cover;
  document.body.classList.add('shot-cover');
  const size = SIZES[scene.size];
  const canvas = document.getElementById('cover');
  canvas.width = size.w;
  canvas.height = size.h;
  const st = {
    ...state,
    size: scene.size,
    layout: query.get('layout') || 'hero',
    grade: query.get('grade') || scene.grade,
    title: query.get('title') || scene.title,
    script: query.get('script') || scene.script,
    tagline: query.get('tagline') || scene.tagline,
    panels: buildPanels(query.get('layout') || 'hero', scene.size),
  };
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('400px Yellowtail'),
    document.fonts.load('600 100px Oswald'),
  ]).catch(() => {});
  renderCover(canvas, st, photos);
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
