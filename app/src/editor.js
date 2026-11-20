// Vice Heat — the editor. Photo strip, layout and grade controls, caption
// fields, panel picking (click to select, drag to pan, wheel to zoom), and
// PNG export in one size or all three. Plain DOM, no libraries.

import { SIZES, SAMPLES, CAPTIONS, defaultState, buildPanels, renderCover, hitPanel, mulberry32 } from './cover.js';

const $ = (id) => document.getElementById(id);

const LAYOUTS = [
  ['hero', 'Hero'],
  ['comic6', 'Comic 6'],
  ['nine', '9 Panels'],
  ['one', '1 Panel'],
  ['two', '2 Panels'],
  ['three', '3 Panels'],
  ['four', '4 Panels'],
];

const GRADE_OPTIONS = [
  ['sunset', 'Vice Sunset'],
  ['neon', 'Neon Night'],
  ['golden', 'Golden Hour'],
  ['ink', 'Comic Ink'],
  ['teal', 'Dusk Teal'],
];

let state = defaultState();
let photos = []; // {name, src, img, anchor}
let selectedPhoto = 0;
let selectedPanel = 0;
let panels = [];
let preview = null;
let dragging = null;

function photoImages() {
  return photos.map((p) => p.img);
}

function rebuildPanels() {
  const built = buildPanels(state.layout, state.size);
  if (state.panels && state.panels.length === built.length && state.layout === state._lastLayout && state.size === state._lastSize) {
    return;
  }
  state.panels = built;
  state._lastLayout = state.layout;
  state._lastSize = state.size;
  selectedPanel = 0;
}

function drawPreview() {
  rebuildPanels();
  const size = SIZES[state.size];
  const scale = Math.min(960 / size.w, 560 / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  const off = document.createElement('canvas');
  panels = renderCover(off, state, photoImages());
  const ctx = preview.getContext('2d');
  ctx.clearRect(0, 0, preview.width, preview.height);
  ctx.drawImage(off, 0, 0, preview.width, preview.height);
  // selection outline on the picked panel
  const sel = panels[selectedPanel];
  if (sel) {
    const sx = preview.width / size.w;
    const sy = preview.height / size.h;
    ctx.save();
    ctx.beginPath();
    sel.poly.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x * preview.width, y * preview.height);
      else ctx.lineTo(x * preview.width, y * preview.height);
    });
    ctx.closePath();
    ctx.strokeStyle = '#ff2e88';
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff2e88';
    ctx.beginPath();
    ctx.arc(sel.poly[0][0] * preview.width, sel.poly[0][1] * preview.height, 5, 0, Math.PI * 2);
    ctx.fill();
    void sx;
    void sy;
  }
  $('panel-count').textContent = `${selectedPanel + 1} OF ${panels.length}`;
  const panel = panels[selectedPanel];
  if (panel) {
    $('zoom').value = panel.zoom || 1;
    $('zoom-val').textContent = `${(panel.zoom || 1).toFixed(2)}×`;
    $('tag-input').value = panel.tag || '';
  }
}

function setStatus(text) {
  $('status').textContent = text;
}

function renderStrip() {
  const strip = $('strip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'thumb' + (i === selectedPhoto ? ' sel' : '');
    const img = document.createElement('img');
    img.src = p.src;
    img.alt = p.name;
    const n = document.createElement('span');
    n.className = 'num';
    n.textContent = String(i + 1);
    d.appendChild(img);
    d.appendChild(n);
    d.addEventListener('click', () => {
      selectedPhoto = i;
      renderStrip();
      drawPreview();
    });
    strip.appendChild(d);
  });
  $('photo-count').textContent = `${photos.length} LOADED`;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    const img = await loadImage(`samples/${s.file}`);
    photos.push({ name: s.file.replace('.jpg', ''), src: `samples/${s.file}`, img, anchor: s.anchor });
  }
  renderStrip();
}

function syncControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
  $('strength').value = state.strength;
  $('strength-val').textContent = state.strength.toFixed(2);
  $('contrast').value = state.contrast;
  $('contrast-val').textContent = state.contrast.toFixed(2);
  $('saturation').value = state.saturation;
  $('saturation-val').textContent = state.saturation.toFixed(2);
  $('grain').value = state.grain;
  $('grain-val').textContent = state.grain.toFixed(2);
  $('vignette').value = state.vignette;
  $('vignette-val').textContent = state.vignette.toFixed(2);
  $('halftone').checked = !!state.halftone;
  $('title-input').value = state.title;
  $('script-input').value = state.script;
  $('tagline-input').value = state.tagline;
  $('quote-input').value = state.quote;
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.addEventListener('click', () => {
      state.layout = b.dataset.layout;
      state.panels = null;
      syncControls();
      drawPreview();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      state.grade = b.dataset.grade;
      syncControls();
      drawPreview();
    });
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      state.size = b.dataset.size;
      state.panels = null;
      syncControls();
      drawPreview();
    });
  });
  const sliders = [
    ['strength', 'strength', 0, 1, 0.01],
    ['contrast', 'contrast', -0.4, 0.4, 0.01],
    ['saturation', 'saturation', -0.6, 0.6, 0.01],
    ['grain', 'grain', 0, 1, 0.01],
    ['vignette', 'vignette', 0, 1, 0.01],
  ];
  for (const [id, key] of sliders) {
    $(id).addEventListener('input', () => {
      state[key] = parseFloat($(id).value);
      $(`${id}-val`).textContent = state[key].toFixed(2);
      drawPreview();
    });
  }
  $('halftone').addEventListener('change', () => {
    state.halftone = $('halftone').checked;
    drawPreview();
  });
  const texts = [
    ['title-input', 'title'],
    ['script-input', 'script'],
    ['tagline-input', 'tagline'],
    ['quote-input', 'quote'],
  ];
  for (const [id, key] of texts) {
    $(id).addEventListener('input', () => {
      state[key] = $(id).value;
      drawPreview();
    });
  }
  $('tag-input').addEventListener('input', () => {
    const panel = panels[selectedPanel];
    if (panel) panel.tag = $('tag-input').value.toUpperCase();
    drawPreview();
  });
  $('zoom').addEventListener('input', () => {
    const panel = panels[selectedPanel];
    if (panel) {
      panel.zoom = parseFloat($('zoom').value);
      $('zoom-val').textContent = `${panel.zoom.toFixed(2)}×`;
      drawPreview();
    }
  });
  $('auto-crop').addEventListener('click', () => {
    const panel = panels[selectedPanel];
    if (panel) {
      panel.panX = 0;
      panel.panY = 0;
      panel.zoom = 1;
      drawPreview();
    }
  });
  $('replace-photo').addEventListener('click', () => {
    const panel = panels[selectedPanel];
    if (panel) {
      panel.photo = (panel.photo + 1) % photos.length;
      drawPreview();
    }
  });
  $('flip-photo').addEventListener('click', () => {
    const panel = panels[selectedPanel];
    if (panel) {
      panel.flip = !panel.flip;
      drawPreview();
    }
  });
  $('fill-all').addEventListener('click', () => {
    for (const p of panels) p.photo = selectedPhoto;
    drawPreview();
  });
  $('spread-all').addEventListener('click', () => {
    panels.forEach((p, i) => {
      p.photo = i % photos.length;
    });
    drawPreview();
  });
  $('surprise').addEventListener('click', () => {
    const rnd = mulberry32((Math.random() * 1e9) | 0);
    state.layout = LAYOUTS[Math.floor(rnd() * LAYOUTS.length)][0];
    state.grade = GRADE_OPTIONS[Math.floor(rnd() * GRADE_OPTIONS.length)][0];
    state.title = CAPTIONS.titles[Math.floor(rnd() * CAPTIONS.titles.length)];
    state.script = CAPTIONS.scripts[Math.floor(rnd() * CAPTIONS.scripts.length)];
    state.tagline = CAPTIONS.taglines[Math.floor(rnd() * CAPTIONS.taglines.length)];
    const q = CAPTIONS.quotes[Math.floor(rnd() * CAPTIONS.quotes.length)];
    state.quote = q[0];
    state.quoteSource = q[1];
    state.panels = null;
    syncControls();
    drawPreview();
    setStatus('Surprised you. Try another one.');
  });
  $('add-photos').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', async (e) => {
    for (const file of e.target.files) {
      if (photos.length >= 12) break;
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      photos.push({ name: file.name.replace(/\.[^.]+$/, ''), src: url, img, anchor: [0.5, 0.5] });
    }
    renderStrip();
    drawPreview();
  });
  $('export-one').addEventListener('click', () => exportSize(state.size));
  $('export-all').addEventListener('click', exportAll);
  $('export-all-2').addEventListener('click', exportAll);
}

async function exportSize(sizeKey) {
  const keep = { ...state, panels: state.panels };
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  const st = { ...state, size: sizeKey, panels: buildPanels(state.layout, sizeKey) };
  // keep the editor's per-panel tweaks when the layout matches
  if (state.panels && state.panels.length === st.panels.length) {
    st.panels = state.panels;
  }
  renderCover(off, st, photoImages());
  const blob = await new Promise((res) => off.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-heat-${size.w}x${size.h}.png`;
  a.click();
  setStatus(`SAVED VICE-HEAT-${size.w}X${size.h}.PNG`);
  void keep;
}

async function exportAll() {
  for (const key of Object.keys(SIZES)) {
    await exportSize(key);
    await new Promise((r) => setTimeout(r, 250));
  }
  setStatus('SAVED ALL 3 SIZES — 1920×1080 · 1080×1350 · 1080×1080');
}

function bindCanvas() {
  preview = $('preview');
  preview.addEventListener('pointerdown', (e) => {
    const r = preview.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * SIZES[state.size].w;
    const y = ((e.clientY - r.top) / r.height) * SIZES[state.size].h;
    const hit = hitPanel(panels, x, y, SIZES[state.size].w, SIZES[state.size].h);
    if (hit >= 0) {
      selectedPanel = hit;
      dragging = { x: e.clientX, y: e.clientY, panX: panels[hit].panX || 0, panY: panels[hit].panY || 0 };
      preview.setPointerCapture(e.pointerId);
      drawPreview();
    }
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const panel = panels[selectedPanel];
    if (!panel) return;
    const r = preview.getBoundingClientRect();
    const sx = SIZES[state.size].w / r.width;
    panel.panX = dragging.panX + (e.clientX - dragging.x) * sx;
    panel.panY = dragging.panY + (e.clientY - dragging.y) * sx;
    drawPreview();
  });
  preview.addEventListener('pointerup', () => {
    dragging = null;
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = panels[selectedPanel];
    if (!panel) return;
    panel.zoom = Math.max(0.6, Math.min(3, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
    drawPreview();
  }, { passive: false });
  preview.addEventListener('dblclick', () => {
    const panel = panels[selectedPanel];
    if (!panel) return;
    panel.photo = (panel.photo + 1) % photos.length;
    drawPreview();
  });
}

export async function bootEditor() {
  bindCanvas();
  bindControls();
  await Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('400px Yellowtail'),
    document.fonts.load('600 100px Oswald'),
  ]).catch(() => {});
  await loadSamples();
  syncControls();
  drawPreview();
  setStatus('Ready — 6 photos loaded. Pick a layout, a grade, export.');
}

export function editorState() {
  return state;
}
