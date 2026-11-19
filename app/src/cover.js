// Vice Heat Cover Studio — cover renderer.
// One shared renderer draws the poster onto any canvas, at any of the three
// post sizes. The editor preview and the PNG export call the same function,
// so what you see is exactly what you save.
//
// The poster system: a comic collage of photo panels on cream gutters, a huge
// skewed gradient title with a layered outline, a pink script subtitle, five
// gold stars with a press quote, a hand-drawn starburst seal, and a tagline
// strip with palm silhouettes, credits and a deterministic barcode.

export const SIZES = {
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 · Landscape' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 · Portrait' },
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 · Square' },
};

export const LAYOUTS = {
  hero: { label: 'Hero', panels: 6 },
  comic: { label: 'Comic 6', panels: 6 },
  nine: { label: '9 panels', panels: 9 },
  single: { label: '1 panel', panels: 1 },
  two: { label: '2 panels', panels: 2 },
  three: { label: '3 panels', panels: 3 },
  four: { label: '4 panels', panels: 4 },
};

export const GRADES = {
  vice: { label: 'Vice Sunset', sat: 1.25, con: 1.08, bri: 1.02, tint: ['#ff7a18', '#ff2e88', '#7b2ff7'], tintAlpha: 0.16 },
  neon: { label: 'Neon Night', sat: 1.35, con: 1.12, bri: 0.96, tint: ['#00e5ff', '#ff2e88', '#3b0f8f'], tintAlpha: 0.22 },
  golden: { label: 'Golden Hour', sat: 1.18, con: 1.04, bri: 1.06, tint: ['#ffd23f', '#ff8a00', '#ff5e3a'], tintAlpha: 0.14 },
  ink: { label: 'Comic Ink', sat: 1.45, con: 1.35, bri: 1.0, tint: ['#ff9d00', '#e53888', '#222244'], tintAlpha: 0.12 },
  dusk: { label: 'Dusk Teal', sat: 1.3, con: 1.1, bri: 0.98, tint: ['#00c2a8', '#ff7a18', '#1b2a6b'], tintAlpha: 0.18 },
};

export const PANEL_LABELS = [
  'THE DRIVER', 'THE ANGLER', 'THE LOOKOUT', 'THE FIXER',
  'THE GETAWAY', 'THE CLOSER', 'THE WHEELMAN', 'THE DEAL', 'THE ESCAPE',
];

// A small deterministic generator, so the grain on a cover is stable between
// the preview and the export of the same caption.
export function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return function next() {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cell tables for the slanted comic panels (GTA style): [x0, x1, y0, y1] as
// fractions of the panel area, plus per-divider leans that turn the cells
// into true trapezoids. vLean maps a vertical divider's fx to its lean
// (fraction of W, constant over the height, pivoting at mid-height); hLean
// maps a horizontal divider's fy to its lean (fraction of H across the
// width). Neighbouring vertical dividers lean in OPPOSITE directions and
// horizontal dividers slant both ways, so the collage reads as a fan of
// trapezoids like the classic GTA cover — not a grid of near-rectangles.
// The leans are keyed per divider, so any corner (fx, fy) is computed
// identically by every cell that shares it: the tiling stays gapless.
const LAYOUT_CELLS = {
  hero: {
    // Mirrors the top-1 "Sunset State" landscape: wide hero left, right
    // column of face + road / gas station / motorcycle + boat, row dividers
    // slanting down-right then up-right. Hero edge leans left going down
    // (top wider), moto/boat divider leans the other way, like the reference.
    vLean: { 0.55: -0.035, 0.78: -0.03, 0.79: 0.025 },
    hLean: { 0.34: 0.08, 0.64: -0.07 },
    cells: [
      [0, 0.55, 0, 1], [0.55, 0.78, 0, 0.34], [0.78, 1, 0, 0.34],
      [0.55, 1, 0.34, 0.64], [0.55, 0.79, 0.64, 1], [0.79, 1, 0.64, 1],
    ],
  },
  comic: {
    vLean: { 0.58: 0.03, 0.30: -0.025, 0.70: 0.025 },
    hLean: { 0.36: 0.07, 0.68: -0.06 },
    cells: [
      [0, 0.58, 0, 0.36], [0.58, 1, 0, 0.36], [0, 0.30, 0.36, 0.68],
      [0.30, 0.70, 0.36, 0.68], [0.70, 1, 0.36, 0.68], [0, 1, 0.68, 1],
    ],
  },
  nine: {
    vLean: { [1 / 3]: 0.02, [2 / 3]: -0.02 },
    hLean: { [1 / 3]: 0.05, [2 / 3]: -0.05 },
    cells: [
      [0, 1 / 3, 0, 1 / 3], [1 / 3, 2 / 3, 0, 1 / 3], [2 / 3, 1, 0, 1 / 3],
      [0, 1 / 3, 1 / 3, 2 / 3], [1 / 3, 2 / 3, 1 / 3, 2 / 3], [2 / 3, 1, 1 / 3, 2 / 3],
      [0, 1 / 3, 2 / 3, 1], [1 / 3, 2 / 3, 2 / 3, 1], [2 / 3, 1, 2 / 3, 1],
    ],
  },
  single: { vLean: {}, hLean: {}, cells: [[0, 1, 0, 1]] },
  two: { vLean: { 0.5: 0.04 }, hLean: {}, cells: [[0, 0.5, 0, 1], [0.5, 1, 0, 1]] },
  three: {
    vLean: { 0.55: 0.035 },
    hLean: { 0.5: 0.07 },
    cells: [[0, 0.55, 0, 1], [0.55, 1, 0, 0.5], [0.55, 1, 0.5, 1]],
  },
  four: {
    vLean: { 0.5: 0.03 },
    hLean: { 0.5: -0.06 },
    cells: [[0, 0.5, 0, 0.5], [0.5, 1, 0, 0.5], [0, 0.5, 0.5, 1], [0.5, 1, 0.5, 1]],
  },
};

/** Lean of one divider from a per-divider table (float keys, tolerant). */
function leanFor(table, v) {
  for (const [k, lean] of Object.entries(table)) {
    if (Math.abs(Number(k) - v) < 1e-9) return lean;
  }
  return 0;
}

/** X of a vertical divider at a given height fraction (outer edges fixed). */
function dividerX(fx, fy, vLean, W) {
  if (fx <= 0 || fx >= 1) return fx * W;
  return fx * W + leanFor(vLean, fx) * W * (fy - 0.5);
}

/** Y of a horizontal divider at a given width fraction (outer edges fixed). */
function dividerY(fy, fx, hLean, areaH) {
  if (fy <= 0 || fy >= 1) return fy * areaH;
  return fy * areaH + leanFor(hLean, fy) * areaH * (fx - 0.5);
}

/** Panel polygons for a layout: [{ pts: [[x, y] x4], rect: {x, y, w, h} }]. */
export function layoutPolys(name, W, H) {
  const def = LAYOUT_CELLS[name] || LAYOUT_CELLS.single;
  const areaH = H * 0.88; // panels stop above the tagline strip
  const g = Math.round(Math.min(W, H) * 0.007); // cream gutter
  return def.cells.map(([fx0, fx1, fy0, fy1]) => {
    const pts = [
      [dividerX(fx0, fy0, def.vLean, W) + g, dividerY(fy0, fx0, def.hLean, areaH) + g],
      [dividerX(fx1, fy0, def.vLean, W) - g, dividerY(fy0, fx1, def.hLean, areaH) + g],
      [dividerX(fx1, fy1, def.vLean, W) - g, dividerY(fy1, fx1, def.hLean, areaH) - g],
      [dividerX(fx0, fy1, def.vLean, W) + g, dividerY(fy1, fx0, def.hLean, areaH) - g],
    ];
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return {
      pts,
      rect: { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY },
    };
  });
}

/** Panel rectangles for a layout (bounding boxes; minis and hit tests). */
export function layoutRects(name, W, H) {
  return layoutPolys(name, W, H).map((p) => p.rect);
}

/** Cover-crop draw of one photo into a rect, with zoom and a crop centre.
 *  When `poly` is given (a slanted panel), the photo is clipped to the
 *  polygon instead; placement still uses the bounding rect. */
export function drawPhotoInto(ctx, img, rect, zoom, cx, cy, grade, strength, poly) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  // Cover-crop offsets, clamped so the image always covers the rect: the
  // crop centre only distributes overflow, it must never open a gap.
  const ox = Math.min(rect.x, Math.max(rect.x + rect.w - pw, rect.x + rect.w / 2 - pw * cx));
  const oy = Math.min(rect.y, Math.max(rect.y + rect.h - ph, rect.y + rect.h / 2 - ph * cy));
  ctx.save();
  ctx.beginPath();
  if (poly) {
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.clip();
  ctx.filter = `saturate(${(1 + (grade.sat - 1) * strength).toFixed(3)}) ` +
    `contrast(${(1 + (grade.con - 1) * strength).toFixed(3)}) ` +
    `brightness(${(1 + (grade.bri - 1) * strength).toFixed(3)})`;
  ctx.drawImage(img, ox, oy, pw, ph);
  ctx.filter = 'none';
  // Warm / cool wash over the photo, stronger at the edges.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.tint[0] + '00');
  wash.addColorStop(0.55, grade.tint[1] + Math.round(grade.tintAlpha * strength * 255).toString(16).padStart(2, '0'));
  wash.addColorStop(1, grade.tint[2] + Math.round(grade.tintAlpha * strength * 320).toString(16).padStart(2, '0'));
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** A lens-flare sun glow drawn over the hero panel: core, halo, streaks.
 *  The boulevard photo already has its own sun low on the left, so the
 *  glow reinforces that spot — a second sun stamped over the subject's
 *  face was the v1 glare smear. Small core, short thin streak, no wash. */
export function drawSunGlow(ctx, rect, grade) {
  const sx = rect.x + rect.w * 0.07;
  const sy = rect.y + rect.h * 0.30;
  const r = rect.w * 0.26;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  halo.addColorStop(0, 'rgba(255, 236, 170, 0.85)');
  halo.addColorStop(0.25, 'rgba(255, 190, 90, 0.4)');
  halo.addColorStop(0.6, 'rgba(255, 110, 80, 0.12)');
  halo.addColorStop(1, 'rgba(255, 110, 80, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  // One short, thin horizontal flare streak through the sun.
  ctx.translate(sx, sy);
  ctx.rotate(-0.08);
  const streak = ctx.createLinearGradient(-r, 0, r, 0);
  streak.addColorStop(0, 'rgba(255, 220, 160, 0)');
  streak.addColorStop(0.5, 'rgba(255, 220, 160, 0.32)');
  streak.addColorStop(1, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(-r, -r * 0.008, r * 2, r * 0.016);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 225, 0.95)';
  ctx.beginPath();
  ctx.arc(sx, sy, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
  // Two small bokeh ghosts trailing right of the sun.
  ctx.fillStyle = 'rgba(255, 200, 120, 0.28)';
  ctx.beginPath();
  ctx.arc(sx + r * 0.55, sy + r * 0.10, r * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 150, 160, 0.20)';
  ctx.beginPath();
  ctx.arc(sx + r * 0.95, sy - r * 0.06, r * 0.03, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** One five-pointed star path, centred at (x, y) with outer radius r. */
export function starPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** The giant skewed gradient title, with a layered outline and magenta shadow. */
export function drawTitle(ctx, text, W, H, grade) {
  const top = H * 0.55;
  const maxW = W * 0.98;
  let size = H * 0.29;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const measure = (s) => {
    ctx.font = `${s}px Anton, 'Arial Black', sans-serif`;
    return ctx.measureText(text).width * 1.04;
  };
  while (measure(size) > maxW && size > 20) size -= 4;
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  // Skew the whole title block around its centre.
  ctx.translate(W / 2, top + size);
  ctx.transform(1, 0, -0.14, 1, 0, 0);
  const grad = ctx.createLinearGradient(0, -size, 0, size * 0.12);
  if (grade === 'neon') {
    grad.addColorStop(0, '#aef7ff'); grad.addColorStop(0.45, '#38e1ff');
    grad.addColorStop(0.75, '#ff5fa2'); grad.addColorStop(1, '#ff2e88');
  } else if (grade === 'dusk') {
    grad.addColorStop(0, '#d8fff4'); grad.addColorStop(0.45, '#2ee6c8');
    grad.addColorStop(0.75, '#ff9d00'); grad.addColorStop(1, '#ff5e3a');
  } else if (grade === 'ink') {
    grad.addColorStop(0, '#fff6c9'); grad.addColorStop(0.5, '#ffb400');
    grad.addColorStop(1, '#ff5e3a');
  } else {
    grad.addColorStop(0, '#fff3a3'); grad.addColorStop(0.42, '#ffc93c');
    grad.addColorStop(0.72, '#ff7a18'); grad.addColorStop(1, '#ff2e63');
  }
  // Magenta drop shadow, offset down-right.
  ctx.save();
  ctx.translate(size * 0.045, size * 0.075);
  ctx.fillStyle = grade === 'neon' ? '#7b2ff7' : '#c2185b';
  ctx.fillText(text, 0, 0);
  ctx.restore();
  // Layered outline: thick black, then a thinner deep-purple ring.
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#14060f';
  ctx.lineWidth = size * 0.17;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = grade === 'neon' ? '#2b0a4d' : '#4d0a2e';
  ctx.lineWidth = size * 0.085;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  // Thin bright rim along the top of the letters.
  ctx.save();
  ctx.translate(0, -size * 0.015);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = size * 0.012;
  ctx.strokeText(text, 0, 0);
  ctx.restore();
  ctx.restore();
  return { size, baselineY: top + size };
}

/** Pink brush-script subtitle overlapping the foot of the title. */
export function drawSubtitle(ctx, text, W, H, titleSize) {
  const size = Math.min(H * 0.075, W * 0.07);
  ctx.save();
  ctx.translate(W * 0.60, H * 0.56 + titleSize * 1.0);
  ctx.rotate(-0.07);
  ctx.font = `${size}px Yellowtail, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#7a0a3d';
  ctx.lineWidth = size * 0.14;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = '#ff5fa2';
  ctx.fillText(text, 0, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `${size * 0.9}px Yellowtail, cursive`;
  ctx.fillText(text, 0, -size * 0.06);
  ctx.restore();
}

/** Five gold stars plus the press quote, set in a full-width dark press
 *  strip across the collage — a deliberate masthead band, never a pill
 *  floating over one panel by accident. */
export function drawStarsAndQuote(ctx, quote, source, W, H) {
  const bandY = H * 0.482;
  const bandH = H * 0.042;
  ctx.save();
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(12, 4, 14, 0.94)');
  band.addColorStop(1, 'rgba(12, 4, 14, 0.80)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, W, bandH);
  ctx.fillStyle = '#ffc93c';
  ctx.fillRect(0, bandY, W, Math.max(2, bandH * 0.05));
  ctx.fillRect(0, bandY + bandH - Math.max(2, bandH * 0.05), W, Math.max(2, bandH * 0.05));
  const y = bandY + bandH / 2;
  const starR = bandH * 0.30;
  const gap = starR * 2.6;
  const x0 = W * 0.022;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, x0 + i * gap, y, starR);
    ctx.fillStyle = '#ffc93c';
    ctx.strokeStyle = '#7a4d00';
    ctx.lineWidth = Math.max(1, starR * 0.12);
    ctx.fill();
    ctx.stroke();
  }
  let quoteText = `“${quote}” — ${source}`;
  let fs = Math.max(11, bandH * 0.46);
  ctx.font = `600 ${fs}px Oswald, sans-serif`;
  const maxQW = W * 0.80;
  while (ctx.measureText(quoteText).width > maxQW && fs > 11) {
    fs -= 1;
    ctx.font = `600 ${fs}px Oswald, sans-serif`;
  }
  while (ctx.measureText(quoteText).width > maxQW && quoteText.length > 12) {
    quoteText = quoteText.slice(0, -5) + '…”';
  }
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(quoteText, x0 + 5 * gap + gap * 0.5, y + fs * 0.05);
  ctx.restore();
}

/** Starburst seal, drawn entirely in canvas, with two lines of text. */
export function drawSeal(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  const points = 18;
  for (let i = 0; i < points * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.82;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#e53888';
  ctx.fill();
  ctx.lineWidth = r * 0.06;
  ctx.strokeStyle = '#fff3d6';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fillStyle = '#fff3d6';
  ctx.fill();
  ctx.fillStyle = '#14060f';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fs = r * 0.21;
  ctx.font = `700 ${fs}px Oswald, sans-serif`;
  ctx.fillText('★ ★ ★', 0, -r * 0.42);
  ctx.fillText('ORIGINAL', 0, -r * 0.1);
  ctx.fillText('COVER ART', 0, r * 0.16);
  ctx.font = `${r * 0.13}px Oswald, sans-serif`;
  ctx.fillText('EST. 2026', 0, r * 0.42);
  ctx.restore();
}

/** A palm silhouette: curved trunk with full drooping fronds. */
export function drawPalm(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#14060f';
  ctx.fillStyle = '#14060f';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(5, -24, 12, -38);
  ctx.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * (0.06 + i * 0.14);
    ctx.beginPath();
    ctx.moveTo(12, -38);
    ctx.quadraticCurveTo(12 + Math.cos(a) * 26, -38 + Math.sin(a) * 18, 12 + Math.cos(a) * 40, -38 + Math.sin(a) * 30 + 12);
    ctx.quadraticCurveTo(12 + Math.cos(a) * 22, -38 + Math.sin(a) * 10, 12, -38);
    ctx.fill();
  }
  ctx.restore();
}

/** Deterministic barcode bars from the title text. */
export function drawBarcode(ctx, x, y, w, h, seedText) {
  const rnd = seededRandom('barcode:' + seedText);
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = '#14060f';
  let px = x;
  while (px < x + w) {
    const bw = 1 + Math.floor(rnd() * 4);
    if (rnd() > 0.45) ctx.fillRect(px, y, bw, h);
    px += bw + 1 + Math.floor(rnd() * 3);
  }
  ctx.restore();
}

/** Halftone dot overlay for the Comic Ink grade. */
export function drawHalftone(ctx, W, H, strength) {
  const step = Math.max(6, Math.round(Math.min(W, H) / 160));
  ctx.save();
  ctx.globalAlpha = 0.16 * strength;
  ctx.fillStyle = '#14060f';
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      const r = step * 0.16 * (0.6 + 0.4 * Math.sin((x + y) * 0.02));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Film grain: stable speckles seeded from the caption. */
export function drawGrain(ctx, W, H, amount, seedText) {
  if (amount <= 0.01) return;
  const rnd = seededRandom('grain:' + seedText);
  const count = Math.round((W * H) / 2600 * amount);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rnd();
    ctx.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.05 + rnd() * 0.06})` : `rgba(0,0,0,${0.05 + rnd() * 0.07})`;
    const s = 1 + Math.floor(rnd() * 2);
    ctx.fillRect(rnd() * W, rnd() * H, s, s);
  }
  ctx.restore();
}

/** Soft dark vignette around the whole cover. */
export function drawVignette(ctx, W, H, amount) {
  if (amount <= 0.01) return;
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(10,4,12,0)');
  g.addColorStop(1, `rgba(10,4,12,${0.55 * amount})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/**
 * Draws the full poster onto `canvas` from a state object:
 * photos, panels, layout, grade, sliders, caption and size.
 * `state.photos` holds { img, name, anchorX, anchorY }.
 * `state.panels` holds { photo, zoom, cx, cy } per panel.
 */
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES['1920x1080'];
  const W = size.w;
  const H = size.h;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] || GRADES.vice;
  const strength = state.strength ?? 0.9;
  // Cream comic-page background; gutters read as paper between panels.
  ctx.fillStyle = '#fdf6e3';
  ctx.fillRect(0, 0, W, H);

  const polys = layoutPolys(state.layout, W, H);
  const g = Math.round(Math.min(W, H) * 0.007); // cream gutter
  const labels = state.layout === 'single' ? [''] : PANEL_LABELS;
  polys.forEach(({ pts, rect }, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, cx: 0.5, cy: 0.5 };
    const photo = state.photos[panel.photo];
    if (photo && photo.img) {
      const cx = panel.cx ?? photo.anchorX ?? 0.5;
      const cy = panel.cy ?? photo.anchorY ?? 0.5;
      drawPhotoInto(ctx, photo.img, rect, panel.zoom || 1, cx, cy, grade, strength, pts);
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.fillStyle = '#3a2b4d';
      ctx.fill();
      ctx.restore();
    }
    // Cream comic border along the slanted panel edge.
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    ctx.closePath();
    ctx.strokeStyle = '#fdf6e3';
    ctx.lineWidth = g;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
    // Hero focal moment: sun glow on the first panel of hero / single layouts.
    if ((state.layout === 'hero' || state.layout === 'single') && i === 0 &&
      (state.grade === 'vice' || state.grade === 'golden')) {
      drawSunGlow(ctx, rect, grade);
    }
    if (state.selectedPanel === i && state.showSelection) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = Math.max(3, H * 0.004);
      ctx.setLineDash([H * 0.012, H * 0.008]);
      ctx.stroke();
      ctx.restore();
    }
    // Panel caption chip, top-left inside the panel (skipped on low panels
    // the title covers, so no half-hidden chip peeks out).
    const label = labels[i % labels.length];
    if (label && pts[0][1] < H * 0.55) {
      const fs = Math.max(11, H * 0.016);
      ctx.save();
      ctx.font = `700 ${fs}px Oswald, sans-serif`;
      const tw = ctx.measureText(label).width;
      const chipX = pts[0][0] + H * 0.008;
      const chipY = pts[0][1] + H * 0.008;
      ctx.fillStyle = 'rgba(10,4,12,0.85)';
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, tw + fs * 1.1, fs * 1.7, fs * 0.4);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, chipX + fs * 0.55, chipY + fs * 0.88);
      ctx.restore();
    }
  });

  // Thin black poster frame around the whole cover.
  ctx.save();
  ctx.strokeStyle = '#0d040c';
  ctx.lineWidth = Math.max(4, H * 0.006);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();

  // A warm dusk wash behind the title so white-on-photo lettering always reads.
  const wash = ctx.createLinearGradient(0, H * 0.46, 0, H * 0.92);
  wash.addColorStop(0, 'rgba(20,6,15,0)');
  wash.addColorStop(1, 'rgba(20,6,15,0.5)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, H * 0.46, W, H * 0.46);

  const title = (state.title || 'VICE HEAT').toUpperCase();
  drawStarsAndQuote(ctx, state.quote || 'PURE SUNSET ADRENALINE', state.quoteSrc || 'THE VICE GAZETTE', W, H);
  const { size: titleSize } = drawTitle(ctx, title, W, H, state.grade);
  drawSubtitle(ctx, state.subtitle || 'Neon Palms', W, H, titleSize);
  // Seal straddles a panel junction, like the top-1 cover: hero layout puts
  // it on the face/gas-station corner; other layouts keep it at the right
  // edge, clear of the panel chips.
  const sealPos = { hero: [0.775, 0.315] }[state.layout] || [0.885, 0.44];
  drawSeal(ctx, W * sealPos[0], H * sealPos[1], H * 0.062);

  // Tagline strip: gradient band, palm silhouettes, spaced capitals.
  const stripY = H * 0.88;
  const stripH = H * 0.07;
  const strip = ctx.createLinearGradient(0, stripY, W, stripY);
  strip.addColorStop(0, '#ff2e88');
  strip.addColorStop(0.5, '#b83280');
  strip.addColorStop(1, '#3b0f8f');
  ctx.fillStyle = strip;
  ctx.fillRect(0, stripY, W, stripH);
  // Low setting sun behind the tagline, then a row of fuller palms.
  ctx.save();
  const sunG = ctx.createRadialGradient(W / 2, stripY + stripH * 0.98, 0, W / 2, stripY + stripH * 0.98, stripH * 1.1);
  sunG.addColorStop(0, 'rgba(255, 210, 63, 0.5)');
  sunG.addColorStop(0.6, 'rgba(255, 122, 24, 0.28)');
  sunG.addColorStop(1, 'rgba(255, 122, 24, 0)');
  ctx.fillStyle = sunG;
  ctx.fillRect(W / 2 - stripH * 1.1, stripY, stripH * 2.2, stripH);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.9;
  const palmS = stripH * 0.9;
  for (let i = 0; i < 11; i++) {
    const px = (W * (i + 0.5)) / 11 + (i % 2 === 0 ? W * 0.008 : -W * 0.008);
    drawPalm(ctx, px, stripY + stripH * 0.98, palmS / 40);
  }
  ctx.restore();
  const tagline = (state.tagline || 'ONE COAST · NO RULES · COMING SOON').toUpperCase();
  const tfs = Math.max(12, stripH * 0.34);
  ctx.save();
  ctx.font = `600 ${tfs}px Oswald, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Letter-spacing by hand: measure each word, draw centred with gaps.
  const words = tagline.split(' ');
  const gapW = tfs * 0.9;
  const widths = words.map((w) => ctx.measureText(w).width);
  const totalW = widths.reduce((a, b) => a + b, 0) + gapW * (words.length - 1);
  let tx = (W - totalW) / 2;
  ctx.fillStyle = '#fff3d6';
  ctx.shadowColor = 'rgba(20,6,15,0.8)';
  ctx.shadowBlur = tfs * 0.15;
  words.forEach((w, i) => {
    ctx.fillText(w, tx + widths[i] / 2, stripY + stripH / 2 + tfs * 0.05);
    tx += widths[i] + gapW;
  });
  ctx.restore();

  // Credits band: tiny credits left, barcode right.
  ctx.fillStyle = '#0d040c';
  ctx.fillRect(0, H * 0.95, W, H * 0.05);
  const cfs = Math.max(9, H * 0.013);
  ctx.save();
  ctx.font = `${cfs}px Oswald, sans-serif`;
  ctx.fillStyle = '#cbb8c2';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `${title} — A VICE HEAT COVER STUDIO PICTURE · STARRING YOU · SHOT ON YOUR OWN CAMERA · LETTERING AND SEAL ORIGINAL · CAT. VH-26-0619`,
    W * 0.015, H * 0.975,
  );
  ctx.restore();
  drawBarcode(ctx, W * 0.93, H * 0.958, W * 0.055, H * 0.034, title);

  if (state.halftone || state.grade === 'ink') drawHalftone(ctx, W, H, state.halftone ? 1 : 0.7);
  drawGrain(ctx, W, H, state.grain ?? 0.28, title + (state.subtitle || ''));
  drawVignette(ctx, W, H, state.vignette ?? 0.5);
  return { w: W, h: H };
}
