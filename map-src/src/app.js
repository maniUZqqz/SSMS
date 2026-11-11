import ForceGraph3D from '3d-force-graph';
import * as THREE from 'three';
import { buildModel, PALETTE, NEUTRAL, F_PK, F_NULL, F_IDENT, F_COMPUTED, F_FK } from './model.js';
import { computeLayout } from './layout.js';
import { labelSprite, labelAspect, sizeLabel, cardSprite, disposeCard, haloSprite, CARD_UNITS, CARD_W, HEAD, ROW } from './sprites.js';
import { $, fa, esc, trunc, faDate } from './util.js';

// Builds the whole scene for one database.
//   schema: the structure in the scene's compact form (model.js: fromStructure)
//   ctx:    what the page around the scene provides - title, layout cache id, a saved view to restore, the SQL text viewer
export function run(schema, ctx) {
// ============================== model & state ==============================
const M = buildModel(schema);
const { nodes, links } = M;
const TOP = PALETTE.length;
const BG = '#0a0c11';
const REL = 3.2;

const state = {
  colorMode: 'cluster', sizeMode: 'deg',
  showIsolated: true, showViews: false, showLabels: true, showCards: true, showFlow: true, autoRotate: true,
  selected: null, spot: null, hops: 1,
};
let hl = null;                 // Set of highlighted nodes, or null when nothing is in focus
let hlSorted = [];
let visibleNodes = [];
let selLinks = 0;              // number of relations drawn for the selected table

const groupOf = n => (state.colorMode === 'cluster' ? n.cluster : n.module);
const baseColor = n => { const g = groupOf(n); return g ? g.color : NEUTRAL; };
const isVisible = n => (state.showViews || !n.isView) && (state.showIsolated || !n.ring);
const linkVisible = l => (l.kind !== 'view' || state.showViews) && isVisible(nodes[l.a]) && isVisible(nodes[l.b]);
const touchesSel = l => state.selected && (l.a === state.selected.id || l.b === state.selected.id);

function neighbours(n) {
  const ids = [...n.nbr];
  if (state.showViews) ids.push(...n.uses, ...n.usedBy);
  return ids.map(i => nodes[i]).filter(isVisible);
}
function computeHL() {
  const s = state.selected;
  if (s && state.caseSet) {
    // following one row: only the tables that hold rows related to it stay lit
    hl = new Set([s, ...[...state.caseSet].filter(isVisible)]);
  } else if (s) {
    hl = new Set([s]);
    neighbours(s).forEach(m => hl.add(m));
    if (state.hops === 2) [...hl].forEach(m => neighbours(m).forEach(k => hl.add(k)));
  } else if (state.spot) hl = new Set(state.spot.nodes.filter(isVisible));
  else hl = null;
  hlSorted = hl ? [...hl].sort((a, b) => b.deg - a.deg) : [];
  visibleNodes = nodes.filter(isVisible);
  selLinks = s ? links.filter(l => touchesSel(l) && linkVisible(l)).length : 0;
}
function sizeNode(n) {
  let v;
  if (state.sizeMode === 'cols') v = 0.5 + n.cols / 6;
  else if (state.sizeMode === 'rows') v = 0.6 + Math.pow(Math.log10((n.rows || 0) + 1), 3) / 4;
  else v = 1 + (n.isView ? n.uses.length * 0.5 : n.deg * 0.9);
  n.val = v;
  n.radius = Math.cbrt(v) * REL;
}

// ============================== tooltips ==============================
function nodeTip(n) {
  const g = groupOf(n);
  return `<div class="tip"><div class="tip-n mono">${esc(n.full)}</div>` +
    `<div class="tip-m">${n.isView ? 'ویو' : 'جدول'} · ${fa(n.cols)} ستون${n.rows != null ? ' · ' + fa(n.rows) + ' ردیف' : ''} · ${fa(n.isView ? n.uses.length : n.deg)} ${n.isView ? 'منبع' : 'جدول مرتبط'}</div>` +
    (g ? `<div class="tip-m"><i class="dot" style="background:${g.color}"></i>${state.colorMode === 'cluster' ? 'خوشهٔ' : 'ماژول'} <span class="mono">${esc(g.label)}</span></div>` : '') +
    (n.t.d ? `<div class="tip-d" dir="auto">${esc(trunc(n.t.d, 170))}</div>` : '') + '</div>';
}
function linkTip(l) {
  const a = nodes[l.a], b = nodes[l.b];
  if (l.kind === 'view') return `<div class="tip"><div class="tip-m">ویو <span class="mono">${esc(a.name)}</span> از <span class="mono">${esc(b.name)}</span> می‌خواند</div></div>`;
  const rows = l.fks.slice(0, 6).map(fk => `<div class="tip-fk mono">${fk.cols.map(([p, r]) => `${esc(a.name)}.<b>${esc(p)}</b> → ${esc(b.name)}.<b>${esc(r)}</b>`).join('<br>')}</div>`).join('');
  return `<div class="tip"><div class="tip-m">کلید خارجی${l.fks.length > 1 ? ' (' + fa(l.fks.length) + ' مورد)' : ''}</div>${rows}${l.fks.length > 6 ? '<div class="tip-m">…</div>' : ''}</div>`;
}

// ============================== outer ring of unrelated tables ==============================
const ringNodes = nodes.filter(n => n.ring);
const RING_ROWS = 3, RING_GAP = 2, RING_STEP = 15;
const ringGroups = [];
let ringSlots = 1, ringR = 900, coreR = 700;
(function planRing() {
  const by = new Map();
  ringNodes.forEach(n => { if (!by.has(n.module)) by.set(n.module, []); by.get(n.module).push(n); });
  const big = [...by].filter(([, a]) => a.length >= 4).sort((x, y) => y[1].length - x[1].length);
  const misc = [...by].filter(([, a]) => a.length < 4).flatMap(([, a]) => a);
  let slot = 0;
  for (const [label, arr] of [...big.map(([m, a]) => [m.label, a]), ['', misc]]) {
    if (!arr.length) continue;
    arr.sort((a, b) => a.module.rank - b.module.rank || a.name.localeCompare(b.name));
    const start = slot;
    arr.forEach((n, i) => { n.ringSlot = slot + Math.floor(i / RING_ROWS); n.ringRow = i % RING_ROWS; });
    slot += Math.ceil(arr.length / RING_ROWS);
    ringGroups.push({ label, mid: (start + slot - 1) / 2, count: arr.length });
    slot += RING_GAP;
  }
  ringSlots = Math.max(1, slot);
})();
function placeRing() {
  const r = [];
  for (const n of nodes) if (!n.ring) r.push(Math.hypot(n.x, n.z));
  r.sort((a, b) => a - b);
  coreR = r.length ? r[Math.floor(r.length * 0.97)] : 300;
  ringR = Math.max(520, (r.length ? r[r.length - 1] : 300) * 1.04 + 70);
  for (const n of ringNodes) {
    const a = (n.ringSlot / ringSlots) * Math.PI * 2, rr = ringR + n.ringRow * RING_STEP;
    n.x = Math.cos(a) * rr; n.z = Math.sin(a) * rr; n.y = 0;
  }
  for (const g of ringGroups) {
    const a = (g.mid / ringSlots) * Math.PI * 2, rr = ringR + RING_ROWS * RING_STEP + 16;
    g.pos = new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr);
  }
}

// ============================== start ==============================
return start();

async function start() {
  nodes.forEach(sizeNode);
  computeHL();
  $('#loading-text').textContent = `چیدمان ${fa(nodes.length)} جدول و ویو بر اساس رابطه‌هایشان…`;
  await new Promise(r => setTimeout(r, 30));
  await computeLayout(nodes, links, p => { $('#loading .bar i').style.width = (p * 100).toFixed(0) + '%'; }, ctx.cacheId || M.meta.id || M.meta.db);
  placeRing();
  nodes.forEach(n => { n.fx = n.x; n.fy = n.y; n.fz = n.z; });

  // ---------- scene host: camera, controls, hover/click picking, the selected table's relations ----------
  const C_OUT = '#7fb2f5', C_IN = '#f2a65a', C_VIEW = '#d9d7cf';
  const proxyGeo = new THREE.SphereGeometry(1, 8, 6);
  const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
  // every table gets an invisible pick target; the visible spheres are drawn in one batch below
  function makeProxy(n) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(proxyGeo, proxyMat);
    m.scale.setScalar(Math.max(3.6, n.radius * 1.15));
    g.add(m);
    n.__proxy = m;
    return g;
  }
  const selLinkColor = l => (l.kind === 'view' ? C_VIEW : l.a === state.selected?.id ? C_OUT : C_IN);
  const selLinkVisible = l => !!touchesSel(l) && linkVisible(l) && (!state.caseSet || (hl.has(nodes[l.a]) && hl.has(nodes[l.b])));
  const many = () => selLinks > 60;

  const graph = new ForceGraph3D($('#scene'), { controlType: 'orbit', rendererConfig: { antialias: true, alpha: false, powerPreference: 'high-performance' } });
  graph
    .backgroundColor(BG).showNavInfo(false)
    .nodeId('id').nodeRelSize(REL).nodeVal(n => n.val).nodeVisibility(isVisible).nodeLabel(nodeTip).nodeThreeObject(makeProxy)
    .linkVisibility(selLinkVisible).linkColor(selLinkColor).linkOpacity(1).linkWidth(() => (many() ? 0 : 0.45))
    .linkDirectionalParticles(() => (state.showFlow ? (many() ? 1 : 3) : 0)).linkDirectionalParticleWidth(1.4).linkDirectionalParticleSpeed(0.007).linkDirectionalParticleColor(() => '#ffffff')
    .linkDirectionalArrowLength(() => (many() ? 0 : 3.5)).linkDirectionalArrowRelPos(1).linkDirectionalArrowColor(selLinkColor)
    .linkLabel(linkTip).linkHoverPrecision(2)
    .enableNodeDrag(false).warmupTicks(0).cooldownTicks(0)
    .onNodeClick(n => select(n))
    .onLinkClick(l => { const s = state.selected; select(nodes[s && s.id === l.a ? l.b : s && s.id === l.b ? l.a : l.b]); })
    .onBackgroundClick(() => { if (state.selected) select(null); else if (state.spot) setSpot(null); })
    .graphData({ nodes, links });

  const scene = graph.scene(), camera = graph.camera(), controls = graph.controls();
  const fog = new THREE.Fog(BG, 2000, 6000);
  scene.fog = fog;
  controls.enableDamping = true; controls.dampingFactor = 0.14;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.3;
  controls.minDistance = 12; controls.maxDistance = 14000; controls.zoomSpeed = 1.3;

  // ---------- all tables in one draw call, all relations in another ----------
  const tableNodes = nodes.filter(n => !n.isView), viewNodes = nodes.filter(n => n.isView);
  const instT = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshLambertMaterial(), Math.max(1, tableNodes.length));
  const instV = new THREE.InstancedMesh(new THREE.OctahedronGeometry(1, 0), new THREE.MeshLambertMaterial({ flatShading: true }), Math.max(1, viewNodes.length));
  for (const inst of [instT, instV]) { inst.frustumCulled = false; inst.raycast = () => {}; scene.add(inst); }
  const bgColor = new THREE.Color(BG), _c = new THREE.Color(), _m = new THREE.Matrix4();
  function paintNodes() {
    const put = (inst, list, k) => {
      list.forEach((n, i) => {
        const s = isVisible(n) ? n.radius * k : 0;
        _m.makeScale(s, s, s).setPosition(n.x, n.y, n.z);
        inst.setMatrixAt(i, _m);
        _c.set(baseColor(n));
        if (hl && !hl.has(n)) _c.lerp(bgColor, 0.9);
        inst.setColorAt(i, _c);
      });
      inst.count = list.length;
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    };
    put(instT, tableNodes, 1); put(instV, viewNodes, 1.3);
  }

  const linePos = new Float32Array(links.length * 6), lineCol = new Float32Array(links.length * 8);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineCol, 4));
  const lineMesh = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }));
  lineMesh.frustumCulled = false; lineMesh.raycast = () => {};
  scene.add(lineMesh);
  const LC_FK = new THREE.Color('rgb(150,170,205)'), LC_VIEW = new THREE.Color('rgb(225,220,205)');
  function paintLines() {
    links.forEach((l, i) => {
      const a = nodes[l.a], b = nodes[l.b];
      let alpha;
      if (!linkVisible(l) || touchesSel(l)) alpha = 0;           // the selected table's relations are drawn thicker, separately
      else if (hl) alpha = hl.has(a) && hl.has(b) ? (state.selected ? 0.16 : 0.5) : 0.022;
      else alpha = l.kind === 'view' ? 0.13 : 0.2;
      const c = l.kind === 'view' ? LC_VIEW : LC_FK;
      linePos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6);
      lineCol.set([c.r, c.g, c.b, alpha, c.r, c.g, c.b, alpha], i * 8);
    });
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  }

  // ---------- camera ----------
  function homeView(ms = 1200) {
    const W = window.innerWidth, H = window.innerHeight;
    const margin = Math.max(document.body.classList.contains('side-closed') ? 0 : 300, state.selected ? 432 : 0);
    const aspect = Math.max(0.5, (W - 2 * margin) / H);
    const tan = Math.tan((camera.fov * Math.PI) / 360), e = (20 * Math.PI) / 180;
    const R = (state.showIsolated ? ringR + RING_ROWS * RING_STEP : coreR) + 40;
    // far enough that the whole ring fits: its sides horizontally, its near edge vertically
    const dist = Math.max(R / (tan * aspect), R * Math.cos(e) + (R * Math.sin(e)) / (tan * 0.9)) * 1.04;
    graph.cameraPosition({ x: 0, y: Math.sin(e) * dist, z: Math.cos(e) * dist }, { x: 0, y: 0, z: 0 }, ms);
    return dist;
  }
  const flyDist = n => 80 + n.radius * 7;
  // the selected table's card is sized so that it is about 440px wide once the camera arrives
  const selScale = n => (flyDist(n) / 129) * 1.5;
  function flyTo(n, ms = 1300) {
    const dir = new THREE.Vector3(camera.position.x - n.x, camera.position.y - n.y, camera.position.z - n.z);
    if (dir.lengthSq() < 1) dir.set(0, 0.3, 1);
    dir.normalize();
    const dist = flyDist(n);
    // aim a little to the right of the table, so the table and its column card sit in the free space between the panels
    const W = window.innerWidth, H = window.innerHeight, k = H / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const left = 464, right = document.body.classList.contains('side-closed') ? 0 : 300;
    const nodeX = left + Math.max(0, (W - left - right - 530) / 2) + 90;
    const off = (Math.max(0, W / 2 - nodeX) * dist) / k;
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize().multiplyScalar(off);
    const t = { x: n.x + side.x, y: n.y + side.y, z: n.z + side.z };
    graph.cameraPosition({ x: t.x + dir.x * dist, y: t.y + dir.y * dist, z: t.z + dir.z * dist }, t, ms);
  }

  // ---------- labels & column cards: only what is near and what fits without overlapping ----------
  const lod = new Map();           // node -> { kind: 'label' | 'card' | 'cardSel', sprite }
  const anchors = nodes.filter(n => !n.isView).sort((a, b) => b.deg - a.deg).slice(0, 26);
  const CARD_DIST = 190, MAX_CARDS = 6, LABEL_DIST = 1300, MAX_LABELS = 70;
  const _p = new THREE.Vector3();
  const labelH = n => 0.0165 + Math.min(0.01, n.radius * 0.0006);

  for (const g of ringGroups) {
    if (!g.label || g.count < 6) continue;
    g.sprite = labelSprite(g.label, 'mod');
    g.aspect = labelAspect(g.label, 'mod');
    sizeLabel(g.sprite, 0.017);
    g.sprite.position.copy(g.pos);
    g.sprite.raycast = () => {};
    scene.add(g.sprite);
  }

  function dropLOD(n, cur) {
    if (cur.sprite.parent) cur.sprite.parent.remove(cur.sprite);
    if (cur.kind !== 'label') disposeCard(cur.sprite);
    lod.delete(n);
  }
  function addLOD(n, kind) {
    const obj = n.__threeObj;
    if (!obj) return;
    let s;
    if (kind === 'label') {
      s = labelSprite(n.caseLabel || n.name);
      sizeLabel(s, labelH(n));
      s.center.set(0.5, 0);
      s.position.set(0, n.radius * 1.12 + 0.6, 0);
    } else {
      s = cardSprite(n, baseColor(n) === NEUTRAL ? '#5d5c57' : baseColor(n), kind === 'cardSel' ? 30 : 12, kind === 'cardSel', kind === 'cardSel' ? selScale(n) : 1);
    }
    obj.add(s);
    lod.set(n, { kind, sprite: s });
  }
  function clearLOD(pred) { for (const [n, cur] of [...lod]) if (!pred || pred(cur)) dropLOD(n, cur); }

  let linkLabels = [];             // foreign-key column names floating on the selected table's relations
  function rebuildLinkLabels() {
    linkLabels.forEach(e => scene.remove(e.sprite));
    linkLabels = [];
    const s = state.selected;
    if (!s || !state.showLabels) return;
    const ls = links.filter(l => l.kind === 'fk' && touchesSel(l) && linkVisible(l));
    if (ls.length > 60) return;
    for (const l of ls) {
      const names = [...new Set(l.fks.flatMap(fk => fk.cols.map(c => c[0])))];
      const text = trunc(names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2}` : ''), 46);
      const sprite = labelSprite(text, 'fk');
      sizeLabel(sprite, 0.0155);
      sprite.raycast = () => {};
      const a = nodes[l.a], b = nodes[l.b];
      sprite.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      scene.add(sprite);
      linkLabels.push({ sprite, aspect: labelAspect(text, 'fk') });
    }
  }

  function updateLOD() {
    const W = window.innerWidth, H = window.innerHeight;
    const k = H / (2 * Math.tan((camera.fov * Math.PI) / 360));     // pixels per world unit at distance 1
    const cp = camera.position, sel = state.selected;
    const project = (x, y, z) => {
      _p.set(x, y, z).project(camera);
      if (_p.z > 1 || Math.abs(_p.x) > 1.08 || Math.abs(_p.y) > 1.08) return null;
      return { x: ((_p.x + 1) * W) / 2, y: ((1 - _p.y) * H) / 2, d: Math.hypot(x - cp.x, y - cp.y, z - cp.z) };
    };
    const cands = [];
    for (const n of hl || visibleNodes) {
      n.__scr = n.__threeObj ? project(n.x, n.y, n.z) : null;
      if (n.__scr) cands.push(n);
    }
    cands.sort((a, b) => a.__scr.d - b.__scr.d);

    const want = new Map(), boxes = [];
    const fits = b => { for (const o of boxes) if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) return false; return true; };
    const cardBox = (n, rows, scale = 1) => {
      const s = n.__scr, f = (k / s.d) * CARD_UNITS * scale, x0 = s.x + ((n.radius + 2.5) * k) / s.d, y0 = s.y - (HEAD / 2) * f;
      return [x0, y0, x0 + CARD_W * f, y0 + (HEAD + rows * ROW + 8) * f];
    };
    const textBox = (s, h, aspect, lift) => { const hp = h * k, w = hp * aspect, y1 = s.y - lift; return [s.x - w / 2 - 2, y1 - hp, s.x + w / 2 + 2, y1 + 1]; };
    const tryLabel = n => {
      if (want.has(n) || !n.__scr) return false;
      const b = textBox(n.__scr, labelH(n), n.caseLabel ? labelAspect(n.caseLabel) : n.__la || (n.__la = labelAspect(n.name)), (n.radius * 1.12 * k) / n.__scr.d);
      if (!fits(b)) return false;
      want.set(n, 'label'); boxes.push(b);
      return true;
    };

    // the selected table first: its card (or its name), and nothing may cover the table itself
    if (sel && sel.__threeObj) {
      if (state.showCards) { want.set(sel, 'cardSel'); if (sel.__scr) boxes.push(cardBox(sel, Math.min(sel.cols, 30), selScale(sel))); }
      else if (state.showLabels) tryLabel(sel);
      if (sel.__scr) { const r = (sel.radius * 1.9 * k) / sel.__scr.d; boxes.push([sel.__scr.x - r, sel.__scr.y - r, sel.__scr.x + r, sel.__scr.y + r]); }
    }
    if (state.showCards) {
      let c = 0;
      for (const n of cands) {
        if (n.__scr.d > CARD_DIST || c >= MAX_CARDS) break;
        if (want.has(n)) continue;
        const b = cardBox(n, Math.min(n.cols, 12));
        if (fits(b)) { want.set(n, 'card'); boxes.push(b); c++; }
      }
    }
    if (state.showLabels) {
      for (const n of anchors) if (isVisible(n) && (!hl || hl.has(n))) tryLabel(n);
      for (let i = 0; i < hlSorted.length && i < 70; i++) tryLabel(hlSorted[i]);
    }
    for (const g of ringGroups) {
      if (!g.sprite) continue;
      let ok = state.showLabels && state.showIsolated && !hl;
      if (ok) {
        const s = project(g.pos.x, g.pos.y, g.pos.z);
        const b = s && textBox(s, 0.017, g.aspect, 0);
        ok = !!b && fits(b);
        if (ok) boxes.push(b);
      }
      g.sprite.visible = ok;
    }
    for (const e of linkLabels) {
      const s = project(e.sprite.position.x, e.sprite.position.y, e.sprite.position.z);
      const b = s && textBox(s, 0.0155, e.aspect, -0.0155 * k * 0.5);
      const ok = !!b && fits(b);
      if (ok) boxes.push(b);
      e.sprite.visible = ok;
    }
    if (state.showLabels) {
      // labels already on screen keep their place first, so they do not flicker while the camera moves
      const near = cands.filter(n => n.__scr.d <= (n.ring ? 230 : LABEL_DIST));
      let c = 0;
      for (const shown of [true, false]) for (const n of near) {
        if (c >= MAX_LABELS) break;
        const cur = lod.get(n);
        if ((!!cur && cur.kind === 'label') !== shown) continue;
        if (tryLabel(n)) c++;
      }
    }
    for (const [n, cur] of [...lod]) if (want.get(n) !== cur.kind || cur.sprite.parent !== n.__threeObj) dropLOD(n, cur);
    for (const [n, kind] of want) if (!lod.has(n)) addLOD(n, kind);
  }

  const halo = haloSprite();
  let lastLOD = 0;
  function frame(t) {
    requestAnimationFrame(frame);
    const d = camera.position.distanceTo(controls.target);
    fog.near = d * 0.75; fog.far = d + 3600;
    const s = state.selected;
    if (s && s.__threeObj) {
      if (halo.parent !== s.__threeObj) s.__threeObj.add(halo);
      halo.scale.setScalar(s.radius * (3.3 + 0.25 * Math.sin(t / 380)));
    } else if (halo.parent) halo.parent.remove(halo);
    if (t - lastLOD > 200) { lastLOD = t; updateLOD(); }
  }

  // ---------- restyling ----------
  function refreshStyles() {
    paintNodes(); paintLines();
    graph.linkVisibility(selLinkVisible).linkColor(selLinkColor).linkWidth(graph.linkWidth())
      .linkDirectionalParticles(graph.linkDirectionalParticles()).linkDirectionalArrowLength(graph.linkDirectionalArrowLength()).linkDirectionalArrowColor(selLinkColor);
  }
  function refreshVisibility() {
    computeHL();
    graph.nodeVisibility(isVisible);
    refreshStyles();
    rebuildLinkLabels();
  }

  // ---------- selection ----------
  function select(n, opts = {}) {
    if (n) {
      if (n.isView && !state.showViews) setToggle('showViews', true, true);
      if (n.ring && !state.showIsolated) setToggle('showIsolated', true, true);
      setToggle('autoRotate', false, true);
      state.spot = null;
    }
    state.selected = n || null;
    if (ctx.onSelect) ctx.onSelect(state.selected);      // lets the row explorer leave "one row" mode when another table is picked
    refreshVisibility();
    renderLegend();
    renderDetail(opts.col);
    if (n && opts.fly !== false) flyTo(n);
    updateLOD();
  }
  // "One row" mode: `related` maps each table that holds rows related to the open row to a short note for its label.
  function setCase(related) {
    nodes.forEach(n => { n.caseLabel = null; });
    state.caseSet = related ? new Set(related.keys()) : null;
    if (related) for (const [n, note] of related) if (note) n.caseLabel = `${n.name}  ${note}`;
    clearLOD(c => c.kind === 'label');
    refreshVisibility();
    updateLOD();
  }
  function setSpot(group) {
    state.spot = group && !(state.spot && state.spot.key === group.key) ? group : null;
    state.selected = null;
    refreshVisibility(); renderLegend(); renderDetail(); updateLOD();
  }

  // ---------- side panel: legend & switches ----------
  function legendEntries() {
    const groups = state.colorMode === 'cluster' ? M.clusters : M.modules;
    const cnt = g => g.nodes.filter(n => !n.isView).length;
    const out = groups.slice(0, TOP).map(g => ({ g, label: g.label, n: cnt(g), color: g.color, mono: true }));
    const rest = groups.slice(TOP);
    if (rest.length) {
      const other = { key: '~other', color: NEUTRAL, nodes: rest.flatMap(g => g.nodes) };
      out.push({ g: other, label: (state.colorMode === 'cluster' ? 'سایر خوشه‌ها' : 'سایر ماژول‌ها') + ` (${fa(rest.length)})`, n: cnt(other), color: NEUTRAL });
    }
    if (state.colorMode === 'cluster') {
      const iso = { key: '~iso', color: NEUTRAL, nodes: nodes.filter(n => !n.isView && n.deg === 0) };
      out.push({ g: iso, label: 'بدون رابطه (حلقهٔ بیرونی)', n: iso.nodes.length, color: NEUTRAL });
    }
    return { out, rest };
  }
  let legendGroups = [];
  function renderLegend() {
    const { out, rest } = legendEntries();
    const listed = rest.filter(g => g.nodes.length >= 2);
    legendGroups = out.map(e => e.g).concat(listed);
    const spotKey = state.spot && state.spot.key;
    const row = (e, i) => `<button class="lg${spotKey === e.g.key ? ' on' : ''}" data-lg="${i}"><i class="dot" style="background:${e.color}"></i><span class="${e.mono ? 'mono' : ''}">${esc(e.label)}</span><b>${fa(e.n)}</b></button>`;
    let h = out.map(row).join('');
    if (listed.length) {
      h += `<details class="more"${listed.some(g => g.key === spotKey) ? ' open' : ''}><summary>فهرست کامل ${state.colorMode === 'cluster' ? 'خوشه‌ها' : 'ماژول‌ها'}</summary><div class="more-list">` +
        listed.map((g, i) => row({ g, label: g.label, n: g.nodes.filter(n => !n.isView).length, color: g.color, mono: true }, out.length + i)).join('') + '</div></details>';
    }
    $('#legend').innerHTML = h;
    $('#legend-note').textContent = state.colorMode === 'cluster'
      ? 'خوشه یعنی گروهی از جدول‌ها که بیشترین رابطه را با هم دارند؛ نام هر خوشه، پرارتباط‌ترین جدول آن است.'
      : 'ماژول از پیشوند نام جدول یا نام اسکیما گرفته شده است (مثل Sales_ ، Hr_ ، Tbl_Order…).';
  }
  $('#legend').addEventListener('click', ev => {
    const b = ev.target.closest('[data-lg]');
    if (b) setSpot(legendGroups[+b.dataset.lg]);
  });

  function setToggle(key, val, silent) {
    state[key] = val;
    const el = document.querySelector(`[data-toggle="${key}"]`);
    if (el) el.checked = val;
    if (key === 'autoRotate') controls.autoRotate = val;
    if (silent) return;
    if (key === 'showIsolated' || key === 'showViews') {
      if (state.selected && !isVisible(state.selected)) state.selected = null;
      refreshVisibility(); renderDetail();
    } else if (key === 'showFlow') refreshStyles();
    else if (key === 'showLabels') rebuildLinkLabels();
    updateLOD();
  }
  document.querySelectorAll('[data-toggle]').forEach(el => {
    el.checked = state[el.dataset.toggle];
    el.addEventListener('change', () => setToggle(el.dataset.toggle, el.checked));
  });
  document.querySelectorAll('.seg[data-seg]').forEach(seg => seg.addEventListener('click', ev => {
    const b = ev.target.closest('button');
    if (!b || b.classList.contains('on')) return;
    seg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    const key = seg.dataset.seg;
    state[key] = b.dataset.v;
    if (key === 'colorMode') {
      state.spot = null;
      computeHL(); clearLOD(c => c.kind !== 'label'); refreshStyles(); renderLegend(); renderDetail();
    } else if (key === 'sizeMode') {
      nodes.forEach(n => { sizeNode(n); if (n.__proxy) n.__proxy.scale.setScalar(Math.max(3.6, n.radius * 1.15)); });
      clearLOD(); graph.nodeVal(n => n.val); refreshStyles();
    }
    updateLOD();
  }));
  $('#btn-home').addEventListener('click', () => { if (state.selected) select(null); homeView(); });
  $('#btn-side').addEventListener('click', () => document.body.classList.toggle('side-closed'));

  // ---------- detail panel ----------
  function relItem(other, text, extra = '') {
    return `<button class="rel" data-go="${other.id}"><span class="mono rel-t">${esc(other.full)}${extra}</span><span class="mono rel-c">${text}</span></button>`;
  }
  const fkCols = fk => fk.cols.map(([p, r]) => `${esc(p)} → ${esc(r)}`).join(' , ');
  function fkBadges(fk) {
    return (fk.onDelete === 1 ? '<em class="chip">ON DELETE CASCADE</em>' : fk.onDelete === 2 ? '<em class="chip">ON DELETE SET NULL</em>' : '') + (fk.disabled ? '<em class="chip warn">غیرفعال</em>' : '');
  }
  function section(title, count, body, open = true, mark = '') {
    return `<details class="sec"${open ? ' open' : ''}><summary>${mark}${title}<b>${fa(count)}</b></summary>${body}</details>`;
  }
  function renderDetail(focusCol) {
    const el = $('#detail'), n = state.selected;
    document.body.classList.toggle('has-detail', !!n);
    if (!n) { el.innerHTML = ''; return; }
    const custom = ctx.detailOverride ? ctx.detailOverride(n) : null;     // the row explorer shows one row here instead of the structure
    if (custom != null) { el.innerHTML = custom; el.scrollTop = 0; return; }
    const t = n.t, cl = n.cluster, mo = n.module;
    const canCode = !!ctx.showCode;
    const fkByCol = new Map();
    [...n.out, ...n.self].forEach(fk => fk.cols.forEach(([p, r]) => { if (!fkByCol.has(p)) fkByCol.set(p, { fk, r }); }));

    let h = `<header><div class="d-kind">${n.isView ? 'ویو' : 'جدول'}<span class="mono">${esc(n.schema)}</span></div>` +
      `<h2 class="mono" title="${esc(n.full)}">${esc(n.name)}</h2>` +
      `<button class="x" id="d-close" title="بستن (Esc)">✕</button>` +
      `<div class="d-tags">` +
      `<button class="tag" data-spot="module" title="نمایش همهٔ جدول‌های این ماژول"><i class="dot" style="background:${state.colorMode === 'module' ? mo.color : NEUTRAL}"></i>ماژول <span class="mono">${esc(mo.label)}</span></button>` +
      (cl ? `<button class="tag" data-spot="cluster" title="نمایش همهٔ جدول‌های این خوشه"><i class="dot" style="background:${state.colorMode === 'cluster' ? cl.color : NEUTRAL}"></i>خوشهٔ <span class="mono">${esc(cl.label)}</span></button>` : '') +
      `</div>` + (t.d ? `<p class="d-desc" dir="auto">${esc(t.d)}</p>` : '') + `</header>`;

    h += `<div class="stats">` +
      `<div><b>${fa(n.cols)}</b><span>ستون</span></div>` +
      (n.isView ? `<div><b>${fa(n.uses.length)}</b><span>منبع</span></div>` : `<div><b>${n.rows == null ? '—' : fa(n.rows)}</b><span>ردیف</span></div><div><b>${fa(n.out.length)}</b><span>ارجاع به بیرون</span></div><div><b>${fa(n.inc.length)}</b><span>ارجاع به این</span></div>`) +
      `</div>`;
    h += `<div class="d-actions"><button id="d-fly">نمایش در صحنه</button><button id="d-copy">کپی نام</button>` +
      (ctx.detailActions ? ctx.detailActions(n) : '') +
      (n.isView && canCode && !t.hidden ? `<button data-code="${esc(n.schema + '.' + n.name)}">کد SQL</button>` : '') +
      `<span class="seg mini" id="d-hops"><button data-h="1" class="${state.hops === 1 ? 'on' : ''}">همسایهٔ مستقیم</button><button data-h="2" class="${state.hops === 2 ? 'on' : ''}">تا دو گام</button></span></div>`;

    const rows = t.c.map((c, i) => {
      const f = c[2], ref = fkByCol.get(c[0]);
      const meta = [];
      if (ref) meta.push(`<a data-go="${ref.fk.to}" class="mono">→ ${esc(nodes[ref.fk.to].name)}.<wbr>${esc(ref.r)}</a>`);
      if (f & F_IDENT) meta.push('identity');
      if (f & F_COMPUTED) meta.push(c[5] ? `computed: <span class="mono">${esc(trunc(String(c[5]), 90))}</span>` : 'computed');
      if (c[3]) meta.push(`<span class="mono">= ${esc(c[3])}</span>`);
      return `<tr data-col="${esc(c[0])}"><td class="ci">${i + 1}</td>` +
        `<td class="ck">${f & F_PK ? '<i class="k pk">PK</i>' : ''}${f & F_FK ? '<i class="k fk">FK</i>' : ''}</td>` +
        `<td class="cn"><span class="mono${f & F_PK ? ' b' : ''}">${esc(c[0])}</span>${meta.length ? `<small>${meta.join(' · ')}</small>` : ''}${c[4] ? `<small class="cd" dir="auto">${esc(c[4])}</small>` : ''}</td>` +
        `<td class="ct mono">${esc(c[1])}${f & F_NULL ? '<small>null</small>' : ''}</td></tr>`;
    }).join('');
    h += section('ستون‌ها', t.c.length, `<table class="cols"><tbody>${rows}</tbody></table>`);

    if (n.out.length) h += section('ارجاع می‌دهد به', n.out.length, n.out.map(fk => relItem(nodes[fk.to], fkCols(fk), fkBadges(fk))).join(''), true, `<i class="ln" style="background:${C_OUT}"></i>`);
    if (n.inc.length) h += section('ارجاع شده از', n.inc.length, n.inc.map(fk => relItem(nodes[fk.from], fkCols(fk), fkBadges(fk))).join(''), n.inc.length <= 60, `<i class="ln" style="background:${C_IN}"></i>`);
    if (n.self.length) h += section('رابطه با خودش', n.self.length, n.self.map(fk => `<div class="rel static"><span class="mono rel-c">${fkCols(fk)}</span></div>`).join(''));
    if (n.uses.length) h += section('این ویو از این‌ها می‌خواند', n.uses.length, n.uses.map(j => relItem(nodes[j], nodes[j].isView ? 'view' : nodes[j].cols + ' columns')).join(''));
    if (n.usedBy.length) h += section('ویوهایی که از این می‌خوانند', n.usedBy.length, n.usedBy.map(j => relItem(nodes[j], 'view')).join(''), false);
    if (t.ix && t.ix.length) h += section('ایندکس‌ها', t.ix.length, t.ix.map(ix =>
      `<div class="rel static"><span class="mono rel-t">${esc(ix[0])}${ix[1] & 4 ? '<em class="chip">PK</em>' : ix[1] & 1 ? '<em class="chip">UNIQUE</em>' : ''}${ix[1] & 2 ? '<em class="chip">CLUSTERED</em>' : ''}</span>` +
      `<span class="mono rel-c">${esc(ix[2])}${ix[3] ? ` <span class="inc">INCLUDE (${esc(ix[3])})</span>` : ''}</span></div>`).join(''), false);
    if (t.ck && t.ck.length) h += section('قیدهای CHECK', t.ck.length, t.ck.map(x =>
      `<div class="rel static"><span class="mono rel-t">${esc(x.name)}${x.disabled ? '<em class="chip warn">غیرفعال</em>' : ''}</span><span class="mono rel-c">${esc(x.definition)}</span></div>`).join(''), false);
    const tagOf = canCode ? 'button' : 'div', cls = canCode ? 'rel' : 'rel static';
    if (t.tg && t.tg.length) h += section('تریگرها', t.tg.length, t.tg.map(x =>
      `<${tagOf} class="${cls}" data-code="${esc(n.schema + '.' + x.name)}"><span class="mono rel-t">${esc(x.name)}${x.insteadOf ? '<em class="chip">INSTEAD OF</em>' : ''}${x.disabled ? '<em class="chip warn">غیرفعال</em>' : ''}</span>` +
      `<span class="mono rel-c">${esc((x.events || []).join(', '))}</span></${tagOf}>`).join(''), false);
    if (t.rt && t.rt.length) h += section('پروسیجرها و تابع‌هایی که از این استفاده می‌کنند', t.rt.length, t.rt.slice(0, 500).map(r =>
      `<${tagOf} class="${cls}" data-code="${esc(r.schema + '.' + r.name)}"><span class="mono rel-t">${esc(r.schema === 'dbo' ? r.name : r.schema + '.' + r.name)}</span>` +
      `<span class="mono rel-c">${r.kind === 'PROCEDURE' ? 'procedure' : 'function'}${r.parameters && r.parameters.length ? ' · ' + r.parameters.length + ' parameters' : ''}</span></${tagOf}>`).join('') +
      (t.rt.length > 500 ? `<div class="rel static"><span class="rel-c">… +${t.rt.length - 500}</span></div>` : ''), false);
    h += `<footer>ایجاد: <span class="mono">${esc(t.cr || '')}</span> · آخرین تغییر ساختار: <span class="mono">${esc(t.md || '')}</span></footer>`;

    el.innerHTML = h;
    el.scrollTop = 0;
    if (focusCol) {
      const row = el.querySelector(`tr[data-col="${CSS.escape(focusCol)}"]`);
      if (row) { row.classList.add('hit'); row.scrollIntoView({ block: 'center' }); }
    }
  }
  $('#detail').addEventListener('click', ev => {
    const go = ev.target.closest('[data-go]');
    if (go) return select(nodes[+go.dataset.go]);
    const codeBtn = ev.target.closest('[data-code]');
    if (codeBtn && ctx.showCode) return ctx.showCode(codeBtn.dataset.code);
    const n = state.selected;
    if (!n) return;
    if (ev.target.closest('#d-close')) return select(null);
    if (ev.target.closest('#d-fly')) return flyTo(n);
    const copy = ev.target.closest('#d-copy');
    if (copy) {
      const txt = n.schema + '.' + n.name;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).catch(() => {
        const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }).finally(() => { copy.textContent = 'کپی شد'; setTimeout(() => (copy.textContent = 'کپی نام'), 1200); });
      return;
    }
    const hop = ev.target.closest('#d-hops button');
    if (hop) { state.hops = +hop.dataset.h; refreshVisibility(); renderDetail(); updateLOD(); return; }
    const tag = ev.target.closest('[data-spot]');
    if (tag) {
      const mode = tag.dataset.spot, g = mode === 'cluster' ? n.cluster : n.module;
      if (state.colorMode !== mode) document.querySelector(`.seg[data-seg="colorMode"] button[data-v="${mode}"]`).click();
      state.spot = null;
      setSpot(g);
    }
  });

  // ---------- search ----------
  const sIn = $('#search'), sOut = $('#results');
  let sItems = [], sIdx = -1;
  const sIndex = nodes.map(n => ({ n, l: n.name.toLowerCase(), d: (n.t.d || '').toLowerCase(), c: n.t.c.map(c => c[0].toLowerCase()) }));
  function runSearch() {
    const q = sIn.value.trim().toLowerCase();
    if (!q) { sOut.classList.remove('open'); sItems = []; return; }
    const tb = [], cl = [];
    for (const e of sIndex) {
      const i = e.l.indexOf(q);
      if (i >= 0) tb.push([i === 0 ? (e.l.length === q.length ? 0 : 1) : e.l[i - 1] === '_' ? 2 : 3, e.n]);
      else if (e.d && e.d.includes(q)) tb.push([4, e.n]);
      if (q.length >= 2) for (let k = 0; k < e.c.length; k++) {
        const j = e.c[k].indexOf(q);
        if (j >= 0) cl.push([e.c[k].length === q.length ? 0 : j === 0 ? 1 : 2, e.n, e.n.t.c[k]]);
      }
    }
    const byRank = (a, b) => a[0] - b[0] || b[1].deg - a[1].deg || a[1].name.localeCompare(b[1].name);
    tb.sort(byRank); cl.sort(byRank);
    sItems = [...tb.slice(0, 14).map(x => ({ n: x[1] })), ...cl.slice(0, 24).map(x => ({ n: x[1], col: x[2] }))];
    const mark = s => { const i = s.toLowerCase().indexOf(q); return i < 0 ? esc(s) : esc(s.slice(0, i)) + '<mark>' + esc(s.slice(i, i + q.length)) + '</mark>' + esc(s.slice(i + q.length)); };
    let h = '';
    if (tb.length) h += `<div class="r-h">جدول‌ها و ویوها <b>${fa(tb.length)}</b></div>`;
    sItems.forEach((it, i) => {
      if (it.col && (i === 0 || !sItems[i - 1].col)) h += `<div class="r-h">ستون‌ها <b>${fa(cl.length)}</b></div>`;
      h += it.col
        ? `<button class="r" data-i="${i}"><span class="mono">${mark(it.col[0])}</span><small class="mono">${esc(it.n.full)} · ${esc(it.col[1])}</small></button>`
        : `<button class="r" data-i="${i}"><i class="dot${it.n.isView ? ' sq' : ''}" style="background:${baseColor(it.n)}"></i><span class="mono">${mark(it.n.full)}</span><small>${it.n.isView ? 'ویو' : fa(it.n.cols) + ' ستون · ' + fa(it.n.deg) + ' رابطه'}</small></button>`;
    });
    if (!sItems.length) h = '<div class="r-h">چیزی پیدا نشد</div>';
    sOut.innerHTML = h; sOut.classList.add('open'); sIdx = -1;
  }
  function pick(i) {
    const it = sItems[i];
    if (!it) return;
    sOut.classList.remove('open'); sIn.blur();
    select(it.n, { col: it.col && it.col[0] });
  }
  let sTimer;
  sIn.addEventListener('input', () => { clearTimeout(sTimer); sTimer = setTimeout(runSearch, 90); });
  sIn.addEventListener('focus', () => { if (sIn.value.trim()) runSearch(); });
  sIn.addEventListener('keydown', ev => {
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (!sItems.length) return;
      sIdx = (sIdx + (ev.key === 'ArrowDown' ? 1 : -1) + sItems.length) % sItems.length;
      sOut.querySelectorAll('.r').forEach((b, i) => { b.classList.toggle('cur', i === sIdx); if (i === sIdx) b.scrollIntoView({ block: 'nearest' }); });
    } else if (ev.key === 'Enter') { clearTimeout(sTimer); if (sIdx < 0) runSearch(); pick(Math.max(0, sIdx)); }
    else if (ev.key === 'Escape') { sOut.classList.remove('open'); sIn.blur(); ev.stopPropagation(); }
  });
  sOut.addEventListener('click', ev => { const b = ev.target.closest('.r'); if (b) pick(+b.dataset.i); });
  document.addEventListener('pointerdown', ev => { if (!ev.target.closest('#searchbox')) sOut.classList.remove('open'); });

  // ---------- global input ----------
  document.addEventListener('keydown', ev => {
    if (ev.target === sIn) return;
    if (ev.key === 'Escape') { if (state.selected) select(null); else if (state.spot) setSpot(null); }
    else if (ev.key === '/' || (ev.key === 'f' && (ev.ctrlKey || ev.metaKey))) { ev.preventDefault(); sIn.focus(); sIn.select(); }
  });
  const canvasEl = graph.renderer().domElement;
  ['pointerdown', 'wheel'].forEach(t => canvasEl.addEventListener(t, () => { if (state.autoRotate) setToggle('autoRotate', false, true); }, { passive: true }));
  window.addEventListener('resize', () => graph.width(window.innerWidth).height(window.innerHeight));

  // ---------- header numbers ----------
  const S = M.stats;
  $('#dbname').textContent = ctx.title || M.meta.db;
  $('#stats').innerHTML = [[S.tables, 'جدول'], [S.columns, 'ستون'], [S.fks, 'رابطه'], [S.views, 'ویو']].map(([v, l]) => `<span><b>${fa(v)}</b>${l}</span>`).join('');
  $('#cnt-iso').textContent = fa(S.isolated);
  $('#cnt-views').textContent = fa(S.views);
  $('#asof').textContent = 'ساختار خوانده‌شده در ' + faDate(M.meta.at);

  // ---------- first frame: paint, then glide in from far away ----------
  paintNodes(); paintLines(); renderLegend();
  if (document.fonts) document.fonts.load('600 14px Vazirmatn');
  requestAnimationFrame(frame);
  $('#loading').classList.add('hide');
  const rs = ctx.restore;
  if (rs && rs.cam) {
    // coming back after an automatic update: same viewpoint, same table
    graph.cameraPosition(rs.cam.p, rs.cam.t);
    setToggle('autoRotate', false, true);
    const n = rs.selected && nodes.find(x => x.full === rs.selected);
    if (n) select(n, { fly: false });
  } else {
    const dist = homeView(0), e = (20 * Math.PI) / 180;
    graph.cameraPosition({ x: 0, y: Math.sin(e) * dist * 2.4, z: Math.cos(e) * dist * 2.4 }, { x: 0, y: 0, z: 0 });
    setTimeout(() => { if (!state.selected) homeView(2200); }, 250);
  }

  // bring a small group of tables into view, keeping the direction the camera is looking from
  function frameNodes(list, ms = 1400) {
    const c = new THREE.Vector3();
    list.forEach(n => c.add(new THREE.Vector3(n.x, n.y, n.z)));
    c.multiplyScalar(1 / list.length);
    let r = 0;
    list.forEach(n => { r = Math.max(r, Math.hypot(n.x - c.x, n.y - c.y, n.z - c.z) + n.radius); });
    const dir = new THREE.Vector3().subVectors(camera.position, c);
    if (dir.lengthSq() < 1) dir.set(0, 0.3, 1);
    dir.normalize();
    const dist = Math.max(170, r * 2.8);
    graph.cameraPosition({ x: c.x + dir.x * dist, y: c.y + dir.y * dist, z: c.z + dir.z * dist }, { x: c.x, y: c.y, z: c.z }, ms);
  }
  const app = {
    M, nodes, state, select, setSpot, setToggle, homeView, lod, graph, setCase, flyTo,
    refreshDetail: () => renderDetail(),
    find: name => nodes.find(n => n.name.toLowerCase() === String(name).toLowerCase() || n.full.toLowerCase() === String(name).toLowerCase()),
    byFull: full => nodes.find(n => `${n.schema}.${n.name}`.toLowerCase() === String(full).toLowerCase()),
    spotlight: (list, label) => {
      state.spot = null;
      setToggle('autoRotate', false, true);
      setSpot({ key: '~custom', label, color: NEUTRAL, nodes: list });
      if (list.length && list.length <= 40) frameNodes(list);
    },
    viewState: () => ({
      cam: { p: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, t: { x: controls.target.x, y: controls.target.y, z: controls.target.z } },
      selected: state.selected ? state.selected.full : null,
    }),
    ready: true,
  };
  window.__db3d = app;      // handle for automated checks
  return app;
}
}
