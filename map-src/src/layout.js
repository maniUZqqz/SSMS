// Places the tables in space: related tables pull each other together, all tables repel,
// and a mild gravity keeps small islands near the core.
// The result is remembered per database. When the structure changes, the tables that were already there keep
// their place and only the new ones are fitted in, so the map stays familiar as the database grows.
import { forceSimulation, forceLink, forceManyBody, forceX, forceY, forceZ } from 'd3-force-3d';

const DECAY = 0.02, ALPHA_MIN = 0.004;

function signature(nodes, links) {
  let h = 2166136261;
  const add = s => { for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } };
  nodes.forEach(n => add(n.full + '|'));
  links.forEach(l => add(l.a + '>' + l.b + ';'));
  return (h >>> 0).toString(36) + '.' + nodes.length + '.' + links.length;
}
// stable pseudo-random number in [-1, 1) from a name
function jitter(name, salt) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) / 2147483648) - 1;
}

function simulation(free, nodes, links) {
  const simLinks = links.filter(l => !nodes[l.a].ring && !nodes[l.b].ring).map(l => ({ source: nodes[l.a], target: nodes[l.b], kind: l.kind }));
  return forceSimulation(free, 3).alphaDecay(DECAY).velocityDecay(0.38).alphaMin(ALPHA_MIN).stop()
    .force('charge', forceManyBody().strength(n => (n.isView ? -14 : -(36 + Math.min(n.deg, 80) * 2))).distanceMax(1000).theta(0.9))
    .force('link', forceLink(simLinks)
      .distance(l => (l.kind === 'view' ? 50 : 30 + 3 * Math.sqrt(Math.min(l.source.deg, l.target.deg))))
      .strength(l => {
        if (l.kind === 'view') return 0.1;
        const a = Math.max(1, l.source.deg), b = Math.max(1, l.target.deg);
        return 1 / Math.min(a, b) / (1 + 0.6 * Math.log10(Math.max(a, b)));   // links into big hubs pull less
      }))
    .force('gx', forceX(0).strength(0.035)).force('gy', forceY(0).strength(0.055)).force('gz', forceZ(0).strength(0.035));
}
async function run(sim, ticks, onProgress, from = 0, span = 1) {
  let t = performance.now();
  for (let i = 0; i < ticks; i++) {
    sim.tick();
    if (performance.now() - t > 45) {
      onProgress(from + (i / ticks) * span);
      await new Promise(r => setTimeout(r, 0));
      t = performance.now();
    }
  }
}

// returns 'cached' | 'updated' | 'new'
export async function computeLayout(nodes, links, onProgress, cacheId) {
  const KEY = 'db3d.layout.v3.' + cacheId;
  const sig = signature(nodes, links);
  const free = nodes.filter(n => !n.ring);
  let cache = null;
  try { cache = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { /* storage unavailable: just compute */ }
  const save = () => {
    free.forEach(n => { n.x = Math.round(n.x * 10) / 10; n.y = Math.round(n.y * 10) / 10; n.z = Math.round(n.z * 10) / 10; delete n.fx; delete n.fy; delete n.fz; });
    try { localStorage.setItem(KEY, JSON.stringify({ sig, names: free.map(n => n.full), p: free.flatMap(n => [n.x, n.y, n.z]) })); } catch (e) { /* ignore */ }
  };
  const known = new Map();
  if (cache && Array.isArray(cache.names) && cache.p && cache.p.length === cache.names.length * 3) cache.names.forEach((nm, i) => known.set(nm, i));

  if (cache && cache.sig === sig && known.size === free.length) {
    free.forEach(n => { const i = known.get(n.full); n.x = cache.p[i * 3]; n.y = cache.p[i * 3 + 1]; n.z = cache.p[i * 3 + 2]; });
    return 'cached';
  }

  const old = free.filter(n => known.has(n.full));
  if (old.length >= free.length * 0.6) {
    // the structure changed a little: keep what was there, fit the newcomers in next to the tables they relate to
    old.forEach(n => { const i = known.get(n.full); n.x = n.fx = cache.p[i * 3]; n.y = n.fy = cache.p[i * 3 + 1]; n.z = n.fz = cache.p[i * 3 + 2]; });
    const placed = new Set(old);
    const around = new Map();
    for (const l of links) {
      const a = nodes[l.a], b = nodes[l.b];
      if (placed.has(a) && !placed.has(b) && !b.ring) (around.get(b) || around.set(b, []).get(b)).push(a);
      if (placed.has(b) && !placed.has(a) && !a.ring) (around.get(a) || around.set(a, []).get(a)).push(b);
    }
    for (const n of free) {
      if (placed.has(n)) continue;
      const nb = around.get(n) || [];
      const c = nb.reduce((s, m) => [s[0] + m.x, s[1] + m.y, s[2] + m.z], [0, 0, 0]).map(v => (nb.length ? v / nb.length : 0));
      const spread = nb.length ? 22 : 120;
      n.x = c[0] + jitter(n.full, 1) * spread; n.y = c[1] + jitter(n.full, 2) * spread; n.z = c[2] + jitter(n.full, 3) * spread;
    }
    const sim = simulation(free, nodes, links);
    sim.alpha(0.3);
    await run(sim, 80, onProgress, 0, 0.8);
    old.forEach(n => { delete n.fx; delete n.fy; delete n.fz; });
    sim.alpha(0.03);
    await run(sim, 20, onProgress, 0.8, 0.2);
    onProgress(1);
    save();
    return 'updated';
  }

  const sim = simulation(free, nodes, links);
  await run(sim, Math.ceil(Math.log(ALPHA_MIN) / Math.log(1 - DECAY)), onProgress);
  onProgress(1);
  save();
  return 'new';
}
