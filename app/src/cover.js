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

/** Panel rectangles for a layout, as fractions of the panel area. */
export function layoutRects(name, W, H) {
  const areaH = H * 0.88; // panels stop above the tagline strip
  const g = Math.round(Math.min(W, H) * 0.007); // cream gutter
  const u = (x, y, w, h) => ({
    x: Math.round(x * W) + g, y: Math.round(y * areaH) + g,
    w: Math.round(w * W) - g * 2, h: Math.round(h * areaH) - g * 2,
  });
  switch (name) {
    case 'hero': return [
      u(0, 0, 0.55, 0.72), u(0.55, 0, 0.225, 0.36), u(0.775, 0, 0.225, 0.36),
      u(0.55, 0.36, 0.225, 0.36), u(0.775, 0.36, 0.225, 0.36), u(0, 0.72, 0.55, 0.28),
    ];
    case 'comic': return [
      u(0, 0, 0.5, 0.36), u(0.5, 0, 0.5, 0.36), u(0, 0.36, 0.34, 0.32),
      u(0.34, 0.36, 0.33, 0.32), u(0.67, 0.36, 0.33, 0.32), u(0, 0.68, 1, 0.32),
    ];
    case 'nine': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(u(c / 3, r / 3, 1 / 3, 1 / 3));
      return out;
    }
    case 'single': return [u(0, 0, 1, 1)];
    case 'two': return [u(0, 0, 0.5, 1), u(0.5, 0, 0.5, 1)];
    case 'three': return [u(0, 0, 0.55, 1), u(0.55, 0, 0.45, 0.5), u(0.55, 0.5, 0.45, 0.5)];
    case 'four': return [u(0, 0, 0.5, 0.5), u(0.5, 0, 0.5, 0.5), u(0, 0.5, 0.5, 0.5), u(0.5, 0.5, 0.5, 0.5)];
    default: return [u(0, 0, 1, 1)];
  }
}

/** Cover-crop draw of one photo into a rect, with zoom and a crop centre. */
export function drawPhotoInto(ctx, img, rect, zoom, cx, cy, grade, strength) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const ox = rect.x + rect.w / 2 - pw * cx;
  const oy = rect.y + rect.h / 2 - ph * cy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
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

/** A lens-flare sun glow drawn over the hero panel: core, halo, streaks. */
export function drawSunGlow(ctx, rect, grade) {
  const sx = rect.x + rect.w * 0.86;
  const sy = rect.y + rect.h * 0.16;
  const r = rect.w * 0.42;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  halo.addColorStop(0, 'rgba(255, 236, 170, 0.95)');
  halo.addColorStop(0.18, 'rgba(255, 190, 90, 0.55)');
  halo.addColorStop(0.5, 'rgba(255, 110, 80, 0.18)');
  halo.addColorStop(1, 'rgba(255, 110, 80, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
  // Horizontal flare streak through the sun.
  ctx.translate(sx, sy);
  ctx.rotate(-0.12);
  const streak = ctx.createLinearGradient(-r * 1.4, 0, r * 1.4, 0);
  streak.addColorStop(0, 'rgba(255, 220, 160, 0)');
  streak.addColorStop(0.5, 'rgba(255, 220, 160, 0.5)');
  streak.addColorStop(1, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = streak;
  ctx.fillRect(-r * 1.4, -r * 0.012, r * 2.8, r * 0.024);
  ctx.fillRect(-r * 0.5, -r * 0.05, r, r * 0.1);
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255, 250, 225, 0.95)';
  ctx.beginPath();
  ctx.arc(sx, sy, r * 0.07, 0, Math.PI * 2);
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
  const top = H * 0.56;
  const maxW = W * 0.98;
  let size = H * 0.27;
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

/** Five gold stars plus the press-quote bar above the title. */
export function drawStarsAndQuote(ctx, quote, source, W, H) {
  const y = H * 0.50;
  const starR = H * 0.016;
  const gap = starR * 2.5;
  const x0 = W * 0.045;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    starPath(ctx, x0 + i * gap, y, starR);
    ctx.fillStyle = '#ffc93c';
    ctx.strokeStyle = '#7a4d00';
    ctx.lineWidth = Math.max(1, starR * 0.12);
    ctx.fill();
    ctx.stroke();
  }
  const quoteText = `“${quote}” — ${source}`;
  const fs = Math.max(12, H * 0.021);
  ctx.font = `600 ${fs}px Oswald, sans-serif`;
  const qw = ctx.measureText(quoteText).width;
  const pad = fs * 0.7;
  const bx = x0 + 5 * gap + gap * 0.4;
  ctx.fillStyle = 'rgba(10, 4, 12, 0.88)';
  ctx.beginPath();
  ctx.roundRect(bx, y - fs * 0.75, qw + pad * 2, fs * 1.5, fs * 0.75);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(quoteText, bx + pad, y + fs * 0.05);
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

/** A palm silhouette: curved trunk with drooping fronds. */
export function drawPalm(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = '#14060f';
  ctx.fillStyle = '#14060f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(4, -22, 10, -34);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.15 + i * 0.14);
    ctx.beginPath();
    ctx.moveTo(10, -34);
    ctx.quadraticCurveTo(10 + Math.cos(a) * 22, -34 + Math.sin(a) * 16, 10 + Math.cos(a) * 34, -34 + Math.sin(a) * 26 + 10);
    ctx.quadraticCurveTo(10 + Math.cos(a) * 20, -34 + Math.sin(a) * 10, 10, -34);
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

  const rects = layoutRects(state.layout, W, H);
  const labels = state.layout === 'single' ? [''] : PANEL_LABELS;
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: 0, zoom: 1, cx: 0.5, cy: 0.5 };
    const photo = state.photos[panel.photo];
    if (photo && photo.img) {
      const cx = panel.cx ?? photo.anchorX ?? 0.5;
      const cy = panel.cy ?? photo.anchorY ?? 0.5;
      drawPhotoInto(ctx, photo.img, rect, panel.zoom || 1, cx, cy, grade, strength);
    } else {
      ctx.fillStyle = '#3a2b4d';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    }
    // Hero focal moment: sun glow on the first panel of hero / single layouts.
    if ((state.layout === 'hero' || state.layout === 'single') && i === 0 && state.grade !== 'neon') {
      drawSunGlow(ctx, rect, grade);
    }
    if (state.selectedPanel === i && state.showSelection) {
      ctx.save();
      ctx.strokeStyle = '#ff2e88';
      ctx.lineWidth = Math.max(3, H * 0.004);
      ctx.setLineDash([H * 0.012, H * 0.008]);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      ctx.restore();
    }
    // Panel caption chip, top-left inside the panel (skipped on low panels
    // the title covers, so no half-hidden chip peeks out).
    const label = labels[i % labels.length];
    if (label && rect.y < H * 0.55) {
      const fs = Math.max(11, H * 0.016);
      ctx.save();
      ctx.font = `700 ${fs}px Oswald, sans-serif`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(10,4,12,0.85)';
      ctx.beginPath();
      ctx.roundRect(rect.x + H * 0.008, rect.y + H * 0.008, tw + fs * 1.1, fs * 1.7, fs * 0.4);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, rect.x + H * 0.008 + fs * 0.55, rect.y + H * 0.008 + fs * 0.88);
      ctx.restore();
    }
  });

  // A warm dusk wash behind the title so white-on-photo lettering always reads.
  const wash = ctx.createLinearGradient(0, H * 0.5, 0, H * 0.9);
  wash.addColorStop(0, 'rgba(20,6,15,0)');
  wash.addColorStop(1, 'rgba(20,6,15,0.42)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, H * 0.5, W, H * 0.4);

  const title = (state.title || 'VICE HEAT').toUpperCase();
  drawStarsAndQuote(ctx, state.quote || 'PURE SUNSET ADRENALINE', state.quoteSrc || 'THE VICE GAZETTE', W, H);
  const { size: titleSize } = drawTitle(ctx, title, W, H, state.grade);
  drawSubtitle(ctx, state.subtitle || 'Neon Palms', W, H, titleSize);
  drawSeal(ctx, W * 0.885, H * 0.44, H * 0.062);

  // Tagline strip: gradient band, palm silhouettes, spaced capitals.
  const stripY = H * 0.88;
  const stripH = H * 0.07;
  const strip = ctx.createLinearGradient(0, stripY, W, stripY);
  strip.addColorStop(0, '#ff2e88');
  strip.addColorStop(0.5, '#b83280');
  strip.addColorStop(1, '#3b0f8f');
  ctx.fillStyle = strip;
  ctx.fillRect(0, stripY, W, stripH);
  ctx.save();
  ctx.globalAlpha = 0.9;
  const palmS = stripH * 0.9;
  for (let i = 0; i < 9; i++) {
    const px = (W * (i + 0.5)) / 9 + (i % 2 === 0 ? W * 0.01 : -W * 0.01);
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
