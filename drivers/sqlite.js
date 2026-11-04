'use strict';
// SQLite driver (Node's built-in node:sqlite, no npm package needed).
//
// Object Explorer path scheme (keys appended to the path):
//   []                                   -> databases:   d:<db>            ('main', 'temp', attached names)
//   [d:<db>]                             -> folders:     tables | views | indexes | triggers
//   [d:<db>, tables]                     -> tables:      t:<table>
//   [d:<db>, views]                      -> views:       v:<view>
//   [d:<db>, indexes]                    -> indexes:     x:<index>
//   [d:<db>, triggers]                   -> triggers:    g:<trigger>
//   [d:<db>, tables, t:<table>]          -> folders:     cols | idx | fks | trg       (views: cols | trg)
//   [..., t:<table>, cols]               -> columns:     c:<column>
//   [..., t:<table>, idx]                -> indexes:     x:<index>
//   [..., t:<table>, fks]                -> foreign keys f:<id>
//   [..., t:<table>, trg]                -> triggers:    g:<trigger>

const fs = require('fs');
const nodePath = require('path');
const { grid, splitStatements, quoteIdent, errorItem } = require('./common');

const language = 'sql';
const Q = quoteIdent.sqlite;
const DEFAULT_MAX_ROWS = 1000;
const COUNT_ROWS_BELOW_BYTES = 32 * 1024 * 1024;   // COUNT(*) per table in the tree only for small database files

let sqliteModule = null;

// node:sqlite still prints a one-time ExperimentalWarning; swallow just that one.
function loadSqlite() {
  if (sqliteModule) return sqliteModule;
  const orig = process.emitWarning;
  process.emitWarning = function (warning, ...rest) {
    const msg = typeof warning === 'string' ? warning : warning && warning.message;
    if (/SQLite is an experimental feature/i.test(msg || '')) return;
    return orig.call(process, warning, ...rest);
  };
  try {
    sqliteModule = require('node:sqlite');
  } catch (e) {
    throw new Error('SQLite support needs Node.js 22.5 or newer (node:sqlite): ' + e.message);
  } finally {
    process.emitWarning = orig;
  }
  return sqliteModule;
}

const maxRowsOf = o => {
  const n = Math.floor(Number(o && o.maxRows));
  return n > 0 ? n : DEFAULT_MAX_ROWS;
};

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);
const fixValue = v => (typeof v === 'bigint' ? (v <= MAX_SAFE && v >= -MAX_SAFE ? Number(v) : v.toString()) : v);

const all = (db, sql, ...params) => db.prepare(sql).all(...params);
const get = (db, sql, ...params) => db.prepare(sql).get(...params);

function pathKey(key) {
  const i = key.indexOf(':');
  return i > 0 ? { prefix: key.slice(0, i), name: key.slice(i + 1) } : { folder: key };
}

// Finds the database / table / view a node path points into.
function parsePath(p) {
  const ctx = { db: 'main', table: null, tableType: null, last: null };
  for (const key of p) {
    const k = pathKey(key);
    if (k.prefix === 'd') { ctx.db = k.name; ctx.table = null; ctx.tableType = null; }
    else if (k.prefix === 't' || k.prefix === 'v') { ctx.table = k.name; ctx.tableType = k.prefix === 't' ? 'table' : 'view'; }
    ctx.last = k;
  }
  return ctx;
}

const qualified = (db, name) => (db === 'main' ? Q(name) : `${Q(db)}.${Q(name)}`);
const isSystemName = n => /^sqlite_/i.test(n);

// ---- connection

async function connect(spec) {
  const { DatabaseSync } = loadSqlite();
  let file = String(spec.file || '').trim().replace(/^"(.*)"$/, '$1');
  if (!file) throw new Error('Database file is required.');
  const full = nodePath.resolve(file);
  // Windows treats names like AUX.db, NUL.txt or COM1 as legacy devices: opening them blocks forever.
  if (process.platform === 'win32' && /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(nodePath.basename(full).split('.')[0].trim())) {
    throw new Error(`"${nodePath.basename(full)}" is a reserved device name on Windows. Choose a different file name.`);
  }
  let exists = false;
  try {
    const st = fs.statSync(full);
    if (st.isDirectory()) throw new Error(`"${full}" is a folder, not a database file.`);
    if (!st.isFile()) throw new Error(`"${full}" is not a regular file.`);
    exists = true;
  } catch (e) {
    if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') throw e;
  }
  if (!exists) {
    if (!spec.create) throw new Error(`File not found: ${full} — tick 'Create the file if it does not exist' to create a new database`);
    if (spec.readOnly) throw new Error(`File not found: ${full} — a read-only connection cannot create it`);
    if (!fs.existsSync(nodePath.dirname(full))) throw new Error(`Folder not found: ${nodePath.dirname(full)}`);
  }
  let db;
  try {
    db = new DatabaseSync(full, { readOnly: !!spec.readOnly });
    db.exec('PRAGMA busy_timeout = 5000');
    get(db, 'SELECT count(*) AS n FROM sqlite_master');     // fails here for files that are not SQLite databases
  } catch (e) {
    try { if (db) db.close(); } catch { /* ignore */ }
    throw new Error(/not a database/i.test(e.message) ? `"${full}" is not a SQLite database file.` : e.message);
  }
  const version = get(db, 'SELECT sqlite_version() AS v').v;
  return {
    db,
    file: full,
    readOnly: !!spec.readOnly,
    sessions: new Set(),
    info: { version, user: '', database: 'main', server: full },
  };
}

async function close(conn) {
  for (const s of [...conn.sessions]) s.close();
  try { conn.db.close(); } catch { /* already closed */ }
}

async function databases(conn) {
  return all(conn.db, 'SELECT name FROM pragma_database_list ORDER BY seq').map(r => r.name);
}

// ---- Object Explorer

const folder = (key, label, kind) => ({ key, label, icon: 'folder', expandable: true, kind });

const selectAction = (db, name) => ({ label: 'Select Top 1000 Rows', sql: `SELECT * FROM ${qualified(db, name)} LIMIT 1000`, run: true, db });
const scriptAction = () => ({ label: 'Script as CREATE', script: 'create' });

function dbSize(conn, db) {
  try {
    const pages = Object.values(get(conn.db, `PRAGMA ${Q(db)}.page_count`) || {})[0];
    const size = Object.values(get(conn.db, `PRAGMA ${Q(db)}.page_size`) || {})[0];
    return pages * size;
  } catch {
    return null;
  }
}

function dbNodes(conn) {
  return all(conn.db, 'SELECT name FROM pragma_database_list ORDER BY seq').map(({ name }) => {
    const bytes = dbSize(conn, name);
    let encoding = '';
    try { encoding = Object.values(get(conn.db, `PRAGMA ${Q(name)}.encoding`) || {})[0] || ''; } catch { /* ignore */ }
    return {
      key: `d:${name}`, label: name, icon: 'db', expandable: true,
      sub: name === 'main' ? `(${nodePath.basename(conn.shownAs || conn.file)})` : '',
      kind: 'generic', drag: Q(name),
      row: { name, size_mb: bytes == null ? null : Math.round(bytes / 1048576 * 100) / 100, owner: '', encoding },
    };
  });
}

function tableNodes(conn, db, type) {
  const rows = all(conn.db, `SELECT name, sql FROM ${Q(db)}.sqlite_master WHERE type = ? ORDER BY name COLLATE NOCASE`, type)
    .filter(r => !isSystemName(r.name));
  const bytes = type === 'table' ? dbSize(conn, db) : null;
  const countRows = bytes != null && bytes <= COUNT_ROWS_BELOW_BYTES;
  return rows.map(r => {
    let rowCount = null;
    if (countRows) {
      try { rowCount = Number(get(conn.db, `SELECT count(*) AS n FROM ${Q(db)}.${Q(r.name)}`).n); } catch { /* virtual table, missing module ... */ }
    }
    const isTable = type === 'table';
    const virtual = isTable && /^\s*CREATE\s+VIRTUAL\s+TABLE/i.test(r.sql || '');
    return {
      key: `${isTable ? 't' : 'v'}:${r.name}`, label: r.name, icon: isTable ? 'table' : 'view', expandable: true,
      sub: virtual ? '(virtual)' : '', count: rowCount, kind: 'generic', drag: qualified(db, r.name),
      row: isTable
        ? { name: r.name, sch: db, created: '', row_count: rowCount, data_kb: null, index_kb: null, modified: '', owner: '' }
        : { name: r.name, sch: db, created: '', modified: '', type_desc: 'VIEW' },
      actions: [selectAction(db, r.name), scriptAction()],
    };
  });
}

function indexKeys(conn, db, index) {
  try {
    return all(conn.db, 'SELECT name, "desc" AS d FROM pragma_index_xinfo(?, ?) WHERE key = 1 ORDER BY seqno', index, db)
      .map(c => `${c.name == null ? '<expression>' : c.name}${c.d ? ' DESC' : ''}`).join(', ');
  } catch {
    return '';
  }
}

function indexNode(conn, db, name, table, kindLabel, unique, partial) {
  const keys = indexKeys(conn, db, name);
  const bits = [unique ? 'unique' : '', partial ? 'partial' : '', table ? `on ${table}` : ''].filter(Boolean);
  return {
    key: `x:${name}`, label: name, icon: unique ? 'key' : 'index', expandable: false,
    sub: bits.length ? `(${bits.join(', ')})` : '', kind: 'generic', drag: Q(name),
    row: { name, kind: kindLabel, unique: !!unique, keys, include: '' },
    actions: [scriptAction()],
  };
}

function triggerNode(name, table) {
  return {
    key: `g:${name}`, label: name, icon: 'trigger', expandable: false, sub: table ? `(on ${table})` : '', kind: 'generic',
    row: { name, disabled: false }, actions: [scriptAction()],
  };
}

function columnNodes(conn, db, table) {
  const cols = all(conn.db, 'SELECT * FROM pragma_table_xinfo(?, ?)', table, db).filter(c => c.hidden !== 1);
  const fkCols = new Set(all(conn.db, 'SELECT "from" AS c FROM pragma_foreign_key_list(?, ?)', table, db).map(r => r.c));
  const master = get(conn.db, `SELECT sql FROM ${Q(db)}.sqlite_master WHERE name = ?`, table);
  const withoutRowid = /\bWITHOUT\s+ROWID\b/i.test((master && master.sql) || '');
  const pkCount = cols.filter(c => c.pk > 0).length;
  return cols.map(c => {
    const pk = c.pk > 0, fk = fkCols.has(c.name);
    const identity = pk && pkCount === 1 && !withoutRowid && /^INTEGER$/i.test(c.type || '');
    const type = c.type || '';
    const bits = [pk ? 'PK' : '', fk ? 'FK' : '', type, c.notnull ? 'not null' : 'null'].filter(Boolean);
    return {
      key: `c:${c.name}`, label: c.name, icon: pk ? 'key' : fk ? 'fkey' : 'col', expandable: false,
      sub: `(${bits.join(', ')})`, kind: 'generic', drag: Q(c.name),
      row: { name: c.name, data_type: type, nullable: !c.notnull, pk, fk, identity, computed: c.hidden >= 2, default: c.dflt_value },
    };
  });
}

function foreignKeyNodes(conn, db, table) {
  const groups = new Map();
  for (const r of all(conn.db, 'SELECT * FROM pragma_foreign_key_list(?, ?) ORDER BY id, seq', table, db)) {
    if (!groups.has(r.id)) groups.set(r.id, { table: r.table, from: [], to: [], onDelete: r.on_delete, onUpdate: r.on_update });
    const g = groups.get(r.id);
    g.from.push(r.from);
    g.to.push(r.to);
  }
  return [...groups.entries()].map(([id, g]) => {
    const cols = g.from.join(', ');
    const ref = `${g.table} (${g.to.every(x => x == null) ? 'primary key' : g.to.join(', ')})`;
    const label = `${cols} → ${g.table}`;
    const actionsText = [g.onDelete && g.onDelete !== 'NO ACTION' ? `ON DELETE ${g.onDelete}` : '', g.onUpdate && g.onUpdate !== 'NO ACTION' ? `ON UPDATE ${g.onUpdate}` : ''].filter(Boolean).join(' ');
    return {
      key: `f:${id}`, label, icon: 'fkey', expandable: false, sub: actionsText ? `(${actionsText})` : '', kind: 'generic',
      row: { name: label, kind: 'Foreign Key', cols, ref },
    };
  });
}

async function tree(conn, p) {
  if (!p.length) return dbNodes(conn);
  const ctx = parsePath(p);
  const last = ctx.last;
  const db = ctx.db;
  if (last.prefix === 'd') {
    return [folder('tables', 'Tables', 'tables'), folder('views', 'Views', 'objects'), folder('indexes', 'Indexes', 'indexes'), folder('triggers', 'Triggers', 'triggers')];
  }
  if (last.prefix === 't') return [folder('cols', 'Columns', 'columns'), folder('idx', 'Indexes', 'indexes'), folder('fks', 'Foreign Keys', 'keys'), folder('trg', 'Triggers', 'triggers')];
  if (last.prefix === 'v') return [folder('cols', 'Columns', 'columns'), folder('trg', 'Triggers', 'triggers')];
  if (last.prefix) return [];

  switch (last.folder) {
    case 'tables': return tableNodes(conn, db, 'table');
    case 'views': return tableNodes(conn, db, 'view');
    case 'indexes':
      return all(conn.db, `SELECT name, tbl_name, sql FROM ${Q(db)}.sqlite_master WHERE type = 'index' AND sql IS NOT NULL ORDER BY name COLLATE NOCASE`)
        .map(r => indexNode(conn, db, r.name, r.tbl_name, 'Index', /^\s*CREATE\s+UNIQUE\b/i.test(r.sql), /\bWHERE\b/i.test(r.sql)));
    case 'triggers':
      return all(conn.db, `SELECT name, tbl_name FROM ${Q(db)}.sqlite_master WHERE type = 'trigger' ORDER BY name COLLATE NOCASE`)
        .map(r => triggerNode(r.name, r.tbl_name));
    case 'cols': return ctx.table ? columnNodes(conn, db, ctx.table) : [];
    case 'idx':
      if (!ctx.table) return [];
      return all(conn.db, 'SELECT * FROM pragma_index_list(?, ?) ORDER BY seq', ctx.table, db).map(r => {
        const kindLabel = r.origin === 'pk' ? 'Primary Key' : r.origin === 'u' ? 'Unique Constraint' : 'Index';
        return indexNode(conn, db, r.name, null, kindLabel, !!r.unique, !!r.partial);
      });
    case 'fks': return ctx.table ? foreignKeyNodes(conn, db, ctx.table) : [];
    case 'trg':
      if (!ctx.table) return [];
      return all(conn.db, `SELECT name FROM ${Q(db)}.sqlite_master WHERE type = 'trigger' AND tbl_name = ? ORDER BY name COLLATE NOCASE`, ctx.table)
        .map(r => triggerNode(r.name, null));
    default: return [];
  }
}

async function objects(conn, db) {
  const schema = db || 'main';
  return all(conn.db, `SELECT name, type FROM ${Q(schema)}.sqlite_master WHERE type IN ('table', 'view') ORDER BY name COLLATE NOCASE`)
    .filter(r => !isSystemName(r.name))
    .map(r => ({ schema, name: r.name, type: r.type }));
}

async function columns(conn, db, schema, name) {
  return all(conn.db, 'SELECT name, type FROM pragma_table_xinfo(?, ?) WHERE hidden <> 1 ORDER BY cid', name, schema || db || 'main')
    .map(c => ({ name: c.name, type: c.type || '' }));
}

const SCRIPT_TYPES = { t: 'table', v: 'view', x: 'index', g: 'trigger' };

async function script(conn, p, kind) {
  if (kind !== 'create') throw new Error(`Unsupported script kind: ${kind}`);
  const ctx = parsePath(p);
  const last = ctx.last;
  const type = last && SCRIPT_TYPES[last.prefix];
  if (!type) throw new Error('Select a table, view, index or trigger to script.');
  const row = get(conn.db, `SELECT sql FROM ${Q(ctx.db)}.sqlite_master WHERE type = ? AND name = ?`, type, last.name);
  if (!row) throw new Error(`The ${type} ${Q(last.name)} no longer exists.`);
  if (!row.sql) return `-- ${last.name} is created automatically by SQLite (it has no CREATE statement).\n`;
  return row.sql.trim().replace(/;?$/, ';') + '\n';
}

// ---- query sessions

function tokenOffset(err, stmt) {
  // sqlite does not report an error position through node:sqlite; use the offending token of syntax errors when it is unambiguous.
  const m = /near "([^"]+)": syntax error/.exec((err && err.message) || '');
  if (!m) return undefined;
  const first = stmt.sql.indexOf(m[1]);
  return first >= 0 && stmt.sql.indexOf(m[1], first + 1) < 0 ? first : undefined;
}

const DML = /^(INSERT|UPDATE|DELETE|REPLACE)\b/i;
const isDml = sql => DML.test(sql) || (/^WITH\b/i.test(sql) && /\)\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(sql));

function runStatement(db, stmt, max, mode, items) {
  const sql = mode === 'explain' && !/^EXPLAIN\b/i.test(stmt.sql) ? 'EXPLAIN QUERY PLAN ' + stmt.sql : stmt.sql;
  const st = db.prepare(sql);
  const cols = st.columns();
  if (cols.length === 0) {
    const r = st.run();
    if (mode === 'explain') items.push({ type: 'msg', text: 'This statement has no query plan.' });
    else if (isDml(stmt.sql)) items.push({ type: 'msg', text: `(${r.changes} row${Number(r.changes) === 1 ? '' : 's'} affected)` });
    else items.push({ type: 'msg', text: 'Commands completed successfully.' });
    return;
  }
  const g = grid(cols.map(c => ({ name: c.name, type: c.type || '' })), max);
  let byName = false;
  st.setReadBigInts(true);
  if (typeof st.setReturnArrays === 'function') st.setReturnArrays(true);
  else byName = true;
  let n = 0, more = false;
  for (const row of st.iterate()) {
    if (n >= max) { more = true; break; }
    g.add((byName ? cols.map(c => row[c.name]) : row).map(fixValue));
    n++;
  }
  items.push(g.item);
  if (more) items.push({ type: 'msg', text: `(showing the first ${n} rows; more rows are available)` });
}

// ATTACH / DETACH only affect the connection that ran them. Mirror them onto the metadata connection
// so attached databases show up in the Object Explorer and the database list.
function syncAttached(target, source) {
  try {
    const user = d => d.name !== 'main' && d.name !== 'temp';
    const want = new Map(all(source, 'SELECT name, file FROM pragma_database_list').filter(user).map(d => [d.name, d.file]));
    const have = new Set(all(target, 'SELECT name, file FROM pragma_database_list').filter(user).map(d => d.name));
    for (const [name, file] of want) {
      if (!have.has(name) && file) target.exec(`ATTACH DATABASE '${file.replace(/'/g, "''")}' AS ${Q(name)}`);
    }
    for (const name of have) if (!want.has(name)) target.exec(`DETACH DATABASE ${Q(name)}`);
  } catch { /* best effort: the query itself already succeeded */ }
}

async function openSession(conn) {
  const { DatabaseSync } = loadSqlite();
  const db = new DatabaseSync(conn.file, { readOnly: conn.readOnly });
  db.exec('PRAGMA busy_timeout = 5000');
  let closed = false;
  const session = {
    async run(text, opts = {}) {
      if (closed) throw new Error('The session is closed.');
      const max = maxRowsOf(opts);
      const items = [];
      let errors = 0, attachTouched = false;
      for (const stmt of splitStatements(String(text || ''), 'sqlite')) {
        try {
          runStatement(db, stmt, max, opts.mode, items);
          if (opts.mode !== 'explain' && /^(ATTACH|DETACH)\b/i.test(stmt.sql)) attachTouched = true;
        } catch (e) {
          items.push(errorItem(e, stmt, text, tokenOffset(e, stmt)));
          errors++;
          break;
        }
      }
      if (attachTouched) syncAttached(conn.db, db);
      return { items, errors, database: opts.database || 'main' };
    },
    async cancel() { return false; },          // node:sqlite runs synchronously and has no interrupt
    async close() {
      if (closed) return;
      closed = true;
      conn.sessions.delete(session);
      try { db.close(); } catch { /* ignore */ }
    },
  };
  conn.sessions.add(session);
  return session;
}

module.exports = { language, connect, close, databases, tree, objects, columns, script, openSession, _internal: { parsePath, isDml, tokenOffset, loadSqlite } };
