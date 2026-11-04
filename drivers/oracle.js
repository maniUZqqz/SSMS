'use strict';
// Oracle driver (node-oracledb "Thin" mode: pure JavaScript, no Oracle Client needed).
// `database` in this app is an Oracle schema: the tab's schema is applied with ALTER SESSION SET CURRENT_SCHEMA.
//
// Object Explorer path scheme (keys appended to the path; the part before the first ':' is the key type):
//   []                                        -> own schema, other non-system schemas (s:<SCHEMA>) and the folder "sys"
//   [sys]                                     -> system schemas (s:<SCHEMA>)
//   [s:<S>]                                   -> folders: tables | views | procs | funcs | pkgs | seqs | trigs | syns
//   [s:<S>, tables]   -> t:<TABLE>            [s:<S>, views]  -> v:<VIEW> / m:<MATERIALIZED VIEW>
//   [s:<S>, procs]    -> p:<PROCEDURE>        [s:<S>, funcs]  -> f:<FUNCTION>        [s:<S>, pkgs] -> k:<PACKAGE>
//   [s:<S>, seqs]     -> q:<SEQUENCE>         [s:<S>, trigs]  -> g:<TRIGGER>         [s:<S>, syns] -> y:<SYNONYM>
//   [..., t:<T>]                              -> folders: cols | idx | cons | trg      (views: cols | trg)
//   [..., t:<T>, cols] -> c:<COLUMN>          [..., t:<T>, idx] -> x:<INDEX>
//   [..., t:<T>, cons] -> np|nu|nr|nc:<CONSTRAINT>  (primary key, unique, foreign key (ref), check)
//   [..., t:<T>, trg]  -> g:<TRIGGER>         [..., p:<P>] -> folder args -> a:<ARGUMENT>

const { grid, splitStatements, quoteIdent, errorItem, requireDriver } = require('./common');

const language = 'sql';
const Q = quoteIdent.oracle;

const DEFAULT_MAX_ROWS = 1000;
const FETCH_CHUNK = 500;
const OUTPUT_CHUNK = 100;           // DBMS_OUTPUT.GET_LINES batch
const OUTPUT_MAX_LINES = 20000;     // per statement; the rest stays in the buffer for the next one
const MAX_META_ROWS = 20000;

const SYSTEM_SCHEMA_RE = /^(SYS|SYSTEM|OUTLN|DBSNMP|XDB|MDSYS|CTXSYS|ORDSYS|ORDDATA|ORDPLUGINS|SI_INFORMTN_SCHEMA|WMSYS|EXFSYS|OLAPSYS|APPQOSSYS|ANONYMOUS|DIP|LBACSYS|DVSYS|DVF|AUDSYS|OJVMSYS|REMOTE_SCHEDULER_AGENT|PDADMIN|MDDATA|ORACLE_OCM|DBSFWUSER|DGPDB_INT|XS\$NULL|SPATIAL_[A-Z_]+|FLOWS_[A-Z0-9_]+|APEX_[A-Z0-9_]+|ORDS[A-Z0-9_]*|GSM[A-Z_]*|GG[A-Z_]*|SYS\$[A-Z0-9_$]*|SYS(BACKUP|DG|KM|RAC|MAN|ASM|OPER)|[A-Z0-9_]+SYS)$/;

// ---------------------------------------------------------------- formatting helpers

const p2 = n => String(n).padStart(2, '0');

function fmtDate(d, millis, utc) {
  if (d == null) return null;
  if (!(d instanceof Date)) return String(d);
  if (isNaN(d)) return String(d);
  const g = utc
    ? [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()]
    : [d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()];
  return `${String(g[0]).padStart(4, '0')}-${p2(g[1] + 1)}-${p2(g[2])} ${p2(g[3])}:${p2(g[4])}:${p2(g[5])}`
    + (millis ? '.' + String(g[6]).padStart(3, '0') : '') + (utc ? ' UTC' : '');
}

function fmtIntervalYM(v) {
  if (v == null) return null;
  const neg = v.years < 0 || v.months < 0;
  return `${neg ? '-' : '+'}${String(Math.abs(v.years)).padStart(2, '0')}-${p2(Math.abs(v.months))}`;
}

function fmtIntervalDS(v) {
  if (v == null) return null;
  const neg = [v.days, v.hours, v.minutes, v.seconds, v.fseconds].some(x => x < 0);
  return `${neg ? '-' : '+'}${p2(Math.abs(v.days))} ${p2(Math.abs(v.hours))}:${p2(Math.abs(v.minutes))}:${p2(Math.abs(v.seconds))}.${String(Math.abs(v.fseconds)).padStart(9, '0')}`;
}

// Column type shown in grid headers (from the result-set metadata).
function metaTypeName(m) {
  const n = m.dbTypeName || (m.dbType && m.dbType.columnTypeName) || '';
  switch (n) {
    case 'VARCHAR2': case 'NVARCHAR2': case 'CHAR': case 'NCHAR': case 'RAW':
      return m.byteSize ? `${n}(${m.byteSize})` : n;
    case 'NUMBER':
      if (m.scale === -127) return m.precision ? 'FLOAT' : 'NUMBER';
      if (!m.precision) return m.scale === 0 ? 'NUMBER(*,0)' : 'NUMBER';
      return m.scale ? `NUMBER(${m.precision},${m.scale})` : `NUMBER(${m.precision})`;
    default:
      return n;
  }
}

// Column type from ALL_TAB_COLUMNS rows.
function dictTypeName(r) {
  const t = r.DATA_TYPE;
  switch (t) {
    case 'NUMBER':
      if (r.DATA_PRECISION == null) return r.DATA_SCALE == null ? 'NUMBER' : `NUMBER(*,${r.DATA_SCALE})`;
      return r.DATA_SCALE ? `NUMBER(${r.DATA_PRECISION},${r.DATA_SCALE})` : `NUMBER(${r.DATA_PRECISION})`;
    case 'FLOAT':
      return r.DATA_PRECISION == null ? 'FLOAT' : `FLOAT(${r.DATA_PRECISION})`;
    case 'VARCHAR2': case 'CHAR':
      return `${t}(${r.CHAR_LENGTH || r.DATA_LENGTH}${r.CHAR_USED === 'C' ? ' CHAR' : ''})`;
    case 'NVARCHAR2': case 'NCHAR':
      return `${t}(${r.CHAR_LENGTH || r.DATA_LENGTH})`;
    case 'RAW':
      return `RAW(${r.DATA_LENGTH})`;
    default:
      return t;
  }
}

const cleanMessage = err => String((err && err.message) || err).replace(/\r?\n?Help: https?:\/\/\S+\s*$/, '').trim();

// ---------------------------------------------------------------- connection

function connectParams(oracledb, spec) {
  let user = String(spec.user || '').trim();
  let privilege;
  const m = /^(.*?)\s+as\s+(sysdba|sysoper|sysasm|sysbackup|sysdg|syskm|sysrac)$/i.exec(user);
  if (m) {
    user = m[1].trim();
    privilege = oracledb[m[2].toUpperCase()];
  }
  let server = String(spec.server || '').trim();
  let connectString;
  let tcps = false;
  if (server.startsWith('(')) {
    connectString = server;                                  // a full (DESCRIPTION=...) descriptor
  } else {
    const pm = /^(tcps?):\/\/(.*)$/i.exec(server);           // tcps://host switches to TLS (spec.encrypt is not used: its default is on)
    if (pm) { tcps = pm[1].toLowerCase() === 'tcps'; server = pm[2]; }
    const port = parseInt(spec.port, 10) || 1521;
    connectString = `${pm ? pm[1].toLowerCase() + '://' : ''}${server}:${port}/${String(spec.database || '').trim()}`;
  }
  const params = { user, password: String(spec.password == null ? '' : spec.password), connectString };
  if (privilege) params.privilege = privilege;
  const t = parseInt(spec.connectTimeout, 10);
  if (t > 0) { params.connectTimeout = t; params.transportConnectTimeout = t; }
  if (tcps && spec.trustServerCertificate) params.sslServerDNMatch = false;
  return params;
}

async function initConnection(db, appName) {
  try { db.module = appName || 'Web SQL Studio'; } catch { /* optional */ }
}

async function connect(spec) {
  const oracledb = requireDriver('oracledb');                // Thin mode: initOracleClient() is never called
  const params = connectParams(oracledb, spec);
  if (!params.user) throw new Error('User name is required.');
  let db;
  try {
    db = await oracledb.getConnection(params);
  } catch (e) {
    throw new Error(cleanMessage(e));
  }
  try {
    await initConnection(db, spec.appName);
    const ctx = (await db.execute(
      "SELECT SYS_CONTEXT('USERENV', 'SESSION_USER') AS u, SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS s FROM dual",
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT })).rows[0];
    return {
      oracledb, db, params, appName: spec.appName, sessions: new Set(), flags: {},
      user: ctx.U, schema: ctx.S,
      info: { version: db.oracleServerVersionString || String(db.oracleServerVersion || ''), user: ctx.U, database: ctx.S, server: String(spec.server || '') },
    };
  } catch (e) {
    try { await db.close(); } catch { /* ignore */ }
    throw new Error(cleanMessage(e));
  }
}

async function close(conn) {
  for (const s of [...conn.sessions]) await s.close();
  try { await conn.db.close(); } catch { /* already closed */ }
}

const LOST_RE = /DPY-4011|DPY-1001|NJS-500|NJS-003|NJS-024|ORA-03113|ORA-03114|ORA-03135|ORA-12537|ORA-12547|ORA-01012|ORA-00028|connection (is )?closed/i;
const isConnectionLost = e => LOST_RE.test((e && (e.message + ' ' + (e.code || ''))) || '');

// Metadata query on the shared connection (one automatic reconnect when the idle connection was dropped).
async function mq(conn, sql, binds = {}, opts = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const r = await conn.db.execute(sql, binds, { outFormat: conn.oracledb.OUT_FORMAT_OBJECT, maxRows: MAX_META_ROWS, ...opts });
      return r.rows || [];
    } catch (e) {
      if (attempt === 0 && isConnectionLost(e)) {
        try { await conn.db.close(); } catch { /* ignore */ }
        conn.db = await conn.oracledb.getConnection(conn.params);
        await initConnection(conn.db, conn.appName);
        conn.flags.ddlInit = false;
        continue;
      }
      throw new Error(cleanMessage(e));
    }
  }
}

// Tries a 12c+ query first and falls back to a version without the newer columns (ORA-00904).
async function mqCompat(conn, flag, sqlNew, sqlOld, binds) {
  if (conn.flags[flag] !== false) {
    try {
      const rows = await mq(conn, sqlNew, binds);
      conn.flags[flag] = true;
      return rows;
    } catch (e) {
      if (!/ORA-00904/.test(e.message)) throw e;
      conn.flags[flag] = false;
    }
  }
  return mq(conn, sqlOld, binds);
}

const TS = "'YYYY-MM-DD HH24:MI:SS'";

async function getUsers(conn) {
  const rows = await mqCompat(conn, 'oracleMaintained',
    `SELECT username, TO_CHAR(created, ${TS}) AS created, oracle_maintained AS maint FROM all_users ORDER BY username`,
    `SELECT username, TO_CHAR(created, ${TS}) AS created, 'N' AS maint FROM all_users ORDER BY username`);
  return rows.map(r => ({ name: r.USERNAME, created: r.CREATED, system: r.MAINT === 'Y' || SYSTEM_SCHEMA_RE.test(r.USERNAME) }));
}

async function databases(conn) {
  const users = (await getUsers(conn)).map(u => u.name);
  return [...users.filter(n => n === conn.user), ...users.filter(n => n !== conn.user)];
}

// ---------------------------------------------------------------- Object Explorer

const splitKey = key => {
  const i = key.indexOf(':');
  return i > 0 ? { prefix: key.slice(0, i), name: key.slice(i + 1) } : { folder: key };
};

const OWNING = new Set(['t', 'v', 'm', 'p', 'f']);     // key types whose children need the object name

function parsePath(p) {
  const ctx = { schema: null, obj: null, last: null };
  for (const key of p) {
    const k = splitKey(key);
    if (k.prefix === 's') { ctx.schema = k.name; ctx.obj = null; }
    else if (OWNING.has(k.prefix)) ctx.obj = k;
    ctx.last = k;
  }
  return ctx;
}

const folder = (key, label, kind) => ({ key, label, icon: 'folder', expandable: true, kind });
const qn = (schema, name) => `${Q(schema)}.${Q(name)}`;
const scriptAction = () => ({ label: 'Script as CREATE', script: 'create' });
const selectAction = (schema, name) => ({ label: 'Select Top 1000 Rows', sql: `SELECT * FROM ${qn(schema, name)} WHERE ROWNUM <= 1000`, run: true, db: schema });

async function schemaNodes(conn, system) {
  const users = await getUsers(conn);
  const mk = u => ({
    key: `s:${u.name}`, label: u.name, icon: 'schema', expandable: true, kind: 'generic', drag: Q(u.name),
    sub: u.name === conn.user ? '(current user)' : '',
    row: { name: u.name, created: u.created, size_mb: null, owner: '', encoding: '' },
  });
  if (system) return users.filter(u => u.system && u.name !== conn.user).map(mk);
  const own = users.filter(u => u.name === conn.user);
  const others = users.filter(u => u.name !== conn.user && !u.system);
  const sys = users.filter(u => u.system && u.name !== conn.user);
  const nodes = [...own, ...others].map(mk);
  if (sys.length) nodes.push({ ...folder('sys', 'System Schemas', 'schemas'), count: sys.length });
  return nodes;
}

const schemaFolders = () => [
  folder('tables', 'Tables', 'tables'), folder('views', 'Views', 'objects'), folder('procs', 'Procedures', 'objects'),
  folder('funcs', 'Functions', 'objects'), folder('pkgs', 'Packages', 'objects'), folder('seqs', 'Sequences', 'objects'),
  folder('trigs', 'Triggers', 'triggers'), folder('syns', 'Synonyms', 'objects'),
];

async function dbBlockKb(conn) {
  if (conn.blockKb) return conn.blockKb;
  let kb = 8;
  try {
    const o = conn.oracledb;
    const r = await conn.db.execute(
      "BEGIN :ok := DBMS_UTILITY.GET_PARAMETER_VALUE('db_block_size', :i, :s); END;",
      { ok: { dir: o.BIND_OUT, type: o.NUMBER }, i: { dir: o.BIND_INOUT, type: o.NUMBER, val: 0 }, s: { dir: o.BIND_INOUT, type: o.STRING, val: 'x', maxSize: 100 } });
    const bytes = Number(r.outBinds.i);
    if ([2048, 4096, 8192, 16384, 32768].includes(bytes)) kb = bytes / 1024;
  } catch { /* keep the 8 KB default */ }
  conn.blockKb = kb;
  return kb;
}

async function tableNodes(conn, schema) {
  const [rows, blockKb] = await Promise.all([mq(conn,
    `SELECT t.table_name AS name, TO_CHAR(o.created, ${TS}) AS created, TO_CHAR(o.last_ddl_time, ${TS}) AS modified,
            t.num_rows, t.blocks, t.temporary, o.status
       FROM all_tables t
       LEFT JOIN all_objects o ON o.owner = t.owner AND o.object_name = t.table_name AND o.object_type = 'TABLE' AND o.subobject_name IS NULL
      WHERE t.owner = :owner AND t.table_name NOT LIKE 'BIN$%' AND t.nested = 'NO' AND (t.iot_type IS NULL OR t.iot_type = 'IOT')
        AND NOT EXISTS (SELECT 1 FROM all_objects mv WHERE mv.owner = t.owner AND mv.object_name = t.table_name AND mv.object_type = 'MATERIALIZED VIEW')
      ORDER BY t.table_name`, { owner: schema }), dbBlockKb(conn)]);
  return rows.map(r => ({
    key: `t:${r.NAME}`, label: r.NAME, icon: 'table', expandable: true, kind: 'generic',
    sub: r.TEMPORARY === 'Y' ? '(temporary)' : '', count: r.NUM_ROWS == null ? null : Number(r.NUM_ROWS),
    dim: r.STATUS === 'INVALID', drag: qn(schema, r.NAME),
    row: {
      name: r.NAME, sch: schema, created: r.CREATED, modified: r.MODIFIED,
      row_count: r.NUM_ROWS == null ? null : Number(r.NUM_ROWS), data_kb: r.BLOCKS == null ? null : Math.round(r.BLOCKS * blockKb), index_kb: null, owner: schema,
    },
    actions: [selectAction(schema, r.NAME), scriptAction()],
  }));
}

// Procedures, functions, packages, sequences, views: rows from ALL_OBJECTS.
async function objectRows(conn, schema, types) {
  return mq(conn,
    `SELECT o.object_name AS name, o.object_type AS type, TO_CHAR(o.created, ${TS}) AS created, TO_CHAR(o.last_ddl_time, ${TS}) AS modified,
            CASE WHEN EXISTS (SELECT 1 FROM all_objects b WHERE b.owner = o.owner AND b.object_name = o.object_name AND b.status <> 'VALID') THEN 'INVALID' ELSE 'VALID' END AS status
       FROM all_objects o
      WHERE o.owner = :owner AND o.object_type IN (${types.map(t => `'${t}'`).join(', ')}) AND o.object_name NOT LIKE 'BIN$%'
      ORDER BY o.object_name`, { owner: schema });
}

function objectNode(prefix, schema, r, icon, opts = {}) {
  const invalid = r.STATUS === 'INVALID';
  const bits = [opts.sub, invalid ? 'invalid' : ''].filter(Boolean).join(', ');
  return {
    key: `${prefix}:${r.NAME}`, label: r.NAME, icon, expandable: !!opts.expandable, kind: 'generic', dim: invalid,
    sub: bits ? `(${bits})` : '', drag: qn(schema, r.NAME),
    row: { name: r.NAME, sch: schema, created: r.CREATED, modified: r.MODIFIED, type_desc: r.TYPE || opts.type || '' },
    actions: opts.actions || [scriptAction()],
  };
}

async function viewNodes(conn, schema) {
  return (await objectRows(conn, schema, ['VIEW', 'MATERIALIZED VIEW'])).map(r =>
    objectNode(r.TYPE === 'VIEW' ? 'v' : 'm', schema, r, 'view', { expandable: true, sub: r.TYPE === 'VIEW' ? '' : 'materialized', actions: [selectAction(schema, r.NAME), scriptAction()] }));
}

// Argument lists of the standalone procedures / functions, used for the "execute" templates.
async function routineArgs(conn, schema) {
  let rows = [];
  try {
    rows = await mq(conn,
      `SELECT object_name, argument_name, in_out, data_type, position, overload FROM all_arguments
        WHERE owner = :owner AND package_name IS NULL AND data_level = 0 ORDER BY object_name, overload, position`, { owner: schema });
  } catch { /* templates without arguments */ }
  const byName = new Map();
  for (const r of rows) {
    let e = byName.get(r.OBJECT_NAME);
    if (!e) byName.set(r.OBJECT_NAME, e = { overload: r.OVERLOAD, args: [] });
    if (r.OVERLOAD === e.overload && r.ARGUMENT_NAME) e.args.push(r);
  }
  return byName;
}

// "Execute" / "Select" template with every parameter in named notation, e.g. P_ID => NULL, -- IN NUMBER
function executeTemplate(schema, name, args, isFunction) {
  const pad = isFunction ? '  ' : '    ';
  const lines = args.map((a, i) => `${pad}${Q(a.ARGUMENT_NAME)} => NULL${i < args.length - 1 ? ',' : ' '} -- ${[a.IN_OUT === 'IN/OUT' ? 'IN OUT' : a.IN_OUT, a.DATA_TYPE].filter(Boolean).join(' ')}`);
  const call = `${qn(schema, name)}${lines.length ? `(\n${lines.join('\n')}\n${pad.slice(2)})` : ''}`;
  return isFunction ? `SELECT ${call}\n  FROM dual` : `BEGIN\n  ${call};\nEND;`;
}

async function routineNodes(conn, schema, isFunction) {
  const [rows, args] = await Promise.all([objectRows(conn, schema, [isFunction ? 'FUNCTION' : 'PROCEDURE']), routineArgs(conn, schema)]);
  return rows.map(r => objectNode(isFunction ? 'f' : 'p', schema, r, isFunction ? 'func' : 'proc', {
    expandable: true,
    actions: [scriptAction(), { label: isFunction ? 'Select Function…' : 'Execute Procedure…', sql: executeTemplate(schema, r.NAME, (args.get(r.NAME) || { args: [] }).args, isFunction), run: false, db: schema }],
  }));
}

async function synonymNodes(conn, schema) {
  const rows = await mq(conn,
    `SELECT s.synonym_name AS name, s.table_owner, s.table_name, s.db_link, TO_CHAR(o.created, ${TS}) AS created, TO_CHAR(o.last_ddl_time, ${TS}) AS modified
       FROM all_synonyms s
       LEFT JOIN all_objects o ON o.owner = s.owner AND o.object_name = s.synonym_name AND o.object_type = 'SYNONYM'
      WHERE s.owner = :owner ORDER BY s.synonym_name`, { owner: schema });
  return rows.map(r => ({
    ...objectNode('y', schema, { ...r, TYPE: 'SYNONYM' }, 'syn', { actions: [selectAction(schema, r.NAME), scriptAction()] }),
    sub: `(→ ${r.TABLE_OWNER ? r.TABLE_OWNER + '.' : ''}${r.TABLE_NAME}${r.DB_LINK ? '@' + r.DB_LINK : ''})`,
  }));
}

async function triggerRows(conn, where, binds) {
  return mq(conn,
    `SELECT t.trigger_name AS name, t.trigger_type, t.triggering_event, t.status, t.table_name, TO_CHAR(o.created, ${TS}) AS created, TO_CHAR(o.last_ddl_time, ${TS}) AS modified
       FROM all_triggers t
       LEFT JOIN all_objects o ON o.owner = t.owner AND o.object_name = t.trigger_name AND o.object_type = 'TRIGGER'
      WHERE ${where} ORDER BY t.trigger_name`, binds);
}

function triggerNodes(rows, schema, showTable) {
  return rows.map(r => {
    const disabled = r.STATUS === 'DISABLED';
    const event = String(r.TRIGGERING_EVENT || '').toLowerCase();
    const bits = [String(r.TRIGGER_TYPE || '').toLowerCase().replace(/ each row/, ' row'), event, showTable && r.TABLE_NAME ? `on ${r.TABLE_NAME}` : '', disabled ? 'disabled' : ''].filter(Boolean);
    return {
      key: `g:${r.NAME}`, label: r.NAME, icon: 'trigger', expandable: false, kind: 'generic', dim: disabled,
      sub: `(${bits.join(', ')})`, drag: qn(schema, r.NAME),
      row: { name: r.NAME, sch: schema, created: r.CREATED, modified: r.MODIFIED, type_desc: 'TRIGGER', instead_of: /^INSTEAD OF/i.test(r.TRIGGER_TYPE || ''), disabled },
      actions: [scriptAction()],
    };
  });
}

async function columnNodes(conn, schema, table, withKeys) {
  const cols = await mqCompat(conn, 'identityColumn',
    `SELECT column_name, data_type, data_length, data_precision, data_scale, char_length, char_used, nullable, data_default, column_id, identity_column, virtual_column
       FROM all_tab_columns WHERE owner = :owner AND table_name = :tab ORDER BY column_id`,
    `SELECT column_name, data_type, data_length, data_precision, data_scale, char_length, char_used, nullable, data_default, column_id, 'NO' AS identity_column, 'NO' AS virtual_column
       FROM all_tab_columns WHERE owner = :owner AND table_name = :tab ORDER BY column_id`, { owner: schema, tab: table });
  const pk = new Set(), fk = new Set();
  if (withKeys) {
    const keys = await mq(conn,
      `SELECT cc.column_name, c.constraint_type FROM all_constraints c
         JOIN all_cons_columns cc ON cc.owner = c.owner AND cc.constraint_name = c.constraint_name AND cc.table_name = c.table_name
        WHERE c.owner = :owner AND c.table_name = :tab AND c.constraint_type IN ('P', 'R')`, { owner: schema, tab: table });
    for (const k of keys) (k.CONSTRAINT_TYPE === 'P' ? pk : fk).add(k.COLUMN_NAME);
  }
  return cols.map(c => {
    const type = dictTypeName(c);
    const isPk = pk.has(c.COLUMN_NAME), isFk = fk.has(c.COLUMN_NAME), nullable = c.NULLABLE === 'Y';
    const bits = [isPk ? 'PK' : '', isFk ? 'FK' : '', type, nullable ? 'null' : 'not null'].filter(Boolean);
    return {
      key: `c:${c.COLUMN_NAME}`, label: c.COLUMN_NAME, icon: isPk ? 'key' : isFk ? 'fkey' : 'col', expandable: false, kind: 'generic',
      sub: `(${bits.join(', ')})`, drag: Q(c.COLUMN_NAME),
      row: {
        name: c.COLUMN_NAME, data_type: type, nullable, pk: isPk, fk: isFk, identity: c.IDENTITY_COLUMN === 'YES', computed: c.VIRTUAL_COLUMN === 'YES',
        default: c.DATA_DEFAULT == null ? null : String(c.DATA_DEFAULT).trim(),
      },
    };
  });
}

async function indexNodes(conn, schema, table) {
  const rows = await mq(conn,
    `SELECT i.index_name, i.index_type, i.uniqueness, i.status, c.column_name, c.column_position, c.descend, e.column_expression
       FROM all_indexes i
       JOIN all_ind_columns c ON c.index_owner = i.owner AND c.index_name = i.index_name
       LEFT JOIN all_ind_expressions e ON e.index_owner = c.index_owner AND e.index_name = c.index_name AND e.column_position = c.column_position
      WHERE i.table_owner = :owner AND i.table_name = :tab
      ORDER BY i.index_name, c.column_position`, { owner: schema, tab: table });
  const byName = new Map();
  for (const r of rows) {
    let ix = byName.get(r.INDEX_NAME);
    if (!ix) byName.set(r.INDEX_NAME, ix = { name: r.INDEX_NAME, type: r.INDEX_TYPE, unique: r.UNIQUENESS === 'UNIQUE', status: r.STATUS, cols: [] });
    ix.cols.push(r.COLUMN_EXPRESSION ? String(r.COLUMN_EXPRESSION).trim() : r.COLUMN_NAME + (r.DESCEND === 'DESC' ? ' DESC' : ''));
  }
  return [...byName.values()].map(ix => {
    const unusable = ix.status === 'UNUSABLE';
    const bits = [ix.unique ? 'Unique' : '', ix.type, unusable ? 'unusable' : ''].filter(Boolean);
    return {
      key: `x:${ix.name}`, label: ix.name, icon: ix.unique ? 'key' : 'index', expandable: false, kind: 'generic', dim: unusable,
      sub: `(${bits.join(', ')})`, drag: qn(schema, ix.name),
      row: { name: ix.name, kind: ix.type, unique: ix.unique, keys: ix.cols.join(', '), include: '', disabled: unusable },
      actions: [scriptAction()],
    };
  });
}

const NOT_NULL_CHECK = /^\s*"?[A-Za-z0-9_$#]+"?\s+IS\s+NOT\s+NULL\s*$/i;
const CONSTRAINT_KINDS = { P: 'Primary Key', U: 'Unique', R: 'Foreign Key', C: 'Check' };
const CONSTRAINT_ICONS = { P: 'key', U: 'key', R: 'fkey', C: 'check' };

async function constraintNodes(conn, schema, table) {
  const [cons, cols, refs] = await Promise.all([
    mq(conn,
      `SELECT constraint_name, constraint_type, search_condition, status, delete_rule FROM all_constraints
        WHERE owner = :owner AND table_name = :tab AND constraint_type IN ('P', 'U', 'R', 'C')
        ORDER BY DECODE(constraint_type, 'P', 1, 'U', 2, 'R', 3, 4), constraint_name`, { owner: schema, tab: table }),
    mq(conn,
      `SELECT constraint_name, column_name FROM all_cons_columns WHERE owner = :owner AND table_name = :tab ORDER BY constraint_name, position`, { owner: schema, tab: table }),
    mq(conn,
      `SELECT c.constraint_name, rc.owner AS r_owner, rc.table_name AS r_table, rcc.column_name AS r_column
         FROM all_constraints c
         JOIN all_constraints rc ON rc.owner = c.r_owner AND rc.constraint_name = c.r_constraint_name
         JOIN all_cons_columns rcc ON rcc.owner = rc.owner AND rcc.constraint_name = rc.constraint_name
        WHERE c.owner = :owner AND c.table_name = :tab AND c.constraint_type = 'R'
        ORDER BY c.constraint_name, rcc.position`, { owner: schema, tab: table }),
  ]);
  const colsOf = new Map(), refOf = new Map();
  for (const c of cols) { if (!colsOf.has(c.CONSTRAINT_NAME)) colsOf.set(c.CONSTRAINT_NAME, []); colsOf.get(c.CONSTRAINT_NAME).push(c.COLUMN_NAME); }
  for (const r of refs) {
    if (!refOf.has(r.CONSTRAINT_NAME)) refOf.set(r.CONSTRAINT_NAME, { table: (r.R_OWNER === schema ? '' : r.R_OWNER + '.') + r.R_TABLE, cols: [] });
    refOf.get(r.CONSTRAINT_NAME).cols.push(r.R_COLUMN);
  }
  const nodes = [];
  for (const c of cons) {
    const type = c.CONSTRAINT_TYPE;
    const cond = c.SEARCH_CONDITION == null ? '' : String(c.SEARCH_CONDITION).trim();
    if (type === 'C' && NOT_NULL_CHECK.test(cond)) continue;       // NOT NULL is shown by the column's Allow Nulls
    const cn = (colsOf.get(c.CONSTRAINT_NAME) || []).join(', ');
    const r = refOf.get(c.CONSTRAINT_NAME);
    const ref = r ? `${r.table} (${r.cols.join(', ')})` : '';
    const disabled = c.STATUS === 'DISABLED';
    const definition = type === 'C' ? cond : type === 'R' ? `REFERENCES ${ref}${c.DELETE_RULE && c.DELETE_RULE !== 'NO ACTION' ? ' ON DELETE ' + c.DELETE_RULE : ''}` : '';
    nodes.push({
      key: `n${type.toLowerCase()}:${c.CONSTRAINT_NAME}`, label: c.CONSTRAINT_NAME, icon: CONSTRAINT_ICONS[type], expandable: false, kind: 'generic', dim: disabled,
      sub: `(${CONSTRAINT_KINDS[type]}${disabled ? ', disabled' : ''})`,
      row: { name: c.CONSTRAINT_NAME, kind: CONSTRAINT_KINDS[type], cols: cn, ref, column: cn, definition },
      actions: [scriptAction()],
    });
  }
  return nodes;
}

async function argumentNodes(conn, schema, name) {
  const rows = await mq(conn,
    `SELECT argument_name, in_out, data_type, position, defaulted, overload FROM all_arguments
      WHERE owner = :owner AND object_name = :name AND package_name IS NULL AND data_level = 0
      ORDER BY overload, position`, { owner: schema, name });
  const first = rows.length ? rows[0].OVERLOAD : null;
  return rows.filter(r => r.OVERLOAD === first && (r.ARGUMENT_NAME || r.POSITION === 0)).map(r => {
    const label = r.ARGUMENT_NAME || 'RETURN';
    const dir = r.IN_OUT === 'IN/OUT' ? 'IN OUT' : r.IN_OUT;
    return {
      key: `a:${label}`, label, icon: 'param', expandable: false, kind: 'generic',
      sub: `(${[dir, r.DATA_TYPE].filter(Boolean).join(', ')})`,
      row: { name: label, data_type: r.DATA_TYPE || '', direction: dir, has_default: r.DEFAULTED === 'Y' },
    };
  });
}

async function tree(conn, p) {
  if (!p.length) return schemaNodes(conn, false);
  const ctx = parsePath(p);
  const last = ctx.last;
  if (last.folder === 'sys') return schemaNodes(conn, true);
  if (last.prefix === 's') return schemaFolders();
  if (last.prefix === 't') return [folder('cols', 'Columns', 'columns'), folder('idx', 'Indexes', 'indexes'), folder('cons', 'Constraints', 'constraints'), folder('trg', 'Triggers', 'triggers')];
  if (last.prefix === 'v' || last.prefix === 'm') return [folder('cols', 'Columns', 'columns'), folder('trg', 'Triggers', 'triggers')];
  if (last.prefix === 'p' || last.prefix === 'f') return [folder('args', 'Parameters', 'params')];
  if (last.prefix || !ctx.schema) return [];

  const schema = ctx.schema;
  const obj = ctx.obj;
  switch (last.folder) {
    case 'tables': return tableNodes(conn, schema);
    case 'views': return viewNodes(conn, schema);
    case 'procs': return routineNodes(conn, schema, false);
    case 'funcs': return routineNodes(conn, schema, true);
    case 'pkgs':
      return (await objectRows(conn, schema, ['PACKAGE'])).map(r => objectNode('k', schema, r, 'proc'));
    case 'seqs':
      return (await objectRows(conn, schema, ['SEQUENCE'])).map(r => objectNode('q', schema, r, 'seq'));
    case 'trigs':
      return triggerNodes(await triggerRows(conn, 't.owner = :owner', { owner: schema }), schema, true);
    case 'syns': return synonymNodes(conn, schema);
    case 'cols': return obj ? columnNodes(conn, schema, obj.name, obj.prefix === 't') : [];
    case 'idx': return obj ? indexNodes(conn, schema, obj.name) : [];
    case 'cons': return obj ? constraintNodes(conn, schema, obj.name) : [];
    case 'trg': return obj ? triggerNodes(await triggerRows(conn, 't.table_owner = :owner AND t.table_name = :tab', { owner: schema, tab: obj.name }), schema, false) : [];
    case 'args': return obj ? argumentNodes(conn, schema, obj.name) : [];
    default: return [];
  }
}

async function objects(conn, db) {
  const schema = db || conn.schema;
  const rows = await mq(conn,
    `SELECT object_name AS name, object_type AS type FROM all_objects
      WHERE owner = :owner AND object_type IN ('TABLE', 'VIEW', 'MATERIALIZED VIEW') AND object_name NOT LIKE 'BIN$%'
      ORDER BY object_name`, { owner: schema });
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.NAME)) continue;                  // materialized views also appear as their container table
    seen.add(r.NAME);
    out.push({ schema, name: r.NAME, type: r.TYPE === 'TABLE' ? 'table' : 'view' });
  }
  return out;
}

async function columns(conn, db, schema, name) {
  const owner = schema || db || conn.schema;
  const sql = `SELECT column_name, data_type, data_length, data_precision, data_scale, char_length, char_used
                 FROM all_tab_columns WHERE owner = :owner AND table_name = :tab ORDER BY column_id`;
  let rows = await mq(conn, sql, { owner, tab: name });
  if (!rows.length && name !== String(name).toUpperCase()) rows = await mq(conn, sql, { owner, tab: String(name).toUpperCase() });
  return rows.map(r => ({ name: r.COLUMN_NAME, type: dictTypeName(r) }));
}

// DBMS_METADATA object types by key type.
const DDL_TYPES = {
  t: 'TABLE', v: 'VIEW', m: 'MATERIALIZED_VIEW', p: 'PROCEDURE', f: 'FUNCTION', k: ['PACKAGE_SPEC', 'PACKAGE_BODY'], q: 'SEQUENCE',
  g: 'TRIGGER', y: 'SYNONYM', x: 'INDEX', np: 'CONSTRAINT', nu: 'CONSTRAINT', nc: 'CONSTRAINT', nr: 'REF_CONSTRAINT',
};

async function script(conn, p, kind) {
  if (kind !== 'create') throw new Error(`Unsupported script kind: ${kind}`);
  const ctx = parsePath(p);
  const last = ctx.last;
  const types = last && DDL_TYPES[last.prefix];
  if (!types || !ctx.schema) throw new Error('Select an object to script.');
  if (!conn.flags.ddlInit) {
    try {
      await conn.db.execute(`BEGIN
        DBMS_METADATA.SET_TRANSFORM_PARAM(DBMS_METADATA.SESSION_TRANSFORM, 'SQLTERMINATOR', TRUE);
        DBMS_METADATA.SET_TRANSFORM_PARAM(DBMS_METADATA.SESSION_TRANSFORM, 'SEGMENT_ATTRIBUTES', FALSE);
      END;`);
    } catch { /* default transforms */ }
    conn.flags.ddlInit = true;
  }
  const o = conn.oracledb;
  const clobAsString = m => (m.dbType === o.DB_TYPE_CLOB || m.dbType === o.DB_TYPE_NCLOB ? { type: o.DB_TYPE_VARCHAR } : undefined);
  const parts = [];
  for (const type of [].concat(types)) {
    try {
      const rows = await mq(conn, 'SELECT DBMS_METADATA.GET_DDL(:t, :n, :o) AS ddl FROM dual', { t: type, n: last.name, o: ctx.schema }, { fetchTypeHandler: clobAsString });
      const ddl = rows.length && rows[0].DDL ? String(rows[0].DDL).trim() : '';
      if (ddl) parts.push(ddl);
    } catch (e) {
      if (type !== 'PACKAGE_BODY') throw e;          // a package may have no body
    }
  }
  if (!parts.length) throw new Error(`No DDL was returned for ${last.name}.`);
  return parts.join('\n\n') + '\n';
}

// ---------------------------------------------------------------- query sessions

// Fetch conversions so every value reaches the grid as an exact string / buffer (Thin mode: server-side NLS formats are not involved).
function resultFetchHandler(o) {
  return m => {
    switch (m.dbType) {
      case o.DB_TYPE_NUMBER:            // Thin decodes NUMBER to a digit string; keeping it avoids losing precision beyond 15 digits
        return { type: o.DB_TYPE_VARCHAR, converter: v => (typeof v === 'string' ? v.replace(/^(-?)\./, '$10.') : v) };
      case o.DB_TYPE_CLOB:
      case o.DB_TYPE_NCLOB:
      case o.DB_TYPE_JSON:
      case o.DB_TYPE_VECTOR:
        return { type: o.DB_TYPE_VARCHAR };
      case o.DB_TYPE_BLOB:
        return { type: o.DB_TYPE_RAW };
      case o.DB_TYPE_DATE:
        return { converter: v => fmtDate(v, false, false) };
      case o.DB_TYPE_TIMESTAMP:
        return { converter: v => fmtDate(v, true, false) };
      case o.DB_TYPE_TIMESTAMP_TZ:
      case o.DB_TYPE_TIMESTAMP_LTZ:
        return { converter: v => fmtDate(v, true, true) };
      case o.DB_TYPE_INTERVAL_YM:
        return { converter: fmtIntervalYM };
      case o.DB_TYPE_INTERVAL_DS:
        return { converter: fmtIntervalDS };
      default:
        return undefined;
    }
  };
}

const gridValue = v => {
  if (v && typeof v === 'object') {
    if (typeof v.getRows === 'function') return '[cursor]';
    if (typeof v.getData === 'function') return '[LOB]';
  }
  return v;
};

async function readResultSet(rs, meta, max, items) {
  const g = grid((meta || rs.metaData || []).map(m => ({ name: m.name, type: metaTypeName(m) })), max);
  let got = 0;
  try {
    for (;;) {
      const want = Math.min(FETCH_CHUNK, max + 1 - got);       // one row beyond the limit tells whether more rows exist
      if (want <= 0) break;
      const rows = await rs.getRows(want);
      if (!rows.length) break;
      for (const row of rows) {
        if (got < max) g.add(row.map(gridValue));
        got++;
      }
    }
  } finally {
    try { await rs.close(); } catch { /* the connection may be gone */ }
  }
  items.push(g.item);
  if (got > max) items.push({ type: 'msg', text: `(showing the first ${max} rows; more rows are available)` });
}

const byteOffsetToChars = (s, bytes) => Buffer.from(s, 'utf8').subarray(0, bytes).toString('utf8').length;

// Error item with the best line number we can get: Oracle's parse error offset (bytes into the statement),
// or the line numbers that PL/SQL puts into its messages for anonymous blocks.
function oraErrorItem(err, stmt, text, prefixLen = 0) {
  const message = cleanMessage(err);
  let offset;
  if (Number.isInteger(err && err.offset) && err.offset > prefixLen) offset = byteOffsetToChars(stmt.sql, err.offset - prefixLen);
  const item = errorItem({ message }, stmt, text, offset);
  if (offset === undefined && /^(DECLARE|BEGIN)\b/i.test(stmt.sql)) {
    const m = /ORA-06550: line (\d+),/.exec(message);
    if (m) item.line = stmt.line + Number(m[1]) - 1;
    else {
      const frames = [...message.matchAll(/ORA-06512: at line (\d+)/g)];       // frames of the anonymous block itself ("at line N", no object name)
      if (frames.length) item.line = stmt.line + Number(frames[frames.length - 1][1]) - 1;
    }
  }
  return item;
}

const firstWord = sql => ((/^\s*([A-Za-z]+)/.exec(sql) || [])[1] || '').toUpperCase();

// SQL*Plus / SQL Developer script commands that only make sense in a script runner.
const SQLPLUS_IGNORED = /^(SET\s+(SERVEROUTPUT|DEFINE|ECHO|FEEDBACK|VERIFY|TIMING|PAGESIZE|LINESIZE|HEADING|HEAD|TERMOUT|TRIMSPOOL|TRIMOUT|SQLBLANKLINES|SQLPROMPT|LONG|LONGCHUNKSIZE|WRAP|COLSEP|NEWPAGE|TAB|SCAN|NUMWIDTH|NUMFORMAT|ESCAPE|SQLTERMINATOR|UNDERLINE|ARRAYSIZE|AUTOTRACE|SHOWMODE)\b.*|SPOOL\b.*|WHENEVER\s+(SQLERROR|OSERROR)\b.*|COLUMN\s+.*|COL\s+.*|REM(ARK)?(\s.*)?)$/i;

function sqlplusCommand(sql) {
  if (/\n/.test(sql)) return null;
  const pm = /^PROMPT(?:\s+(.*))?$/i.exec(sql);
  if (pm) return { text: pm[1] || '' };
  return SQLPLUS_IGNORED.test(sql) ? { text: null } : null;
}

const COMPILE_RE = /^CREATE\s+(?:OR\s+REPLACE\s+)?(?:(?:NON)?EDITIONABLE\s+)?(?:(?:NO)?FORCE\s+)?(PROCEDURE|FUNCTION|PACKAGE\s+BODY|PACKAGE|TRIGGER|TYPE\s+BODY|TYPE|VIEW)\s+("[^"]+"|[A-Za-z][\w$#]*)(?:\s*\.\s*("[^"]+"|[A-Za-z][\w$#]*))?/i;

function parseCompileTarget(sql, defaultSchema) {
  const m = COMPILE_RE.exec(sql);
  if (!m) return null;
  const ident = s => (s.startsWith('"') ? s.slice(1, -1) : s.toUpperCase());
  return { type: m[1].toUpperCase().replace(/\s+/g, ' '), owner: m[3] ? ident(m[2]) : defaultSchema, name: ident(m[3] || m[2]) };
}

// ORA-24344 "success with compilation error": a CREATE of a PL/SQL object that was stored but does not compile.
const isCompileWarning = w => !!w && (w.errorNum === 24344 || /ORA-24344/.test(w.message || ''));

const GET_LINES_SQL ='BEGIN DBMS_OUTPUT.GET_LINES(:lines, :n); END;';

class OracleSession {
  constructor(conn, db, schema) {
    this.conn = conn;
    this.o = conn.oracledb;
    this.db = db;
    this.schema = schema;
    this.busy = false;
    this.closed = false;
    this.lost = false;
    this.handler = resultFetchHandler(this.o);
  }

  async init() {
    await initConnection(this.db, this.conn.appName);
    try { await this.db.execute('BEGIN DBMS_OUTPUT.ENABLE(NULL); END;'); } catch { /* output is optional */ }
  }

  async reopen() {
    try { await this.db.close(); } catch { /* ignore */ }
    this.db = await this.o.getConnection(this.conn.params);
    this.lost = false;
    await this.init();
    this.schema = (await this.db.execute("SELECT SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') FROM dual")).rows[0][0];
  }

  async useSchema(want) {
    if (!want || want === this.schema) return;
    const alter = n => this.db.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${Q(n)}`);
    try {
      await alter(want);
      this.schema = want;
    } catch (e) {
      if (want !== want.toUpperCase() && /ORA-01435/.test(e.message)) { await alter(want.toUpperCase()); this.schema = want.toUpperCase(); }
      else throw e;
    }
  }

  // Moves DBMS_OUTPUT text into a message item.
  async drainOutput(items) {
    const o = this.o;
    const lines = [];
    while (lines.length < OUTPUT_MAX_LINES) {
      const r = await this.db.execute(GET_LINES_SQL, {
        lines: { dir: o.BIND_OUT, type: o.STRING, maxArraySize: OUTPUT_CHUNK, maxSize: 32767 },
        n: { dir: o.BIND_INOUT, type: o.NUMBER, val: OUTPUT_CHUNK },
      });
      const got = r.outBinds.lines || [];
      const n = Math.min(Number(r.outBinds.n) || 0, got.length);
      for (let i = 0; i < n; i++) lines.push(got[i] == null ? '' : got[i]);
      if (n < OUTPUT_CHUNK) break;
    }
    if (lines.length) items.push({ type: 'msg', text: lines.join('\n') });
  }

  async reportWarning(warning, stmt, items) {
    const target = isCompileWarning(warning) ? parseCompileTarget(stmt.sql, this.schema) : null;
    if (!target) {
      items.push({ type: 'msg', text: 'Warning: ' + cleanMessage(warning) });
      return 0;
    }
    const rows = await this.db.execute(
      'SELECT line, position, text, attribute FROM all_errors WHERE owner = :o AND name = :n AND type = :t ORDER BY sequence',
      { o: target.owner, n: target.name, t: target.type }, { outFormat: this.o.OUT_FORMAT_OBJECT });
    items.push({ type: 'msg', text: `Warning: ${target.type.toLowerCase()} ${target.name} was created with compilation errors.` });
    let errors = 0;
    for (const r of rows.rows) {
      const where = `(line ${r.LINE}, column ${r.POSITION})`;
      if (r.ATTRIBUTE === 'WARNING') items.push({ type: 'msg', text: `Compilation warning: ${r.TEXT} ${where}` });
      else {
        errors++;
        items.push({ type: 'err', message: `Compilation error: ${r.TEXT} ${where}`, line: stmt.line + r.LINE - 1 });
      }
    }
    return errors;
  }

  async explain(stmt, max, items) {
    const prefix = 'EXPLAIN PLAN FOR ';
    try {
      await this.db.execute(prefix + stmt.sql);
    } catch (e) {
      e.sqlPrefix = prefix.length;
      throw e;
    }
    const res = await this.db.execute('SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY())', [],
      { resultSet: true, outFormat: this.o.OUT_FORMAT_ARRAY });
    await readResultSet(res.resultSet, res.metaData, max, items);
  }

  // Runs one statement; returns the number of errors it reported without throwing (compilation errors).
  async execStatement(stmt, max, mode, items) {
    const sql = stmt.sql;
    const cmd = sqlplusCommand(sql);
    if (cmd) {
      if (cmd.text) items.push({ type: 'msg', text: cmd.text });
      return 0;
    }
    if (mode === 'explain') { await this.explain(stmt, max, items); return 0; }
    const res = await this.db.execute(sql, [], { resultSet: true, outFormat: this.o.OUT_FORMAT_ARRAY, fetchTypeHandler: this.handler });
    if (res.resultSet) {
      await readResultSet(res.resultSet, res.metaData, max, items);
    } else {
      const word = firstWord(sql);
      if (/^(INSERT|UPDATE|DELETE|MERGE|WITH)$/.test(word)) {
        const n = res.rowsAffected || 0;
        items.push({ type: 'msg', text: `(${n} row${n === 1 ? '' : 's'} affected)` });
      } else if (word === 'COMMIT') items.push({ type: 'msg', text: 'Commit complete.' });
      else if (word === 'ROLLBACK') items.push({ type: 'msg', text: 'Rollback complete.' });
      else if (word === 'BEGIN' || word === 'DECLARE') items.push({ type: 'msg', text: 'PL/SQL procedure successfully completed.' });
      else if (word === 'CALL') items.push({ type: 'msg', text: 'Call completed.' });
      else if (!isCompileWarning(res.warning)) items.push({ type: 'msg', text: 'Command completed successfully.' });
    }
    if (res.implicitResults) {                                       // DBMS_SQL.RETURN_RESULT
      for (const rs of Object.values(res.implicitResults)) await readResultSet(rs, rs.metaData, max, items);
    }
    return res.warning ? this.reportWarning(res.warning, stmt, items) : 0;
  }

  async run(text, opts = {}) {
    if (this.closed) throw new Error('The session is closed.');
    const max = Math.floor(Number(opts.maxRows)) > 0 ? Math.floor(Number(opts.maxRows)) : DEFAULT_MAX_ROWS;
    const items = [];
    let errors = 0;
    this.busy = true;
    try {
      if (this.lost) {
        try {
          await this.reopen();
          items.push({ type: 'msg', text: '(The connection was lost and has been re-established; the previous transaction and session settings are gone.)' });
        } catch (e) {
          items.push({ type: 'err', message: cleanMessage(e), line: null });
          return { items, errors: 1, database: this.schema };
        }
      }
      try {
        await this.useSchema(opts.database);
      } catch (e) {
        items.push({ type: 'err', message: `Could not switch to schema ${Q(opts.database)}: ${cleanMessage(e)}`, line: null });
        return { items, errors: 1, database: this.schema };
      }
      let schemaChanged = false;
      for (const stmt of splitStatements(String(text || ''), 'oracle')) {
        if (/\bCURRENT_SCHEMA\b/i.test(stmt.sql)) schemaChanged = true;
        try {
          errors += await this.execStatement(stmt, max, opts.mode, items);
        } catch (e) {
          if (isConnectionLost(e)) this.lost = true;
          else { try { await this.drainOutput(items); } catch { /* ignore */ } }
          items.push(oraErrorItem(e, stmt, text, e.sqlPrefix || 0));
          errors++;
          break;
        }
        try { await this.drainOutput(items); } catch (e) { if (isConnectionLost(e)) this.lost = true; }
      }
      if (schemaChanged && !this.lost) {
        try { this.schema = (await this.db.execute("SELECT SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') FROM dual")).rows[0][0]; } catch { /* ignore */ }
      }
      return { items, errors, database: this.schema };
    } finally {
      this.busy = false;
    }
  }

  async cancel() {
    if (!this.busy || this.closed) return false;
    try {
      if (typeof this.db.breakExecution === 'function') await this.db.breakExecution();
      else await this.db.break();
      return true;
    } catch {
      return false;
    }
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    this.conn.sessions.delete(this);
    if (this.busy) await this.cancel();
    try { await this.db.close(); } catch { /* ignore */ }
  }
}

async function openSession(conn) {
  const db = await conn.oracledb.getConnection(conn.params);
  const session = new OracleSession(conn, db, conn.schema);
  try {
    await session.init();
    session.schema = (await db.execute("SELECT SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') FROM dual")).rows[0][0];
  } catch (e) {
    try { await db.close(); } catch { /* ignore */ }
    throw new Error(cleanMessage(e));
  }
  conn.sessions.add(session);
  return session;
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  _internal: {
    connectParams, parsePath, splitKey, dictTypeName, metaTypeName, fmtDate, fmtIntervalYM, fmtIntervalDS, oraErrorItem,
    parseCompileTarget, sqlplusCommand, resultFetchHandler, executeTemplate, readResultSet, OracleSession, SYSTEM_SCHEMA_RE,
  },
};
