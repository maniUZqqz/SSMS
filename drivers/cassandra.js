'use strict';
// Apache Cassandra driver (cassandra-driver 4.x, CQL). Requires Cassandra 3.0+ (system_schema).
//
// Object Explorer paths (each element is a node `key`):
//   []                         keyspaces + 'System Keyspaces' folder ($sys)   key = keyspace name
//   ['$sys']                   system keyspaces (the '$sys' element is ignored in deeper paths)
//   [ks]                       folders: Tables (t), Materialized Views (mv), User Types (ut), Functions (fn)
//   [ks,'t']                   tables                 key = table name
//   [ks,'t',tbl]               folders: Columns (c), Indexes (i)
//   [ks,'t',tbl,'c' | 'i']     columns | indexes
//   [ks,'mv']                  materialized views     [ks,'mv',view] -> Columns folder (c) -> columns
//   [ks,'ut']                  user types             [ks,'ut',type] -> fields
//   [ks,'fn']                  functions and aggregates   key = "name(argtypes)"

const { grid, splitStatements, requireDriver } = require('./common');

const language = 'sql';

const SYSTEM_RE = /^(system($|_)|dse_|solr_admin$|cfs($|_archive$)|opscenter$|hivemetastore$|spark_system$)/i;
const VIRTUAL_KEYSPACES = new Set(['system_views', 'system_virtual_schema']);
const RESERVED = new Set(['add', 'allow', 'alter', 'and', 'apply', 'asc', 'authorize', 'batch', 'begin', 'by', 'columnfamily', 'create', 'delete', 'desc',
  'describe', 'drop', 'entries', 'execute', 'from', 'full', 'grant', 'if', 'in', 'index', 'infinity', 'insert', 'into', 'keyspace', 'limit', 'materialized',
  'modify', 'nan', 'norecursive', 'not', 'null', 'of', 'on', 'or', 'order', 'primary', 'rename', 'replace', 'revoke', 'schema', 'select', 'set', 'table',
  'to', 'token', 'truncate', 'unlogged', 'update', 'use', 'using', 'view', 'where', 'with']);

const isSystem = ks => SYSTEM_RE.test(ks);
// Quotes an identifier only when CQL needs it (upper case, odd characters, reserved words).
const cql = s => (/^[a-z][a-z0-9_]*$/.test(s) && !RESERVED.has(s) ? s : `"${String(s).replace(/"/g, '""')}"`);
const lit = s => `'${String(s).replace(/'/g, "''")}'`;

// CQL also has `// comment` lines, which splitStatements() does not know: blank them out (same length, so
// statement line numbers stay correct) outside strings, quoted identifiers, $$ blocks and /* */ comments.
function blankSlashComments(text) {
  const n = text.length;
  let out = '';
  let i = 0;
  while (i < n) {
    const c = text[i], d = text[i + 1];
    let e = -1;
    if (c === '/' && d === '/') {
      e = text.indexOf('\n', i);
      if (e < 0) e = n;
      out += ' '.repeat(e - i);
      i = e;
      continue;
    }
    if (c === '-' && d === '-') e = text.indexOf('\n', i);
    else if (c === '/' && d === '*') { e = text.indexOf('*/', i + 2); e = e < 0 ? n : e + 2; }
    else if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < n) { if (text[j] === c) { if (text[j + 1] === c) { j += 2; continue; } break; } j++; }
      e = j + 1;
    } else if (c === '$' && d === '$') { e = text.indexOf('$$', i + 2); e = e < 0 ? n : e + 2; }
    if (e >= 0) {
      if (e < 0 || e > n) e = n;
      out += text.slice(i, e);
      i = e;
    } else { out += c; i++; }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Value / type helpers
// ---------------------------------------------------------------------------------------------

let typeNames = null;
function typeName(t) {
  if (!t) return '';
  const { types } = requireDriver('cassandra-driver');
  if (!typeNames) {
    typeNames = {};
    for (const [n, c] of Object.entries(types.dataTypes)) typeNames[c] = n;
    typeNames[types.dataTypes.varchar] = 'text';
  }
  const D = types.dataTypes;
  switch (t.code) {
    case D.list: return `list<${typeName(t.info)}>`;
    case D.set: return `set<${typeName(t.info)}>`;
    case D.map: return Array.isArray(t.info) ? `map<${typeName(t.info[0])}, ${typeName(t.info[1])}>` : 'map';
    case D.tuple: return Array.isArray(t.info) ? `tuple<${t.info.map(typeName).join(', ')}>` : 'tuple';
    case D.udt: return t.info && t.info.name ? String(t.info.name) : 'udt';
    case D.custom: return typeof t.info === 'string' ? t.info : 'custom';
    default: return typeNames[t.code] || String(t.code);
  }
}

// Converts a driver value into something cell() renders well (Long -> number when safe, collections -> plain JSON).
function norm(v, depth = 0) {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object') return typeof v === 'bigint' ? v.toString() : v;
  if (v instanceof Date || Buffer.isBuffer(v) || v instanceof Uint8Array) return v;
  if (depth > 20) return '[nested too deep]';
  if (Array.isArray(v)) return v.map(x => norm(x, depth + 1));
  if (v instanceof Set) return [...v].map(x => norm(x, depth + 1));
  if (v instanceof Map) { const o = {}; for (const [k, x] of v) o[String(k)] = norm(x, depth + 1); return o; }
  const name = v.constructor && v.constructor.name;
  if (name === 'Long') { const n = v.toNumber(); return Number.isSafeInteger(n) ? n : v.toString(); }
  if (name === 'Tuple' && Array.isArray(v.elements)) return v.elements.map(x => norm(x, depth + 1));
  if (v.constructor === Object || name === undefined) {
    const o = {};
    for (const k of Object.keys(v)) o[k] = norm(v[k], depth + 1);
    return o;
  }
  return String(v);                                      // BigDecimal, Uuid, InetAddress, LocalDate, LocalTime, Duration, Integer ...
}

const mapEntries = m => (m instanceof Map ? [...m] : m && typeof m === 'object' ? Object.entries(m) : []);

// ---------------------------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------------------------

function clientOptions(spec, dc) {
  const cassandra = requireDriver('cassandra-driver');
  const timeout = Math.max(1, Number(spec.connectTimeout) || 15) * 1000;
  const o = {
    contactPoints: [String(spec.server || '127.0.0.1').trim()],
    localDataCenter: dc,
    protocolOptions: { port: Number(spec.port) || 9042 },
    socketOptions: { connectTimeout: timeout, readTimeout: 300000 },
    isMetadataSyncEnabled: false,          // schema is read with explicit system_schema queries; skips a full schema load per tab
  };
  if (spec.appName) o.applicationName = String(spec.appName);
  if (spec.user) o.authProvider = new cassandra.auth.PlainTextAuthProvider(spec.user, spec.password || '');
  if (spec.encrypt) o.sslOptions = { rejectUnauthorized: !spec.trustServerCertificate };
  return o;
}

function friendlyError(e, spec) {
  if (e && e.name === 'NoHostAvailableError' && e.innerErrors) {
    const first = Object.entries(e.innerErrors)[0];
    if (first) return new Error(`Cannot connect to Cassandra at ${first[0]}: ${first[1] && first[1].message ? first[1].message : first[1]}`);
  }
  return e;
}

async function connect(spec) {
  const { Client } = requireDriver('cassandra-driver');
  let dc = String(spec.dataCenter || '').trim() || 'datacenter1';
  let client = new Client(clientOptions(spec, dc));
  try {
    await client.connect();
  } catch (e) {
    await client.shutdown().catch(() => {});
    // Wrong data center and none configured explicitly: use the one the cluster reports.
    const m = !spec.dataCenter && /only found hosts in data centers: \[([^\]]+)\]/.exec(e && e.message || '');
    if (!m) throw friendlyError(e, spec);
    dc = m[1].split(',')[0].trim();
    client = new Client(clientOptions(spec, dc));
    try { await client.connect(); } catch (e2) { await client.shutdown().catch(() => {}); throw friendlyError(e2, spec); }
  }
  let version = '';
  try {
    const r = await client.execute('SELECT release_version FROM system.local', [], { prepare: false });
    version = r.rows[0] ? String(r.rows[0].release_version) : '';
  } catch { /* restricted */ }
  return {
    client, spec, dc,
    info: { version, user: spec.user || '', database: spec.database || '', server: spec.server || '' },
  };
}

async function close(conn) { await conn.client.shutdown(); }

const meta = (conn, query, params = []) => conn.client.execute(query, params, { prepare: true });

// ---------------------------------------------------------------------------------------------
// Schema queries
// ---------------------------------------------------------------------------------------------

async function keyspaceRows(conn) {
  const r = await meta(conn, 'SELECT keyspace_name, durable_writes, replication FROM system_schema.keyspaces');
  const rows = r.rows.map(x => ({ name: x.keyspace_name, durable: x.durable_writes, replication: x.replication, virtual: false }));
  try {                                                  // Cassandra 4.0 virtual keyspaces
    const v = await meta(conn, 'SELECT keyspace_name FROM system_virtual_schema.keyspaces');
    for (const x of v.rows) if (!rows.some(k => k.name === x.keyspace_name)) rows.push({ name: x.keyspace_name, durable: null, replication: null, virtual: true });
  } catch { /* not available */ }
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

const schemaOf = ks => (VIRTUAL_KEYSPACES.has(ks) ? 'system_virtual_schema' : 'system_schema');

async function tableNames(conn, ks) {
  const r = await meta(conn, `SELECT table_name, comment FROM ${schemaOf(ks)}.tables WHERE keyspace_name = ?`, [ks]);
  return r.rows.map(x => ({ name: x.table_name, comment: x.comment })).sort((a, b) => a.name.localeCompare(b.name));
}

async function viewRows(conn, ks) {
  if (VIRTUAL_KEYSPACES.has(ks)) return [];
  const r = await meta(conn, 'SELECT * FROM system_schema.views WHERE keyspace_name = ?', [ks]);
  return r.rows.sort((a, b) => a.view_name.localeCompare(b.view_name));
}

const KIND_ORDER = { partition_key: 0, clustering: 1, static: 2, regular: 3 };

// Columns of a table or view: [{ name, type, kind, position, order }] in primary key order, then by name.
async function columnRows(conn, ks, table) {
  const r = await meta(conn, `SELECT * FROM ${schemaOf(ks)}.columns WHERE keyspace_name = ? AND table_name = ?`, [ks, table]);
  return r.rows.map(x => ({ name: x.column_name, type: x.type, kind: x.kind, position: x.position, order: x.clustering_order }))
    .sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.position - b.position) || a.name.localeCompare(b.name));
}

async function indexRows(conn, ks, table) {
  const r = await meta(conn, 'SELECT * FROM system_schema.indexes WHERE keyspace_name = ? AND table_name = ?', [ks, table]);
  return r.rows.sort((a, b) => a.index_name.localeCompare(b.index_name));
}

async function typeRows(conn, ks) {
  const r = await meta(conn, 'SELECT * FROM system_schema.types WHERE keyspace_name = ?', [ks]);
  return r.rows.sort((a, b) => a.type_name.localeCompare(b.type_name));
}

async function functionRows(conn, ks) {
  const f = await meta(conn, 'SELECT * FROM system_schema.functions WHERE keyspace_name = ?', [ks]);
  const a = await meta(conn, 'SELECT * FROM system_schema.aggregates WHERE keyspace_name = ?', [ks]);
  const rows = [
    ...f.rows.map(x => ({ kind: 'function', name: x.function_name, args: x.argument_types || [], returns: x.return_type, row: x })),
    ...a.rows.map(x => ({ kind: 'aggregate', name: x.aggregate_name, args: x.argument_types || [], returns: x.return_type, row: x })),
  ];
  rows.forEach(x => { x.key = `${x.name}(${x.args.join(',')})`; });
  return rows.sort((x, y) => x.key.localeCompare(y.key));
}

const replicationText = rep => {
  const e = Object.fromEntries(mapEntries(rep));
  if (!e.class) return '';
  const cls = String(e.class).split('.').pop();
  if (cls === 'SimpleStrategy') return `${cls} RF ${e.replication_factor}`;
  return `${cls} ${Object.entries(e).filter(([k]) => k !== 'class').map(([k, v]) => `${k}:${v}`).join(' ')}`.trim();
};

// ---------------------------------------------------------------------------------------------
// Object Explorer
// ---------------------------------------------------------------------------------------------

const node = (key, label, o = {}) => ({ key, label, icon: 'folder', expandable: false, ...o });

function ksNode(k) {
  return node(k.name, k.name, {
    icon: 'db', expandable: true, kind: 'generic', dim: isSystem(k.name), sub: replicationText(k.replication) ? `(${replicationText(k.replication)})` : undefined,
    row: { name: k.name, size_mb: null, owner: null, encoding: null },
    actions: [
      { label: 'Describe tables', sql: 'SELECT table_name, comment FROM system_schema.tables WHERE keyspace_name = ' + lit(k.name), run: true, db: k.name },
      { label: 'Script as CREATE', script: 'create' },
    ],
  });
}

function tableNode(ks, t, icon) {
  const ref = `${cql(ks)}.${cql(t)}`;
  return {
    icon, ref,
    actions: [
      { label: 'Select Top 1000 Rows', sql: `SELECT * FROM ${ref} LIMIT 1000`, run: true, db: ks },
      { label: 'Script as CREATE', script: 'create' },
    ],
  };
}

function columnNodes(rows) {
  return rows.map(c => {
    const pk = c.kind === 'partition_key' || c.kind === 'clustering';
    const role = c.kind === 'partition_key' ? 'partition key' : c.kind === 'clustering' ? `clustering ${String(c.order || 'asc').toLowerCase()}` : c.kind === 'static' ? 'static' : '';
    return node(c.name, c.name, {
      icon: pk ? 'key' : 'col', sub: `(${c.type}${role ? ', ' + role : ''})`,
      row: { name: c.name, data_type: c.type, nullable: !pk, pk, fk: false, identity: false, default: null },
    });
  });
}

async function tree(conn, path = []) {
  let p = path.slice();
  const sysFolder = p[0] === '$sys';
  if (sysFolder && p.length > 1) p = p.slice(1);
  const [ks, folder, name, sub, extra] = p;

  if (p.length === 0) {
    const all = await keyspaceRows(conn);
    const user = all.filter(k => !isSystem(k.name));
    const sys = all.filter(k => isSystem(k.name));
    const out = user.map(ksNode);
    if (sys.length) out.push(node('$sys', 'System Keyspaces', { expandable: true, kind: 'gdatabases', count: sys.length, row: { name: 'System Keyspaces' } }));
    return out;
  }
  if (sysFolder && path.length === 1) {
    return (await keyspaceRows(conn)).filter(k => isSystem(k.name)).map(ksNode);
  }

  if (p.length === 1) {
    const virtual = VIRTUAL_KEYSPACES.has(ks);
    const out = [node('t', 'Tables', { expandable: true, kind: 'generic', row: { name: 'Tables' } })];
    if (!virtual) {
      out.push(node('mv', 'Materialized Views', { expandable: true, kind: 'generic', row: { name: 'Materialized Views' } }));
      out.push(node('ut', 'User Types', { expandable: true, kind: 'generic', row: { name: 'User Types' } }));
      out.push(node('fn', 'Functions', { expandable: true, kind: 'generic', row: { name: 'Functions' } }));
    }
    return out;
  }

  if (folder === 't') {
    if (p.length === 2) {
      return (await tableNames(conn, ks)).map(t => {
        const n = tableNode(ks, t.name, 'table');
        return node(t.name, t.name, { icon: 'table', expandable: true, kind: 'generic', drag: n.ref, row: { name: t.name }, actions: n.actions, sub: t.comment ? `(${t.comment})` : undefined });
      });
    }
    if (p.length === 3) {
      return [
        node('c', 'Columns', { expandable: true, kind: 'columns', row: { name: 'Columns' } }),
        node('i', 'Indexes', { expandable: true, kind: 'indexes', row: { name: 'Indexes' } }),
      ];
    }
    if (p.length === 4 && sub === 'c') return columnNodes(await columnRows(conn, ks, name));
    if (p.length === 4 && sub === 'i') {
      return (await indexRows(conn, ks, name)).map(ix => {
        const o = Object.fromEntries(mapEntries(ix.options));
        return node(ix.index_name, ix.index_name, {
          icon: 'index', sub: o.target ? `(${o.target})` : undefined,
          row: { name: ix.index_name, kind: ix.kind, unique: false, keys: o.target || '', include: '' },
        });
      });
    }
    return [];
  }

  if (folder === 'mv') {
    if (p.length === 2) {
      return (await viewRows(conn, ks)).map(v => {
        const n = tableNode(ks, v.view_name, 'view');
        return node(v.view_name, v.view_name, { icon: 'view', expandable: true, kind: 'generic', drag: n.ref, sub: `(on ${v.base_table_name})`, row: { name: v.view_name }, actions: n.actions });
      });
    }
    if (p.length === 3) return [node('c', 'Columns', { expandable: true, kind: 'columns', row: { name: 'Columns' } })];
    if (p.length === 4 && sub === 'c') return columnNodes(await columnRows(conn, ks, name));
    return [];
  }

  if (folder === 'ut') {
    if (p.length === 2) {
      return (await typeRows(conn, ks)).map(t => node(t.type_name, t.type_name, {
        icon: 'type', expandable: true, kind: 'columns', sub: `(${(t.field_names || []).length} fields)`, row: { name: t.type_name },
        actions: [{ label: 'Script as CREATE', script: 'create' }],
      }));
    }
    if (p.length === 3) {
      const t = (await typeRows(conn, ks)).find(x => x.type_name === name);
      if (!t) return [];
      return (t.field_names || []).map((f, i) => node(f, f, {
        icon: 'col', sub: `(${t.field_types[i]})`,
        row: { name: f, data_type: t.field_types[i], nullable: true, pk: false, fk: false, identity: false, default: null },
      }));
    }
    return [];
  }

  if (folder === 'fn' && p.length === 2) {
    return (await functionRows(conn, ks)).map(f => node(f.key, `${f.name}(${f.args.join(', ')})`, {
      icon: 'func', sub: `${f.kind === 'aggregate' ? 'aggregate ' : ''}→ ${f.returns}`, row: { name: f.key },
      actions: [{ label: 'Script as CREATE', script: 'create' }],
    }));
  }
  return [];
}

async function databases(conn) {
  const all = await keyspaceRows(conn);
  return [...all.filter(k => !isSystem(k.name)), ...all.filter(k => isSystem(k.name))].map(k => k.name);
}

async function objects(conn, db) {
  if (!db) return [];
  const out = (await tableNames(conn, db)).map(t => ({ schema: '', name: t.name, type: 'table' }));
  for (const v of await viewRows(conn, db).catch(() => [])) out.push({ schema: '', name: v.view_name, type: 'view' });
  return out;
}

async function columns(conn, db, schema, name) {
  if (!db || !name) return [];
  return (await columnRows(conn, db, name)).map(c => ({ name: c.name, type: c.type }));
}

// ---------------------------------------------------------------------------------------------
// Scripting
// ---------------------------------------------------------------------------------------------

const optionValue = v => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return lit(v);
  if (typeof v === 'boolean' || typeof v === 'number') return String(v);
  const ents = mapEntries(v);
  if (ents.length || v instanceof Map || (typeof v === 'object' && v.constructor === Object)) return `{${ents.map(([k, x]) => `${lit(k)}: ${lit(x)}`).join(', ')}}`;
  return lit(String(v));
};

const TABLE_OPTIONS = ['bloom_filter_fp_chance', 'caching', 'comment', 'compaction', 'compression', 'crc_check_chance', 'dclocal_read_repair_chance',
  'default_time_to_live', 'gc_grace_seconds', 'max_index_interval', 'memtable_flush_period_in_ms', 'min_index_interval', 'read_repair',
  'read_repair_chance', 'speculative_retry', 'additional_write_policy', 'memtable', 'cdc'];

function primaryKey(cols) {
  const pk = cols.filter(c => c.kind === 'partition_key').map(c => cql(c.name));
  const ck = cols.filter(c => c.kind === 'clustering').map(c => cql(c.name));
  return `PRIMARY KEY (${[pk.length > 1 ? `(${pk.join(', ')})` : pk[0], ...ck].join(', ')})`;
}

async function scriptTable(conn, ks, table) {
  const cols = await columnRows(conn, ks, table);
  if (!cols.length) throw new Error(`Table ${ks}.${table} was not found.`);
  const t = (await meta(conn, `SELECT * FROM ${schemaOf(ks)}.tables WHERE keyspace_name = ? AND table_name = ?`, [ks, table])).rows[0] || {};
  const defs = cols.map(c => `    ${cql(c.name)} ${c.type}${c.kind === 'static' ? ' static' : ''}`);
  defs.push(`    ${primaryKey(cols)}`);
  let s = `CREATE TABLE ${cql(ks)}.${cql(table)} (\n${defs.join(',\n')}\n)`;
  const opts = [];
  const ck = cols.filter(c => c.kind === 'clustering');
  if (ck.length) opts.push(`CLUSTERING ORDER BY (${ck.map(c => `${cql(c.name)} ${String(c.order || 'asc').toUpperCase()}`).join(', ')})`);
  for (const k of TABLE_OPTIONS) {
    const v = optionValue(t[k]);
    if (v !== null) opts.push(`${k} = ${v}`);
  }
  if (opts.length) s += ` WITH ${opts.join('\n    AND ')}`;
  return s + ';';
}

async function scriptView(conn, ks, view) {
  const v = (await meta(conn, 'SELECT * FROM system_schema.views WHERE keyspace_name = ? AND view_name = ?', [ks, view])).rows[0];
  if (!v) throw new Error(`Materialized view ${ks}.${view} was not found.`);
  const cols = await columnRows(conn, ks, view);
  let s = `CREATE MATERIALIZED VIEW ${cql(ks)}.${cql(view)} AS\n    SELECT ${v.include_all_columns ? '*' : cols.map(c => cql(c.name)).join(', ')}\n    FROM ${cql(ks)}.${cql(v.base_table_name)}\n    WHERE ${v.where_clause}\n    ${primaryKey(cols)}`;
  const ck = cols.filter(c => c.kind === 'clustering');
  const opts = [];
  if (ck.length) opts.push(`CLUSTERING ORDER BY (${ck.map(c => `${cql(c.name)} ${String(c.order || 'asc').toUpperCase()}`).join(', ')})`);
  for (const k of TABLE_OPTIONS) {
    const o = optionValue(v[k]);
    if (o !== null) opts.push(`${k} = ${o}`);
  }
  if (opts.length) s += `\n    WITH ${opts.join('\n    AND ')}`;
  return s + ';';
}

async function script(conn, path, kind) {
  if (kind !== 'create') throw new Error(`Scripting "${kind}" is not supported for Cassandra.`);
  let p = path.slice();
  if (p[0] === '$sys') p = p.slice(1);
  const [ks, folder, name, sub, extra] = p;
  if (!ks) throw new Error('Select a keyspace, table, view, type or function to script.');

  if (p.length === 1) {
    const k = (await keyspaceRows(conn)).find(x => x.name === ks);
    if (!k) throw new Error(`Keyspace ${ks} was not found.`);
    const rep = optionValue(k.replication) || "{'class': 'SimpleStrategy', 'replication_factor': '1'}";
    return `CREATE KEYSPACE ${cql(ks)} WITH replication = ${rep}${k.durable === null ? '' : ` AND durable_writes = ${k.durable}`};`;
  }
  if (folder === 't' && name) {
    if (sub === 'i' && extra) {
      const ix = (await indexRows(conn, ks, name)).find(x => x.index_name === extra);
      if (!ix) throw new Error(`Index ${extra} was not found.`);
      const o = Object.fromEntries(mapEntries(ix.options));
      const custom = ix.kind === 'CUSTOM' || (o.class_name && o.class_name !== 'org.apache.cassandra.index.internal.CassandraIndex');
      const extraOpts = Object.entries(o).filter(([k]) => k !== 'target' && k !== 'class_name');
      return `CREATE ${custom ? 'CUSTOM ' : ''}INDEX ${cql(ix.index_name)} ON ${cql(ks)}.${cql(name)} (${o.target})${custom ? ` USING ${lit(o.class_name)}` : ''}${extraOpts.length ? ` WITH OPTIONS = {${extraOpts.map(([k, v]) => `${lit(k)}: ${lit(v)}`).join(', ')}}` : ''};`;
    }
    return scriptTable(conn, ks, name);
  }
  if (folder === 'mv' && name) return scriptView(conn, ks, name);
  if (folder === 'ut' && name) {
    const t = (await typeRows(conn, ks)).find(x => x.type_name === name);
    if (!t) throw new Error(`Type ${ks}.${name} was not found.`);
    return `CREATE TYPE ${cql(ks)}.${cql(name)} (\n${t.field_names.map((f, i) => `    ${cql(f)} ${t.field_types[i]}`).join(',\n')}\n);`;
  }
  if (folder === 'fn' && name) {
    const f = (await functionRows(conn, ks)).find(x => x.key === name);
    if (!f) throw new Error(`Function ${name} was not found.`);
    const r = f.row;
    if (f.kind === 'aggregate') {
      return `CREATE OR REPLACE AGGREGATE ${cql(ks)}.${cql(f.name)}(${f.args.join(', ')})\n    SFUNC ${cql(r.state_func)}\n    STYPE ${r.state_type}${r.final_func ? `\n    FINALFUNC ${cql(r.final_func)}` : ''}${r.initcond ? `\n    INITCOND ${r.initcond}` : ''};`;
    }
    const args = (r.argument_names || []).map((n, i) => `${cql(n)} ${f.args[i]}`).join(', ');
    return `CREATE OR REPLACE FUNCTION ${cql(ks)}.${cql(f.name)}(${args})\n    ${r.called_on_null_input ? 'CALLED' : 'RETURNS NULL'} ON NULL INPUT\n    RETURNS ${f.returns}\n    LANGUAGE ${r.language}\n    AS $$${r.body}$$;`;
  }
  throw new Error('Scripting is not available for this node.');
}

// ---------------------------------------------------------------------------------------------
// Sessions (one Client per query tab, so USE does not leak between tabs)
// ---------------------------------------------------------------------------------------------

async function openSession(conn) {
  const { Client } = requireDriver('cassandra-driver');
  const S = { client: null, keyspace: conn.spec.database || '', running: false, abort: null };

  async function ensureClient() {
    if (S.client) return S.client;
    const c = new Client(clientOptions(conn.spec, conn.dc));
    try {
      await c.connect();
    } catch (e) {
      await c.shutdown().catch(() => {});
      throw friendlyError(e, conn.spec);
    }
    S.client = c;
    if (S.keyspace) {
      try { await c.execute(`USE ${cql(S.keyspace)}`, [], { prepare: false }); S.keyspace = c.keyspace || S.keyspace; }
      catch { S.keyspace = ''; }                         // the configured keyspace does not exist: stay without one
    }
    return c;
  }

  return {
    async run(text, opts = {}) {
      const maxRows = Math.max(1, Number(opts.maxRows) || 1000);
      const items = [];
      const stmts = splitStatements(blankSlashComments(String(text || '')), 'cql');
      const failWith = (e, st) => {
        let line = st ? st.line : null;
        const m = st && /\bline (\d+):\d+/.exec(e && e.message || '');         // "line 1:14 no viable alternative..."
        if (m) line = st.line + Number(m[1]) - 1;
        items.push({ type: 'err', message: e && e.message ? e.message : String(e), line });
        return { items, errors: 1, database: S.keyspace };
      };
      if (opts.mode === 'explain') {
        items.push({ type: 'err', message: 'Cassandra has no execution plans.', line: stmts[0] ? stmts[0].line : null });
        return { items, errors: 1, database: S.keyspace };
      }
      S.running = true;
      const cancelled = new Promise((_, rej) => { S.abort = () => rej(new Error('Operation cancelled')); });
      cancelled.catch(() => {});
      try {
        let client;
        try { client = await Promise.race([ensureClient(), cancelled]); } catch (e) { return failWith(e, stmts[0]); }
        if (opts.database && opts.database !== S.keyspace) {
          try { await client.execute(`USE ${cql(String(opts.database))}`, [], { prepare: false }); S.keyspace = client.keyspace || String(opts.database); }
          catch (e) { return failWith(e, stmts[0]); }
        }
        for (const st of stmts) {
          let res;
          const sql = st.sql.replace(/\s*;\s*$/, '');
          try {
            res = await Promise.race([client.execute(sql, [], { prepare: false, fetchSize: maxRows }), cancelled]);
          } catch (e) { return failWith(e, st); }
          if (/^USE\b/i.test(sql)) S.keyspace = client.keyspace || S.keyspace;
          if (res.columns && res.columns.length) {
            const g = grid(res.columns.map(c => ({ name: c.name, type: typeName(c.type) })), maxRows);
            for (const row of res.rows) g.add(row.values().map(v => norm(v)));
            items.push(g.item);
            if (res.pageState) items.push({ type: 'msg', text: `Showing the first ${res.rows.length} rows; more rows are available (add a LIMIT or narrow the WHERE clause).` });
          } else {
            items.push({ type: 'msg', text: 'Statement executed.' });
          }
          const warnings = res.info && res.info.warnings;
          if (Array.isArray(warnings)) for (const w of warnings) items.push({ type: 'msg', text: `Warning: ${w}` });
        }
        return { items, errors: 0, database: S.keyspace };
      } finally {
        S.running = false;
        S.abort = null;
      }
    },
    // Releases the editor immediately; the statement itself keeps running on the server.
    cancel() {
      if (S.running && S.abort) { S.abort(); return true; }
      return false;
    },
    async close() {
      if (S.client) { await S.client.shutdown().catch(() => {}); S.client = null; }
    },
  };
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  // exported for tests
  _internal: { cql, lit, typeName, norm, replicationText, primaryKey, optionValue, isSystem, blankSlashComments },
};
