// Vice Heat — the cover engine. Pure canvas: trapezoid photo panels with
// face-safe crops, grade washes, a giant striped-gradient title, brush-script
// subtitle, press strip, name tags, location ribbon, starburst seal, palm
// tagline strip, credits and barcode. No libraries, no network.

export const SIZES = {
  landscape: { w: 1920, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  square: { w: 1080, h: 1080 },
};

export const SAMPLES = [
  { file: 'boulevard.jpg', anchor: [0.42, 0.28] },
  { file: 'pier.jpg', anchor: [0.62, 0.35] },
  { file: 'rooftop.jpg', anchor: [0.52, 0.6] },
  { file: 'club.jpg', anchor: [0.42, 0.28] },
  { file: 'neon.jpg', anchor: [0.5, 0.62] },
  { file: 'yacht.jpg', anchor: [0.5, 0.42] },
];

const TAGS = ['THE DRIVER', 'THE ANGLER', 'THE CREW', 'THE INSIDER', 'THE COURIER', 'THE BOSS'];

export const GRADES = {
  sunset: { wash: 'rgba(255, 122, 26, 0.20)', glow: '#ffd9a0', sat: 1.0 },
  neon: { wash: 'rgba(123, 47, 247, 0.22)', glow: '#ff9de2', sat: 1.05 },
  golden: { wash: 'rgba(255, 201, 61, 0.20)', glow: '#fff3c4', sat: 1.0 },
  ink: { wash: 'rgba(245, 239, 224, 0.10)', glow: '#ffffff', sat: 0.55 },
  teal: { wash: 'rgba(45, 212, 191, 0.18)', glow: '#9ff5e8', sat: 0.95 },
};

export const CAPTIONS = {
  titles: ['VICE HEAT', 'VICE HEAT', 'PALM LINE', 'NEON PALMS', 'VICE CITY', 'HEATWAVE'],
  scripts: ['Neon Palms', 'Golden Hour', 'Night Drive', 'Sunset Run', 'Coast Line', 'Vice Nights'],
  taglines: [
    'ONE COAST · NO RULES · COMING SOON',
    'ONE COAST · SIX STORIES · NO CURFEW',
    'THREE FACES · ONE LONG NIGHT',
    'SIX STORIES · ONE SUNSET · NO WAY BACK',
    'PALMS UP · ENGINES HOT · VICE CITY',
  ],
  quotes: [
    ['PURE SUNSET ADRENALINE', 'THE VICE GAZETTE'],
    ['A POSTER YOU CAN HEAR', 'COAST WEEKLY'],
    ['THE COOLEST COVER OF THE YEAR', 'PALM PRESS'],
    ['NEON, PALMS AND PURE HEAT', 'THE SUNSET TIMES'],
  ],
};

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function defaultState() {
  return {
    layout: 'hero',
    size: 'landscape',
    grade: 'teal',
    strength: 0.9,
    contrast: 0.06,
    saturation: 0.06,
    grain: 0.28,
    vignette: 0.5,
    halftone: false,
    title: 'VICE HEAT',
    script: 'Neon Palms',
    tagline: 'ONE COAST · NO RULES · COMING SOON',
    quote: 'PURE SUNSET ADRENALINE',
    quoteSource: 'THE VICE GAZETTE',
    location: 'VICE CITY · SOL · 7',
    panels: null,
  };
}

// Chrome geometry per layout family. titleY is the TOP edge of the title
// glyphs (normalised); the ribbon sits low, clear of the title, so the
// bottom-centre panel's tag and the location line are never covered.
function layoutSpec(layout, size) {
  if (size === 'portrait') {
    return { titleY: 0.50, ribbonY: 0.885, sealX: 0.88, sealY: 0.66 };
  }
  return { titleY: 0.44, ribbonY: 0.87, sealX: 0.88, sealY: 0.62 };
}

function panel(photo, poly, tagPos, anchor) {
  const s = SAMPLES[photo % SAMPLES.length];
  return {
    photo,
    poly,
    tag: TAGS[photo % TAGS.length],
    anchor: (anchor || s.anchor).slice(),
    tagPos: tagPos || 'top',
    zoom: 1,
    panX: 0,
    panY: 0,
    flip: false,
  };
}

export function buildPanels(layout, size) {
  if (layout === 'hero') {
    if (size === 'portrait') {
      return [
        // portrait hero: top edge level, bottom edges slant in opposite directions
        panel(0, [[0, 0.06], [0.98, 0.06], [0.98, 0.645], [0, 0.60]]),
        panel(1, [[0, 0.618], [0.47, 0.64], [0.52, 0.815], [0, 0.79]]),
        panel(2, [[0.485, 0.64], [0.98, 0.663], [0.98, 0.79], [0.535, 0.815]]),
        panel(3, [[0, 0.808], [0.50, 0.832], [0.455, 0.925], [0, 0.925]]),
        panel(4, [[0.515, 0.832], [0.98, 0.808], [0.98, 0.925], [0.47, 0.925]]),
      ];
    }
    return [
      // hero landscape: slanted hero flank, right column trapezoids slanting alternately
      panel(0, [[0, 0.06], [0.415, 0.06], [0.295, 0.925], [0, 0.925]]),
      panel(1, [[0.43, 0.06], [0.665, 0.06], [0.70, 0.385], [0.388, 0.355]]),
      panel(2, [[0.68, 0.06], [0.99, 0.06], [0.99, 0.36], [0.715, 0.385]]),
      panel(3, [[0.386, 0.375], [0.698, 0.405], [0.665, 0.615], [0.357, 0.59]]),
      panel(4, [[0.713, 0.405], [0.99, 0.38], [0.99, 0.64], [0.68, 0.615]]),
      panel(5, [[0.351, 0.645], [0.99, 0.615], [0.99, 0.925], [0.31, 0.925]], 'bottom', [0.5, 0.59]),
    ];
  }
  if (layout === 'comic6') {
    return [
      // comic6: every divider slants, alternating direction row by row
      panel(0, [[0, 0.06], [0.345, 0.06], [0.315, 0.483], [0, 0.47]]),
      panel(1, [[0.36, 0.06], [0.675, 0.06], [0.705, 0.496], [0.33, 0.483]]),
      panel(2, [[0.69, 0.06], [0.99, 0.06], [0.99, 0.51], [0.72, 0.496]]),
      panel(3, [[0, 0.49], [0.325, 0.503], [0.36, 0.925], [0, 0.925]]),
      panel(4, [[0.34, 0.503], [0.665, 0.516], [0.63, 0.925], [0.375, 0.925]]),
      panel(5, [[0.68, 0.516], [0.99, 0.53], [0.99, 0.925], [0.645, 0.925]], 'bottom'),
    ];
  }
  if (layout === 'nine') {
    const out = [];
    const rows = [[0.06, 0.345], [0.355, 0.64], [0.65, 0.925]];
    const cols = [[0, 0.33], [0.34, 0.66], [0.67, 0.99]];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        out.push(panel((r * 3 + c) % 6, [
          [cols[c][0], rows[r][0]], [cols[c][1], rows[r][0]],
          [cols[c][1], rows[r][1]], [cols[c][0], rows[r][1]],
        ]));
      }
    }
    return out;
  }
  if (layout === 'one') {
    return [panel(0, [[0, 0.06], [1, 0.06], [1, 0.925], [0, 0.925]])];
  }
  if (layout === 'two') {
    return [
      // two: five-point chevron split, the two panels interlock diagonally
      panel(0, [[0, 0.06], [0.55, 0.06], [0.50, 0.50], [0.44, 0.925], [0, 0.925]]),
      panel(1, [[0.565, 0.06], [1, 0.06], [1, 0.925], [0.455, 0.925], [0.515, 0.50]]),
    ];
  }
  if (layout === 'three') {
    return [
      // three: chevron split with a diagonal crossbar between the two right panels
      panel(0, [[0, 0.06], [0.55, 0.06], [0.50, 0.50], [0.44, 0.925], [0, 0.925]]),
      panel(1, [[0.565, 0.06], [1, 0.06], [1, 0.46], [0.515, 0.485]]),
      panel(2, [[0.515, 0.505], [1, 0.48], [1, 0.925], [0.455, 0.925]]),
    ];
  }
  // four
  return [
    // four: all four dividers slant, none axis-aligned
    panel(0, [[0, 0.06], [0.52, 0.06], [0.46, 0.49], [0, 0.465]]),
    panel(1, [[0.535, 0.06], [1, 0.06], [1, 0.44], [0.475, 0.475]]),
    panel(2, [[0, 0.485], [0.445, 0.51], [0.52, 0.925], [0, 0.925]]),
    panel(3, [[0.46, 0.495], [1, 0.46], [1, 0.925], [0.535, 0.925]]),
  ];
}

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

export function hitPanel(panels, x, y, W, H) {
  for (let i = panels.length - 1; i >= 0; i--) {
    if (pointInPoly(x / W, y / H, panels[i].poly)) return i;
  }
  return -1;
}

function polyPath(ctx, poly, w, h) {
  ctx.beginPath();
  poly.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x * w, y * h);
    else ctx.lineTo(x * w, y * h);
  });
  ctx.closePath();
}

// Cover-fit with a face-safe anchor: crop the overflowing dimension only,
// never stretch; the anchor sits at its fraction of the crop slack.
function drawPhoto(ctx, img, p, size, state) {
  const { w, h } = size;
  const xs = p.poly.map((pt) => pt[0]);
  const ys = p.poly.map((pt) => pt[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const pw = (x1 - x0) * w;
  const ph = (y1 - y0) * h;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const anchor = p.anchor || [0.5, 0.5];
  const aspect = pw / ph;
  const iAspect = iw / ih;
  const zoom = Math.max(0.6, Math.min(3, p.zoom || 1));
  let cropW = iw;
  let cropH = ih;
  if (aspect > iAspect) cropH = iw / aspect;
  else cropW = ih * aspect;
  cropW /= zoom;
  cropH /= zoom;
  const slackX = iw - cropW;
  const slackY = ih - cropH;
  let sx = anchor[0] * slackX + ((p.panX || 0) / pw) * slackX;
  let sy = anchor[1] * slackY + ((p.panY || 0) / ph) * slackY;
  sx = Math.max(0, Math.min(slackX, sx));
  sy = Math.max(0, Math.min(slackY, sy));
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.save();
  polyPath(ctx, p.poly, w, h);
  ctx.clip();
  ctx.filter = `contrast(${(1 + state.contrast).toFixed(2)}) saturate(${((1 + state.saturation) * grade.sat).toFixed(2)})`;
  if (p.flip) {
    ctx.translate((x0 + x1) * w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(img, sx, sy, cropW, cropH, x0 * w, y0 * h, pw, ph);
  ctx.restore();
}

function drawTag(ctx, p, size) {
  const { w, h } = size;
  const xs = p.poly.map((pt) => pt[0]);
  const ys = p.poly.map((pt) => pt[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const fs = Math.max(13, 0.016 * w);
  ctx.font = `600 ${fs}px Oswald, sans-serif`;
  const pad = fs * 0.55;
  const tw = ctx.measureText(p.tag).width + pad * 2;
  const th = fs * 1.7;
  const x = x0 * w + 6;
  const y = p.tagPos === 'bottom' ? y1 * h - th - 6 : y0 * h + 6;
  ctx.fillStyle = 'rgba(12, 6, 20, 0.92)';
  ctx.fillRect(x, y, tw, th);
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.tag, x + pad, y + th / 2 + 1);
}

function drawPressStrip(ctx, state, size) {
  const { w, h } = size;
  const band = 0.06 * h;
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, band);
  const cy = band / 2;
  const starSize = band * 0.62;
  ctx.font = `${starSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let x = 0.012 * w;
  ctx.fillStyle = '#ffd23f';
  for (let i = 0; i < 5; i++) {
    ctx.fillText('★', x, cy + 1);
    x += starSize * 1.12;
  }
  const qSize = Math.max(13, 0.02 * w);
  ctx.font = `600 ${qSize}px Oswald, sans-serif`;
  x += 0.008 * w;
  ctx.fillStyle = '#fff3d6';
  ctx.fillText(`"${state.quote}"`, x, cy + 1);
  x += ctx.measureText(`"${state.quote}"`).width + 0.01 * w;
  ctx.fillStyle = '#ff8a3d';
  ctx.fillText(`— ${state.quoteSource}`, x, cy + 1);
  // VOL tab
  const tabText = 'VOL. 1';
  ctx.font = `700 ${qSize}px Oswald, sans-serif`;
  const tw = ctx.measureText(tabText).width + qSize * 1.6;
  const th = band * 0.72;
  const tx = w - tw - 0.012 * w;
  const ty = (band - th) / 2;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.roundRect(tx, ty, tw, th, 4);
  ctx.fill();
  ctx.fillStyle = '#241104';
  ctx.textAlign = 'center';
  ctx.fillText(tabText, tx + tw / 2, cy + 1);
}

function drawRibbon(ctx, state, size, spec) {
  const { w, h } = size;
  const fs = Math.max(13, 0.017 * w);
  ctx.font = `600 ${fs}px Oswald, sans-serif`;
  const pad = fs * 0.7;
  const tw = ctx.measureText(state.location).width + pad * 2;
  const th = fs * 1.8;
  const x = 0.02 * w;
  const y = spec.ribbonY * h - th / 2;
  ctx.fillStyle = 'rgba(22, 10, 36, 0.92)';
  ctx.fillRect(x, y, tw, th);
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = Math.max(1.5, th * 0.07);
  ctx.strokeRect(x, y, tw, th);
  ctx.fillStyle = '#ffd23f';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.location, x + pad, y + th / 2 + 1);
}

function drawTitle(ctx, state, size, spec) {
  const { w, h } = size;
  const text = (state.title || 'VICE HEAT').toUpperCase();
  let tSize = 0.30 * w;
  const fit = () => {
    ctx.font = `${tSize}px Anton, sans-serif`;
    return ctx.measureText(text).width;
  };
  while (fit() > w * 0.69 && tSize > 40) tSize -= 4;
  const capH = 0.72 * tSize;
  const baseline = spec.titleY * h + capH;
  ctx.save();
  ctx.translate(w / 2, baseline);
  ctx.transform(1.25, 0, -0.1, 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // magenta drop shadow
  ctx.fillStyle = '#ff2e88';
  ctx.fillText(text, 10, 12);
  // striped gradient fill
  const g = ctx.createLinearGradient(0, -capH, 0, 8);
  g.addColorStop(0, '#fff3c4');
  g.addColorStop(0.28, '#ffd23f');
  g.addColorStop(0.5, '#ff7a1a');
  g.addColorStop(0.68, '#ff2e88');
  g.addColorStop(1, '#7b2ff7');
  ctx.fillStyle = g;
  ctx.fillText(text, 0, 0);
  // dark outline
  ctx.lineWidth = Math.max(3, tSize * 0.028);
  ctx.strokeStyle = '#160a24';
  ctx.lineJoin = 'round';
  ctx.strokeText(text, 0, 0);
  ctx.restore();
  return baseline;
}

function drawScript(ctx, state, size, titleBaseline) {
  const { w, h } = size;
  const sSize = 0.078 * w;
  ctx.save();
  ctx.font = `${sSize}px Yellowtail, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const y = titleBaseline + 0.06 * h;
  ctx.lineWidth = Math.max(3, sSize * 0.08);
  ctx.strokeStyle = '#160a24';
  ctx.lineJoin = 'round';
  ctx.strokeText(state.script, w / 2, y);
  ctx.fillStyle = '#ff8ab8';
  ctx.fillText(state.script, w / 2, y);
  ctx.restore();
}

function drawSeal(ctx, size, spec) {
  const { w, h } = size;
  const cx = spec.sealX * w;
  const cy = spec.sealY * h;
  const R = 0.052 * w;
  const r = 0.038 * w;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? R : r;
    const x = Math.cos(a) * rad;
    const y = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#ff2e88';
  ctx.fill();
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = Math.max(2, R * 0.07);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3d6';
  ctx.fill();
  ctx.fillStyle = '#160a24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = Math.max(10, 0.0115 * w);
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  ctx.fillText('★ ORIGINAL ★', 0, -fs * 0.95);
  ctx.fillText('COVER ART', 0, 0);
  ctx.fillText('EST. 2026', 0, fs * 0.95);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -22, 0, -34);
  ctx.stroke();
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -34);
    ctx.quadraticCurveTo(i * 12, -46, i * 20, -38 + Math.abs(i) * 3);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTagline(ctx, state, size) {
  const { w, h } = size;
  const y0 = 0.925 * h;
  const y1 = 0.97 * h;
  const g = ctx.createLinearGradient(0, y0, w, y0);
  g.addColorStop(0, '#ff2e88');
  g.addColorStop(0.5, '#c44ce0');
  g.addColorStop(1, '#7b2ff7');
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, w, y1 - y0);
  const rnd = mulberry32(99);
  for (let i = 0; i < 9; i++) {
    const x = (i + 0.5) * (w / 9) + (rnd() - 0.5) * 30;
    drawPalm(ctx, x, y1 - 2, (y1 - y0) / 46, 'rgba(22, 10, 36, 0.55)');
  }
  ctx.fillStyle = '#fff3d6';
  ctx.font = `600 ${Math.max(14, 0.022 * w)}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.tagline, w / 2, (y0 + y1) / 2 + 1);
}

function drawCredits(ctx, size) {
  const { w, h } = size;
  const y0 = 0.97 * h;
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, y0, w, h - y0);
  ctx.fillStyle = '#b9a3cc';
  ctx.font = `500 ${Math.max(10, 0.011 * w)}px Oswald, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'VICE HEAT — A VICE HEAT COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · LETTERING AND SEAL ORIGINAL · CAT. VH-26-0619',
    0.012 * w,
    y0 + (h - y0) / 2 + 1,
  );
  // deterministic barcode
  const rnd = mulberry32(2026);
  const bw = 0.055 * w;
  const bh = (h - y0) * 0.62;
  const bx = w - bw - 0.012 * w;
  const by = y0 + (h - y0 - bh) / 2;
  ctx.fillStyle = '#fff3d6';
  ctx.fillRect(bx - 4, by - 3, bw + 8, bh + 6);
  ctx.fillStyle = '#160a24';
  let x = bx;
  while (x < bx + bw - 2) {
    const bar = 1 + rnd() * 4;
    if (rnd() > 0.45) ctx.fillRect(x, by, bar, bh);
    x += bar + 1 + rnd() * 3;
  }
}

function drawGrain(ctx, state, size) {
  const { w, h } = size;
  const rnd = mulberry32(7);
  const n = Math.floor(2200 * state.grain);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const v = rnd() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.05)`;
    ctx.fillRect(rnd() * w, rnd() * h, 1.6, 1.6);
  }
  ctx.restore();
}

function drawHalftone(ctx, size) {
  const { w, h } = size;
  ctx.save();
  ctx.fillStyle = 'rgba(22, 10, 36, 0.07)';
  const step = 8;
  for (let y = step / 2; y < h; y += step) {
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function renderCover(canvas, state, photos) {
  const size = SIZES[state.size];
  const { w, h } = size;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.sunset;
  const spec = layoutSpec(state.layout, state.size);
  const fresh = buildPanels(state.layout, state.size);
  const panels = state.panels && state.panels.length === fresh.length ? state.panels : fresh;

  ctx.fillStyle = '#150a22';
  ctx.fillRect(0, 0, w, h);

  for (const p of panels) {
    const img = photos[p.photo % photos.length];
    if (img) drawPhoto(ctx, img, p, size, state);
  }
  // cream gutters
  ctx.strokeStyle = '#fff3d6';
  ctx.lineWidth = Math.max(2, 0.0035 * w);
  ctx.lineJoin = 'round';
  for (const p of panels) {
    polyPath(ctx, p.poly, w, h);
    ctx.stroke();
  }
  // grade wash + sun glow
  ctx.fillStyle = grade.wash;
  ctx.globalAlpha = state.strength;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  const glow = ctx.createRadialGradient(w * 0.22, h * 0.16, 0, w * 0.22, h * 0.16, w * 0.42);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.globalAlpha = 0.35 * state.strength;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
  // vignette
  if (state.vignette > 0) {
    const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    v.addColorStop(0, 'rgba(10, 4, 18, 0)');
    v.addColorStop(1, `rgba(10, 4, 18, ${0.55 * state.vignette})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  }

  drawPressStrip(ctx, state, size);
  drawRibbon(ctx, state, size, spec);
  const titleBaseline = drawTitle(ctx, state, size, spec);
  drawScript(ctx, state, size, titleBaseline);
  // tags last, so no name tag is ever hidden behind the title
  for (const p of panels) drawTag(ctx, p, size);
  drawSeal(ctx, size, spec);
  drawTagline(ctx, state, size);
  drawCredits(ctx, size);
  if (state.halftone) drawHalftone(ctx, size);
  drawGrain(ctx, state, size);
  return panels;
}
