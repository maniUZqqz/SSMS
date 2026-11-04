'use strict';
// PostgreSQL driver for Web SQL Studio (npm packages: pg, pg-cursor). See drivers/common.js for the interface.
//
// Object Explorer path scheme (every element is the `key` of a tree node):
//   []                                           -> databases
//   ['db:<name>']                                -> user schemas ('s:<schema>') + "System Schemas" folder ('sys')
//   [.., 'sys']                                  -> pg_catalog / information_schema ('s:<schema>')
//   [.., 's:<schema>']                           -> folders: tables, views, matviews, funcs, procs, seqs
//   [.., 'tables']   -> 't:<table>'  -> folders: columns, indexes, constraints, triggers -> 'c:' | 'i:' | 'k:' | 'tr:'
//   [.., 'views']    -> 'v:<view>'   -> folder:  columns
//   [.., 'matviews'] -> 'mv:<view>'  -> folders: columns, indexes
//   [.., 'funcs']    -> 'f:<oid>'    -> folder:  params                                  -> 'a:<n>'
//   [.., 'procs']    -> 'p:<oid>'    -> folder:  params
//   [.., 'seqs']     -> 'q:<sequence>'
//
// A PostgreSQL connection is bound to one database, so metadata uses one lazily created client per database
// (conn.meta); every query tab owns its own client (session) that is reconnected when the database changes.

const { grid, splitStatements, quoteIdent, errorItem, requireDriver } = require('./common');

const language = 'sql';
const q = quoteIdent.postgres;
const DEFAULT_PORT = 5432;
const CHUNK = 2000;                       // rows requested per cursor read

// ---------------------------------------------------------------- small helpers

const num = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const kb = v => { const n = num(v); return n === null ? null : Math.round(n / 1024); };
const lit = s => "'" + String(s).replace(/'/g, "''") + "'";

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

// Type parsers: dates/times/numerics/int8/json come back as the server's own text (no JS Date time-zone shifts).
const RAW_OIDS = new Set([
  20, 114, 3802, 199, 3807,                       // int8, json, jsonb (+ arrays)
  1082, 1083, 1114, 1184, 1266, 1186, 1700,       // date, time, timestamp, timestamptz, timetz, interval, numeric
  1182, 1183, 1115, 1185, 1270, 1187, 1231, 1016, // arrays of those
]);
function makeTypes(pg) {
  return {
    getTypeParser(oid, format) {
      if ((format === undefined || format === 'text') && RAW_OIDS.has(oid)) return v => v;
      return pg.types.getTypeParser(oid, format);
    },
  };
}

const TYPE_NAMES = {
  16: 'bool', 17: 'bytea', 18: 'char', 19: 'name', 20: 'int8', 21: 'int2', 23: 'int4', 24: 'regproc', 25: 'text', 26: 'oid', 27: 'tid', 28: 'xid',
  114: 'json', 142: 'xml', 600: 'point', 650: 'cidr', 700: 'float4', 701: 'float8', 790: 'money', 829: 'macaddr', 869: 'inet',
  1042: 'bpchar', 1043: 'varchar', 1082: 'date', 1083: 'time', 1114: 'timestamp', 1184: 'timestamptz', 1186: 'interval', 1266: 'timetz',
  1560: 'bit', 1562: 'varbit', 1700: 'numeric', 2205: 'regclass', 2206: 'regtype', 2950: 'uuid', 3802: 'jsonb', 3904: 'int4range',
  1007: 'int4[]', 1009: 'text[]', 1015: 'varchar[]', 1016: 'int8[]', 1021: 'float4[]', 1022: 'float8[]', 1000: 'bool[]', 2951: 'uuid[]', 3807: 'jsonb[]',
};

// First keyword of a statement, skipping comments and opening parentheses.
function firstWord(sql) {
  let s = String(sql);
  for (;;) {
    const t = s.replace(/^\s+/, '');
    if (t.startsWith('--')) { const i = t.indexOf('\n'); s = i < 0 ? '' : t.slice(i + 1); continue; }
    if (t.startsWith('/*')) { const i = t.indexOf('*/'); s = i < 0 ? '' : t.slice(i + 2); continue; }
    s = t;
    break;
  }
  const m = /^[(\s]*([A-Za-z]+)/.exec(s);
  return m ? m[1].toUpperCase() : '';
}

// Splits "a integer, b numeric(10,2) DEFAULT 5" at top-level commas.
function splitTopLevel(s) {
  const out = [];
  let depth = 0, cur = '', quote = null;
  for (const ch of String(s)) {
    if (quote) { cur += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Execute-template argument list from pg_get_function_arguments() output.
function templateArgs(argText) {
  return splitTopLevel(argText).map(a => {
    const x = a.replace(/\s+DEFAULT\s[\s\S]*$/i, '').replace(/\s*=\s[\s\S]*$/, '');
    const m = /^(IN\s+|OUT\s+|INOUT\s+|VARIADIC\s+)?([\s\S]*)$/i.exec(x);
    const mode = (m[1] || 'IN').trim().toUpperCase();
    return { mode, text: m[2].trim() };
  }).filter(a => a.mode !== 'OUT')
    .map(a => `NULL /* ${a.text} */`).join(', ');
}

// ---------------------------------------------------------------- connection management

function baseConfig(spec, pg) {
  const { host, port } = hostPort(spec);
  const cfg = {
    host, port,
    user: spec.user || undefined,
    password: spec.password === undefined || spec.password === null || spec.password === '' ? undefined : String(spec.password),
    ssl: spec.encrypt ? { rejectUnauthorized: !spec.trustServerCertificate } : false,
    connectionTimeoutMillis: Math.max(1, Number(spec.connectTimeout) || 15) * 1000,
    application_name: spec.appName || 'Web SQL Studio',
    keepAlive: true,
    types: makeTypes(pg),
  };
  return cfg;
}

// Creates and connects a client; always has an 'error' listener (an unhandled one would crash the process).
async function newClient(conn, database) {
  const c = new conn.pg.Client({ ...conn.cfg, database });
  c.__dead = false;
  c.on('error', () => { c.__dead = true; });
  c.on('end', () => { c.__dead = true; });
  try {
    await c.connect();
  } catch (e) {
    c.__dead = true;
    try { c.end().catch(() => {}); } catch { /* ignore */ }
    throw e;
  }
  return c;
}

// Metadata client for one database (created on first use, shared by all tree queries on that database).
async function meta(conn, db) {
  if (conn.closed) throw new Error('The connection is closed');
  let p = conn.meta.get(db);
  if (p) {
    try {
      const c = await p;
      if (!c.__dead) return c;
    } catch { /* fall through and reconnect */ }
    if (conn.meta.get(db) === p) conn.meta.delete(db);
  }
  p = newClient(conn, db);
  conn.meta.set(db, p);
  try {
    return await p;
  } catch (e) {
    if (conn.meta.get(db) === p) conn.meta.delete(db);
    throw e;
  }
}

// Runs a metadata query on `db` and returns the rows (retries once on a dead connection).
async function Q(conn, db, sql, params) {
  for (let attempt = 0; ; attempt++) {
    const c = await meta(conn, db);
    try {
      return (await c.query(sql, params || [])).rows;
    } catch (e) {
      if (attempt === 0 && c.__dead) continue;
      throw e;
    }
  }
}

async function connect(spec) {
  const pg = requireDriver('pg');
  const Cursor = requireDriver('pg-cursor');
  const cfg = baseConfig(spec, pg);
  const conn = { pg, Cursor, cfg, spec, meta: new Map(), sessions: new Set(), closed: false, info: null, vnum: 0, db0: spec.database || 'postgres' };
  try {
    let client;
    try {
      client = await newClient(conn, conn.db0);
    } catch (e) {
      if (!spec.database && e && e.code === '3D000') { conn.db0 = 'template1'; client = await newClient(conn, conn.db0); }
      else throw e;
    }
    conn.meta.set(conn.db0, Promise.resolve(client));
    const r = (await client.query("SELECT current_setting('server_version') AS v, current_setting('server_version_num') AS vn, current_user AS u, current_database() AS d")).rows[0];
    conn.vnum = Number(r.vn) || 0;
    conn.info = { version: r.v, user: r.u, database: r.d, server: hostPort(spec).shown };
  } catch (e) {
    await close(conn);
    throw new Error(errText(e));
  }
  return conn;
}

// Ends a client politely; a client stuck in a running query is torn down after 2 s.
async function endClient(c) {
  c.__dead = true;
  const ended = await Promise.race([c.end().then(() => true, () => true), new Promise(r => setTimeout(() => r(false), 2000))]);
  if (!ended) { try { c.connection.stream.destroy(); } catch { /* ignore */ } }
}

async function close(conn) {
  if (!conn || conn.closed) return;
  conn.closed = true;
  await Promise.allSettled([...conn.sessions].map(s => s.close()));
  const clients = await Promise.allSettled([...conn.meta.values()]);
  conn.meta.clear();
  await Promise.allSettled(clients.filter(r => r.status === 'fulfilled').map(r => endClient(r.value)));
}

// ---------------------------------------------------------------- metadata

const procKind = conn => (conn.vnum >= 110000 ? 'p.prokind' : "CASE WHEN p.proisagg THEN 'a' ELSE 'f' END");
const notExtension = "NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')";

async function databases(conn) {
  const rows = await Q(conn, conn.db0,
    "SELECT datname AS name FROM pg_database WHERE NOT datistemplate AND datallowconn AND has_database_privilege(oid, 'CONNECT') ORDER BY datname");
  return rows.map(r => r.name);
}

const USER_SCHEMA = "n.nspname NOT LIKE 'pg\\_%' AND n.nspname <> 'information_schema'";

async function objects(conn, db) {
  const rows = await Q(conn, db,
    `SELECT n.nspname AS schema, c.relname AS name, CASE WHEN c.relkind IN ('v', 'm') THEN 'view' ELSE 'table' END AS type
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'p', 'f', 'v', 'm') AND ${USER_SCHEMA}
      ORDER BY n.nspname, c.relname LIMIT 50000`);
  return rows.map(r => ({ schema: r.schema, name: r.name, type: r.type }));
}

async function columns(conn, db, schema, name) {
  const rows = await Q(conn, db,
    `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type
       FROM pg_attribute a
      WHERE a.attrelid = (SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                           WHERE c.relname = $2 AND c.relkind IN ('r', 'p', 'f', 'v', 'm')
                             AND (CASE WHEN $1::text <> '' THEN n.nspname = $1 ELSE pg_table_is_visible(c.oid) END)
                           ORDER BY n.nspname LIMIT 1)
        AND a.attnum > 0 AND NOT a.attisdropped
      ORDER BY a.attnum`, [schema || '', name]);
  return rows.map(r => ({ name: r.name, type: r.type }));
}

async function relOid(conn, db, schema, name) {
  const rows = await Q(conn, db,
    'SELECT c.oid::text AS oid FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname = $2',
    [schema, name]);
  if (!rows.length) throw new Error(`Object "${schema}"."${name}" was not found`);
  return rows[0].oid;
}

// ---------------------------------------------------------------- Object Explorer

const node = o => ({ expandable: false, ...o });
const folder = (key, label, kind, count) => ({ key, label, icon: 'folder', expandable: true, kind, count: count === undefined ? null : count, row: { name: label } });
const qual = (schema, name) => q(schema) + '.' + q(name);
const scriptCreate = { label: 'Script as CREATE', script: 'create' };
const selectTop = (db, schema, name) => ({ label: 'Select Top 1000 Rows', sql: `SELECT * FROM ${qual(schema, name)} LIMIT 1000`, run: true, db });

function parsePath(path) {
  const c = { db: null, schema: null, obj: null, objTag: null, leafTag: null, leaf: null, last: path.length ? path[path.length - 1] : '' };
  for (const k of path) {
    const i = k.indexOf(':');
    if (i < 0) continue;
    const tag = k.slice(0, i), val = k.slice(i + 1);
    if (tag === 'db') c.db = val;
    else if (tag === 's') c.schema = val;
    else if (tag === 't' || tag === 'v' || tag === 'mv' || tag === 'f' || tag === 'p' || tag === 'q') { c.objTag = tag; c.obj = val; }
    else if (tag === 'c' || tag === 'i' || tag === 'k' || tag === 'tr' || tag === 'a') { c.leafTag = tag; c.leaf = val; }
  }
  return c;
}

async function tree(conn, path) {
  path = path || [];
  if (!path.length) return databaseNodes(conn);
  const c = parsePath(path);
  const last = c.last;
  if (last.startsWith('db:')) return schemaNodes(conn, c.db, false);
  if (last === 'sys') return schemaNodes(conn, c.db, true);
  if (last.startsWith('s:')) return schemaFolders(conn, c.db, c.schema);
  switch (last) {
    case 'tables': return tableNodes(conn, c.db, c.schema);
    case 'views': return viewNodes(conn, c.db, c.schema, 'v');
    case 'matviews': return viewNodes(conn, c.db, c.schema, 'm');
    case 'funcs': return routineNodes(conn, c.db, c.schema, false);
    case 'procs': return routineNodes(conn, c.db, c.schema, true);
    case 'seqs': return sequenceNodes(conn, c.db, c.schema);
    case 'columns': return columnNodes(conn, c.db, c.schema, c.obj);
    case 'indexes': return indexNodes(conn, c.db, c.schema, c.obj);
    case 'constraints': return constraintNodes(conn, c.db, c.schema, c.obj);
    case 'triggers': return triggerNodes(conn, c.db, c.schema, c.obj);
    case 'params': return paramNodes(conn, c.db, c.obj);
    default: break;
  }
  if (last.startsWith('t:')) return tableFolders(conn, c.db, c.schema, c.obj);
  if (last.startsWith('v:')) return [folder('columns', 'Columns', 'columns')];
  if (last.startsWith('mv:')) return [folder('columns', 'Columns', 'columns'), folder('indexes', 'Indexes', 'indexes')];
  if (last.startsWith('f:') || last.startsWith('p:')) return [folder('params', 'Parameters', 'params')];
  return [];
}

async function databaseNodes(conn) {
  const rows = await Q(conn, conn.db0,
    `SELECT d.datname AS name, pg_get_userbyid(d.datdba) AS owner, pg_encoding_to_char(d.encoding) AS encoding,
            has_database_privilege(d.oid, 'CONNECT') AS ok,
            CASE WHEN has_database_privilege(d.oid, 'CONNECT') THEN pg_database_size(d.oid) END AS size_bytes
       FROM pg_database d WHERE NOT d.datistemplate AND d.datallowconn ORDER BY d.datname`);
  return rows.map(r => node({
    key: 'db:' + r.name, label: r.name, icon: 'db', expandable: !!r.ok, dim: !r.ok, kind: 'schemas', drag: q(r.name),
    row: { name: r.name, size_mb: num(r.size_bytes) === null ? null : Math.round(num(r.size_bytes) / 1048576 * 100) / 100, owner: r.owner, encoding: r.encoding },
    actions: [{ label: 'New Query', sql: '', run: false, db: r.name }, scriptCreate],
  }));
}

async function schemaNodes(conn, db, system) {
  const rows = await Q(conn, db,
    `SELECT n.nspname AS name, pg_get_userbyid(n.nspowner) AS owner,
            (n.nspname LIKE 'pg\\_%' OR n.nspname = 'information_schema') AS sys
       FROM pg_namespace n
      WHERE n.nspname NOT LIKE 'pg\\_toast%' AND n.nspname NOT LIKE 'pg\\_temp%' AND n.nspname <> 'pg_toast'
      ORDER BY n.nspname`);
  const list = rows.filter(r => !!r.sys === system);
  const out = list.map(r => node({
    key: 's:' + r.name, label: r.name, icon: 'schema', expandable: true, kind: 'generic', drag: q(r.name),
    row: { name: r.name, owner: r.owner },
    actions: [{ label: 'New Query', sql: '', run: false, db }, scriptCreate],
  }));
  if (!system) {
    const n = rows.filter(r => r.sys).length;
    if (n) out.push(folder('sys', 'System Schemas', 'schemas', n));
  }
  return out;
}

async function schemaFolders(conn, db, schema) {
  const [rel, proc] = await Promise.all([
    Q(conn, db,
      `SELECT count(*) FILTER (WHERE c.relkind IN ('r', 'p', 'f')) AS tables_n, count(*) FILTER (WHERE c.relkind = 'v') AS views_n,
              count(*) FILTER (WHERE c.relkind = 'm') AS mviews_n, count(*) FILTER (WHERE c.relkind = 'S') AS seqs_n
         FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1`, [schema]),
    Q(conn, db,
      `SELECT count(*) FILTER (WHERE k IN ('f', 'w')) AS funcs_n, count(*) FILTER (WHERE k = 'p') AS procs_n
         FROM (SELECT ${procKind(conn)} AS k FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                WHERE n.nspname = $1 AND ${notExtension}) s`, [schema]),
  ]);
  const out = [
    folder('tables', 'Tables', 'tables', num(rel[0].tables_n)),
    folder('views', 'Views', 'objects', num(rel[0].views_n)),
    folder('matviews', 'Materialized Views', 'objects', num(rel[0].mviews_n)),
    folder('funcs', 'Functions', 'objects', num(proc[0].funcs_n)),
  ];
  if (conn.vnum >= 110000) out.push(folder('procs', 'Procedures', 'objects', num(proc[0].procs_n)));
  out.push(folder('seqs', 'Sequences', 'objects', num(rel[0].seqs_n)));
  return out;
}

async function tableNodes(conn, db, schema) {
  const rows = await Q(conn, db,
    `SELECT c.relname AS name, c.relkind AS kind, pg_get_userbyid(c.relowner) AS owner, c.reltuples::float8 AS tuples,
            CASE WHEN c.relkind = 'r' THEN pg_relation_size(c.oid) END AS data_bytes,
            CASE WHEN c.relkind = 'r' THEN pg_indexes_size(c.oid) END AS index_bytes
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = $1 AND c.relkind IN ('r', 'p', 'f') ORDER BY c.relname`, [schema]);
  return rows.map(r => {
    const data = num(r.data_bytes), idx = num(r.index_bytes), tuples = num(r.tuples);
    return node({
      key: 't:' + r.name, label: r.name, icon: 'table', expandable: true, kind: 'generic', drag: qual(schema, r.name),
      sub: r.kind === 'p' ? '(partitioned)' : r.kind === 'f' ? '(foreign)' : undefined,
      row: {
        name: r.name, sch: schema, created: null, row_count: tuples === null || tuples < 0 ? null : Math.round(tuples),
        data_kb: kb(data), index_kb: kb(idx), modified: null, reserved_kb: data === null && idx === null ? null : kb((data || 0) + (idx || 0)), owner: r.owner,
      },
      actions: [selectTop(db, schema, r.name), scriptCreate],
    });
  });
}

async function tableFolders(conn, db, schema, table) {
  const oid = await relOid(conn, db, schema, table);
  const [r] = await Q(conn, db,
    `SELECT (SELECT count(*) FROM pg_attribute WHERE attrelid = $1::oid AND attnum > 0 AND NOT attisdropped) AS cols_n,
            (SELECT count(*) FROM pg_index WHERE indrelid = $1::oid) AS idx_n,
            (SELECT count(*) FROM pg_constraint WHERE conrelid = $1::oid AND contype <> 'n') AS con_n,
            (SELECT count(*) FROM pg_trigger WHERE tgrelid = $1::oid AND NOT tgisinternal) AS trg_n`, [oid]);
  return [
    folder('columns', 'Columns', 'columns', num(r.cols_n)),
    folder('indexes', 'Indexes', 'indexes', num(r.idx_n)),
    folder('constraints', 'Constraints', 'constraints', num(r.con_n)),
    folder('triggers', 'Triggers', 'triggers', num(r.trg_n)),
  ];
}

async function viewNodes(conn, db, schema, relkind) {
  const rows = await Q(conn, db,
    `SELECT c.relname AS name, pg_get_userbyid(c.relowner) AS owner
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relkind = $2 ORDER BY c.relname`, [schema, relkind]);
  const mat = relkind === 'm';
  return rows.map(r => node({
    key: (mat ? 'mv:' : 'v:') + r.name, label: r.name, icon: 'view', expandable: true, kind: 'generic', drag: qual(schema, r.name),
    row: { name: r.name, sch: schema, created: null, modified: null, type_desc: mat ? 'MATERIALIZED VIEW' : 'VIEW' },
    actions: [selectTop(db, schema, r.name), scriptCreate],
  }));
}

async function routineNodes(conn, db, schema, procedures) {
  const kinds = procedures ? "('p')" : "('f', 'w')";
  const rows = await Q(conn, db,
    `SELECT p.oid::text AS oid, p.proname AS name, pg_get_function_arguments(p.oid) AS args, pg_get_function_identity_arguments(p.oid) AS id_args,
            CASE WHEN ${procKind(conn)} = 'p' THEN NULL ELSE pg_get_function_result(p.oid) END AS result
       FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = $1 AND ${procKind(conn)} IN ${kinds} AND ${notExtension}
      ORDER BY p.proname, p.oid`, [schema]);
  return rows.map(r => {
    const full = qual(schema, r.name);
    let call;
    if (procedures) call = `CALL ${full}(${templateArgs(r.args)});`;
    else if (/^(SETOF\s|TABLE\()/i.test(r.result || '')) call = `SELECT * FROM ${full}(${templateArgs(r.args)});`;
    else call = `SELECT ${full}(${templateArgs(r.args)});`;
    return node({
      key: (procedures ? 'p:' : 'f:') + r.oid, label: `${r.name}(${r.id_args})`, icon: procedures ? 'proc' : 'func', expandable: true, kind: 'generic',
      sub: r.result ? `(returns ${r.result})` : undefined, drag: full,
      row: { name: `${r.name}(${r.id_args})`, sch: schema, created: null, modified: null, type_desc: procedures ? 'PROCEDURE' : 'FUNCTION' },
      actions: [scriptCreate, { label: procedures ? 'Execute Procedure' : 'Select Function', sql: call, run: false, db }],
    });
  });
}

async function sequenceNodes(conn, db, schema) {
  const rows = await Q(conn, db,
    `SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relkind = 'S' ORDER BY c.relname`, [schema]);
  return rows.map(r => node({
    key: 'q:' + r.name, label: r.name, icon: 'seq', drag: qual(schema, r.name),
    row: { name: r.name, sch: schema, created: null, modified: null, type_desc: 'SEQUENCE' },
    actions: [{ label: 'Select Next Value', sql: `SELECT nextval(${lit(qual(schema, r.name))});`, run: false, db }, scriptCreate],
  }));
}

async function columnNodes(conn, db, schema, table) {
  const oid = await relOid(conn, db, schema, table);
  const identity = conn.vnum >= 100000 ? "a.attidentity <> ''" : 'false';
  const rows = await Q(conn, db,
    `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, NOT a.attnotnull AS nullable,
            EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = a.attrelid AND i.indisprimary AND a.attnum = ANY (i.indkey)) AS pk,
            EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conrelid = a.attrelid AND k.contype = 'f' AND a.attnum = ANY (k.conkey)) AS fk,
            (${identity} OR pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval(%') AS identity,
            pg_get_expr(d.adbin, d.adrelid) AS dflt,
            CASE WHEN a.attcollation <> 0 AND a.attcollation <> t.typcollation THEN (SELECT collname FROM pg_collation WHERE oid = a.attcollation) END AS coll
       FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid
       LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = $1::oid AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`, [oid]);
  return rows.map(r => {
    const sub = '(' + [r.pk ? 'PK' : null, r.fk ? 'FK' : null, r.type, r.nullable ? 'null' : 'not null'].filter(Boolean).join(', ') + ')';
    return node({
      key: 'c:' + r.name, label: r.name, icon: r.pk ? 'key' : r.fk ? 'fkey' : 'col', sub, drag: q(r.name),
      row: { name: r.name, data_type: r.type, nullable: !!r.nullable, pk: !!r.pk, fk: !!r.fk, identity: !!r.identity, default: r.dflt, collation: r.coll },
    });
  });
}

async function indexNodes(conn, db, schema, table) {
  const oid = await relOid(conn, db, schema, table);
  const nkey = conn.vnum >= 110000 ? 'i.indnkeyatts' : 'i.indnatts';
  const rows = await Q(conn, db,
    `SELECT ic.relname AS name, am.amname AS method, i.indisunique AS uniq, i.indisprimary AS pk, i.indisvalid AS valid,
            ${nkey}::int AS nkey, pg_get_expr(i.indpred, i.indrelid) AS filter,
            ARRAY(SELECT pg_get_indexdef(i.indexrelid, k, true) FROM generate_series(1, i.indnatts) k ORDER BY k) AS cols
       FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid JOIN pg_am am ON am.oid = ic.relam
      WHERE i.indrelid = $1::oid ORDER BY ic.relname`, [oid]);
  return rows.map(r => node({
    key: 'i:' + r.name, label: r.name, icon: r.pk ? 'key' : 'index', sub: `(${r.uniq ? 'Unique' : 'Non-Unique'}, ${r.method})`,
    row: { name: r.name, kind: r.method, unique: !!r.uniq, keys: r.cols.slice(0, r.nkey).join(', '), include: r.cols.slice(r.nkey).join(', '), filter: r.filter, disabled: !r.valid },
  }));
}

const CONSTRAINT_KINDS = { p: 'PRIMARY KEY', u: 'UNIQUE', f: 'FOREIGN KEY', c: 'CHECK', x: 'EXCLUDE', t: 'CONSTRAINT TRIGGER' };

async function constraintNodes(conn, db, schema, table) {
  const oid = await relOid(conn, db, schema, table);
  const rows = await Q(conn, db,
    `SELECT k.conname AS name, k.contype::text AS type, pg_get_constraintdef(k.oid, true) AS def,
            ARRAY(SELECT a.attname::text FROM unnest(k.conkey) WITH ORDINALITY u(attnum, ord) JOIN pg_attribute a ON a.attrelid = k.conrelid AND a.attnum = u.attnum ORDER BY u.ord) AS cols,
            CASE WHEN k.contype = 'f' THEN k.confrelid::regclass::text END AS ref_table,
            CASE WHEN k.contype = 'f' THEN ARRAY(SELECT a.attname::text FROM unnest(k.confkey) WITH ORDINALITY u(attnum, ord) JOIN pg_attribute a ON a.attrelid = k.confrelid AND a.attnum = u.attnum ORDER BY u.ord) END AS ref_cols
       FROM pg_constraint k WHERE k.conrelid = $1::oid AND k.contype <> 'n'
      ORDER BY CASE k.contype WHEN 'p' THEN 0 WHEN 'u' THEN 1 WHEN 'f' THEN 2 ELSE 3 END, k.conname`, [oid]);
  return rows.map(r => {
    const kind = CONSTRAINT_KINDS[r.type] || r.type;
    const cols = (r.cols || []).join(', ');
    const ref = r.ref_table ? `${r.ref_table}(${(r.ref_cols || []).join(', ')})` : '';
    return node({
      key: 'k:' + r.name, label: r.name, icon: r.type === 'f' ? 'fkey' : r.type === 'p' || r.type === 'u' ? 'key' : 'check',
      sub: `(${kind.toLowerCase()})`,
      row: { name: r.name, kind, cols, ref, column: cols, definition: r.def },
      actions: [scriptCreate],
    });
  });
}

async function triggerNodes(conn, db, schema, table) {
  const oid = await relOid(conn, db, schema, table);
  const rows = await Q(conn, db,
    `SELECT t.tgname AS name, t.tgenabled::text AS enabled, t.tgtype::int AS type FROM pg_trigger t
      WHERE t.tgrelid = $1::oid AND NOT t.tgisinternal ORDER BY t.tgname`, [oid]);
  return rows.map(r => {
    const t = r.type;
    const timing = t & 64 ? 'INSTEAD OF' : t & 2 ? 'BEFORE' : 'AFTER';
    const events = [t & 4 ? 'INSERT' : null, t & 8 ? 'DELETE' : null, t & 16 ? 'UPDATE' : null, t & 32 ? 'TRUNCATE' : null].filter(Boolean).join(' OR ');
    return node({
      key: 'tr:' + r.name, label: r.name, icon: 'trigger', sub: `(${timing} ${events})`,
      row: { name: r.name, instead_of: !!(t & 64), disabled: r.enabled === 'D' },
      actions: [scriptCreate],
    });
  });
}

async function paramNodes(conn, db, procOid) {
  const rows = await Q(conn, db,
    `SELECT t.ord::int AS ord, COALESCE(p.proargnames[t.ord], '') AS name, format_type(t.typ, NULL) AS type,
            COALESCE(p.proargmodes[t.ord], 'i')::text AS mode, p.pronargdefaults::int AS ndef
       FROM pg_proc p CROSS JOIN LATERAL unnest(COALESCE(p.proallargtypes, p.proargtypes::oid[])) WITH ORDINALITY AS t(typ, ord)
      WHERE p.oid = $1::oid ORDER BY t.ord`, [procOid]);
  const dirs = { i: 'IN', o: 'OUT', b: 'INOUT', v: 'VARIADIC', t: 'TABLE' };
  const inputs = rows.filter(r => r.mode === 'i' || r.mode === 'b' || r.mode === 'v');
  return rows.map(r => {
    const pos = inputs.indexOf(r);
    const hasDefault = pos >= 0 && pos >= inputs.length - r.ndef;
    const name = r.name || `$${r.ord}`;
    return node({
      key: 'a:' + r.ord, label: name, icon: 'param', sub: `(${dirs[r.mode] || r.mode}, ${r.type})`,
      row: { name, data_type: r.type, direction: dirs[r.mode] || r.mode, has_default: hasDefault },
    });
  });
}

// ---------------------------------------------------------------- script

async function script(conn, path, kind) {
  if (kind && kind !== 'create') throw new Error(`Unsupported script kind "${kind}"`);
  const c = parsePath(path || []);
  const { db, schema } = c;
  const last = c.last;
  const header = db ? `-- Database: ${db}\n\n` : '';

  if (last.startsWith('db:')) {
    const r = (await Q(conn, conn.db0,
      `SELECT d.datname AS name, pg_get_userbyid(d.datdba) AS owner, pg_encoding_to_char(d.encoding) AS enc, d.datcollate AS coll, d.datctype AS ctype
         FROM pg_database d WHERE d.datname = $1`, [db]))[0];
    if (!r) throw new Error('Database not found');
    return `CREATE DATABASE ${q(r.name)}\n    WITH OWNER = ${q(r.owner)}\n    ENCODING = ${lit(r.enc)}\n    LC_COLLATE = ${lit(r.coll)}\n    LC_CTYPE = ${lit(r.ctype)};\n`;
  }
  if (last.startsWith('s:')) {
    const r = (await Q(conn, db, 'SELECT pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname = $1', [schema]))[0];
    if (!r) throw new Error('Schema not found');
    return `${header}CREATE SCHEMA ${q(schema)} AUTHORIZATION ${q(r.owner)};\n`;
  }
  if (last.startsWith('t:')) return header + await scriptTable(conn, db, schema, c.obj);
  if (last.startsWith('v:') || last.startsWith('mv:')) return header + await scriptView(conn, db, schema, c.obj, last.startsWith('mv:'));
  if (last.startsWith('f:') || last.startsWith('p:')) {
    const r = (await Q(conn, db, 'SELECT pg_get_functiondef($1::oid) AS def', [c.obj]))[0];
    if (!r || !r.def) throw new Error('Function not found');
    return `${header}${r.def.replace(/\s+$/, '')};\n`;
  }
  if (last.startsWith('q:')) return header + await scriptSequence(conn, db, schema, c.obj);
  if (last.startsWith('tr:')) {
    const oid = await relOid(conn, db, schema, c.obj);
    const r = (await Q(conn, db, 'SELECT pg_get_triggerdef(t.oid, true) AS def FROM pg_trigger t WHERE t.tgrelid = $1::oid AND t.tgname = $2 AND NOT t.tgisinternal', [oid, c.leaf]))[0];
    if (!r) throw new Error('Trigger not found');
    return `${header}${r.def};\n`;
  }
  if (last.startsWith('i:')) {
    const oid = await relOid(conn, db, schema, c.obj);
    const r = (await Q(conn, db, 'SELECT pg_get_indexdef(i.indexrelid) AS def FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid WHERE i.indrelid = $1::oid AND ic.relname = $2', [oid, c.leaf]))[0];
    if (!r) throw new Error('Index not found');
    return `${header}${r.def};\n`;
  }
  if (last.startsWith('k:')) {
    const oid = await relOid(conn, db, schema, c.obj);
    const r = (await Q(conn, db, 'SELECT pg_get_constraintdef(k.oid, true) AS def FROM pg_constraint k WHERE k.conrelid = $1::oid AND k.conname = $2', [oid, c.leaf]))[0];
    if (!r) throw new Error('Constraint not found');
    return `${header}ALTER TABLE ${qual(schema, c.obj)}\n    ADD CONSTRAINT ${q(c.leaf)} ${r.def};\n`;
  }
  throw new Error('Script as CREATE is not available for this object');
}

async function scriptTable(conn, db, schema, table) {
  const [h] = await Q(conn, db,
    `SELECT c.oid::text AS oid, c.relkind::text AS kind, c.relpersistence::text AS persistence, c.relispartition AS ispart,
            pg_get_expr(c.relpartbound, c.oid) AS bound, CASE WHEN c.relkind = 'p' THEN pg_get_partkeydef(c.oid) END AS partkey, c.reloptions AS opts
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname = $2`, [schema, table]);
  if (!h) throw new Error(`Table "${schema}"."${table}" was not found`);
  const name = qual(schema, table);
  const parts = [];

  const extra = [];
  const indexes = await Q(conn, db,
    `SELECT pg_get_indexdef(i.indexrelid) AS def FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid
      WHERE i.indrelid = $1::oid
        AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid AND k.conrelid = i.indrelid AND k.contype IN ('p', 'u', 'x'))
      ORDER BY ic.relname`, [h.oid]);
  for (const r of indexes) extra.push(r.def + ';');
  const triggers = await Q(conn, db, 'SELECT pg_get_triggerdef(t.oid, true) AS def FROM pg_trigger t WHERE t.tgrelid = $1::oid AND NOT t.tgisinternal ORDER BY t.tgname', [h.oid]);
  for (const r of triggers) extra.push(r.def + ';');

  if (h.ispart) {
    const [p] = await Q(conn, db,
      `SELECT pn.nspname AS schema, pc.relname AS name FROM pg_inherits i JOIN pg_class pc ON pc.oid = i.inhparent JOIN pg_namespace pn ON pn.oid = pc.relnamespace
        WHERE i.inhrelid = $1::oid`, [h.oid]);
    let ddl = `CREATE TABLE ${name} PARTITION OF ${p ? qual(p.schema, p.name) : '/* parent */'}\n    ${h.bound}`;
    if (h.partkey) ddl += `\n    PARTITION BY ${h.partkey}`;
    parts.push(ddl + ';');
    return [...parts, ...extra].join('\n\n') + '\n';
  }

  const cols = await Q(conn, db,
    `SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull, pg_get_expr(d.adbin, d.adrelid) AS dflt,
            ${conn.vnum >= 100000 ? 'a.attidentity::text' : "''"} AS identity, ${conn.vnum >= 120000 ? 'a.attgenerated::text' : "''"} AS generated,
            CASE WHEN a.attcollation <> 0 AND a.attcollation <> t.typcollation
                 THEN (SELECT quote_ident(cn.nspname) || '.' || quote_ident(co.collname) FROM pg_collation co JOIN pg_namespace cn ON cn.oid = co.collnamespace WHERE co.oid = a.attcollation) END AS coll
       FROM pg_attribute a JOIN pg_type t ON t.oid = a.atttypid LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = $1::oid AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attnum`, [h.oid]);
  const lines = cols.map(a => {
    let s = `    ${q(a.name)} ${a.type}`;
    if (a.coll) s += ` COLLATE ${a.coll}`;
    if (a.identity === 'a') s += ' GENERATED ALWAYS AS IDENTITY';
    else if (a.identity === 'd') s += ' GENERATED BY DEFAULT AS IDENTITY';
    else if (a.generated === 's') s += ` GENERATED ALWAYS AS (${a.dflt}) STORED`;
    else if (a.dflt !== null && a.dflt !== undefined) s += ` DEFAULT ${a.dflt}`;
    if (a.notnull) s += ' NOT NULL';
    return s;
  });
  const cons = await Q(conn, db,
    `SELECT k.conname AS name, pg_get_constraintdef(k.oid, true) AS def FROM pg_constraint k
      WHERE k.conrelid = $1::oid AND k.contype <> 'n'
      ORDER BY CASE k.contype WHEN 'p' THEN 0 WHEN 'u' THEN 1 WHEN 'c' THEN 2 WHEN 'f' THEN 3 ELSE 4 END, k.conname`, [h.oid]);
  for (const k of cons) lines.push(`    CONSTRAINT ${q(k.name)} ${k.def}`);

  const foreign = h.kind === 'f';
  let ddl = `CREATE ${foreign ? 'FOREIGN ' : h.persistence === 'u' ? 'UNLOGGED ' : ''}TABLE ${name} (\n${lines.join(',\n')}\n)`;
  if (h.partkey) ddl += `\nPARTITION BY ${h.partkey}`;
  if (foreign) {
    const [f] = await Q(conn, db, 'SELECT s.srvname AS server, ft.ftoptions AS opts FROM pg_foreign_table ft JOIN pg_foreign_server s ON s.oid = ft.ftserver WHERE ft.ftrelid = $1::oid', [h.oid]);
    if (f) {
      ddl += `\nSERVER ${q(f.server)}`;
      if (f.opts && f.opts.length) ddl += `\nOPTIONS (${f.opts.map(o => { const i = o.indexOf('='); return `${o.slice(0, i)} ${lit(o.slice(i + 1))}`; }).join(', ')})`;
    }
  } else if (h.opts && h.opts.length) {
    ddl += `\nWITH (${h.opts.join(', ')})`;
  }
  parts.push(ddl + ';');
  return [...parts, ...extra].join('\n\n') + '\n';
}

async function scriptView(conn, db, schema, name, materialized) {
  const [r] = await Q(conn, db,
    `SELECT c.oid::text AS oid, pg_get_viewdef(c.oid, true) AS def, c.reloptions AS opts, c.relispopulated AS populated
       FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = $1 AND c.relname = $2 AND c.relkind = $3`, [schema, name, materialized ? 'm' : 'v']);
  if (!r) throw new Error(`View "${schema}"."${name}" was not found`);
  const body = String(r.def).replace(/;\s*$/, '');
  const opts = r.opts && r.opts.length ? `\nWITH (${r.opts.join(', ')})` : '';
  if (!materialized) return `CREATE OR REPLACE VIEW ${qual(schema, name)}${opts} AS\n${body};\n`;
  let out = `CREATE MATERIALIZED VIEW ${qual(schema, name)}${opts} AS\n${body}\nWITH ${r.populated ? '' : 'NO '}DATA;\n`;
  const idx = await Q(conn, db, 'SELECT pg_get_indexdef(i.indexrelid) AS def FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid WHERE i.indrelid = $1::oid ORDER BY ic.relname', [r.oid]);
  for (const i of idx) out += `\n${i.def};\n`;
  return out;
}

async function scriptSequence(conn, db, schema, name) {
  const [r] = await Q(conn, db,
    `SELECT data_type::text AS type, start_value::text AS start, min_value::text AS min, max_value::text AS max, increment_by::text AS inc, cycle, cache_size::text AS cache
       FROM pg_sequences WHERE schemaname = $1 AND sequencename = $2`, [schema, name]);
  if (!r) throw new Error(`Sequence "${schema}"."${name}" was not found`);
  return `CREATE SEQUENCE ${qual(schema, name)}\n    AS ${r.type}\n    INCREMENT BY ${r.inc}\n    MINVALUE ${r.min}\n    MAXVALUE ${r.max}\n    START WITH ${r.start}\n    CACHE ${r.cache}\n    ${r.cycle ? '' : 'NO '}CYCLE;\n`;
}

// ---------------------------------------------------------------- query sessions

const EXPLAINABLE = new Set(['SELECT', 'WITH', 'INSERT', 'UPDATE', 'DELETE', 'MERGE', 'VALUES', 'TABLE', 'EXECUTE', 'DECLARE']);
const WITH_TAG = /^(INSERT|UPDATE|DELETE|MERGE|COPY)\b/;

function pgError(err, stmt, text, prefixLen) {
  if (!err || (err.code === undefined && err.severity === undefined)) return { type: 'err', message: errText(err), line: stmt ? stmt.line : null };
  let message = String(err.message || 'Error');
  if (err.code) message += ` (SQLSTATE ${err.code})`;
  if (err.detail) message += `\nDETAIL: ${err.detail}`;
  if (err.hint) message += `\nHINT: ${err.hint}`;
  const pos = err.position ? Number(err.position) - 1 - (prefixLen || 0) : undefined;
  return errorItem({ message }, stmt, text, Number.isInteger(pos) && pos >= 0 ? pos : undefined);
}

function noticeText(n) {
  let s = `${n.severity || 'NOTICE'}: ${n.message}`;
  if (n.detail) s += `\nDETAIL: ${n.detail}`;
  if (n.hint) s += `\nHINT: ${n.hint}`;
  return s;
}

class PgSession {
  constructor(conn) {
    this.conn = conn;
    this.client = null;
    this.db = conn.spec.database || conn.db0;
    this.lastTag = null;
    this.onNotice = null;
    this.typeCache = new Map();
    this.closed = false;
  }

  async _connect(database) {
    const c = await newClient(this.conn, database);
    c.on('notice', n => { if (this.onNotice) this.onNotice(n); });
    if (c.connection) c.connection.on('commandComplete', m => { this.lastTag = m && m.text ? m.text : null; });
    const old = this.client;
    this.client = c;
    this.db = database;
    this.typeCache = new Map();
    if (old) { try { old.end().catch(() => {}); } catch { /* ignore */ } }
  }

  async _ensure(database) {
    const want = database || this.db;
    if (this.client && !this.client.__dead && want === this.db) return;
    await this._connect(want);
  }

  async run(text, opts = {}) {
    const maxRows = Math.max(1, Math.floor(Number(opts.maxRows)) || 5000);
    const explain = opts.mode === 'explain';
    const items = [];
    let errors = 0;

    try {
      await this._ensure(opts.database);
    } catch (e) {
      items.push({ type: 'err', message: errText(e), line: null });
      return { items, errors: 1, database: this.db };
    }

    this.onNotice = n => items.push({ type: 'msg', text: noticeText(n) });
    try {
      for (const stmt of splitStatements(String(text || ''), 'postgres')) {
        let sql = stmt.sql;
        let prefix = 0;
        const w = firstWord(sql);
        if (/^COPY\b[\s\S]*\b(FROM\s+STDIN|TO\s+STDOUT)\b/i.test(sql)) {
          items.push({ type: 'err', message: 'COPY ... FROM STDIN / TO STDOUT is not supported here. Use COPY ... TO/FROM a file, or run a SELECT.', line: stmt.line });
          errors++;
          break;
        }
        if (explain && w !== 'SET' && w !== 'RESET') {
          if (!EXPLAINABLE.has(w)) {
            items.push({ type: 'msg', text: `-- Skipped (no execution plan for ${w || 'this statement'}): ${sql.length > 60 ? sql.slice(0, 60) + '...' : sql}` });
            continue;
          }
          sql = 'EXPLAIN ' + sql;
          prefix = 8;
        }
        try {
          await this._exec(sql, maxRows, items);
        } catch (e) {
          items.push(pgError(e, stmt, text, prefix));
          errors++;
          break;
        }
      }
    } finally {
      this.onNotice = null;
    }
    return { items, errors, database: this.db };
  }

  // Runs one statement through a cursor so that at most maxRows(+1) rows are ever held in memory.
  async _exec(sql, maxRows, items) {
    const { Cursor, cfg } = this.conn;
    this.lastTag = null;
    const cursor = this.client.query(new Cursor(sql, null, { rowMode: 'array', types: cfg.types }));
    const read = n => new Promise((resolve, reject) => cursor.read(n, (err, rows, result) => (err ? reject(err) : resolve({ rows, result }))));
    let g = null;
    let fields = null;
    let more = false;
    let fetched = 0;
    let result = null;
    // A read error (e.g. a runtime error on row N) rejects here; the partial grid already sits in `items`.
    for (;;) {
      const want = Math.min(CHUNK, maxRows + 1 - fetched);
      const res = await read(want);
      result = res.result;
      if (!g && result.fields && result.fields.length) {
        fields = result.fields;
        g = grid(fields.map(f => ({ name: f.name, type: TYPE_NAMES[f.dataTypeID] || '' })), maxRows);
        items.push(g.item);
      }
      for (const row of res.rows) {
        fetched++;
        if (g && g.item.rows.length < maxRows) g.add(row);
      }
      if (fetched > maxRows) { more = true; break; }
      if (res.rows.length < want) break;
    }
    if (more) await cursor.close().catch(() => {});
    if (g) await this._fixTypes(g, fields);

    if (g) {
      if (more) items.push({ type: 'msg', text: `Showing the first ${maxRows.toLocaleString('en-US')} rows (more rows are available; raise "Maximum rows" in Tools -> Options to see more).` });
      if (this.lastTag && WITH_TAG.test(this.lastTag)) items.push({ type: 'msg', text: this.lastTag });
      return;
    }
    let tag = this.lastTag;
    if (!tag && result && result.command) tag = result.rowCount !== null && result.rowCount !== undefined ? `${result.command} ${result.rowCount}` : result.command;
    items.push({ type: 'msg', text: tag || 'Commands completed successfully.' });
  }

  // Resolves type names for OIDs that are not in the built-in table (enums, domains, extension types, arrays...).
  async _fixTypes(g, fields) {
    const missing = [...new Set(fields.map(f => f.dataTypeID).filter(o => !TYPE_NAMES[o] && !this.typeCache.has(o)))];
    if (missing.length && !this.client.__dead) {
      try {
        const r = await this.client.query('SELECT oid::text AS oid, format_type(oid, NULL) AS name FROM pg_type WHERE oid = ANY($1::oid[])', [missing]);
        for (const row of r.rows) this.typeCache.set(Number(row.oid), row.name);
      } catch { /* leave the type blank */ }
    }
    fields.forEach((f, i) => { g.item.columns[i].type = TYPE_NAMES[f.dataTypeID] || this.typeCache.get(f.dataTypeID) || ''; });
  }

  // pg_cancel_backend from a separate connection; the session stays usable.
  async cancel() {
    const c0 = this.client;
    if (!c0 || c0.__dead || !c0.processID) return;
    let k = null;
    try {
      k = await newClient(this.conn, this.db);
      await k.query('SELECT pg_cancel_backend($1)', [c0.processID]);
    } finally {
      if (k) { try { await k.end(); } catch { /* ignore */ } }
    }
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.conn.sessions.delete(this);
    const c = this.client;
    this.client = null;
    if (c) await endClient(c);
  }
}

async function openSession(conn) {
  const s = new PgSession(conn);
  await s._connect(s.db);
  conn.sessions.add(s);
  return s;
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  _internal: { firstWord, splitTopLevel, templateArgs, hostPort, pgError, makeTypes, parsePath, errText },
};
