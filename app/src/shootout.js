// Gang shootout scene, drawn procedurally on a canvas — the app is offline,
// so no photo is fetched for it. A dusk street, two crews trading fire
// across a parked lowrider, muzzle flashes, neon and wet asphalt.
// Used as a seventh sample photo ("Shootout") in the strip and panels.

import { seededRandom } from './cover.js';

const W = 1024;
const H = 640;

function skyline(ctx, rnd, baseY, color, minH, maxH, windows) {
  ctx.fillStyle = color;
  let x = -10;
  while (x < W + 10) {
    const bw = 46 + rnd() * 56;
    const bh = minH + rnd() * (maxH - minH);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (windows) {
      for (let wy = baseY - bh + 12; wy < baseY - 14; wy += 18) {
        for (let wx = x + 8; wx < x + bw - 8; wx += 16) {
          if (rnd() > 0.72) {
            ctx.fillStyle = rnd() > 0.6 ? 'rgba(255, 210, 63, 0.85)' : 'rgba(56, 225, 255, 0.8)';
            ctx.fillRect(wx, wy, 5, 7);
            ctx.fillStyle = color;
          }
        }
      }
    }
    // Rooftop antenna on some buildings.
    if (rnd() > 0.7) {
      ctx.fillRect(x + bw / 2 - 1, baseY - bh - 26, 2, 26);
      ctx.fillStyle = '#ff2e55';
      ctx.beginPath();
      ctx.arc(x + bw / 2, baseY - bh - 28, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
    x += bw + 4 + rnd() * 14;
  }
}

function neonSign(ctx, x, y, text, size) {
  ctx.save();
  ctx.font = `900 ${size}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;
  ctx.strokeStyle = '#ff5fa2';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.roundRect(x - tw / 2 - 18, y - size * 0.62, tw + 36, size * 1.24, 10);
  ctx.stroke();
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#fff0f5';
  ctx.fillText(text, x, y + 2);
  ctx.restore();
}

function gunman(ctx, x, y, s, dir, pose, rim) {
  // Side-view silhouette, gun extended toward `dir`. y = street level.
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  const C = '#0a0512';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const limb = (x1, y1, x2, y2, w) => {
    ctx.strokeStyle = C;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };
  if (pose === 'crouch') {
    limb(-6, -92, -52, -42, 15); limb(-52, -42, -80, 0, 14);
    limb(-6, -92, 26, -54, 15); limb(26, -54, 46, 0, 14);
    limb(-6, -92, 16, -158, 30); // torso, leaning forward
    // head + cap
    ctx.fillStyle = C;
    ctx.beginPath(); ctx.arc(22, -176, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(8, -192, 34, 7);
    // arms + pistol
    limb(16, -152, 52, -142, 11); limb(16, -152, 78, -138, 10);
    ctx.fillStyle = C;
    ctx.fillRect(74, -143, 42, 9);
    ctx.fillRect(110, -141, 12, 5);
  } else {
    limb(0, -100, -18, -48, 15); limb(-18, -48, -28, 0, 14);
    limb(0, -100, 22, -50, 15); limb(22, -50, 36, 0, 14);
    limb(0, -100, 10, -168, 30); // torso
    ctx.fillStyle = C;
    ctx.beginPath(); ctx.arc(16, -186, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(2, -202, 34, 7); // cap brim
    limb(10, -160, 48, -150, 11); limb(10, -160, 82, -146, 10);
    ctx.fillStyle = C;
    ctx.fillRect(78, -151, 44, 9);
    ctx.fillRect(118, -149, 12, 5);
  }
  // Rim light on the facing edge: torso front + head arc.
  ctx.strokeStyle = rim;
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (pose === 'crouch') {
    ctx.moveTo(28, -96); ctx.lineTo(30, -156);
    ctx.arc(22, -176, 17, -0.9, 0.9);
  } else {
    ctx.moveTo(24, -104); ctx.lineTo(24, -166);
    ctx.arc(16, -186, 17, -0.9, 0.9);
  }
  ctx.stroke();
  ctx.restore();
}

function muzzleFlash(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 64 * scale);
  glow.addColorStop(0, 'rgba(255, 240, 180, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 160, 60, 0.5)');
  glow.addColorStop(1, 'rgba(255, 120, 40, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 64 * scale, 0, Math.PI * 2);
  ctx.fill();
  // Starburst spikes.
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  const spikes = 8;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 34 * scale : 9 * scale;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbe8';
  ctx.beginPath();
  ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Smoke drifting back toward the shooter.
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const sx = x - 18 - i * 16;
    const sy = y - 10 - i * 6;
    const sr = 12 + i * 7;
    const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sg.addColorStop(0, 'rgba(180, 160, 190, 0.20)');
    sg.addColorStop(1, 'rgba(180, 160, 190, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function lowrider(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // Pink underglow.
  const ug = ctx.createRadialGradient(0, 6, 0, 0, 6, 190);
  ug.addColorStop(0, 'rgba(255, 46, 136, 0.5)');
  ug.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = ug;
  ctx.beginPath();
  ctx.ellipse(0, 8, 190, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body silhouette.
  ctx.fillStyle = '#0d0716';
  ctx.beginPath();
  ctx.moveTo(-170, 0);
  ctx.lineTo(-168, -34);
  ctx.quadraticCurveTo(-120, -44, -84, -46);
  ctx.lineTo(-58, -84);
  ctx.quadraticCurveTo(-52, -92, -40, -92);
  ctx.lineTo(52, -92);
  ctx.quadraticCurveTo(66, -92, 76, -80);
  ctx.lineTo(108, -48);
  ctx.quadraticCurveTo(160, -44, 172, -30);
  ctx.lineTo(170, 0);
  ctx.closePath();
  ctx.fill();
  // Chrome roof-line highlight + window.
  ctx.strokeStyle = 'rgba(255, 95, 162, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-84, -46);
  ctx.lineTo(-58, -84);
  ctx.lineTo(52, -92);
  ctx.lineTo(76, -80);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120, 40, 90, 0.9)';
  ctx.beginPath();
  ctx.moveTo(-52, -84);
  ctx.lineTo(48, -84);
  ctx.lineTo(66, -76);
  ctx.lineTo(-56, -76);
  ctx.closePath();
  ctx.fill();
  // Wheels with chrome hubs.
  for (const wx of [-108, 108]) {
    ctx.fillStyle = '#05030a';
    ctx.beginPath(); ctx.arc(wx, 0, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfd6dd';
    ctx.beginPath(); ctx.arc(wx, 0, 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/** Builds the 1024×640 shootout scene and returns the canvas. */
export function makeShootoutImage() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const rnd = seededRandom('shootout-scene-v2');

  // Dusk sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 350);
  sky.addColorStop(0, '#160a24');
  sky.addColorStop(0.55, '#7a1240');
  sky.addColorStop(1, '#ff7a18');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 350);
  // Low sun disc behind the skyline.
  const sun = ctx.createRadialGradient(512, 320, 0, 512, 320, 130);
  sun.addColorStop(0, 'rgba(255, 220, 130, 0.9)');
  sun.addColorStop(0.5, 'rgba(255, 140, 60, 0.35)');
  sun.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(360, 190, 304, 180);

  skyline(ctx, rnd, 350, '#1d0b2e', 90, 230, true);
  skyline(ctx, rnd, 350, '#12081e', 40, 150, false);

  // Wet street.
  const street = ctx.createLinearGradient(0, 350, 0, H);
  street.addColorStop(0, '#241028');
  street.addColorStop(1, '#0a0512');
  ctx.fillStyle = street;
  ctx.fillRect(0, 350, W, H - 350);
  // Neon reflections on the wet asphalt.
  for (const [rx, rw, color] of [[300, 60, '255,46,136'], [700, 46, '56,225,255'], [512, 80, '255,122,24']]) {
    const refl = ctx.createLinearGradient(0, 350, 0, H);
    refl.addColorStop(0, `rgba(${color},0.30)`);
    refl.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = refl;
    ctx.fillRect(rx - rw / 2, 350, rw, H - 350);
  }
  // Centre dashes.
  ctx.fillStyle = 'rgba(255, 220, 120, 0.55)';
  for (let x = 20; x < W; x += 90) ctx.fillRect(x, 456, 44, 5);

  neonSign(ctx, 700, 140, 'VICE', 58);
  lowrider(ctx, 560, 500, 0.85);

  // The two crews. Left (magenta rim) fires right; right (cyan rim) fires left.
  gunman(ctx, 380, 486, 1.15, 1, 'aim', '#ff5fa2');
  gunman(ctx, 300, 492, 1.05, 1, 'crouch', '#ff5fa2');
  gunman(ctx, 820, 486, 1.15, -1, 'aim', '#38e1ff');
  gunman(ctx, 910, 492, 1.05, -1, 'crouch', '#38e1ff');

  // Muzzle flashes at the gun tips, spread across the street.
  muzzleFlash(ctx, 520, 318, 1.0);
  muzzleFlash(ctx, 422, 347, 0.85);
  muzzleFlash(ctx, 680, 318, 0.9);

  // Shell casings in the air.
  ctx.fillStyle = '#ffd23f';
  for (const [cx, cy, a] of [[470, 390, 0.6], [580, 370, -0.4], [740, 390, 1.1], [640, 420, 0.2]]) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillRect(-4, -1.5, 8, 3);
    ctx.restore();
  }

  // Comic halftone dots + vignette for the printed-poster feel.
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.fillStyle = '#0a0512';
  const step = 9;
  for (let y = step / 2; y < H; y += step) {
    for (let x = step / 2; x < W; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, W * 0.62);
  vg.addColorStop(0, 'rgba(10,4,12,0)');
  vg.addColorStop(1, 'rgba(10,4,12,0.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  return canvas;
}
