// Turns the raw catalog dump (window.DB_SCHEMA) into the graph the viewer draws:
// nodes (tables/views), links (foreign keys, view references), modules and relation clusters.

export const F_PK = 1, F_NULL = 2, F_IDENT = 4, F_COMPUTED = 8, F_FK = 16;

// Fixed categorical order (dark-surface steps). A 9th group is never a new hue: it folds into "other".
export const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
export const NEUTRAL = '#8d8c86';

const firstWord = s => {
  const m = s.match(/^([A-Z]{2,}(?=_|$|[A-Z][a-z])|[A-Z]?[a-z0-9]+|[A-Z]+)/);
  return m ? m[1] : s;
};

// "Module" = the naming family a table belongs to: another schema, a prefix (Sales_, Hr_ ...),
// or for the generic Tbl_ prefix the first word after it (Tbl_OrderLine -> Order).
function moduleLabel(t) {
  if (t.s !== 'dbo') return t.s;
  const parts = t.n.split('_').filter(Boolean);
  if (!parts.length) return t.n;
  if (/^(tbl|vw|view|v)$/i.test(parts[0]) && parts.length > 1) return firstWord(parts[1]);
  return parts.length > 1 ? parts[0] : firstWord(parts[0]);
}

// Louvain community detection on an undirected weighted graph. Deterministic.
function louvain(n, edges) {
  const nodeMap = Array.from({ length: n }, (_, i) => i);
  let curN = n, curEdges = edges;
  for (let level = 0; level < 12; level++) {
    const adj = Array.from({ length: curN }, () => new Map());
    const deg = new Float64Array(curN);
    let m2 = 0;
    for (const [a, b, w] of curEdges) {
      if (a === b) { deg[a] += 2 * w; }
      else {
        adj[a].set(b, (adj[a].get(b) || 0) + w);
        adj[b].set(a, (adj[b].get(a) || 0) + w);
        deg[a] += w; deg[b] += w;
      }
      m2 += 2 * w;
    }
    if (!m2) break;
    const c = Int32Array.from({ length: curN }, (_, i) => i);
    const tot = Float64Array.from(deg);
    let improved = false, moved = true, iter = 0;
    while (moved && iter++ < 40) {
      moved = false;
      for (let i = 0; i < curN; i++) {
        const ci = c[i];
        const wTo = new Map();
        for (const [j, w] of adj[i]) wTo.set(c[j], (wTo.get(c[j]) || 0) + w);
        tot[ci] -= deg[i];
        let best = ci, bestGain = (wTo.get(ci) || 0) - tot[ci] * deg[i] / m2;
        for (const [cj, w] of wTo) {
          const gain = w - tot[cj] * deg[i] / m2;
          if (gain > bestGain + 1e-10) { bestGain = gain; best = cj; }
        }
        tot[best] += deg[i];
        if (best !== ci) { c[i] = best; moved = true; improved = true; }
      }
    }
    if (!improved) break;
    const remap = new Map();
    for (let i = 0; i < curN; i++) if (!remap.has(c[i])) remap.set(c[i], remap.size);
    const k = remap.size;
    for (let i = 0; i < n; i++) nodeMap[i] = remap.get(c[nodeMap[i]]);
    const agg = new Map();
    for (const [a, b, w] of curEdges) {
      let x = remap.get(c[a]), y = remap.get(c[b]);
      if (x > y) [x, y] = [y, x];
      const key = x * k + y;
      agg.set(key, (agg.get(key) || 0) + w);
    }
    curEdges = [...agg].map(([key, w]) => [Math.floor(key / k), key % k, w]);
    if (k === curN) break;
    curN = k;
  }
  return nodeMap;
}

export function buildModel(schema) {
  const T = schema.tables;
  const nodes = T.map((t, i) => ({
    id: i, t, name: t.n, schema: t.s, isView: t.k === 'V',
    full: t.s === 'dbo' ? t.n : t.s + '.' + t.n,
    cols: t.c.length, rows: t.r == null ? null : t.r,
    out: [], inc: [], self: [],      // foreign keys: this -> parent, child -> this, this -> this
    uses: [], usedBy: [],            // view -> object references
    nbr: new Set(), deg: 0,
  }));

  // ---- foreign keys -> one link per ordered pair of tables ----
  const fks = schema.fks.map((f, i) => ({ i, from: f[0], to: f[1], name: f[2], onDelete: f[3], disabled: !!f[4], cols: f[5] }));
  const linkByPair = new Map();
  const links = [];
  for (const fk of fks) {
    const a = nodes[fk.from], b = nodes[fk.to];
    for (const [pc] of fk.cols) {
      const col = a.t.c.find(c => c[0] === pc);
      if (col) col[2] |= F_FK;
    }
    if (fk.from === fk.to) { a.self.push(fk); continue; }
    a.out.push(fk); b.inc.push(fk);
    a.nbr.add(b.id); b.nbr.add(a.id);
    const key = fk.from * T.length + fk.to;
    let l = linkByPair.get(key);
    if (!l) { l = { source: fk.from, target: fk.to, kind: 'fk', fks: [], a: fk.from, b: fk.to }; linkByPair.set(key, l); links.push(l); }
    l.fks.push(fk);
  }
  nodes.forEach(n => { n.deg = n.nbr.size; });

  // ---- view references ----
  for (const n of nodes) {
    if (!n.t.dp) continue;
    for (const j of n.t.dp) {
      const m = nodes[j];
      if (!m) continue;
      n.uses.push(j); m.usedBy.push(n.id);
      links.push({ source: n.id, target: j, kind: 'view', fks: [], a: n.id, b: j });
    }
  }
  // a table with no foreign key at all sits on the outer ring (views: no references at all)
  nodes.forEach(n => { n.ring = n.isView ? n.uses.length === 0 : n.deg === 0; });

  // ---- modules ----
  const modMap = new Map();
  for (const n of nodes) {
    const label = moduleLabel(n.t), key = label.toLowerCase();
    let m = modMap.get(key);
    if (!m) { m = { key, labels: new Map(), nodes: [], tables: 0 }; modMap.set(key, m); }
    m.labels.set(label, (m.labels.get(label) || 0) + 1);
    m.nodes.push(n); if (!n.isView) m.tables++;
    n.module = m;
  }
  const modules = [...modMap.values()].sort((a, b) => b.tables - a.tables || b.nodes.length - a.nodes.length || a.key.localeCompare(b.key));
  modules.forEach((m, i) => {
    m.label = [...m.labels].sort((a, b) => b[1] - a[1])[0][0];
    m.color = i < PALETTE.length ? PALETTE[i] : NEUTRAL;
    m.rank = i;
  });

  // ---- relation clusters (communities of the foreign-key graph) ----
  const edges = links.filter(l => l.kind === 'fk').map(l => [l.a, l.b, 1]);
  const comm = louvain(nodes.length, edges);
  const cMap = new Map();
  nodes.forEach((n, i) => {
    if (n.isView || n.deg === 0) return;
    let c = cMap.get(comm[i]);
    if (!c) { c = { nodes: [] }; cMap.set(comm[i], c); }
    c.nodes.push(n); n.cluster = c;
  });
  const clusters = [...cMap.values()].sort((a, b) => b.nodes.length - a.nodes.length);
  clusters.forEach((c, i) => {
    c.hub = c.nodes.reduce((best, n) => (n.deg > best.deg ? n : best), c.nodes[0]);
    c.label = c.hub.full; c.key = 'c' + i; c.rank = i;
    c.color = i < PALETTE.length ? PALETTE[i] : NEUTRAL;
  });
  // a view takes the cluster most of its source tables live in
  for (const n of nodes) {
    if (!n.isView || !n.uses.length) continue;
    const votes = new Map();
    for (const j of n.uses) { const c = nodes[j].cluster; if (c) votes.set(c, (votes.get(c) || 0) + 1); }
    let best = null, bv = 0;
    for (const [c, v] of votes) if (v > bv) { best = c; bv = v; }
    if (best) n.cluster = best;
  }

  const tables = nodes.filter(n => !n.isView);
  const stats = {
    tables: tables.length, views: nodes.length - tables.length,
    columns: tables.reduce((a, n) => a + n.cols, 0),
    fks: fks.length, isolated: tables.filter(n => n.deg === 0).length,
    rows: tables.reduce((a, n) => a + (n.rows || 0), 0),
  };
  return { nodes, links, fks, modules, clusters, stats, meta: schema.meta };
}

// The stored structure file (data/<id>.json) is written to be read by people and other tools.
// This turns it into the compact form the scene works with.
export function fromStructure(j) {
  const tables = [], idx = new Map();
  const add = (o, k) => {
    idx.set(`${o.schema}.${o.name}`.toLowerCase(), tables.length);
    tables.push({
      s: o.schema, n: o.name, k, r: k === 'U' ? (o.rows == null ? 0 : o.rows) : null,
      cr: (o.created || '').slice(0, 10), md: (o.modified || '').slice(0, 10), d: o.description || '',
      c: (o.columns || []).map(c => [c.name, c.type,
        (c.primaryKey ? F_PK : 0) | (c.nullable ? F_NULL : 0) | (c.identity ? F_IDENT : 0) | (c.computed ? F_COMPUTED : 0),
        c.default == null ? 0 : c.default, c.description || 0, typeof c.computed === 'string' ? c.computed : 0]),
      ix: (o.indexes || []).map(i => [i.name, (i.unique ? 1 : 0) | (/^CLUSTERED/.test(i.type || '') ? 2 : 0) | (i.primaryKey ? 4 : 0),
        (i.columns || []).join(', '), (i.include || []).join(', '), i.filter || '']),
      tg: o.triggers || [], ck: o.checks || [], rt: [], hidden: !!o.definitionHidden,
    });
  };
  const T = j.tables || [], V = j.views || [];
  T.forEach(o => add(o, 'U'));
  V.forEach(o => add(o, 'V'));
  const fks = [];
  T.forEach((o, i) => (o.foreignKeys || []).forEach(f => {
    const to = idx.get(`${f.references.schema}.${f.references.table}`.toLowerCase());
    if (to === undefined) return;
    const del = f.onDelete === 'CASCADE' ? 1 : f.onDelete === 'SET_NULL' ? 2 : f.onDelete === 'SET_DEFAULT' ? 3 : 0;
    fks.push([i, to, f.name, del, f.disabled ? 1 : 0, f.columns.map((c, k) => [c, f.references.columns[k]])]);
  }));
  V.forEach((v, k) => {
    const dp = (v.reads || []).map(n => idx.get(n.toLowerCase())).filter(x => x !== undefined);
    if (dp.length) tables[T.length + k].dp = dp;
  });
  (j.routines || []).forEach(r => (r.uses || []).forEach(n => {
    const i = idx.get(n.toLowerCase());
    if (i !== undefined) tables[i].rt.push(r);
  }));
  return { meta: { db: j.database, at: j.extractedAt, id: j.id, server: j.server, counts: j.counts || {} }, tables, fks };
}
