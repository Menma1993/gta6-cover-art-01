// Vice Heat Cover Studio — page wiring.
// Loads the sample photos, keeps the editor state, and draws the shared
// renderer (cover.js) into the preview canvas and into PNG exports.
// Drag a panel to pan it, scroll to zoom, double-click to re-center, drop a
// photo on a panel to replace it. Everything runs offline: fonts, samples and
// scripts are files under app/, photos never leave the machine.

import { drawCover, SIZES, LAYOUTS, GRADES, layoutRects, layoutPolys } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

// Face-safe crop anchors for the shipped samples: where the subject sits,
// so the default crop never cuts a face in half.
const SAMPLES = [
  { file: 'boulevard.jpg', name: 'Boulevard', anchorX: 0.5, anchorY: 0.32 },
  { file: 'pier.jpg', name: 'Pier', anchorX: 0.5, anchorY: 0.4 },
  { file: 'tower.jpg', name: 'Tower', anchorX: 0.5, anchorY: 0.45 },
  { file: 'gasstation.jpg', name: 'Gas station', anchorX: 0.5, anchorY: 0.45 },
  { file: 'motorcycle.jpg', name: 'Motorcycle', anchorX: 0.5, anchorY: 0.45 },
  { file: 'speedboat.jpg', name: 'Speedboat', anchorX: 0.5, anchorY: 0.45 },
];

const state = {
  photos: [],
  panels: [],
  selectedPanel: 0,
  selectedPhoto: 0,
  layout: 'hero',
  grade: 'vice',
  strength: 0.9,
  contrast: 0.06,
  saturation: 0.06,
  grain: 0.28,
  vignette: 0.5,
  halftone: false,
  title: 'VICE HEAT',
  subtitle: 'Neon Palms',
  tagline: 'ONE COAST · NO RULES · COMING SOON',
  quote: 'PURE SUNSET ADRENALINE',
  quoteSrc: 'THE VICE GAZETTE',
  size: '1920x1080',
  showSelection: true,
};

let fontsReady = false;
async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('600 20px Oswald'),
      document.fonts.load('40px Yellowtail'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fallback fonts still render a readable cover.
  }
  fontsReady = true;
}

function panelCount() {
  return LAYOUTS[state.layout].panels;
}

function resetPanels() {
  const n = panelCount();
  const old = state.panels;
  state.panels = Array.from({ length: n }, (_, i) => {
    const keep = old[i];
    return keep ? { ...keep } : { photo: i % Math.max(1, state.photos.length), zoom: 1, cx: 0.5, cy: 0.5 };
  });
  if (state.selectedPanel >= n) state.selectedPanel = 0;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(`samples/${s.file}`);
      state.photos.push({ img, name: s.name, anchorX: s.anchorX, anchorY: s.anchorY });
    } catch {
      // A missing sample just leaves one fewer photo in the strip.
    }
  }
  resetPanels();
}

let drawQueued = false;
function redraw() {
  if (drawQueued) return;
  drawQueued = true;
  requestAnimationFrame(async () => {
    drawQueued = false;
    await ensureFonts();
    drawCover(canvas, state);
  });
}

function redrawNow() {
  return ensureFonts().then(() => drawCover(canvas, state));
}

// ---------- photo strip ----------

const stripEl = document.getElementById('strip');
const photoCountEl = document.getElementById('photoCount');

function renderStrip() {
  stripEl.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb' + (i === state.selectedPhoto ? ' selected' : '');
    btn.setAttribute('role', 'option');
    btn.title = photo.name;
    const img = document.createElement('img');
    img.src = photo.img.src;
    img.alt = photo.name;
    img.draggable = true;
    const n = document.createElement('span');
    n.className = 'n';
    n.textContent = String(i + 1);
    btn.append(img, n);
    btn.addEventListener('click', () => {
      state.selectedPhoto = i;
      state.panels[state.selectedPanel].photo = i;
      renderStrip();
      renderPanelDots();
      redraw();
    });
    img.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/photo-index', String(i));
    });
    btn.appendChild(img);
    stripEl.appendChild(btn);
  });
  photoCountEl.textContent = `${state.photos.length} LOADED`;
}

// ---------- panel controls ----------

const panelLabelEl = document.getElementById('panelLabel');
const dotsEl = document.getElementById('panelDots');
const zoomEl = document.getElementById('zoom');
const zoomValEl = document.getElementById('zoomVal');

function renderPanelDots() {
  dotsEl.innerHTML = '';
  panelLabelEl.textContent = `${state.selectedPanel + 1} OF ${panelCount()}`;
  state.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dot' + (i === state.selectedPanel ? ' active' : '');
    b.textContent = String(i + 1);
    b.addEventListener('click', () => {
      state.selectedPanel = i;
      state.selectedPhoto = state.panels[i].photo;
      syncPanelControls();
      renderPanelDots();
      renderStrip();
      redraw();
    });
    dotsEl.appendChild(b);
  });
}

function syncPanelControls() {
  const p = state.panels[state.selectedPanel];
  zoomEl.value = String(p.zoom);
  zoomValEl.textContent = `${p.zoom.toFixed(2)}×`;
}

zoomEl.addEventListener('input', () => {
  const p = state.panels[state.selectedPanel];
  p.zoom = Number(zoomEl.value);
  zoomValEl.textContent = `${p.zoom.toFixed(2)}×`;
  redraw();
});

document.getElementById('autoCenter').addEventListener('click', () => {
  const p = state.panels[state.selectedPanel];
  const photo = state.photos[p.photo];
  p.cx = photo?.anchorX ?? 0.5;
  p.cy = photo?.anchorY ?? 0.5;
  p.zoom = 1;
  syncPanelControls();
  redraw();
});

document.getElementById('fillAll').addEventListener('click', () => {
  const idx = state.selectedPhoto;
  state.panels.forEach((p, i) => {
    p.photo = idx;
    // Vary the crop centre per panel so one photo reads as several shots.
    p.cx = 0.3 + 0.4 * ((i * 0.37) % 1);
    p.cy = 0.3 + 0.35 * ((i * 0.53) % 1);
  });
  redraw();
});

document.getElementById('spreadAll').addEventListener('click', () => {
  state.panels.forEach((p, i) => {
    p.photo = i % state.photos.length;
    p.cx = 0.5;
    p.cy = state.photos[p.photo]?.anchorY ?? 0.5;
  });
  redraw();
});

// ---------- layout + grade pickers ----------

const layoutGridEl = document.getElementById('layoutGrid');
Object.entries(LAYOUTS).forEach(([key, def]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'layout-btn' + (key === state.layout ? ' active' : '');
  b.dataset.layout = key;
  const mini = document.createElement('span');
  mini.className = 'mini';
  const rects = layoutRects(key, 100, 100);
  mini.style.gridTemplateColumns = `repeat(12, 1fr)`;
  mini.style.gridTemplateRows = `repeat(12, 1fr)`;
  rects.forEach((r) => {
    const cell = document.createElement('i');
    cell.style.gridColumn = `${Math.max(1, Math.round(r.x / 100 * 12) + 1)} / span ${Math.max(1, Math.round(r.w / 100 * 12))}`;
    cell.style.gridRow = `${Math.max(1, Math.round(r.y / 100 * 12) + 1)} / span ${Math.max(1, Math.round(r.h / 100 * 12))}`;
    mini.appendChild(cell);
  });
  b.append(mini, document.createTextNode(def.label.toUpperCase()));
  b.addEventListener('click', () => {
    state.layout = key;
    resetPanels();
    document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x.dataset.layout === key));
    syncPanelControls();
    renderPanelDots();
    redraw();
  });
  layoutGridEl.appendChild(b);
});

const GRADE_SWATCH = {
  vice: 'linear-gradient(135deg,#ffd23f,#ff7a18 45%,#ff2e88 80%,#7b2ff7)',
  neon: 'linear-gradient(135deg,#00e5ff,#3b0f8f 50%,#ff2e88)',
  golden: 'linear-gradient(135deg,#fff3a3,#ffd23f 40%,#ff8a00 75%,#ff5e3a)',
  ink: 'linear-gradient(135deg,#fff6c9,#ffb400 50%,#222244)',
  dusk: 'linear-gradient(135deg,#2ee6c8,#00c2a8 40%,#ff7a18 75%,#1b2a6b)',
};
const gradeGridEl = document.getElementById('gradeGrid');
Object.entries(GRADES).forEach(([key, def]) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'grade-btn' + (key === state.grade ? ' active' : '');
  b.dataset.grade = key;
  const sw = document.createElement('span');
  sw.className = 'sw';
  sw.style.background = GRADE_SWATCH[key];
  const label = document.createElement('span');
  label.textContent = def.label.toUpperCase();
  b.append(sw, label);
  b.addEventListener('click', () => {
    state.grade = key;
    document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('active', x.dataset.grade === key));
    redraw();
  });
  gradeGridEl.appendChild(b);
});

// ---------- sliders + caption ----------

function bindSlider(id, valId, apply, format) {
  const el = document.getElementById(id);
  const val = document.getElementById(valId);
  el.addEventListener('input', () => {
    apply(Number(el.value));
    val.textContent = format(Number(el.value));
    redraw();
  });
}
bindSlider('strength', 'strengthVal', (v) => { state.strength = v; }, (v) => v.toFixed(2));
bindSlider('contrast', 'contrastVal', (v) => { state.contrast = v; }, (v) => v.toFixed(2));
bindSlider('saturation', 'saturationVal', (v) => { state.saturation = v; }, (v) => v.toFixed(2));
bindSlider('grain', 'grainVal', (v) => { state.grain = v; }, (v) => v.toFixed(2));
bindSlider('vignette', 'vignetteVal', (v) => { state.vignette = v; }, (v) => v.toFixed(2));
document.getElementById('halftone').addEventListener('change', (e) => {
  state.halftone = e.target.checked;
  redraw();
});

function bindText(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    redraw();
  });
}
bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('tagline', 'tagline');
bindText('quote', 'quote');
bindText('quoteSrc', 'quoteSrc');

// Contrast/saturation sliders shift the active grade around its base values.
function applyGradeTweaks() {
  const g = GRADES[state.grade];
  g.con = 1 + state.contrast;
  g.sat = 1 + state.saturation;
}

// ---------- size pills ----------

document.querySelectorAll('.pill').forEach((pill) => {
  pill.addEventListener('click', () => {
    state.size = pill.dataset.size;
    document.querySelectorAll('.pill').forEach((x) => x.classList.toggle('active', x === pill));
    document.getElementById('exportOne').textContent = `⇩ EXPORT PNG ${state.size.replace('x', ' × ')}`;
    redraw();
  });
});

// ---------- file input + drag and drop ----------

const fileInput = document.getElementById('fileInput');
const openPicker = () => fileInput.click();
document.getElementById('addPhotos').addEventListener('click', openPicker);
document.getElementById('addPhotosTop').addEventListener('click', openPicker);

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    try {
      const img = await loadImage(URL.createObjectURL(file));
      state.photos.push({ img, name: file.name.replace(/\.[^.]+$/, ''), anchorX: 0.5, anchorY: 0.42 });
    } catch {
      // A file that is not a readable image is skipped, not fatal.
    }
  }
  renderStrip();
  redraw();
}
fileInput.addEventListener('change', async (e) => {
  await addFiles([...e.target.files]);
  fileInput.value = '';
});

const dropZone = document.getElementById('dropZone');
['dragover', 'dragenter'].forEach((ev) => dropZone.addEventListener(ev, (e) => e.preventDefault()));
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  await addFiles([...e.dataTransfer.files]);
});
document.getElementById('replacePhoto').addEventListener('click', () => {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';
  picker.addEventListener('change', async () => {
    if (!picker.files[0]) return;
    const img = await loadImage(URL.createObjectURL(picker.files[0]));
    state.photos.push({ img, name: picker.files[0].name.replace(/\.[^.]+$/, ''), anchorX: 0.5, anchorY: 0.42 });
    state.panels[state.selectedPanel].photo = state.photos.length - 1;
    state.selectedPhoto = state.photos.length - 1;
    renderStrip();
    redraw();
  });
  picker.click();
});

// ---------- canvas pan / zoom / select / drop ----------

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const size = SIZES[state.size];
  return {
    x: ((e.clientX - r.left) / r.width) * size.w,
    y: ((e.clientY - r.top) / r.height) * size.h,
  };
}
function panelAt(x, y) {
  const size = SIZES[state.size];
  const polys = layoutPolys(state.layout, size.w, size.h);
  const inside = (pts) => {
    let ok = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ok = !ok;
    }
    return ok;
  };
  const hit = polys.findIndex((p) => inside(p.pts));
  if (hit >= 0) return hit;
  // Near a slanted edge the point can fall in the gutter: fall back to the
  // nearest bounding box.
  const rects = layoutRects(state.layout, size.w, size.h);
  return rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  if (idx < 0) return;
  state.selectedPanel = idx;
  state.selectedPhoto = state.panels[idx].photo;
  syncPanelControls();
  renderPanelDots();
  renderStrip();
  redraw();
  drag = { idx, lastX: x, lastY: y };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { x, y } = canvasPoint(e);
  const size = SIZES[state.size];
  const rects = layoutRects(state.layout, size.w, size.h);
  const rect = rects[drag.idx];
  const p = state.panels[drag.idx];
  const iw = state.photos[p.photo]?.img.naturalWidth || 1;
  const ih = state.photos[p.photo]?.img.naturalHeight || 1;
  const base = Math.max(rect.w / iw, rect.h / ih) * p.zoom;
  p.cx = Math.min(1, Math.max(0, p.cx - (x - drag.lastX) / (iw * base)));
  p.cy = Math.min(1, Math.max(0, p.cy - (y - drag.lastY) / (ih * base)));
  drag.lastX = x;
  drag.lastY = y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  if (idx < 0) return;
  const p = state.panels[idx];
  p.zoom = Math.min(3, Math.max(1, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  if (idx === state.selectedPanel) syncPanelControls();
  redraw();
}, { passive: false });
canvas.addEventListener('dblclick', (e) => {
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  if (idx < 0) return;
  const p = state.panels[idx];
  const photo = state.photos[p.photo];
  p.cx = photo?.anchorX ?? 0.5;
  p.cy = photo?.anchorY ?? 0.5;
  p.zoom = 1;
  if (idx === state.selectedPanel) syncPanelControls();
  redraw();
});
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const { x, y } = canvasPoint(e);
  const idx = panelAt(x, y);
  const photoIdx = Number(e.dataTransfer.getData('text/photo-index'));
  if (idx >= 0 && Number.isFinite(photoIdx)) {
    state.panels[idx].photo = photoIdx;
    state.selectedPanel = idx;
    renderPanelDots();
    redraw();
    return;
  }
  if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files]);
});

// ---------- export ----------

function slug(text) {
  return text.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'COVER';
}
function downloadPng(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  statusEl.textContent = `SAVED ${filename}`;
}
function exportSize(sizeKey) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    const saved = { ...state, showSelection: false, size: sizeKey };
    applyGradeTweaks();
    drawCover(off, saved);
    off.toBlob((blob) => {
      const filename = `${slug(state.title)}-${sizeKey.toUpperCase()}.PNG`;
      downloadPng(blob, filename);
      resolve({ blob, filename, w: off.width, h: off.height });
    }, 'image/png');
  });
}
// Exposed for screenshots and tests: returns the PNG bytes of the current cover.
window.__exportPNG = async (sizeKey) => {
  const off = document.createElement('canvas');
  const saved = { ...state, showSelection: false, size: sizeKey || state.size };
  applyGradeTweaks();
  drawCover(off, saved);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: off.width, h: off.height };
};
window.__state = state;

document.getElementById('exportOne').addEventListener('click', async () => {
  await exportSize(state.size);
});
async function exportAll() {
  const names = [];
  for (const key of Object.keys(SIZES)) {
    const r = await exportSize(key);
    names.push(r.filename);
  }
  statusEl.textContent = `SAVED ${names.join(' · ')}`;
}
document.getElementById('exportAll').addEventListener('click', exportAll);
document.getElementById('exportAllTop').addEventListener('click', exportAll);

// ---------- surprise me ----------

const SURPRISES = [
  { title: 'VICE HEAT', subtitle: 'Neon Palms', tagline: 'ONE COAST · NO RULES · COMING SOON', layout: 'hero', grade: 'vice' },
  { title: 'GOLDEN HEIST', subtitle: 'Coastline Run', tagline: 'TAKE THE SUNSET AND RUN', layout: 'comic', grade: 'golden' },
  { title: 'MIDNIGHT RUN', subtitle: 'After Dark', tagline: 'THE CITY NEVER SLEEPS', layout: 'comic', grade: 'neon' },
  { title: 'PALM ROYALE', subtitle: 'Velvet Coast', tagline: 'KINGS OF THE BOULEVARD', layout: 'hero', grade: 'dusk' },
  { title: 'TURBO SUNSET', subtitle: 'Full Throttle', tagline: 'NO BRAKES · NO MERCY', layout: 'nine', grade: 'ink' },
  { title: 'HOT PURSUIT', subtitle: 'Sirens & Smoke', tagline: 'CATCH ME IF YOU CAN', layout: 'hero', grade: 'vice' },
];
document.getElementById('surpriseTop').addEventListener('click', () => {
  const pick = SURPRISES[Math.floor(Math.random() * SURPRISES.length)];
  Object.assign(state, pick);
  resetPanels();
  state.panels.forEach((p, i) => {
    p.photo = [0, 1, 2, 3, 4, 5][i % 6] % state.photos.length;
    p.cy = state.photos[p.photo]?.anchorY ?? 0.5;
  });
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  document.querySelectorAll('.layout-btn').forEach((x) => x.classList.toggle('active', x.dataset.layout === state.layout));
  document.querySelectorAll('.grade-btn').forEach((x) => x.classList.toggle('active', x.dataset.grade === state.grade));
  renderPanelDots();
  redraw();
});

// ---------- boot + screenshot scenes ----------

async function boot() {
  await loadSamples();
  state.panels.forEach((p, i) => {
    // Default spread: boulevard hero, then the rest across the panels.
    p.photo = [0, 1, 2, 3, 4, 5][i % 6] % state.photos.length;
    p.cy = state.photos[p.photo]?.anchorY ?? 0.5;
  });
  renderStrip();
  renderPanelDots();
  syncPanelControls();
  await redrawNow();
  window.__appReady = true;
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), boot);
} else {
  boot();
}
