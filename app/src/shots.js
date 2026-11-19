// Fixed scenes for screenshots: ?shot=editor shows the page with the sample
// photos loaded; ?shot=cover hides the editor and shows only the cover.
// Query params: size (1920x1080 | 1080x1350 | 1080x1080), layout, grade,
// title, subtitle, tagline, quote. window.__shotReady is set once painted.
export async function runShot(shot, query, boot) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await boot();
  const state = window.__state;
  const apply = (key, param) => {
    const v = query.get(param);
    if (v !== null && v !== '') state[key] = v;
  };
  apply('title', 'title');
  apply('subtitle', 'subtitle');
  apply('tagline', 'tagline');
  apply('quote', 'quote');
  if (query.get('size')) state.size = query.get('size');
  if (query.get('layout')) {
    state.layout = query.get('layout');
    const n = { hero: 6, comic: 6, nine: 9, single: 1, two: 2, three: 3, four: 4 }[state.layout] || 6;
    state.panels = Array.from({ length: n }, (_, i) => ({
      photo: [0, 1, 6, 3, 4, 5][i % 6] % Math.max(1, state.photos.length),
      zoom: 1,
      cx: 0.5,
      cy: state.photos[[0, 1, 6, 3, 4, 5][i % 6] % Math.max(1, state.photos.length)]?.anchorY ?? 0.5,
    }));
  }
  if (query.get('grade')) state.grade = query.get('grade');
  state.showSelection = false;
  // Re-render once with the scene applied, then signal readiness.
  const canvas = document.getElementById('cover');
  const { drawCover } = await import('./cover.js');
  await document.fonts.ready;
  drawCover(canvas, state);
  document.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x.dataset.size === state.size));
  document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('active', x.dataset.grade === state.grade));
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('title', state.title);
  setVal('subtitle', state.subtitle);
  setVal('tagline', state.tagline);
  setVal('quote', state.quote);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
