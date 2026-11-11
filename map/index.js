'use strict';
// Database map: keeps one complete structure document per database (map-data/<id>.json) in step with the real
// database without anyone asking. It checks every few minutes and re-reads when something changed; the documents
// stay usable when the database cannot be reached. It also answers the map's read-only row queries.
//
//   map-data/maps.json            which databases are mapped (connection id + database name, no passwords)
//   map-data/<id>.json            the structure: tables, columns, keys, relations, indexes, views, routines ...
//   map-data/<id>.code.json       SQL text of views, procedures, functions and triggers
//   map-data/<id>.changes.json    what changed between one reading and the next

const fs = require('fs');
const path = require('path');
const Q = require('./queries');
const { shape, prettyDocument, diff, summarize, breathe } = require('./structure');

const SYSTEM_DBS = new Set(['master', 'model', 'msdb', 'tempdb']);
const DAY = 24 * 3600 * 1000;
const BIG_TABLE = 300000;      // rows; above this, counting on a column without an index is only done on request
const localIso = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const clamp = (v, lo, hi, def) => { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : def; };

// Types a text parameter can be converted to, so that a filter can use the column's index.
const CASTABLE = /^(int|bigint|smallint|tinyint|bit|decimal|numeric|money|smallmoney|float|real|date|datetime|datetime2|smalldatetime|time|datetimeoffset|uniqueidentifier|char|varchar|nchar|nvarchar)(\((max|\d+)(,\d+)?\))?$/i;
const DATE_TYPE = /^(date|datetime|datetime2|smalldatetime|time|datetimeoffset)\b/i;

// host: { dir, settings, sets(connId, sql, params, lane), connection(connId), connections(), quoteName(name) }
module.exports = function createMap(host) {
  const DIR = host.dir;
  const REG = path.join(DIR, 'maps.json'), STATUS = path.join(DIR, '_status.json');
  const every = Math.max(1, Number(host.settings.checkEveryMinutes) || 5);
  const auto = host.settings.auto !== false;
  const maps = (readJson(REG, {}).maps || []).filter(m => m && m.id && m.conn && m.database);
  const status = readJson(STATUS, {});
  const cache = new Map();     // id -> { index, code }: parsed on first use, dropped after each reading
  const fileOf = (id, suffix = '') => path.join(DIR, `${id}${suffix}.json`);

  function writeAtomic(file, text) {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file + '.tmp', text, 'utf8');
    fs.renameSync(file + '.tmp', file);
  }
  const saveMaps = () => writeAtomic(REG, JSON.stringify({ maps }, null, 2) + '\n');
  const saveStatus = () => writeAtomic(STATUS, JSON.stringify(status, null, 1));
  const st = id => status[id] || (status[id] = {});
  function find(id) {
    const m = maps.find(x => x.id === id);
    if (!m) throw new Error('This database is not in the map list.');
    return m;
  }

  // Reading structures runs one job at a time.
  let chain = Promise.resolve();
  const enqueue = job => { const p = chain.then(job, job); chain = p.catch(() => {}); return p; };
  async function run(m, sqlText) {
    const sets = await host.sets(m.conn, `USE ${host.quoteName(m.database)};\n${sqlText}`);
    return sets.length ? sets[sets.length - 1].rows : [];
  }

  // ---------------------------------------------------------------- keeping the structure documents current
  async function extract(m, fingerprint) {
    const s = st(m.id);
    s.state = 'extracting';
    const started = Date.now();
    const raw = {};
    for (const [name, sqlText] of Object.entries(Q.ALL)) {
      try { raw[name] = await run(m, sqlText); } catch (e) { raw[name] = { error: e.message }; }
    }
    const conn = host.connection(m.conn) || {};
    const { structure, code } = await shape(raw, { id: m.id, at: localIso(), database: m.database, server: conn.server || '' });
    const prev = readJson(fileOf(m.id), null);

    writeAtomic(fileOf(m.id), await prettyDocument(structure));
    await breathe();
    writeAtomic(fileOf(m.id, '.code'), JSON.stringify({ format: 'db-map-code/1', database: structure.database, extractedAt: structure.extractedAt, objects: code }, null, 1) + '\n');
    await breathe();

    const log = readJson(fileOf(m.id, '.changes'), { format: 'db-map-changes/1', database: structure.database, entries: [] });
    let changed = false;
    if (!prev || !prev.tables) {
      if (!log.entries.length) { log.entries.unshift({ at: structure.extractedAt, first: true, summary: {}, items: [] }); changed = true; }
    } else {
      const items = diff(prev, structure);
      if (items.length) {
        log.entries.unshift({ at: structure.extractedAt, summary: summarize(items), total: items.length, items: items.slice(0, 3000) });
        changed = true;
      }
    }
    log.entries = log.entries.slice(0, 200);
    writeAtomic(fileOf(m.id, '.changes'), JSON.stringify(log, null, 1) + '\n');
    cache.delete(m.id);

    s.extractedAt = structure.extractedAt;
    if (changed || !s.changedAt) s.changedAt = structure.extractedAt;
    s.fingerprint = fingerprint;
    s.counts = structure.counts;
    s.server = structure.server;
    s.tookSeconds = Math.round((Date.now() - started) / 100) / 10;
    s.lastChange = log.entries[0] && !log.entries[0].first ? { at: log.entries[0].at, summary: log.entries[0].summary } : null;
  }

  async function check(m, force) {
    if (!maps.includes(m)) return null;
    const s = st(m.id);
    const conn = host.connection(m.conn);
    if (!conn || !conn.ready) {
      s.state = 'offline';
      s.error = conn ? 'Not connected to this server (its password is not saved). The stored structure is shown.'
        : 'The connection this database was read through was removed. The stored structure is shown.';
      saveStatus();
      return s;
    }
    s.state = s.extractedAt ? 'checking' : 'extracting';
    try {
      const [fp] = await run(m, Q.FINGERPRINT);
      const fingerprint = [fp.n, fp.m, fp.c, fp.f].join('|');
      s.checkedAt = localIso();
      const stale = !s.extractedAt || Date.now() - Date.parse(s.extractedAt) > DAY;    // row counts are refreshed at least daily
      if (force || stale || fingerprint !== s.fingerprint || !fs.existsSync(fileOf(m.id))) await extract(m, fingerprint);
      s.state = 'ok'; s.error = null;
    } catch (e) {
      s.state = 'error'; s.error = e.message; s.checkedAt = localIso();
    }
    saveStatus();
    return s;
  }

  function ensure(connId, database) {
    const conn = host.connection(connId);
    if (!conn) throw new Error('Unknown connection.');
    if (conn.type !== 'mssql') throw new Error('The database map is available for SQL Server connections.');
    if (typeof database !== 'string' || !database.trim()) throw new Error('Database name is required.');
    database = database.trim();
    let m = maps.find(x => x.conn === connId && x.database.toLowerCase() === database.toLowerCase());
    if (m) return m;
    const base = database.replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '') || 'database';
    let id = base, i = 2;
    while (maps.some(x => x.id.toLowerCase() === id.toLowerCase())) id = `${base}-${i++}`;
    m = { id, conn: connId, database, title: database };
    maps.push(m);
    saveMaps();
    enqueue(() => check(m, true));
    return m;
  }

  function pub(m) {
    const s = st(m.id), conn = host.connection(m.conn);
    return {
      id: m.id, title: m.title || m.database, database: m.database,
      server: s.server || (conn && conn.server) || '', connection: conn ? conn.name : null, online: !!(conn && conn.ready),
      state: s.state || 'new', error: s.error || null, extractedAt: s.extractedAt || null, changedAt: s.changedAt || null,
      checkedAt: s.checkedAt || null, counts: s.counts || null, lastChange: s.lastChange || null,
    };
  }

  // ---------------------------------------------------------------- rows (read-only, names checked against the stored structure)
  function entry(id) {
    let c = cache.get(id);
    if (!c) { c = {}; cache.set(id, c); }
    return c;
  }
  function tableOf(id, name) {
    const c = entry(id);
    if (!c.index) {
      const j = readJson(fileOf(id), null);
      if (!j || !j.tables) throw new Error('The structure of this database has not been read yet.');
      c.index = new Map();
      for (const [list, isView] of [[j.tables, false], [j.views || [], true]]) {
        for (const t of list) {
          c.index.set(`${t.schema}.${t.name}`.toLowerCase(), {
            schema: t.schema, name: t.name, isView, rows: t.rows || 0,
            cols: new Map(t.columns.map(col => [col.name.toLowerCase(), col])),
            pk: t.primaryKey ? t.primaryKey.columns : [],
            lead: new Set((t.indexes || []).map(ix => String(ix.columns[0] || '').replace(/ DESC$/, '').toLowerCase())),
          });
        }
      }
    }
    const t = c.index.get(String(name).toLowerCase());
    if (!t) throw new Error(`Unknown table: ${name}`);
    return t;
  }
  const fullName = (m, t) => `${host.quoteName(m.database)}.${host.quoteName(t.schema)}.${host.quoteName(t.name)}`;

  function whereSql(t, where, params, prefix) {
    const parts = [];
    (Array.isArray(where) ? where : []).slice(0, 10).forEach((w, i) => {
      const col = t.cols.get(String(w && w.col).toLowerCase());
      if (!col) throw new Error(`Unknown column: ${w && w.col}`);
      const q = host.quoteName(col.name), p = prefix + i;
      if (w.op === 'null') { parts.push(`${q} IS NULL`); return; }
      const v = w.value == null ? '' : String(w.value);
      if (w.op === 'contains' || w.op === 'starts') {
        params[p] = (w.op === 'contains' ? '%' : '') + v.replace(/[\\%_[]/g, '\\$&') + '%';
        parts.push(`CONVERT(nvarchar(4000), ${q}) LIKE @${p} ESCAPE '\\'`);
      } else {
        params[p] = v;
        parts.push(`${q} = ${CASTABLE.test(col.type) ? `CONVERT(${col.type}, @${p}${DATE_TYPE.test(col.type) ? ', 121' : ''})` : '@' + p}`);
      }
    });
    return parts.length ? ' WHERE ' + parts.join(' AND ') : '';
  }

  const routes = {
    async mapList() {
      return { checkEveryMinutes: every, maps: maps.map(pub) };
    },

    // Called by Object Explorer ("Database Map (3D)"): makes sure the database is mapped and returns its id.
    async mapOpen({ conn, db }) {
      return { id: ensure(conn, db).id };
    },

    async mapSources() {
      return { connections: host.connections().filter(c => c.type === 'mssql') };
    },

    async mapDatabases({ conn }) {
      const c = host.connection(conn);
      if (!c) throw new Error('Unknown connection.');
      const sets = await host.sets(conn, Q.DATABASES, null, 'data');
      const names = (sets[0] ? sets[0].rows : []).map(r => r.name);
      const mapped = new Set(maps.filter(m => m.conn === conn).map(m => m.database.toLowerCase()));
      return { server: c.server, databases: names.map(n => ({ name: n, added: mapped.has(n.toLowerCase()) })) };
    },

    async mapAdd({ conn, databases }) {
      const names = (Array.isArray(databases) ? databases : []).filter(n => typeof n === 'string' && n.trim());
      if (!names.length) throw new Error('Choose at least one database.');
      return { added: names.map(n => ensure(conn, n).id) };
    },

    async mapRemove({ id }) {
      const i = maps.findIndex(x => x.id === id);
      if (i < 0) return { ok: true };
      maps.splice(i, 1);
      saveMaps();
      delete status[id]; saveStatus();
      cache.delete(id);
      for (const suffix of ['', '.code', '.changes']) { try { fs.unlinkSync(fileOf(id, suffix)); } catch { /* not there */ } }
      return { ok: true };
    },

    async mapRefresh({ id }) {
      const m = find(id);
      enqueue(() => check(m, true));
      return { ok: true };
    },

    async mapStructure({ id }) {
      find(id);
      let text;
      try { text = fs.readFileSync(fileOf(id), 'utf8'); } catch { throw new Error('The structure of this database has not been read yet.'); }
      return { rawJson: text };
    },

    async mapChanges({ id }) {
      find(id);
      return readJson(fileOf(id, '.changes'), { entries: [] });
    },

    async mapCode({ id, name }) {
      find(id);
      const c = entry(id);
      if (!c.code) {
        const j = readJson(fileOf(id, '.code'), null);
        c.code = new Map(Object.entries((j && j.objects) || {}).map(([k, v]) => [k.toLowerCase(), v]));
      }
      const text = c.code.get(String(name).toLowerCase());
      return { text: text == null ? null : text };
    },

    // Rows of one table or view, newest first when it has a primary key.
    async mapRows({ id, table, where, top, offset }) {
      const m = find(id), t = tableOf(id, table);
      const n = clamp(top, 1, 500, 60), off = clamp(offset, 0, 100000000, 0);
      const params = {};
      const w = whereSql(t, where, params, 'p');
      const order = t.pk.length ? t.pk.map(c => host.quoteName(c) + ' DESC').join(', ') : '(SELECT NULL)';
      const sqlText = `SELECT * FROM ${fullName(m, t)} WITH (NOLOCK)${w} ORDER BY ${order} OFFSET ${off} ROWS FETCH NEXT ${n + 1} ROWS ONLY`;
      const sets = await host.sets(m.conn, sqlText, Object.keys(params).length ? params : null, 'data');
      const set = sets[0] || { columns: [], cells: [] };
      return { columns: set.columns, rows: set.cells.slice(0, n), more: set.cells.length > n, offset: off };
    },

    // How many rows match, for several tables at once (counts stop at `cap`).
    async mapCounts({ id, items, cap, force }) {
      const m = find(id);
      const limit = clamp(cap, 1, 100000, 1000);
      const params = {}, sqls = [], slots = [];
      (Array.isArray(items) ? items : []).slice(0, 16).forEach((it, i) => {
        const t = tableOf(id, it.table);
        const first = String(((it.where || [])[0] || {}).col || '').toLowerCase();
        // counting in a big table on a column without an index would scan it: only when asked for explicitly
        if (!force && t.rows > BIG_TABLE && !t.lead.has(first)) { slots.push(null); return; }
        const w = whereSql(t, it.where, params, `p${i}_`);
        if (!w) { slots.push(null); return; }
        sqls.push(`SELECT COUNT(*) AS n FROM (SELECT TOP (${limit + 1}) 1 AS x FROM ${fullName(m, t)} WITH (NOLOCK)${w}) q;`);
        slots.push(sqls.length - 1);
      });
      const sets = sqls.length ? await host.sets(m.conn, sqls.join('\n'), params, 'data') : [];
      return { cap: limit, counts: slots.map(i => (i === null ? null : Number(sets[i] && sets[i].rows[0] ? sets[i].rows[0].n : 0))) };
    },
  };

  return {
    routes,
    // A server was connected in the app: map its own database, and catch up on maps that were waiting for a password.
    connected(connId, database) {
      try {
        if (auto && database && !SYSTEM_DBS.has(String(database).toLowerCase())) ensure(connId, database);
        for (const m of maps) if (m.conn === connId && st(m.id).state === 'offline') enqueue(() => check(m, false));
      } catch (e) { console.error('Database map:', e.message); }
    },
    start() {
      const all = () => maps.forEach(m => enqueue(() => check(m, false)));
      setTimeout(all, 3000).unref();
      setInterval(all, every * 60000).unref();
    },
  };
};
