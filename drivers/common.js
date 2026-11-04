'use strict';
// Shared helpers for the non-SQL-Server drivers.
//
// Driver interface (every drivers/<type>.js exports these):
//
//   async connect(spec)                 -> conn   (driver-private object; must set conn.info =
//                                                  { version, user, database, server })
//   async close(conn)
//   async databases(conn)               -> string[]  (databases / schemas / keyspaces for the DB dropdown)
//   async tree(conn, path)              -> Node[]    (Object Explorer children; path = [] is the root)
//   async objects(conn, db)             -> [{ schema, name, type: 'table' | 'view' }]   (IntelliSense)
//   async columns(conn, db, schema, name) -> [{ name, type }]
//   async script(conn, path, kind)      -> string    (e.g. kind 'create' for "Script as CREATE")
//   async openSession(conn)             -> session   (one per query tab; keeps its own current database)
//        session.run(text, { database, maxRows, mode }) -> { items, errors, database }
//            mode 'explain' = show the execution plan of each statement instead of running it
//            (EXPLAIN / EXPLAIN QUERY PLAN / EXPLAIN PLAN FOR + DBMS_XPLAN / cursor.explain()),
//            or return an 'err' item when the database has no plan support.
//            Stops at the first error. Never loads more than maxRows rows per result into memory
//            when the driver can stream or page.
//        session.cancel(), session.close()
//   language                            -> 'sql' | 'js' | 'redis'
//
// Tree node: { key, label, icon, expandable, sub, count, kind, row, drag, dim, actions }
//   key     appended to the path to address the node's children
//   icon    one of the client icon names (folder, db, table, view, proc, func, col, key, fkey, index,
//           trigger, schema, seq, syn, user, type, param, check, server, job)
//   kind    Object Explorer Details layout for the node's children (generic, gdatabases, tables, objects,
//           columns, indexes, keys, constraints, triggers, params, users, schemas, collections, rediskeys)
//   row     values shown in Object Explorer Details ({ name, ... })
//   actions [{ label, sql, run, db }]  -> opens a query tab with `sql` (runs it when `run`)
//           [{ label, script: 'create' }] -> client calls script(conn, nodePath, 'create')
//
// Result items (same shapes the SQL Server path produces):
//   { type: 'grid', columns: [{ name, type }], rows: [[cell, ...]], total }
//   { type: 'msg', text }
//   { type: 'err', message, line }   (line: 1-based line in the submitted text, optional)

const MAX_TEXT = 65535;
const MAX_BINARY = 1024;

const pad = (n, w = 2) => String(n).padStart(w, '0');

function formatDate(d) {
  if (isNaN(d)) return String(d);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
}

function clip(s) {
  return s.length > MAX_TEXT ? s.slice(0, MAX_TEXT) + '…' : s;
}

// Converts any driver value into a JSON-friendly grid cell (null, number or string).
function cell(v) {
  if (v === null || v === undefined) return null;
  switch (typeof v) {
    case 'string': return clip(v);
    case 'number': return Number.isFinite(v) ? v : String(v);
    case 'bigint': return v.toString();
    case 'boolean': return v ? 'true' : 'false';
    case 'function': return '[function]';
    default: break;
  }
  if (v instanceof Date) return formatDate(v);
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) {
    const b = Buffer.from(v);
    return '0x' + b.subarray(0, MAX_BINARY).toString('hex').toUpperCase() + (b.length > MAX_BINARY ? '…' : '');
  }
  if (typeof v.toHexString === 'function') return v.toHexString();            // MongoDB ObjectId
  if (Array.isArray(v) || v.constructor === Object || v instanceof Map || v instanceof Set) return clip(toJson(v));
  const s = String(v);                                                         // Long, Decimal, Uuid, InetAddress...
  return clip(s === '[object Object]' ? toJson(v) : s);
}

function toJson(v) {
  try {
    return JSON.stringify(v, (k, x) => {
      if (typeof x === 'bigint') return x.toString();
      if (x instanceof Map) return Object.fromEntries(x);
      if (x instanceof Set) return [...x];
      if (x && typeof x === 'object' && x.type === 'Buffer' && Array.isArray(x.data)) return '0x' + Buffer.from(x.data).toString('hex');
      if (x && typeof x === 'object' && typeof x.toHexString === 'function') return x.toHexString();
      return x;
    });
  } catch {
    return String(v);
  }
}

// Builds a grid item, keeping at most maxRows rows but counting all of them.
function grid(columns, maxRows) {
  const g = { type: 'grid', columns: columns.map(c => (typeof c === 'string' ? { name: c, type: '' } : { name: c.name, type: c.type || '' })), rows: [], total: 0 };
  return {
    item: g,
    add(row) {
      g.total++;
      if (g.rows.length < maxRows) g.rows.push(row.map(cell));
    },
    get full() { return g.rows.length >= maxRows; },
  };
}

const lineAt = (text, offset) => {
  let n = 1;
  for (let i = text.indexOf('\n'); i !== -1 && i < offset; i = text.indexOf('\n', i + 1)) n++;
  return n;
};

// Splits a script into statements: [{ sql, line }] (line = 1-based line of the first character).
// dialect: 'mysql' | 'postgres' | 'sqlite' | 'oracle' | 'cql'
//   mysql:    `backtick` identifiers, # comments, backslash escapes, DELIMITER lines
//   postgres: $tag$ dollar quoting
//   sqlite:   CREATE TRIGGER ... BEGIN ... END; kept together
//   oracle:   PL/SQL blocks (DECLARE/BEGIN/CREATE PROCEDURE...) end at a line containing only "/";
//             plain SQL statements lose their trailing ";"
//   cql:      BEGIN BATCH ... APPLY BATCH; kept together
function splitStatements(text, dialect) {
  const out = [];
  const n = text.length;
  let delim = ';';
  let i = 0;
  let start = -1;          // start offset of the current statement (first non-space char)
  let mode = null;         // 'plsql' | 'trigger' | 'batch' while inside a block

  const push = (end, stripDelim) => {
    if (start < 0) return;
    let sql = text.slice(start, end).trim();
    if (stripDelim && sql.endsWith(delim)) sql = sql.slice(0, -delim.length).trim();
    if (sql && !/^[;\s]*$/.test(stripComments(sql, dialect))) out.push({ sql, line: lineAt(text, start) });
    start = -1;
    mode = null;
  };

  const atLineStart = p => p === 0 || text[p - 1] === '\n';

  while (i < n) {
    const ch = text[i], nx = text[i + 1];

    // Line-level directives
    if (atLineStart(i)) {
      const lineEnd = text.indexOf('\n', i) < 0 ? n : text.indexOf('\n', i);
      const lineText = text.slice(i, lineEnd);
      if (dialect === 'mysql' && start < 0) {
        const m = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(lineText);
        if (m) { delim = m[1]; i = lineEnd + 1; continue; }
      }
      if (dialect === 'oracle' && /^\s*\/\s*$/.test(lineText)) {
        push(i, false);
        i = lineEnd + 1;
        continue;
      }
    }

    if (/\s/.test(ch)) { i++; continue; }

    // Comments (outside a statement they are skipped, so a statement starts at its first real token)
    if (ch === '-' && nx === '-') { const e = text.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (ch === '#' && dialect === 'mysql') { const e = text.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (ch === '/' && nx === '/' && dialect === 'cql') { const e = text.indexOf('\n', i); i = e < 0 ? n : e; continue; }
    if (ch === '/' && nx === '*') { const e = text.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (start < 0 && text.startsWith(delim, i)) { i += delim.length; continue; }

    if (start < 0) {
      start = i;
      const head = text.slice(i, i + 80).toUpperCase().replace(/\s+/g, ' ');
      if (dialect === 'oracle' && /^(DECLARE|BEGIN|CREATE (OR REPLACE )?(EDITIONABLE |NONEDITIONABLE )?(PROCEDURE|FUNCTION|PACKAGE|TRIGGER|TYPE))\b/.test(head)) mode = 'plsql';
      else if (dialect === 'sqlite' && /^CREATE (TEMP |TEMPORARY )?TRIGGER\b/.test(head)) mode = 'trigger';
      else if (dialect === 'cql' && /^BEGIN (UNLOGGED |COUNTER )?BATCH\b/.test(head)) mode = 'batch';
    }

    // Quoted text
    if (ch === "'" || ch === '"' || (ch === '`' && dialect === 'mysql')) {
      let j = i + 1;
      while (j < n) {
        if (dialect === 'mysql' && text[j] === '\\') { j += 2; continue; }
        if (text[j] === ch) { if (text[j + 1] === ch) { j += 2; continue; } break; }
        j++;
      }
      i = j + 1;
      continue;
    }
    if (ch === '$' && dialect === 'postgres') {
      const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i, i + 64));
      if (m) {
        const e = text.indexOf(m[0], i + m[0].length);
        i = e < 0 ? n : e + m[0].length;
        continue;
      }
    }

    // Statement terminators
    if (mode !== 'plsql' && text.startsWith(delim, i)) {
      const before = text.slice(start, i).toUpperCase();
      if (mode === 'trigger' && !/\bEND\s*$/.test(before)) { i += delim.length; continue; }
      if (mode === 'batch' && !/\bAPPLY\s+BATCH\s*$/.test(before)) { i += delim.length; continue; }
      i += delim.length;
      push(i, dialect === 'oracle' || delim !== ';' || dialect === 'mysql');
      continue;
    }
    i++;
  }
  push(n, dialect === 'oracle' && mode !== 'plsql');
  if (dialect === 'oracle') for (const s of out) if (!/^(DECLARE|BEGIN|CREATE|END)\b/i.test(s.sql) && s.sql.endsWith(';')) s.sql = s.sql.slice(0, -1).trim();
  return out;
}

function stripComments(sql, dialect) {
  const line = dialect === 'mysql' ? /(--|#)[^\n]*/g : dialect === 'cql' ? /(--|\/\/)[^\n]*/g : /--[^\n]*/g;
  return sql.replace(/\/\*[\s\S]*?\*\//g, '').replace(line, '');
}

// Quote an identifier for a dialect.
const quoteIdent = {
  mysql: s => '`' + String(s).replace(/`/g, '``') + '`',
  postgres: s => '"' + String(s).replace(/"/g, '""') + '"',
  sqlite: s => '"' + String(s).replace(/"/g, '""') + '"',
  oracle: s => '"' + String(s).replace(/"/g, '""') + '"',
  cql: s => '"' + String(s).replace(/"/g, '""') + '"',
};

// Error item helper: maps a character offset inside a statement to a script line.
function errorItem(err, stmt, text, offsetInStmt) {
  let line = stmt ? stmt.line : null;
  if (stmt && Number.isInteger(offsetInStmt) && offsetInStmt >= 0) line = stmt.line + lineAt(stmt.sql, offsetInStmt) - 1;
  return { type: 'err', message: err && err.message ? err.message : String(err), line };
}

// Loads an optional npm driver with a friendly error when it is missing.
function requireDriver(name) {
  try {
    return require(name);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') throw new Error(`The "${name}" package is not installed. Run:  npm install ${name}`);
    throw e;
  }
}

module.exports = { cell, toJson, grid, splitStatements, quoteIdent, errorItem, lineAt, requireDriver, formatDate, MAX_TEXT };
