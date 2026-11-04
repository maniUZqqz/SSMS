'use strict';
// MySQL / MariaDB driver for Web SQL Studio (npm package: mysql2). See drivers/common.js for the interface.
//
// Object Explorer path scheme (every element is the `key` of a tree node):
//   []                                          -> databases (+ "System Databases" folder, key 'sysdb')
//   ['sysdb']                                   -> information_schema / mysql / performance_schema / sys
//   [.., 'db:<name>']                           -> folders: tables, views, procs, funcs, triggers
//   [.., 'tables']  -> 't:<table>'    -> folders: columns, indexes, fks      -> 'c:<col>' | 'i:<index>' | 'k:<fk>'
//   [.., 'views']   -> 'v:<view>'     -> folder:  columns
//   [.., 'procs']   -> 'p:<proc>'     -> folder:  params                     -> 'a:<n>'
//   [.., 'funcs']   -> 'f:<func>'     -> folder:  params                     -> 'a:<n>'
//   [.., 'triggers'] -> 'tr:<trigger>'
//
// Metadata goes through a small mysql2 pool; every query tab owns a dedicated connection (session).

const { grid, splitStatements, quoteIdent, errorItem, requireDriver } = require('./common');

const language = 'sql';
const q = quoteIdent.mysql;
const SYSTEM_DBS = new Set(['information_schema', 'mysql', 'performance_schema', 'sys']);
const DEFAULT_PORT = 3306;

// ---------------------------------------------------------------- small helpers

const str = v => (v === null || v === undefined ? '' : Buffer.isBuffer(v) ? v.toString('utf8') : String(v));
const strOrNull = v => (v === null || v === undefined ? null : str(v));
const num = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const kb = v => { const n = num(v); return n === null ? null : Math.round(n / 1024); };
const flag = v => v === true || v === 1 || v === '1' || /^(yes|true)$/i.test(str(v));

function errText(e) {
  if (!e) return 'Unknown error';
  let m = e.message || '';
  if (!m && Array.isArray(e.errors) && e.errors.length) m = e.errors.map(x => x.message || x.code).filter(Boolean).join('; ');
  if (!m && e.code) m = e.code;
  return m || String(e);
}

function hostPort(spec) {
  let host = String(spec.server || '').trim() || 'localhost';
  let port = spec.port !== undefined && spec.port !== null && String(spec.port).trim() !== '' ? Number(spec.port) : null;
  let shown = host;
  if (port === null) {
    const m = /^([^:\s]+):(\d+)$/.exec(host);
    if (m) { host = m[1]; port = Number(m[2]); }
  } else if (port) {
    shown = `${host}:${port}`;
  }
  return { host, port: port || DEFAULT_PORT, shown };
}

function buildConfig(spec) {
  const { host, port } = hostPort(spec);
  const cfg = {
    host, port,
    user: spec.user || undefined,
    password: spec.password === undefined || spec.password === null ? undefined : String(spec.password),
    database: spec.database || undefined,
    connectTimeout: Math.max(1, Number(spec.connectTimeout) || 15) * 1000,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: true,
    multipleStatements: false,
    enableKeepAlive: true,
    connectAttributes: { program_name: spec.appName || 'Web SQL Studio' },
  };
  if (spec.encrypt) cfg.ssl = { rejectUnauthorized: !spec.trustServerCertificate };
  return cfg;
}

// Executes `sql` on a pool (promise API) and returns the rows.
async function Q(conn, sql, params) {
  const [rows] = await conn.pool.query(sql, params || []);
  return rows;
}

function withTimeout(p, ms) {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), ms); })]).finally(() => clearTimeout(t));
}

// First keyword of a statement, skipping comments and opening parentheses.
function firstWord(sql) {
  let s = String(sql);
  for (;;) {
    const t = s.replace(/^\s+/, '');
    if (t.startsWith('--') || t.startsWith('#')) { const i = t.indexOf('\n'); s = i < 0 ? '' : t.slice(i + 1); continue; }
    if (t.startsWith('/*') && !t.startsWith('/*!')) { const i = t.indexOf('*/'); s = i < 0 ? '' : t.slice(i + 2); continue; }
    s = t;
    break;
  }
  const m = /^[(\s]*([A-Za-z]+)/.exec(s);
  return m ? m[1].toUpperCase() : '';
}

// Column type name (as shown in the result grid header tooltip) from a mysql2 ColumnDefinition.
function typeName(f) {
  const t = f.columnType !== undefined ? f.columnType : f.type;
  const bin = f.characterSet === 63;
  const uns = (f.flags & 32) !== 0;
  const int = n => (uns ? n + ' unsigned' : n);
  switch (t) {
    case 0: case 246: return 'decimal';
    case 1: return int('tinyint');
    case 2: return int('smallint');
    case 3: return int('int');
    case 4: return 'float';
    case 5: return 'double';
    case 6: return 'null';
    case 7: return 'timestamp';
    case 8: return int('bigint');
    case 9: return int('mediumint');
    case 10: case 14: return 'date';
    case 11: return 'time';
    case 12: return 'datetime';
    case 13: return 'year';
    case 15: return 'varchar';
    case 16: return 'bit';
    case 242: return 'vector';
    case 245: return 'json';
    case 247: return 'enum';
    case 248: return 'set';
    case 249: return bin ? 'tinyblob' : 'tinytext';
    case 250: return bin ? 'mediumblob' : 'mediumtext';
    case 251: return bin ? 'longblob' : 'longtext';
    case 252: return bin ? 'blob' : 'text';
    case 253: return bin ? 'varbinary' : 'varchar';
    case 254: return bin ? 'binary' : 'char';
    case 255: return 'geometry';
    default: return '';
  }
}

// ---------------------------------------------------------------- connect / close

async function connect(spec) {
  const mysql = requireDriver('mysql2');
  const cfg = buildConfig(spec);
  const rawPool = mysql.createPool({ ...cfg, connectionLimit: 3, waitForConnections: true, queueLimit: 0, maxIdle: 1, idleTimeout: 60000 });
  rawPool.on('error', () => {});
  const conn = { mysql, cfg, spec, rawPool, pool: rawPool.promise(), sessions: new Set(), closed: false, info: null, maria: false };
  try {
    const [row] = await Q(conn, 'SELECT VERSION() AS v, CURRENT_USER() AS u, DATABASE() AS d');
    const version = str(row.v);
    conn.maria = /mariadb/i.test(version);
    conn.info = { version, user: spec.user || str(row.u), database: strOrNull(row.d) || spec.database || '', server: hostPort(spec).shown };
  } catch (e) {
    rawPool.end(() => {});
    throw new Error(errText(e));
  }
  return conn;
}

async function close(conn) {
  if (!conn || conn.closed) return;
  conn.closed = true;
  await Promise.allSettled([...conn.sessions].map(s => s.close()));
  await new Promise(res => conn.rawPool.end(() => res()));
}

// ---------------------------------------------------------------- metadata

async function databases(conn) {
  const rows = await Q(conn, 'SELECT SCHEMA_NAME AS name FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME');
  const names = rows.map(r => str(r.name));
  return [...names.filter(n => !SYSTEM_DBS.has(n.toLowerCase())), ...names.filter(n => SYSTEM_DBS.has(n.toLowerCase()))];
}

async function objects(conn, db) {
  const rows = await Q(conn, 'SELECT TABLE_NAME AS name, TABLE_TYPE AS type FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME', [db]);
  return rows.map(r => ({ schema: db, name: str(r.name), type: str(r.type) === 'BASE TABLE' ? 'table' : 'view' }));
}

async function columns(conn, db, schema, name) {
  const rows = await Q(conn,
    'SELECT COLUMN_NAME AS name, COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION',
    [schema || db, name]);
  return rows.map(r => ({ name: str(r.name), type: str(r.type) }));
}

// ---------------------------------------------------------------- Object Explorer

const node = o => ({ expandable: false, ...o });
const folder = (key, label, kind, count) => ({ key, label, icon: 'folder', expandable: true, kind, count: count === undefined ? null : count, row: { name: label } });

function parsePath(path) {
  const c = { db: null, obj: null, objTag: null, leafTag: null, leaf: null, last: path.length ? path[path.length - 1] : null };
  for (const k of path) {
    const i = k.indexOf(':');
    if (i < 0) continue;
    const tag = k.slice(0, i), val = k.slice(i + 1);
    if (tag === 'db') c.db = val;
    else if (tag === 't' || tag === 'v' || tag === 'p' || tag === 'f' || tag === 'tr') { c.objTag = tag; c.obj = val; }
    else if (tag === 'c' || tag === 'i' || tag === 'k' || tag === 'a') { c.leafTag = tag; c.leaf = val; }
  }
  return c;
}

async function tree(conn, path) {
  path = path || [];
  if (!path.length) return databaseNodes(conn, false);
  const c = parsePath(path);
  const last = c.last;
  if (last === 'sysdb') return databaseNodes(conn, true);
  if (last.startsWith('db:')) return dbFolders(conn, c.db);
  switch (last) {
    case 'tables': return tableNodes(conn, c.db);
    case 'views': return viewNodes(conn, c.db);
    case 'procs': return routineNodes(conn, c.db, 'PROCEDURE');
    case 'funcs': return routineNodes(conn, c.db, 'FUNCTION');
    case 'triggers': return triggerNodes(conn, c.db);
    case 'columns': return columnNodes(conn, c.db, c.obj);
    case 'indexes': return indexNodes(conn, c.db, c.obj);
    case 'fks': return fkNodes(conn, c.db, c.obj);
    case 'params': return paramNodes(conn, c.db, c.obj, c.objTag === 'f' ? 'FUNCTION' : 'PROCEDURE');
    default: break;
  }
  if (last.startsWith('t:')) return tableFolders(conn, c.db, c.obj);
  if (last.startsWith('v:')) return [folder('columns', 'Columns', 'columns')];
  if (last.startsWith('p:') || last.startsWith('f:')) return [folder('params', 'Parameters', 'params')];
  return [];
}

async function databaseNodes(conn, system) {
  const rows = await Q(conn, 'SELECT SCHEMA_NAME AS name, DEFAULT_CHARACTER_SET_NAME AS charset FROM information_schema.SCHEMATA ORDER BY SCHEMA_NAME');
  let sizes = new Map();
  try {
    const s = await withTimeout(Q(conn, 'SELECT TABLE_SCHEMA AS name, SUM(DATA_LENGTH + INDEX_LENGTH) AS size_bytes FROM information_schema.TABLES GROUP BY TABLE_SCHEMA'), 4000);
    sizes = new Map(s.map(r => [str(r.name), num(r.size_bytes)]));
  } catch { /* sizes are optional */ }
  const all = rows.map(r => ({ name: str(r.name), charset: strOrNull(r.charset) }));
  const isSys = n => SYSTEM_DBS.has(n.toLowerCase());
  const list = all.filter(d => isSys(d.name) === system);
  const out = list.map(d => {
    const size = sizes.get(d.name);
    return node({
      key: 'db:' + d.name, label: d.name, icon: 'db', expandable: true, kind: 'generic', drag: q(d.name),
      row: { name: d.name, size_mb: size === null || size === undefined ? null : Math.round(size / 1048576 * 100) / 100, owner: null, encoding: d.charset },
      actions: [{ label: 'New Query', sql: '', run: false, db: d.name }, { label: 'Script as CREATE', script: 'create' }],
    });
  });
  if (!system) {
    const sys = all.filter(d => isSys(d.name));
    if (sys.length) out.push(folder('sysdb', 'System Databases', 'gdatabases', sys.length));
  }
  return out;
}

async function dbFolders(conn, db) {
  const [r] = await Q(conn,
    `SELECT
       (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE') AS tables_n,
       (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE <> 'BASE TABLE') AS views_n,
       (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE') AS procs_n,
       (SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION') AS funcs_n,
       (SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?) AS triggers_n`,
    [db, db, db, db, db]);
  return [
    folder('tables', 'Tables', 'tables', num(r.tables_n)),
    folder('views', 'Views', 'objects', num(r.views_n)),
    folder('procs', 'Stored Procedures', 'objects', num(r.procs_n)),
    folder('funcs', 'Functions', 'objects', num(r.funcs_n)),
    folder('triggers', 'Triggers', 'triggers', num(r.triggers_n)),
  ];
}

const qual = (db, name) => q(db) + '.' + q(name);
const selectTop = (db, name) => ({ label: 'Select Top 1000 Rows', sql: `SELECT * FROM ${qual(db, name)} LIMIT 1000`, run: true, db });
const scriptCreate = { label: 'Script as CREATE', script: 'create' };

async function tableNodes(conn, db) {
  const rows = await Q(conn,
    `SELECT TABLE_NAME AS name, TABLE_ROWS AS row_count, DATA_LENGTH AS data_bytes, INDEX_LENGTH AS index_bytes,
            DATE_FORMAT(CREATE_TIME, '%Y-%m-%d %H:%i:%s') AS created, DATE_FORMAT(UPDATE_TIME, '%Y-%m-%d %H:%i:%s') AS modified
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME`, [db]);
  return rows.map(r => {
    const name = str(r.name);
    const data = num(r.data_bytes), idx = num(r.index_bytes);
    return node({
      key: 't:' + name, label: name, icon: 'table', expandable: true, kind: 'generic', drag: qual(db, name),
      row: {
        name, sch: db, created: strOrNull(r.created), row_count: num(r.row_count), data_kb: kb(data), index_kb: kb(idx),
        modified: strOrNull(r.modified), reserved_kb: data === null && idx === null ? null : kb((data || 0) + (idx || 0)), owner: null,
      },
      actions: [selectTop(db, name), scriptCreate],
    });
  });
}

async function tableFolders(conn, db, table) {
  const [r] = await Q(conn,
    `SELECT
       (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?) AS cols_n,
       (SELECT COUNT(DISTINCT INDEX_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?) AS idx_n,
       (SELECT COUNT(DISTINCT CONSTRAINT_NAME) FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL) AS fk_n`,
    [db, table, db, table, db, table]);
  return [
    folder('columns', 'Columns', 'columns', num(r.cols_n)),
    folder('indexes', 'Indexes', 'indexes', num(r.idx_n)),
    folder('fks', 'Foreign Keys', 'keys', num(r.fk_n)),
  ];
}

async function viewNodes(conn, db) {
  const rows = await Q(conn,
    `SELECT TABLE_NAME AS name, DATE_FORMAT(CREATE_TIME, '%Y-%m-%d %H:%i:%s') AS created, DATE_FORMAT(UPDATE_TIME, '%Y-%m-%d %H:%i:%s') AS modified
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE <> 'BASE TABLE' ORDER BY TABLE_NAME`, [db]);
  return rows.map(r => {
    const name = str(r.name);
    return node({
      key: 'v:' + name, label: name, icon: 'view', expandable: true, kind: 'generic', drag: qual(db, name),
      row: { name, sch: db, created: strOrNull(r.created), modified: strOrNull(r.modified), type_desc: 'VIEW' },
      actions: [selectTop(db, name), scriptCreate],
    });
  });
}

async function routineNodes(conn, db, type) {
  const [rows, params] = await Promise.all([
    Q(conn,
      `SELECT ROUTINE_NAME AS name, DATE_FORMAT(CREATED, '%Y-%m-%d %H:%i:%s') AS created, DATE_FORMAT(LAST_ALTERED, '%Y-%m-%d %H:%i:%s') AS modified
         FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = ? ORDER BY ROUTINE_NAME`, [db, type]),
    Q(conn,
      `SELECT SPECIFIC_NAME AS routine, PARAMETER_NAME AS name, PARAMETER_MODE AS mode, ORDINAL_POSITION AS pos
         FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA = ? AND ROUTINE_TYPE = ? AND ORDINAL_POSITION > 0
        ORDER BY SPECIFIC_NAME, ORDINAL_POSITION`, [db, type]),
  ]);
  const byRoutine = new Map();
  for (const p of params) {
    const k = str(p.routine);
    if (!byRoutine.has(k)) byRoutine.set(k, []);
    byRoutine.get(k).push({ name: str(p.name), mode: str(p.mode) || 'IN' });
  }
  const isFn = type === 'FUNCTION';
  return rows.map(r => {
    const name = str(r.name);
    const args = (byRoutine.get(name) || []).map(p =>
      (p.mode === 'OUT' ? '@' + p.name : `NULL /* ${p.name} */`)).join(', ');
    const call = isFn ? `SELECT ${qual(db, name)}(${args}) AS result;` : `CALL ${qual(db, name)}(${args});`;
    return node({
      key: (isFn ? 'f:' : 'p:') + name, label: name, icon: isFn ? 'func' : 'proc', expandable: true, kind: 'generic', drag: qual(db, name),
      row: { name, sch: db, created: strOrNull(r.created), modified: strOrNull(r.modified), type_desc: type },
      actions: [scriptCreate, { label: isFn ? 'Select Function' : 'Execute Procedure', sql: call, run: false, db }],
    });
  });
}

async function paramNodes(conn, db, routine, type) {
  const rows = await Q(conn,
    `SELECT PARAMETER_NAME AS name, PARAMETER_MODE AS mode, DTD_IDENTIFIER AS dtype, ORDINAL_POSITION AS pos
       FROM information_schema.PARAMETERS WHERE SPECIFIC_SCHEMA = ? AND SPECIFIC_NAME = ? AND ROUTINE_TYPE = ? ORDER BY ORDINAL_POSITION`,
    [db, routine, type]);
  return rows.map(r => {
    const ret = num(r.pos) === 0;
    const name = ret ? '(return value)' : str(r.name);
    const dir = ret ? 'RETURN' : (str(r.mode) || 'IN');
    const dtype = str(r.dtype);
    return node({
      key: 'a:' + num(r.pos), label: name, icon: 'param', sub: `(${dir}, ${dtype})`,
      row: { name, data_type: dtype, direction: dir, has_default: false },
    });
  });
}

async function columnNodes(conn, db, table) {
  const rows = await Q(conn,
    `SELECT c.COLUMN_NAME AS name, c.COLUMN_TYPE AS ctype, c.IS_NULLABLE AS nullable, c.COLUMN_KEY AS ckey, c.EXTRA AS extra,
            c.COLUMN_DEFAULT AS dflt, c.COLLATION_NAME AS coll,
            EXISTS (SELECT 1 FROM information_schema.KEY_COLUMN_USAGE k
                     WHERE k.TABLE_SCHEMA = c.TABLE_SCHEMA AND k.TABLE_NAME = c.TABLE_NAME AND k.COLUMN_NAME = c.COLUMN_NAME
                       AND k.REFERENCED_TABLE_NAME IS NOT NULL) AS is_fk
       FROM information_schema.COLUMNS c WHERE c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ? ORDER BY c.ORDINAL_POSITION`, [db, table]);
  return rows.map(r => {
    const name = str(r.name), type = str(r.ctype);
    const pk = str(r.ckey) === 'PRI', fk = flag(r.is_fk), nullable = flag(r.nullable);
    const extra = str(r.extra);
    const sub = '(' + [pk ? 'PK' : null, fk ? 'FK' : null, type, nullable ? 'null' : 'not null'].filter(Boolean).join(', ') + ')';
    return node({
      key: 'c:' + name, label: name, icon: pk ? 'key' : fk ? 'fkey' : 'col', sub, drag: q(name),
      row: {
        name, data_type: type, nullable, pk, fk, identity: /auto_increment/i.test(extra),
        default: strOrNull(r.dflt), collation: strOrNull(r.coll),
      },
    });
  });
}

async function indexNodes(conn, db, table) {
  const rows = await Q(conn, `SHOW INDEX FROM ${qual(db, table)}`);
  const idx = new Map();
  for (const r of rows) {
    const name = str(r.Key_name);
    if (!idx.has(name)) idx.set(name, { name, unique: num(r.Non_unique) === 0, type: str(r.Index_type), cols: [] });
    const col = r.Column_name === null || r.Column_name === undefined ? `(${str(r.Expression)})` : str(r.Column_name);
    idx.get(name).cols[(num(r.Seq_in_index) || 1) - 1] = col + (str(r.Collation) === 'D' ? ' DESC' : '');
  }
  return [...idx.values()].map(ix => node({
    key: 'i:' + ix.name, label: ix.name, icon: ix.name === 'PRIMARY' ? 'key' : 'index',
    sub: `(${ix.unique ? 'Unique' : 'Non-Unique'}, ${ix.type})`,
    row: { name: ix.name, kind: ix.type, unique: ix.unique, keys: ix.cols.filter(Boolean).join(', '), include: '' },
  }));
}

async function fkNodes(conn, db, table) {
  const rows = await Q(conn,
    `SELECT CONSTRAINT_NAME AS name, COLUMN_NAME AS col, REFERENCED_TABLE_SCHEMA AS rsch, REFERENCED_TABLE_NAME AS rtab, REFERENCED_COLUMN_NAME AS rcol
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION`, [db, table]);
  const fks = new Map();
  for (const r of rows) {
    const name = str(r.name);
    if (!fks.has(name)) fks.set(name, { name, cols: [], rcols: [], rsch: str(r.rsch), rtab: str(r.rtab) });
    fks.get(name).cols.push(str(r.col));
    fks.get(name).rcols.push(str(r.rcol));
  }
  return [...fks.values()].map(f => node({
    key: 'k:' + f.name, label: f.name, icon: 'fkey', sub: `(references ${f.rtab})`,
    row: { name: f.name, kind: 'FOREIGN KEY', cols: f.cols.join(', '), ref: `${f.rsch}.${f.rtab}(${f.rcols.join(', ')})` },
  }));
}

async function triggerNodes(conn, db) {
  const rows = await Q(conn,
    `SELECT TRIGGER_NAME AS name, EVENT_OBJECT_TABLE AS tbl, ACTION_TIMING AS timing, EVENT_MANIPULATION AS event
       FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ? ORDER BY TRIGGER_NAME`, [db]);
  return rows.map(r => {
    const name = str(r.name);
    return node({
      key: 'tr:' + name, label: name, icon: 'trigger', sub: `(${str(r.timing)} ${str(r.event)} on ${str(r.tbl)})`, drag: qual(db, name),
      row: { name, instead_of: false, disabled: false },
      actions: [scriptCreate],
    });
  });
}

// ---------------------------------------------------------------- script

async function script(conn, path, kind) {
  if (kind && kind !== 'create') throw new Error(`Unsupported script kind "${kind}"`);
  const c = parsePath(path || []);
  const db = c.db;
  const last = c.last || '';
  const use = db ? `USE ${q(db)};\n\n` : '';
  const showCreate = async (what, column) => {
    const rows = await Q(conn, `SHOW CREATE ${what}`);
    if (!rows.length) throw new Error('Object not found');
    const sql = strOrNull(rows[0][column]);
    if (!sql) throw new Error('The CREATE statement is not available (insufficient privileges?)');
    return sql;
  };
  const delimited = body => `DELIMITER $$\n${body}$$\nDELIMITER ;\n`;

  if (last.startsWith('db:')) {
    return (await showCreate(`DATABASE ${q(db)}`, 'Create Database')) + ';\n';
  }
  if (last.startsWith('t:')) return use + (await showCreate(`TABLE ${qual(db, c.obj)}`, 'Create Table')) + ';\n';
  if (last.startsWith('v:')) return use + (await showCreate(`VIEW ${qual(db, c.obj)}`, 'Create View')) + ';\n';
  if (last.startsWith('p:')) return use + delimited(await showCreate(`PROCEDURE ${qual(db, c.obj)}`, 'Create Procedure'));
  if (last.startsWith('f:')) return use + delimited(await showCreate(`FUNCTION ${qual(db, c.obj)}`, 'Create Function'));
  if (last.startsWith('tr:')) return use + delimited(await showCreate(`TRIGGER ${qual(db, c.obj)}`, 'SQL Original Statement'));
  throw new Error('Script as CREATE is not available for this object');
}

// ---------------------------------------------------------------- query sessions

const DML = new Set(['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'LOAD', 'CALL']);
const EXPLAINABLE = new Set(['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'TABLE']);

function mysqlError(err, stmt, text) {
  const sqlMsg = err && (err.sqlMessage || err.message) ? String(err.sqlMessage || err.message) : errText(err);
  let message = sqlMsg;
  if (err && err.errno) message = `Error ${err.errno}${err.sqlState ? ` (${err.sqlState})` : ''}: ${sqlMsg}`;
  const item = errorItem({ message }, stmt, text);
  // Parse errors say "... near '...' at line N" (N relative to the statement).
  const m = err && err.errno === 1064 ? /at line (\d+)\s*$/.exec(sqlMsg) : null;
  if (m && stmt) item.line = stmt.line + Number(m[1]) - 1;
  return item;
}

class MySession {
  constructor(conn) {
    this.conn = conn;
    this.c = null;
    this.db = null;
    this.dead = true;
    this.closed = false;
  }

  async open(database) {
    await this._connect(database || this.conn.spec.database || undefined);
    conn_add(this);
  }

  async _connect(database) {
    const { mysql, cfg } = this.conn;
    const c = mysql.createConnection({ ...cfg, database: database || undefined });
    c.on('error', () => { if (this.c === c) this.dead = true; });   // unhandled 'error' events would crash the process
    try {
      await new Promise((resolve, reject) => c.connect(err => (err ? reject(err) : resolve())));
    } catch (e) {
      try { c.destroy(); } catch { /* ignore */ }
      throw new Error(errText(e));
    }
    const old = this.c;
    this.c = c;
    this.dead = false;
    this.db = database || null;
    if (old) { try { old.destroy(); } catch { /* ignore */ } }
  }

  // Simple (non-streaming) query on the session connection.
  _simple(sql) {
    return new Promise((resolve, reject) => {
      this.c.query(sql, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  async _ensure(database) {
    if (this.dead || !this.c) await this._connect(this.db || undefined);
    if (database && database !== this.db) {
      await this._simple('USE ' + q(database));
      this.db = database;
    }
  }

  async run(text, opts = {}) {
    const maxRows = Math.max(1, Math.floor(Number(opts.maxRows)) || 5000);
    const explain = opts.mode === 'explain';
    const items = [];
    let errors = 0;
    let usedUse = false;
    const stop = (err, stmt) => { items.push(mysqlError(err, stmt, text)); errors++; };

    try {
      await this._ensure(opts.database);
    } catch (e) {
      items.push({ type: 'err', message: errText(e), line: null });
      return { items, errors: 1, database: this.db };
    }

    for (const stmt of splitStatements(String(text || ''), 'mysql')) {
      let sql = stmt.sql;
      const w = firstWord(sql);
      if (w === 'USE') usedUse = true;
      if (explain && w !== 'USE' && w !== 'SET') {
        if (!EXPLAINABLE.has(w)) {
          items.push({ type: 'msg', text: `-- Skipped (no execution plan for ${w || 'this statement'}): ${sql.length > 60 ? sql.slice(0, 60) + '...' : sql}` });
          continue;
        }
        sql = 'EXPLAIN ' + sql;
      }
      try {
        await this._stream(sql, w, maxRows, items);
      } catch (e) {
        if (e && (e.fatal || e.code === 'PROTOCOL_CONNECTION_LOST' || e.code === 'ECONNRESET')) this.dead = true;
        stop(e, stmt);
        break;
      }
    }

    if (usedUse && !this.dead) {
      try { const r = await this._simple('SELECT DATABASE() AS d'); this.db = strOrNull(r[0] && r[0].d); } catch { /* keep the old value */ }
    }
    return { items, errors, database: this.db };
  }

  // Runs one statement with the core streaming API; keeps only maxRows rows per result set but counts them all.
  _stream(sql, word, maxRows, items) {
    return new Promise((resolve, reject) => {
      let settled = false;
      let g = null;
      let sets = 0;
      const c = this.c;
      // Event-style queries are not told about a lost connection (mysql2 only emits 'error' on the connection).
      const onConnectionError = err => done(err);
      const done = err => {
        if (settled) return;
        settled = true;
        c.removeListener('error', onConnectionError);
        err ? reject(err) : resolve();
      };
      c.once('error', onConnectionError);
      const query = c.query({ sql, rowsAsArray: true });
      query.on('fields', fields => {
        if (!fields) { g = null; return; }                       // OK packet follows (no result set)
        g = grid(fields.map(f => ({ name: f.name, type: typeName(f) })), maxRows);
        items.push(g.item);
        sets++;
      });
      query.on('result', row => {
        if (Array.isArray(row)) { if (g) g.add(row); return; }
        // OK packet (ResultSetHeader)
        if (sets > 0 && !row.affectedRows) return;                // trailing OK of a CALL that returned result sets
        const n = Number(row.affectedRows) || 0;
        const warn = Number(row.warningStatus) || 0;
        let msg;
        if (DML.has(word) || n > 0) {
          msg = `(${n} row${n === 1 ? '' : 's'} affected)`;
          if (row.insertId && Number(row.insertId) > 0 && word !== 'CALL') msg += ` Last insert id: ${row.insertId}`;
        } else {
          msg = 'Commands completed successfully.';
        }
        if (warn) msg += ` ${warn} warning${warn === 1 ? '' : 's'} (SHOW WARNINGS to display).`;
        items.push({ type: 'msg', text: msg });
      });
      query.on('error', done);
      query.on('end', () => done());
    });
  }

  // KILL QUERY from a separate connection; the session stays usable.
  async cancel() {
    if (!this.c || this.dead || !this.c.threadId) return;
    const id = this.c.threadId;
    const { mysql, cfg } = this.conn;
    const k = mysql.createConnection({ ...cfg, database: undefined });
    k.on('error', () => {});
    try {
      await new Promise((resolve, reject) => k.connect(err => (err ? reject(err) : resolve())));
      await new Promise((resolve, reject) => k.query(`KILL QUERY ${Number(id)}`, err => (err ? reject(err) : resolve())));
    } finally {
      try { k.destroy(); } catch { /* ignore */ }
    }
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.conn.sessions.delete(this);
    const c = this.c;
    this.c = null;
    this.dead = true;
    if (!c) return;
    await new Promise(resolve => {
      const t = setTimeout(() => { try { c.destroy(); } catch { /* ignore */ } resolve(); }, 2000);
      try { c.end(() => { clearTimeout(t); resolve(); }); } catch { clearTimeout(t); resolve(); }
    });
  }
}

function conn_add(session) { session.conn.sessions.add(session); }

async function openSession(conn) {
  const s = new MySession(conn);
  await s.open();
  return s;
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  _internal: { firstWord, typeName, hostPort, buildConfig, mysqlError, parsePath, errText },
};
