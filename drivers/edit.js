'use strict';
// Table metadata and row editing ("Edit Top 200 Rows") for driver-based SQL
// databases: SQLite, MySQL / MariaDB, PostgreSQL and Oracle. Everything runs
// through an ordinary driver session, so it works with any of those drivers.

const { quoteIdent, MAX_TEXT } = require('./common');

const DIALECT = { sqlite: 'sqlite', mysql: 'mysql', mariadb: 'mysql', postgres: 'postgres', oracle: 'oracle' };
const dialectOf = type => DIALECT[type] || null;

// Table name as used in statements. t = { db, schema, name }.
function qualified(d, t) {
  const q = quoteIdent[d];
  if (d === 'sqlite') return `${q(t.db || 'main')}.${q(t.name)}`;
  if (d === 'mysql') return `${q(t.db)}.${q(t.name)}`;
  return `${q(t.schema)}.${q(t.name)}`;
}

// The session "database" for a table: PostgreSQL connects per database, Oracle uses the schema.
const sessionDb = (d, t) => (d === 'oracle' ? t.schema : t.db);

// SQL literal for a value typed in the grid (text as shown), letting the database convert it.
function lit(d, v, type = '') {
  if (v === null || v === undefined) return 'NULL';
  let s = String(v);
  if (d === 'mysql') s = s.replace(/\\/g, '\\\\');
  s = "'" + s.replace(/'/g, "''") + "'";
  if (d === 'oracle') {
    if (/^DATE/i.test(type)) return `TO_DATE(${s}, 'YYYY-MM-DD HH24:MI:SS')`;
    if (/^TIMESTAMP/i.test(type)) return `TO_TIMESTAMP(${s}, 'YYYY-MM-DD HH24:MI:SS.FF')`;
  }
  return s;
}

async function run(sess, sql, database, maxRows = 100000) {
  const r = await sess.run(sql, { database, maxRows });
  const err = r.items.find(i => i.type === 'err');
  if (err) throw new Error(err.message);
  return r.items;
}

const gridsOf = items => items.filter(i => i.type === 'grid');
const objects = g => (g ? g.rows.map(r => Object.fromEntries(g.columns.map((c, i) => [c.name.toLowerCase(), r[i]]))) : []);
const truthy = v => v === true || v === 1 || v === '1' || /^(true|t|yes|y)$/i.test(String(v));

function mysqlDefault(r, mariadb) {
  if (r.dflt === null || r.dflt === undefined) return '';
  const v = String(r.dflt);
  if (mariadb) return v === 'NULL' ? '' : v;   // MariaDB already returns SQL expressions
  if (/DEFAULT_GENERATED/i.test(r.extra || '') || /^(CURRENT_TIMESTAMP|NOW\(\)|NULL)/i.test(v) || /^\(.*\)$/.test(v)) return v;
  if (/int|decimal|numeric|float|double|real|bit|bool|year/i.test(r.data_type || '')) return v;
  return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "''") + "'";
}

// SQLite needs expression defaults in parentheses: DEFAULT (datetime('now')).
function sqliteDefault(v) {
  const s = String(v || '').trim();
  if (!s || s.startsWith('(') || /^(-?\d+(\.\d+)?|'(?:[^']|'')*'|NULL|TRUE|FALSE|CURRENT_(TIME|DATE|TIMESTAMP)|X'[0-9A-F]*')$/i.test(s)) return s;
  return `(${s})`;
}

function oracleType(r) {
  const t = String(r.data_type);
  if (/^(VARCHAR2|CHAR)$/.test(t)) return `${t}(${r.char_length || r.data_length}${r.char_used === 'C' ? ' CHAR' : ''})`;
  if (/^(NVARCHAR2|NCHAR)$/.test(t)) return `${t}(${r.char_length || r.data_length})`;
  if (t === 'NUMBER') {
    if (r.data_precision != null && r.data_precision !== '') return `NUMBER(${r.data_precision}${Number(r.data_scale) ? ',' + r.data_scale : ''})`;
    return String(r.data_scale) === '0' ? 'INTEGER' : 'NUMBER';
  }
  if (t === 'RAW') return `RAW(${r.data_length})`;
  if (t === 'FLOAT' && r.data_precision) return `FLOAT(${r.data_precision})`;
  return t;
}

// ---- SQLite CREATE TABLE parsing (column constraints and table constraints the PRAGMAs don't report)

function splitTop(s) {
  const out = [];
  let depth = 0, cur = '', quote = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quote) {
      cur += ch;
      if (ch === quote) { if (quote !== ']' && s[i + 1] === quote) cur += s[++i]; else quote = null; }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') quote = ch;
    else if (ch === '[') quote = ']';
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function sqlTokens(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '(') {
      let depth = 0, j = i;
      for (; j < s.length; j++) {
        if (s[j] === "'") { j = s.indexOf("'", j + 1); if (j < 0) j = s.length; continue; }
        if (s[j] === '(') depth++;
        else if (s[j] === ')' && --depth === 0) break;
      }
      out.push(s.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if ("'\"`[".includes(ch)) {
      const close = ch === '[' ? ']' : ch;
      let j = i + 1;
      while (j < s.length) { if (s[j] === close) { if (close !== ']' && s[j + 1] === close) { j += 2; continue; } break; } j++; }
      out.push(s.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    let j = i;
    while (j < s.length && !/[\s(]/.test(s[j])) j++;
    out.push(s.slice(i, j));
    i = j;
  }
  return out;
}

const unquote = s => (/^["`[]/.test(s) ? s.slice(1, -1).replace(/""/g, '"') : s);
const STOP = /^(CONSTRAINT|PRIMARY|UNIQUE|CHECK|DEFAULT|COLLATE|REFERENCES|GENERATED|AS)$/i;

function parseSqliteColumn(def) {
  const tk = sqlTokens(def);
  const r = { name: unquote(tk[0] || ''), unique: false, check: '', collation: '', extra: [], generated: false };
  const isStop = j => STOP.test(tk[j] || '') || (/^NOT$/i.test(tk[j] || '') && /^NULL$/i.test(tk[j + 1] || '')) || /^NULL$/i.test(tk[j] || '');
  const skipConflict = j => (/^ON$/i.test(tk[j] || '') && /^CONFLICT$/i.test(tk[j + 1] || '') ? j + 3 : j);
  let i = 1;
  while (i < tk.length && !isStop(i)) i++;
  let named = '';
  while (i < tk.length) {
    const w = tk[i].toUpperCase();
    if (w === 'CONSTRAINT') { named = tk[i + 1] || ''; i += 2; continue; }
    if (w === 'PRIMARY') { i += 2; while (i < tk.length && /^(ASC|DESC|AUTOINCREMENT)$/i.test(tk[i])) i++; i = skipConflict(i); named = ''; continue; }
    if (w === 'NOT' && /^NULL$/i.test(tk[i + 1] || '')) { i = skipConflict(i + 2); named = ''; continue; }
    if (w === 'NULL') { i = skipConflict(i + 1); continue; }
    if (w === 'UNIQUE') { r.unique = true; i = skipConflict(i + 1); named = ''; continue; }
    if (w === 'CHECK') { r.check = (tk[i + 1] || '()').slice(1, -1).trim(); r.checkName = named ? unquote(named) : ''; i += 2; named = ''; continue; }
    if (w === 'DEFAULT') { i += 2; named = ''; continue; }
    if (w === 'COLLATE') { r.collation = tk[i + 1] || ''; i += 2; named = ''; continue; }
    if (w === 'GENERATED' || w === 'AS') { r.generated = true; break; }
    if (w === 'REFERENCES') {
      const parts = [(named ? `CONSTRAINT ${named} ` : '') + 'REFERENCES'];
      let j = i + 1;
      while (j < tk.length && !isStop(j)) parts.push(tk[j++]);
      r.extra.push(parts.join(' '));
      i = j;
      named = '';
      continue;
    }
    i++;
  }
  return r;
}

function parseSqliteCreate(sql) {
  const body = String(sql || '').replace(/--[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const open = body.indexOf('('), close = body.lastIndexOf(')');
  const cols = new Map(), constraints = [];
  if (open < 0 || close < open) return { cols, constraints };
  for (const p of splitTop(body.slice(open + 1, close))) {
    if (/^(CONSTRAINT\s+\S+\s+)?(PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY)\b/i.test(p)) {
      if (!/^(CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\b/i.test(p)) constraints.push(p.replace(/\s+/g, ' '));
      continue;
    }
    const c = parseSqliteColumn(p);
    c.def = p.replace(/\s+/g, ' ');
    cols.set(c.name.toLowerCase(), c);
  }
  return { cols, constraints };
}

// "((a > 1))" -> "a > 1"
function unwrapParens(s) {
  s = String(s).trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')' && --depth === 0) return s;   // the first "(" closes before the end
    }
    s = s.slice(1, -1).trim();
  }
  return s;
}

// Columns of a table with everything the designer shows:
// [{ name, type, nullable, default, pk, identity, seed, incr, unique, uniqueName, check, checkName,
//    collation, description, hasDescription, generated, extra, rawDef }], plus the primary key.
async function loadTable(sess, type, t) {
  const d = dialectOf(type);
  const q = quoteIdent[d];
  const db = sessionDb(d, t);
  let columns = [], pk = [], pkName = null, constraints = [];
  const extras = [];
  const byCol = (rows, key = 'col') => { const m = new Map(); for (const r of rows) m.set(String(r[key]).toLowerCase(), r); return m; };

  if (d === 'sqlite') {
    const [cols, objs] = gridsOf(await run(sess, `PRAGMA ${q(t.db || 'main')}.table_xinfo(${lit(d, t.name)});
SELECT type, name, sql FROM ${q(t.db || 'main')}.sqlite_master WHERE tbl_name = ${lit(d, t.name)} AND type IN ('table', 'index', 'trigger') AND sql IS NOT NULL;`, db)).map(objects);
    const tableSql = (objs.find(o => o.type === 'table') || {}).sql || '';
    const parsed = parseSqliteCreate(tableSql);
    constraints = parsed.constraints;
    columns = cols.filter(r => Number(r.hidden) !== 1).map(r => {
      const pc = parsed.cols.get(String(r.name).toLowerCase()) || { extra: [] };
      const generated = Number(r.hidden) >= 2;
      return {
        name: r.name, type: r.type || '', nullable: !Number(r.notnull), default: r.dflt_value == null ? '' : String(r.dflt_value),
        pkPos: Number(r.pk) || 0, identity: false, generated, unique: !!pc.unique, check: pc.check || '', checkName: pc.checkName || null,
        collation: pc.collation || '',
        extra: (pc.extra || []).join(' '), rawDef: generated ? pc.def || '' : '',
      };
    });
    pk = columns.filter(c => c.pkPos).sort((a, b) => a.pkPos - b.pkPos).map(c => c.name);
    if (pk.length === 1) {
      // A single INTEGER PRIMARY KEY is the rowid: filled in automatically when left empty.
      const c = columns.find(x => x.name === pk[0]);
      if (/^INTEGER$/i.test(c.type.trim())) { c.serial = true; c.identity = /AUTOINCREMENT/i.test(tableSql); }
    }
    for (const o of objs) if (o.type !== 'table') extras.push(o.sql);
  } else if (d === 'mysql') {
    const [cols, keys, uniq] = gridsOf(await run(sess, `SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS dflt, EXTRA AS extra,
       DATA_TYPE AS data_type, COLLATION_NAME AS coll, COLUMN_COMMENT AS descr
  FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ${lit(d, t.db)} AND TABLE_NAME = ${lit(d, t.name)} ORDER BY ORDINAL_POSITION;
SELECT COLUMN_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
 WHERE TABLE_SCHEMA = ${lit(d, t.db)} AND TABLE_NAME = ${lit(d, t.name)} AND CONSTRAINT_NAME = 'PRIMARY' ORDER BY ORDINAL_POSITION;
SELECT INDEX_NAME AS name, MIN(COLUMN_NAME) AS col, COUNT(*) AS n FROM information_schema.STATISTICS
 WHERE TABLE_SCHEMA = ${lit(d, t.db)} AND TABLE_NAME = ${lit(d, t.name)} AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
 GROUP BY INDEX_NAME;`, db)).map(objects);
    const uq = byCol(uniq.filter(u => Number(u.n) === 1));
    columns = cols.map(r => ({
      name: r.name, type: r.type, nullable: r.nullable === 'YES', default: mysqlDefault(r, type === 'mariadb'),
      identity: /auto_increment/i.test(r.extra || ''), generated: /GENERATED/i.test(r.extra || '') && !/DEFAULT_GENERATED/i.test(r.extra || ''),
      collation: r.coll || '', description: r.descr || '', unique: uq.has(String(r.name).toLowerCase()),
      uniqueName: (uq.get(String(r.name).toLowerCase()) || {}).name || null,
    }));
    pk = keys.map(k => k.name);
  } else if (d === 'postgres') {
    const where = `n.nspname = ${lit(d, t.schema)} AND c.relname = ${lit(d, t.name)}`;
    const [cols, keys, cons] = gridsOf(await run(sess, `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull,
       a.attidentity AS ident, a.attgenerated AS gen, pg_get_expr(d.adbin, d.adrelid) AS dflt,
       col_description(c.oid, a.attnum) AS descr,
       (SELECT sq.seqstart || ',' || sq.seqincrement FROM pg_depend dep JOIN pg_sequence sq ON sq.seqrelid = dep.objid
         WHERE dep.refobjid = c.oid AND dep.refobjsubid = a.attnum AND dep.deptype = 'i' LIMIT 1) AS identseq,
       CASE WHEN a.attcollation <> 0 AND a.attcollation <> ty.typcollation THEN co.collname END AS coll
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type ty ON ty.oid = a.atttypid
  LEFT JOIN pg_collation co ON co.oid = a.attcollation
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
 WHERE ${where} AND a.attnum > 0 AND NOT a.attisdropped
 ORDER BY a.attnum;
SELECT con.conname AS name, a.attname AS col
  FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
 WHERE ${where} AND con.contype = 'p'
 ORDER BY k.ord;
SELECT con.conname AS name, con.contype AS ctype, pg_get_constraintdef(con.oid) AS def, a.attname AS col
  FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
 WHERE ${where} AND con.contype IN ('u', 'c') AND array_length(con.conkey, 1) = 1;`, db)).map(objects);
    const uq = byCol(cons.filter(x => x.ctype === 'u'));
    const ck = byCol(cons.filter(x => x.ctype === 'c'));
    columns = cols.map(r => {
      const k = String(r.name).toLowerCase(), u = uq.get(k), c = ck.get(k);
      const [seed, incr] = String(r.identseq || '1,1').split(',');
      return {
        name: r.name, type: r.type, nullable: !truthy(r.notnull), default: r.dflt == null ? '' : String(r.dflt),
        identity: !!r.ident && r.ident !== '', generated: !!r.gen && r.gen !== '', serial: /^nextval\(/i.test(String(r.dflt || '')),
        seed, incr,
        description: r.descr || '', hasDescription: !!r.descr, collation: r.coll || '',
        unique: !!u, uniqueName: u ? u.name : null,
        check: c ? unwrapParens(String(c.def).replace(/^CHECK\s*/i, '')) : '', checkName: c ? c.name : null,
      };
    });
    pk = keys.map(k => k.col);
    pkName = keys.length ? keys[0].name : null;
  } else if (d === 'oracle') {
    const own = `owner = ${lit(d, t.schema)} AND table_name = ${lit(d, t.name)}`;
    const [cols, keys, comments, uniq, checks, idents] = gridsOf(await run(sess, `SELECT column_name AS name, data_type, data_length, data_precision, data_scale, char_length, char_used,
       nullable, data_default AS dflt, identity_column AS ident, virtual_column AS virt
  FROM all_tab_cols WHERE ${own} AND hidden_column = 'NO' ORDER BY column_id;
SELECT cc.column_name AS col, k.constraint_name AS name
  FROM all_constraints k JOIN all_cons_columns cc ON cc.owner = k.owner AND cc.constraint_name = k.constraint_name
 WHERE k.owner = ${lit(d, t.schema)} AND k.table_name = ${lit(d, t.name)} AND k.constraint_type = 'P' ORDER BY cc.position;
SELECT column_name AS col, comments FROM all_col_comments WHERE ${own} AND comments IS NOT NULL;
SELECT k.constraint_name AS name, MIN(cc.column_name) AS col, COUNT(*) AS n
  FROM all_constraints k JOIN all_cons_columns cc ON cc.owner = k.owner AND cc.constraint_name = k.constraint_name
 WHERE k.owner = ${lit(d, t.schema)} AND k.table_name = ${lit(d, t.name)} AND k.constraint_type = 'U' GROUP BY k.constraint_name;
SELECT k.constraint_name AS name, k.search_condition AS cond, cc.column_name AS col
  FROM all_constraints k JOIN all_cons_columns cc ON cc.owner = k.owner AND cc.constraint_name = k.constraint_name
 WHERE k.owner = ${lit(d, t.schema)} AND k.table_name = ${lit(d, t.name)} AND k.constraint_type = 'C';
SELECT column_name AS col, identity_options AS opts FROM all_tab_identity_cols WHERE ${own};`, db)).map(objects);
    const desc = byCol(comments), ident = byCol(idents);
    const uq = byCol(uniq.filter(u => Number(u.n) === 1));
    const ckCount = new Map();
    for (const c of checks) ckCount.set(c.name, (ckCount.get(c.name) || 0) + 1);
    const ck = byCol(checks.filter(c => ckCount.get(c.name) === 1 && !/^\s*"?[\w$#]+"?\s+IS\s+NOT\s+NULL\s*$/i.test(String(c.cond || ''))));
    columns = cols.map(r => {
      const k = String(r.name).toLowerCase(), u = uq.get(k), c = ck.get(k), ds = desc.get(k);
      const dflt = r.dflt == null ? '' : String(r.dflt).trim();
      const opts = String((ident.get(k) || {}).opts || '');
      return {
        name: r.name, type: oracleType(r), nullable: r.nullable === 'Y', default: /^NULL$/i.test(dflt) ? '' : dflt,
        identity: r.ident === 'YES', generated: r.virt === 'YES',
        seed: (/START WITH:\s*(-?\d+)/i.exec(opts) || [])[1] || '1', incr: (/INCREMENT BY:\s*(-?\d+)/i.exec(opts) || [])[1] || '1',
        description: ds ? ds.comments : '', hasDescription: !!ds, unique: !!u, uniqueName: u ? u.name : null,
        check: c ? String(c.cond).trim() : '', checkName: c ? c.name : null,
      };
    });
    pk = keys.map(k => k.col);
    pkName = keys.length ? keys[0].name : null;
  } else {
    throw new Error(`Editing is not supported for ${type}.`);
  }
  if (!columns.length) throw new Error(`Table ${t.name} was not found.`);
  const pkSet = new Set(pk);
  for (const c of columns) {
    c.pk = pkSet.has(c.name);
    if (c.pk) c.nullable = false;
    if (d === 'sqlite') c.default = sqliteDefault(c.default);
    delete c.pkPos;
  }
  return { dialect: d, columns, pk, pkName, extras, constraints };
}

// Columns whose values can be typed in the grid.
function isEditable(d, c) {
  if (c.generated || (c.identity && d !== 'sqlite')) return false;
  const t = String(c.type);
  if (d === 'sqlite') return !/BLOB/i.test(t);
  if (d === 'mysql') return !/blob|binary|geometry|point|polygon|linestring/i.test(t);
  if (d === 'postgres') return !/bytea|\[\]$/i.test(t);
  if (d === 'oracle') return !/BLOB|RAW|LONG|BFILE|XMLTYPE|SDO_/i.test(t);
  return false;
}

// Number of rows a DML statement changed, read from the driver's message ("(1 row affected)", "UPDATE 1"...).
function affected(items) {
  for (const it of items) {
    if (it.type !== 'msg') continue;
    const m = /\((\d+) rows? affected\)/i.exec(it.text) || /^(?:UPDATE|DELETE)\s+(\d+)/i.exec(it.text) || /^INSERT\s+\d+\s+(\d+)/i.exec(it.text);
    if (m) return Number(m[1]);
  }
  return null;
}

const BEGIN = { sqlite: 'BEGIN', mysql: 'START TRANSACTION', postgres: 'BEGIN', oracle: null };

async function oneRowChange(sess, d, db, sql, verb) {
  if (BEGIN[d]) await run(sess, BEGIN[d], db);
  try {
    const n = affected(await run(sess, sql, db));
    if (n !== null && n !== 1) throw new Error(`Expected exactly 1 row to ${verb}, but ${n} rows matched. Nothing was changed.`);
    await run(sess, 'COMMIT', db);
  } catch (e) {
    try { await run(sess, 'ROLLBACK', db); } catch { /* nothing to roll back */ }
    throw e;
  }
}

function keyWhere(d, meta, key) {
  const q = quoteIdent[d];
  const pick = name => {
    const k = Object.keys(key || {}).find(x => x.toLowerCase() === name.toLowerCase());
    if (k === undefined) throw new Error(`Missing key value for column ${name}.`);
    return key[k];
  };
  return meta.pk.map(name => {
    const col = meta.columns.find(c => c.name === name);
    const v = pick(name);
    return v === null ? `${q(name)} IS NULL` : `${q(name)} = ${lit(d, v, col.type)}`;
  }).join(' AND ');
}

function selectSql(d, t, top, where) {
  const base = `SELECT * FROM ${qualified(d, t)}`;
  if (d === 'oracle') return where ? `${base} WHERE ${where}` : `${base} WHERE ROWNUM <= ${top}`;
  return where ? `${base} WHERE ${where}` : `${base} LIMIT ${top}`;
}

async function editLoad(sess, type, t, top) {
  const meta = await loadTable(sess, type, t);
  const d = meta.dialect;
  const g = gridsOf(await run(sess, selectSql(d, t, top), sessionDb(d, t), top))[0] || { columns: [], rows: [] };
  const byName = new Map(meta.columns.map(c => [c.name.toLowerCase(), c]));
  const columns = g.columns.map(gc => {
    const m = byName.get(gc.name.toLowerCase());
    return {
      name: gc.name, type: gc.type, sqlType: m ? m.type : '', editable: !!m && isEditable(d, m) && meta.pk.length > 0,
      nullable: m ? m.nullable : true, pk: !!(m && m.pk), identity: !!(m && m.identity), hasDefault: !!(m && (m.default || m.serial)),
    };
  });
  const truncated = [];
  g.rows.forEach((row, r) => row.forEach((v, c) => { if (typeof v === 'string' && v.length > MAX_TEXT) truncated.push([r, c]); }));
  const pkCols = meta.pk.map(name => ({ name: (g.columns.find(gc => gc.name.toLowerCase() === name.toLowerCase()) || { name }).name }));
  return { columns, pk: pkCols.length ? { name: meta.pkName, cols: pkCols } : null, rows: g.rows, truncated, top };
}

async function editUpdate(sess, type, t, key, values) {
  const meta = await loadTable(sess, type, t);
  const d = meta.dialect, q = quoteIdent[d], db = sessionDb(d, t);
  if (!meta.pk.length) throw new Error('This table has no primary key, so its rows cannot be edited safely.');
  const byName = new Map(meta.columns.map(c => [c.name.toLowerCase(), c]));
  const sets = Object.entries(values || {}).map(([name, v]) => {
    const col = byName.get(name.toLowerCase());
    if (!col || !isEditable(d, col)) throw new Error(`Column ${name} cannot be edited.`);
    return `${q(col.name)} = ${lit(d, v, col.type)}`;
  });
  if (!sets.length) throw new Error('Nothing to update.');
  await oneRowChange(sess, d, db, `UPDATE ${qualified(d, t)} SET ${sets.join(', ')} WHERE ${keyWhere(d, meta, key)}`, 'change');
  const newKey = { ...key };
  for (const [name, v] of Object.entries(values)) if (meta.pk.some(p => p.toLowerCase() === name.toLowerCase())) newKey[name] = v;
  const g = gridsOf(await run(sess, selectSql(d, t, 1, keyWhere(d, meta, newKey)), db, 2))[0];
  return { row: g && g.rows[0] ? g.rows[0] : null };
}

async function editInsert(sess, type, t, values) {
  const meta = await loadTable(sess, type, t);
  const d = meta.dialect, q = quoteIdent[d];
  if (!meta.pk.length) throw new Error('This table has no primary key, so rows cannot be added here.');
  const byName = new Map(meta.columns.map(c => [c.name.toLowerCase(), c]));
  const cols = [], vals = [];
  for (const [name, v] of Object.entries(values || {})) {
    const col = byName.get(name.toLowerCase());
    if (!col || !isEditable(d, col)) throw new Error(`Column ${name} cannot be set.`);
    cols.push(q(col.name));
    vals.push(lit(d, v, col.type));
  }
  if (!cols.length) throw new Error('Enter a value for at least one column.');
  await oneRowChange(sess, d, sessionDb(d, t), `INSERT INTO ${qualified(d, t)} (${cols.join(', ')}) VALUES (${vals.join(', ')})`, 'insert');
  return { row: null, reload: true };
}

async function editDelete(sess, type, t, key) {
  const meta = await loadTable(sess, type, t);
  const d = meta.dialect;
  if (!meta.pk.length) throw new Error('This table has no primary key, so rows cannot be deleted here.');
  await oneRowChange(sess, d, sessionDb(d, t), `DELETE FROM ${qualified(d, t)} WHERE ${keyWhere(d, meta, key)}`, 'delete');
  return { ok: true };
}

// Runs a (designer) script, rolling back when a statement fails.
async function applyScript(sess, type, t, script) {
  const d = dialectOf(type), db = sessionDb(d, t);
  try {
    await run(sess, script, db);
  } catch (e) {
    try { await run(sess, 'ROLLBACK', db); } catch { /* no open transaction */ }
    if (d === 'sqlite') { try { await run(sess, 'PRAGMA legacy_alter_table = OFF;\nPRAGMA foreign_keys = ON;', db); } catch { /* ignore */ } }
    throw e;
  }
}

module.exports = {
  dialectOf, qualified, loadTable, isEditable, editLoad, editUpdate, editInsert, editDelete, applyScript, lit, affected,
  sqliteDefault, parseSqliteCreate,
};
