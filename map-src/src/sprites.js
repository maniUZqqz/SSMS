// Canvas-drawn sprites: table name labels, column cards (the "ER card" of a table) and the selection halo.
import * as THREE from 'three';
import { F_PK, F_NULL, F_FK } from './model.js';

const INK = '#f0efec', INK2 = '#c3c2b7', MUTE = '#898781';
const UI_FONT = '"Segoe UI", Vazirmatn, Tahoma, sans-serif';
const MONO = 'Consolas, "Cascadia Mono", "Courier New", monospace';

// ---------- name labels (constant size on screen) ----------
const labelCache = new Map();
const LABEL_H = 42;
const labelFont = style => `${style === 'name' ? 600 : 500} ${style === 'fk' ? 26 : 30}px ${style === 'fk' ? MONO : UI_FONT}`;
const measureCtx = document.createElement('canvas').getContext('2d');
// width / height of a label, without building it (used to keep labels from overlapping)
export function labelAspect(text, style = 'name') {
  measureCtx.font = labelFont(style);
  return (Math.ceil(measureCtx.measureText(text).width) + 18) / LABEL_H;
}
export function labelSprite(text, style = 'name') {
  const key = style + '|' + text;
  let e = labelCache.get(key);
  if (!e) {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    const font = labelFont(style);
    ctx.font = font;
    const w = Math.ceil(ctx.measureText(text).width) + 18;
    c.width = w; c.height = LABEL_H;
    ctx.font = font; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(8,10,14,0.9)';
    ctx.strokeText(text, 9, LABEL_H / 2 + 1);
    ctx.fillStyle = style === 'name' ? INK : INK2;
    ctx.fillText(text, 9, LABEL_H / 2 + 1);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, sizeAttenuation: false });
    e = { mat, aspect: w / LABEL_H };
    labelCache.set(key, e);
    if (labelCache.size > 900) {           // drop the oldest textures
      const it = labelCache.entries();
      for (let i = 0; i < 200; i++) { const [k, v] = it.next().value; v.mat.map.dispose(); v.mat.dispose(); labelCache.delete(k); }
    }
  }
  const s = new THREE.Sprite(e.mat);
  s.userData.aspect = e.aspect;
  return s;
}
export function sizeLabel(sprite, h) { sprite.scale.set(h * sprite.userData.aspect, h, 1); }

// ---------- column cards (world-sized, read like an ER diagram box) ----------
export const CARD_W = 460, HEAD = 48, ROW = 23;
const PAD = 12, PX = 1.25;
export const CARD_UNITS = 0.085;       // world units per card pixel

function fit(ctx, text, max) {
  if (ctx.measureText(text).width <= max) return text;
  let lo = 0, hi = text.length;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (ctx.measureText(text.slice(0, mid) + '…').width <= max) lo = mid; else hi = mid - 1; }
  return text.slice(0, lo) + '…';
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function cardSprite(node, color, maxRows, selected, scale = 1) {
  const t = node.t;
  let cols = t.c;
  if (cols.length > maxRows) {
    // keep keys first when the list is cut, then fill up in table order
    const keep = new Set();
    cols.forEach((c, i) => { if (c[2] & (F_PK | F_FK) && keep.size < maxRows) keep.add(i); });
    cols.forEach((c, i) => { if (keep.size < maxRows) keep.add(i); });
    cols = cols.filter((c, i) => keep.has(i));
  }
  const more = t.c.length - cols.length;
  const H = HEAD + cols.length * ROW + (more ? 26 : 8);
  const c = document.createElement('canvas');
  c.width = Math.round(CARD_W * PX); c.height = Math.round(H * PX);
  const ctx = c.getContext('2d');
  ctx.scale(PX, PX);

  roundRect(ctx, 1, 1, CARD_W - 2, H - 2, 10);
  ctx.fillStyle = 'rgba(17,19,25,0.96)'; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(0, 0, CARD_W, HEAD);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(0, HEAD - 1, CARD_W, 1);

  // header: name on the left, size on the right
  ctx.textBaseline = 'middle';
  const right = node.isView ? 'VIEW' : (node.rows != null ? node.rows.toLocaleString('en-US') + ' rows' : '');
  ctx.font = `500 12px ${UI_FONT}`; ctx.fillStyle = 'rgba(255,255,255,0.88)'; ctx.textAlign = 'right';
  const rw = right ? ctx.measureText(right).width + 10 : 0;
  if (right) ctx.fillText(right, CARD_W - PAD, HEAD / 2 + 8);
  ctx.fillText(`${t.c.length} cols`, CARD_W - PAD, HEAD / 2 - 8);
  ctx.textAlign = 'left'; ctx.fillStyle = '#ffffff';
  ctx.font = `700 18px ${UI_FONT}`;
  ctx.fillText(fit(ctx, node.full, CARD_W - 2 * PAD - Math.max(rw, 60)), PAD, HEAD / 2 + 1);

  cols.forEach((col, i) => {
    const y = HEAD + i * ROW;
    if (i % 2) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(0, y, CARD_W, ROW); }
    const pk = col[2] & F_PK, fk = col[2] & F_FK;
    ctx.font = `700 10px ${UI_FONT}`;
    if (pk) { ctx.fillStyle = '#e3b341'; ctx.fillText('PK', PAD, y + ROW / 2 + 1); }
    if (fk) { ctx.fillStyle = '#7fb2f5'; ctx.fillText('FK', PAD + (pk ? 17 : 0), y + ROW / 2 + 1); }
    ctx.font = `13px ${MONO}`; ctx.fillStyle = MUTE; ctx.textAlign = 'right';
    const ty = fit(ctx, col[1], 130);
    const tw = ctx.measureText(ty).width;
    ctx.fillText(ty, CARD_W - PAD, y + ROW / 2 + 1);
    ctx.textAlign = 'left';
    ctx.font = `${pk ? 700 : 400} 14px ${MONO}`;
    ctx.fillStyle = col[2] & F_NULL ? INK2 : INK;
    ctx.fillText(fit(ctx, col[0], CARD_W - PAD - 44 - tw - 14), PAD + 40, y + ROW / 2 + 1);
  });
  if (more) {
    ctx.font = `500 12px ${UI_FONT}`; ctx.fillStyle = MUTE; ctx.textAlign = 'center';
    ctx.fillText(`+ ${more} more columns`, CARD_W / 2, HEAD + cols.length * ROW + 13);
  }
  ctx.restore();
  roundRect(ctx, 1, 1, CARD_W - 2, H - 2, 10);
  ctx.lineWidth = selected ? 2.5 : 1; ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.22)'; ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: !selected });
  const s = new THREE.Sprite(mat);
  const w = CARD_W * CARD_UNITS * scale, h = H * CARD_UNITS * scale;
  s.scale.set(w, h, 1);
  // anchor: left edge just right of the node, header centred on it
  s.center.set(-(node.radius + 2.5) / w, 1 - (HEAD / 2) / H);
  if (selected) s.renderOrder = 20;
  s.userData.card = true;
  return s;
}
export function disposeCard(s) { s.material.map.dispose(); s.material.dispose(); }

// ---------- selection halo ----------
export function haloSprite() {
  const c = document.createElement('canvas'); c.width = c.height = 160;
  const ctx = c.getContext('2d');
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(80, 80, 66, 0, Math.PI * 2); ctx.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0.9 }));
  s.renderOrder = 15;
  s.raycast = () => {};       // never steals hover/click from the node
  return s;
}
