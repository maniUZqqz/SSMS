'use strict';
// Database map: turns raw catalog rows into one complete, readable structure document per database,
// and tells what changed between two readings. No database access here.

// Reading a big database is a few seconds of pure CPU work: give the server a turn regularly so the app stays responsive.
const breathe = () => new Promise(resolve => setImmediate(resolve));

const iso = d => (d instanceof Date && !isNaN(d) ? d.toISOString().slice(0, 19) : d == null ? null : String(d));

function cleanDefault(d) {
  d = String(d).trim();
  while (d.length >= 2 && d[0] === '(' && d[d.length - 1] === ')') {
    // strip the outer parentheses only when they match each other
    let depth = 0, closesAtEnd = true;
    for (let i = 0; i < d.length - 1; i++) {
      if (d[i] === '(') depth++;
      else if (d[i] === ')' && --depth === 0) { closesAtEnd = false; break; }
    }
    if (!closesAtEnd) break;
    d = d.slice(1, -1).trim();
  }
  return d;
}

// Which tables/views does a piece of SQL mention? Best effort: comments and string literals are ignored,
// names are matched against the real object list (dbo wins when a bare name exists in several schemas).
const IDENT = /(?:\[[^\]]+\]|[\p{L}_@#][\p{L}\p{N}_@#$]*)(?:\s*\.\s*(?:\[[^\]]+\]|[\p{L}_@#][\p{L}\p{N}_@#$]*))*/gu;
function findRefs(sql, lookup, self) {
  const text = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\r\n]*/g, ' ').replace(/'(?:[^']|'')*'/g, "''");
  const found = new Set();
  for (const m of text.matchAll(IDENT)) {
    const parts = m[0].toLowerCase().split(/\s*\.\s*/).map(p => p.replace(/^\[|\]$/g, ''));
    let hit;
    for (let a = 0; a < parts.length && hit === undefined; a++) {
      if (a + 1 < parts.length && lookup.schemas.has(parts[a])) hit = lookup.full.get(parts[a] + '.' + parts[a + 1]);
      if (hit === undefined && a === 0 && lookup.byName.has(parts[0])) hit = lookup.full.get('dbo.' + parts[0]) || lookup.byName.get(parts[0]);
    }
    if (hit !== undefined && hit !== self) found.add(hit);
  }
  return [...found].sort();
}

// raw: { name: rows[] | { error } } for every query in queries.ALL
async function shape(raw, meta) {
  const warnings = [];
  const need = n => { const r = raw[n]; if (!Array.isArray(r)) throw new Error(`${n}: ${r && r.error ? r.error : 'no result'}`); return r; };
  const opt = n => { const r = raw[n]; if (!Array.isArray(r)) { warnings.push(`${n}: ${r && r.error ? r.error : 'no result'}`); return []; } return r; };

  const info = need('info')[0] || {};
  const byId = new Map(), tables = [], views = [];
  const lookup = { full: new Map(), byName: new Map(), schemas: new Set() };
  for (const o of need('objects')) {
    const t = { schema: o.sch, name: o.name };
    if (o.kind === 'U') t.rows = o.row_count == null ? 0 : Number(o.row_count);
    t.created = iso(o.created); t.modified = iso(o.modified);
    if (o.descr) t.description = o.descr;
    t.columns = [];
    (o.kind === 'U' ? tables : views).push(t);
    byId.set(o.id, t);
    const full = `${o.sch}.${o.name}`;
    lookup.full.set(full.toLowerCase(), full);
    if (!lookup.byName.has(o.name.toLowerCase())) lookup.byName.set(o.name.toLowerCase(), full);
    lookup.schemas.add(o.sch.toLowerCase());
  }
  const isTable = new Set(tables);
  const fullOf = t => `${t.schema}.${t.name}`;

  for (const c of need('columns')) {
    const t = byId.get(c.id);
    if (!t) continue;
    const col = { name: c.name, type: c.typ, nullable: !!c.nullable };
    if (c.ident) col.identity = true;
    if (c.computed) col.computed = c.formula ? cleanDefault(c.formula) : true;
    if (c.dflt != null) col.default = cleanDefault(c.dflt);
    if (c.descr) col.description = c.descr;
    t.columns.push(col);
  }

  await breathe();

  // primary keys and unique constraints
  const keyGroups = new Map();
  for (const k of opt('keys')) {
    const key = k.id + '|' + k.name;
    if (!keyGroups.has(key)) keyGroups.set(key, { id: k.id, name: k.name, kind: k.kind, columns: [] });
    keyGroups.get(key).columns.push(k.col);
  }
  for (const k of keyGroups.values()) {
    const t = byId.get(k.id);
    if (!t) continue;
    if (k.kind === 'PK') {
      t.primaryKey = { name: k.name, columns: k.columns };
      for (const c of t.columns) if (k.columns.includes(c.name)) c.primaryKey = true;
    } else (t.uniqueConstraints || (t.uniqueConstraints = [])).push({ name: k.name, columns: k.columns });
  }

  // foreign keys
  const fkGroups = new Map();
  for (const f of opt('fks')) {
    if (!fkGroups.has(f.fk_id)) fkGroups.set(f.fk_id, { f, pcols: [], rcols: [] });
    const g = fkGroups.get(f.fk_id); g.pcols.push(f.pcol); g.rcols.push(f.rcol);
  }
  let fkCount = 0;
  for (const { f, pcols, rcols } of fkGroups.values()) {
    const t = byId.get(f.p), r = byId.get(f.r);
    if (!t || !r) continue;
    const fk = { name: f.name, columns: pcols, references: { schema: r.schema, table: r.name, columns: rcols } };
    if (f.on_delete && f.on_delete !== 'NO_ACTION') fk.onDelete = f.on_delete;
    if (f.on_update && f.on_update !== 'NO_ACTION') fk.onUpdate = f.on_update;
    if (f.disabled) fk.disabled = true;
    if (f.untrusted) fk.notTrusted = true;
    (t.foreignKeys || (t.foreignKeys = [])).push(fk);
    fkCount++;
  }

  await breathe();

  // indexes
  const ixGroups = new Map();
  let ixCount = 0;
  for (const i of opt('indexes')) {
    const key = i.id + '|' + i.ix;
    let g = ixGroups.get(key);
    if (!g) {
      g = { name: i.name, type: i.typ };
      if (i.uq) g.unique = true;
      if (i.pk) g.primaryKey = true;
      g.columns = [];
      if (i.filter) g.filter = i.filter;
      ixGroups.set(key, g);
      const t = byId.get(i.id);
      if (t) { (t.indexes || (t.indexes = [])).push(g); ixCount++; }
    }
    if (i.inc) (g.include || (g.include = [])).push(i.col);
    else g.columns.push(i.dsc ? i.col + ' DESC' : i.col);
  }

  for (const c of opt('checks')) {
    const t = byId.get(c.id);
    if (!t) continue;
    const ck = { name: c.name, definition: cleanDefault(c.definition || '') };
    if (c.disabled) ck.disabled = true;
    (t.checks || (t.checks = [])).push(ck);
  }

  const code = {};
  const modules = new Map(opt('modules').map(m => [m.id, m.definition]));

  const trGroups = new Map();
  let trCount = 0;
  for (const r of opt('triggers')) {
    let g = trGroups.get(r.tid);
    if (!g) {
      const t = byId.get(r.id);
      g = { name: r.name, events: [] };
      if (r.instead_of) g.insteadOf = true;
      if (r.disabled) g.disabled = true;
      trGroups.set(r.tid, g);
      if (t) {
        (t.triggers || (t.triggers = [])).push(g); trCount++;
        if (modules.has(r.tid)) code[`${t.schema}.${r.name}`] = modules.get(r.tid);
      }
    }
    if (r.ev && !g.events.includes(r.ev)) g.events.push(r.ev);
  }

  // views: what they read
  let done = 0;
  for (const [id, v] of byId) {
    if (isTable.has(v)) continue;
    if (++done % 40 === 0) await breathe();
    const def = modules.get(id);
    if (def == null) { v.definitionHidden = true; continue; }
    v.reads = findRefs(def, lookup, fullOf(v));
    code[fullOf(v)] = def;
  }

  // procedures and functions
  const routines = [], routineById = new Map();
  const KIND = { SQL_STORED_PROCEDURE: 'PROCEDURE', SQL_SCALAR_FUNCTION: 'SCALAR_FUNCTION', SQL_TABLE_VALUED_FUNCTION: 'TABLE_FUNCTION', SQL_INLINE_TABLE_VALUED_FUNCTION: 'TABLE_FUNCTION' };
  for (const r of opt('routines')) {
    const o = { schema: r.sch, name: r.name, kind: KIND[r.kind] || r.kind, created: iso(r.created), modified: iso(r.modified), parameters: [] };
    routines.push(o); routineById.set(r.id, o);
  }
  for (const p of opt('params')) {
    const o = routineById.get(p.id);
    if (!o) continue;
    if (p.pos === 0 || !p.name) { o.returns = p.typ; continue; }
    const prm = { name: p.name, type: p.typ };
    if (p.is_out) prm.output = true;
    o.parameters.push(prm);
  }
  for (const [id, o] of routineById) {
    if (++done % 40 === 0) await breathe();
    const def = modules.get(id);
    if (def == null) { o.definitionHidden = true; continue; }
    o.uses = findRefs(def, lookup);
    code[`${o.schema}.${o.name}`] = def;
  }

  const structure = {
    format: 'db-map-structure/1',
    id: meta.id,
    database: info.db || meta.database,
    server: meta.server || '',
    sqlVersion: info.version || '',
    edition: info.edition || '',
    extractedAt: meta.at,
    serverTime: iso(info.server_time),
    counts: {
      tables: tables.length, views: views.length,
      columns: tables.reduce((a, t) => a + t.columns.length, 0),
      foreignKeys: fkCount, indexes: ixCount, triggers: trCount,
      procedures: routines.filter(r => r.kind === 'PROCEDURE').length,
      functions: routines.filter(r => r.kind !== 'PROCEDURE').length,
      rows: tables.reduce((a, t) => a + (t.rows || 0), 0),
    },
  };
  if (warnings.length) structure.warnings = warnings;
  structure.tables = tables; structure.views = views; structure.routines = routines;
  return { structure, code };
}

// Readable JSON: small things (a column, an index, a key) stay on one line, bigger things open up.
function pretty(v, ind = '') {
  const flat = JSON.stringify(v);
  if (v === null || typeof v !== 'object' || flat.length <= 150) return flat;
  const ni = ind + ' ';
  if (Array.isArray(v)) return '[\n' + v.map(x => ni + pretty(x, ni)).join(',\n') + '\n' + ind + ']';
  return '{\n' + Object.keys(v).map(k => ni + JSON.stringify(k) + ': ' + pretty(v[k], ni)).join(',\n') + '\n' + ind + '}';
}

// The same for a whole structure document, written out in slices.
async function prettyDocument(doc) {
  const parts = [];
  for (const k of Object.keys(doc)) {
    const v = doc[k];
    if (!Array.isArray(v) || v.length < 50) { parts.push(' ' + JSON.stringify(k) + ': ' + pretty(v, ' ')); continue; }
    const items = [];
    for (let i = 0; i < v.length; i++) {
      items.push('  ' + pretty(v[i], '  '));
      if (i % 150 === 149) await breathe();
    }
    parts.push(' ' + JSON.stringify(k) + ': [\n' + items.join(',\n') + '\n ]');
  }
  return '{\n' + parts.join(',\n') + '\n}\n';
}

// What changed between two readings of the same database.
function diff(prev, next) {
  const items = [];
  const key = o => `${o.schema}.${o.name}`;
  const index = list => new Map((list || []).map(o => [key(o), o]));
  const pt = index(prev.tables), nt = index(next.tables);
  for (const [k, t] of nt) {
    const old = pt.get(k);
    if (!old) { items.push({ t: 'table+', n: k, columns: t.columns.length }); continue; }
    const oc = new Map(old.columns.map(c => [c.name, c])), nc = new Map(t.columns.map(c => [c.name, c]));
    for (const [name, c] of nc) {
      const o = oc.get(name);
      if (!o) items.push({ t: 'column+', n: k, c: name, type: c.type });
      else if (o.type !== c.type || !!o.nullable !== !!c.nullable) items.push({ t: 'column~', n: k, c: name, from: o.type + (o.nullable ? ' null' : ''), to: c.type + (c.nullable ? ' null' : '') });
    }
    for (const name of oc.keys()) if (!nc.has(name)) items.push({ t: 'column-', n: k, c: name });
    const of = new Map((old.foreignKeys || []).map(f => [f.name, f])), nf = new Map((t.foreignKeys || []).map(f => [f.name, f]));
    for (const [name, f] of nf) if (!of.has(name)) items.push({ t: 'fk+', n: k, fk: name, to: `${f.references.schema}.${f.references.table}`, c: f.columns.join(', ') });
    for (const [name, f] of of) if (!nf.has(name)) items.push({ t: 'fk-', n: k, fk: name, to: `${f.references.schema}.${f.references.table}` });
  }
  for (const k of pt.keys()) if (!nt.has(k)) items.push({ t: 'table-', n: k });
  for (const [kind, a, b] of [['view', prev.views, next.views], ['routine', prev.routines, next.routines]]) {
    const p = index(a), n = index(b);
    for (const [k, o] of n) {
      const old = p.get(k);
      if (!old) items.push({ t: kind + '+', n: k });
      else if (old.modified !== o.modified) items.push({ t: kind + '~', n: k });
    }
    for (const k of p.keys()) if (!n.has(k)) items.push({ t: kind + '-', n: k });
  }
  return items;
}
function summarize(items) {
  const s = {};
  for (const i of items) s[i.t] = (s[i.t] || 0) + 1;
  return s;
}

module.exports = { shape, prettyDocument, diff, summarize, breathe };
