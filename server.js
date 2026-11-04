'use strict';
// Web SQL Studio: a lightweight, browser-based SQL Server management tool.
// Runs on 127.0.0.1 only; the browser UI lives in ./public.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');
const { exec } = require('child_process');
const { Connection, Request, TYPES } = require('tedious');
const editLib = require('./drivers/edit');
const designLib = require('./drivers/design');

const CONFIG_FILE = path.join(__dirname, 'config.json');
const CONN_FILE = path.join(__dirname, 'connections.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const settings = readJson(CONFIG_FILE, {});
const PORT = Number(process.env.PORT || settings.port || 5050);
const HOST = '127.0.0.1';
const APP_URL = `http://${HOST}:${PORT}/`;
const IDLE_MS = 4 * 60 * 60 * 1000;   // close query sessions unused for 4 hours
const MAX_TEXT = 65535;               // same cap SSMS uses for grid text
const MAX_BINARY = 1024;              // bytes of varbinary shown as hex
const MAX_CELLS = 2000000;            // protects memory on huge result sets
const MAX_MESSAGES = 10000;
const PLAN_COLUMN = 'Microsoft SQL Server 2005 XML Showplan';

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function clampInt(v, lo, hi, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, lo), hi) : def;
}

// ---------------------------------------------------------------------------
// Connection specs (saved in connections.json)

function parseConnectionString(str) {
  const kv = {};
  let i = 0;
  while (i < str.length) {
    const eq = str.indexOf('=', i);
    if (eq < 0) break;
    const key = str.slice(i, eq).trim().toLowerCase().replace(/\s+/g, ' ');
    i = eq + 1;
    while (str[i] === ' ') i++;
    let val = '';
    const q = str[i];
    if (q === '"' || q === "'" || q === '{') {
      const close = q === '{' ? '}' : q;
      let j = i + 1;
      while (j < str.length) {
        if (str[j] === close) {
          if (str[j + 1] === close) { val += close; j += 2; continue; }
          break;
        }
        val += str[j++];
      }
      const semi = str.indexOf(';', j);
      i = semi < 0 ? str.length : semi + 1;
    } else {
      const semi = str.indexOf(';', i);
      val = (semi < 0 ? str.slice(i) : str.slice(i, semi)).trim();
      i = semi < 0 ? str.length : semi + 1;
    }
    if (key) kv[key] = val;
  }
  const pick = (...names) => names.map(n => kv[n]).find(v => v !== undefined);
  const bool = (v, def) => (v === undefined ? def : /^(true|yes|1|mandatory|strict)$/i.test(v));
  return {
    server: pick('server', 'data source', 'address', 'addr', 'network address') || 'localhost',
    auth: 'sql',
    user: pick('user id', 'uid', 'user', 'username') || '',
    password: pick('password', 'pwd') || '',
    database: pick('database', 'initial catalog') || '',
    encrypt: bool(pick('encrypt'), true),
    trustServerCertificate: bool(pick('trustservercertificate', 'trust server certificate'), false),
    connectTimeout: parseInt(pick('connect timeout', 'connection timeout', 'timeout'), 10) || 15,
    appName: pick('application name', 'app') || '',
  };
}

// Database types other than SQL Server are handled by modules in ./drivers (loaded on first use).
const DRIVERS = {
  mysql: './drivers/mysql', mariadb: './drivers/mysql', postgres: './drivers/postgres', oracle: './drivers/oracle',
  sqlite: './drivers/sqlite', mongodb: './drivers/mongodb', redis: './drivers/redis', cassandra: './drivers/cassandra',
  cdb: './drivers/cdb',
};
const TYPE_LABEL = {
  mssql: 'SQL Server', mysql: 'MySQL', mariadb: 'MariaDB', postgres: 'PostgreSQL', oracle: 'Oracle', sqlite: 'SQLite',
  mongodb: 'MongoDB', redis: 'Redis', cassandra: 'Cassandra', cdb: 'Mold Data',
};
const FILE_TYPES = new Set(['sqlite', 'cdb']);   // connections that open a local file

function normalizeGenericSpec(x, type) {
  const str = v => String(v == null ? '' : v).trim();
  const s = {
    type,
    server: str(x.server),
    port: str(x.port).replace(/\D/g, ''),
    user: str(x.user),
    password: typeof x.password === 'string' ? x.password : '',
    database: str(x.database),
    encrypt: !!x.encrypt,
    trustServerCertificate: !!x.trustServerCertificate,
    connectTimeout: clampInt(x.connectTimeout, 1, 300, 15),
    appName: str(x.appName) || 'WebSqlStudio',
    file: str(x.file),
    readOnly: !!x.readOnly,
    create: !!x.create,
    connectionString: str(x.connectionString),
    authSource: str(x.authSource),
    dataCenter: str(x.dataCenter),
  };
  if (FILE_TYPES.has(type)) {
    if (!s.file) throw new Error(type === 'cdb' ? 'Mold data file is required.' : 'Database file is required.');
    if (!path.isAbsolute(s.file)) {
      const example = path.join(os.homedir(), 'Desktop', type === 'cdb' ? 'moldset.cdb' : 'mydata.db');
      throw new Error(`Enter the full path of the file, for example ${example} — or click "Browse…".`);
    }
    if (type === 'sqlite' && /\.sql$/i.test(s.file)) {
      throw new Error('This is a SQL script (.sql), not a SQLite database file. Create a new database (.db) and run the script in it, or open the script with File → Open.');
    }
  }
  else if (type === 'mongodb') { if (!s.server && !s.connectionString) throw new Error('Server name or a connection string is required.'); }
  else if (!s.server) throw new Error('Server name is required.');
  if (type === 'oracle' && !s.database) throw new Error('Service name is required for Oracle.');
  return s;
}

function normalizeSpec(x) {
  const type = TYPE_LABEL[x.type] ? x.type : 'mssql';
  if (type !== 'mssql') return normalizeGenericSpec(x, type);
  const server = String(x.server || '').trim();
  if (!server) throw new Error('Server name is required.');
  const auth = x.auth === 'ntlm' ? 'ntlm' : 'sql';
  let user = String(x.user || '').trim();
  let domain = auth === 'ntlm' ? String(x.domain || '').trim() : '';
  if (auth === 'ntlm' && !domain && user.includes('\\')) [domain, user] = user.split('\\', 2);
  if (!user) throw new Error('Login is required.');
  return {
    type: 'mssql', server, auth, user, domain,
    password: typeof x.password === 'string' ? x.password : '',
    database: String(x.database || '').trim(),
    encrypt: x.encrypt !== false,
    trustServerCertificate: !!x.trustServerCertificate,
    connectTimeout: clampInt(x.connectTimeout, 1, 300, 15),
    appName: String(x.appName || '').trim() || 'WebSqlStudio',
  };
}

function toTedious(spec) {
  let server = spec.server.replace(/^tcp:/i, '');
  let port, instanceName;
  const comma = server.indexOf(',');
  if (comma >= 0) { port = parseInt(server.slice(comma + 1), 10); server = server.slice(0, comma); }
  const slash = server.indexOf('\\');
  if (slash >= 0) { instanceName = server.slice(slash + 1); server = server.slice(0, slash); }
  if (server === '.' || server.toLowerCase() === '(local)') server = 'localhost';
  const options = {
    database: spec.database || undefined,
    encrypt: spec.encrypt,
    trustServerCertificate: spec.trustServerCertificate,
    connectTimeout: spec.connectTimeout * 1000,
    appName: spec.appName,
    requestTimeout: 0,   // no timeout, like SSMS; queries can be cancelled instead
    useUTC: true,        // read datetime values exactly as stored
  };
  if (instanceName) options.instanceName = instanceName;
  else options.port = port || 1433;
  const authentication = spec.auth === 'ntlm'
    ? { type: 'ntlm', options: { userName: spec.user, password: spec.password, domain: spec.domain } }
    : { type: 'default', options: { userName: spec.user, password: spec.password } };
  return { server, authentication, options };
}

function displayName(s) {
  const type = s.type || 'mssql';
  if (type === 'mssql') return `${s.server} (${s.auth === 'ntlm' && s.domain ? s.domain + '\\' : ''}${s.user})`;
  if (FILE_TYPES.has(type)) return `${TYPE_LABEL[type]}: ${path.basename(s.file)}`;
  const host = s.connectionString ? s.connectionString.replace(/^[a-z+]+:\/\/([^@/]*@)?/i, '').split(/[/?]/)[0] : s.server + (s.port ? ':' + s.port : '');
  return `${TYPE_LABEL[type]}: ${host}${s.user ? ` (${s.user})` : ''}`;
}
const sameTarget = (a, b) => (a.type || 'mssql') === (b.type || 'mssql') &&
  String(a.server || '').toLowerCase() === String(b.server || '').toLowerCase() &&
  String(a.user || '').toLowerCase() === String(b.user || '').toLowerCase() &&
  (a.auth || '') === (b.auth || '') && String(a.port || '') === String(b.port || '') &&
  String(a.file || '').toLowerCase() === String(b.file || '').toLowerCase() && (a.connectionString || '') === (b.connectionString || '');

function publicSpec(s) {
  const { password, ...rest } = s;
  return { ...rest, type: s.type || 'mssql', name: displayName(s), hasPassword: !!password, typeLabel: TYPE_LABEL[s.type || 'mssql'] };
}

// A saved connection needs the password typed in when it was saved without "Remember password".
function needsPassword(s) {
  if (FILE_TYPES.has(s.type)) return false;
  if (s.rememberPassword === false) return !!s.user || s.type === 'mssql' || !s.type;
  return !s.password && (!s.type || s.type === 'mssql');
}

let savedConns = (readJson(CONN_FILE, null) || {}).connections;
function writeSaved() {
  fs.writeFileSync(CONN_FILE, JSON.stringify({ connections: savedConns }, null, 2) + '\n');
}
if (!Array.isArray(savedConns)) {
  // First run: move the connection string from config.json into connections.json.
  savedConns = [];
  if (settings.connectionString) {
    try { savedConns.push({ id: crypto.randomUUID(), ...normalizeSpec(parseConnectionString(settings.connectionString)) }); }
    catch (e) { console.error('Ignoring connectionString in config.json:', e.message); }
    delete settings.connectionString;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(settings, null, 2) + '\n');
  }
  writeSaved();
}

// ---------------------------------------------------------------------------
// Sessions: one dedicated connection per query tab, so temp tables, SET
// options, open transactions and USE survive between executions (like SSMS).

const DEFAULT_OPTIONS = { nocount: false, statsIO: false, statsTime: false, xactAbort: false, isolation: 'READ COMMITTED' };
const ISOLATION = ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SNAPSHOT', 'SERIALIZABLE'];

class Session {
  constructor(cfg, connId, initSql) {
    this.cfg = cfg;
    this.connId = connId;
    this.initSql = initSql;
    this.conn = null;
    this.opening = null;
    this.db = null;
    this.busy = false;
    this.cancelled = false;
    this.listener = null;
    this.applied = { ...DEFAULT_OPTIONS };
    this.lastUsed = Date.now();
  }

  open() {
    if (this.conn) return Promise.resolve(this.conn);
    if (this.opening) return this.opening;
    this.opening = new Promise((resolve, reject) => {
      const c = new Connection(this.cfg);
      const lost = () => { if (this.conn === c) this.conn = null; };
      c.on('error', lost); // must be handled or tedious throws
      c.on('end', lost);
      c.on('databaseChange', db => { this.db = db; });
      c.on('infoMessage', m => this.listener && this.listener.info(m));
      c.on('errorMessage', m => this.listener && this.listener.error(m));
      c.connect(err => {
        if (err) { this.opening = null; return reject(err); }
        this.conn = c;
        this.applied = { ...DEFAULT_OPTIONS };
        if (!this.initSql) { this.opening = null; return resolve(c); }
        c.execSqlBatch(new Request(this.initSql, () => { this.opening = null; resolve(c); }));
      });
    });
    return this.opening;
  }

  batch(sqlText, sink, params) {
    return new Promise(resolve => {
      const req = new Request(sqlText, err => resolve(err || null));
      if (sink) {
        req.on('columnMetadata', cols => sink.columns(cols));
        req.on('row', cols => sink.row(cols));
        req.on('done', n => sink.done(n));
        req.on('doneInProc', n => sink.done(n));
      }
      if (params) {
        for (const [name, value] of Object.entries(params)) req.addParameter(name, TYPES.NVarChar, value);
        this.conn.execSql(req);
      } else {
        this.conn.execSqlBatch(req);
      }
    });
  }

  cancel() {
    if (!this.busy) return false;
    this.cancelled = true;
    if (this.conn) this.conn.cancel();
    return true;
  }

  close() {
    if (this.conn) { try { this.conn.close(); } catch { /* already closed */ } }
    this.conn = null;
  }
}

// Live (connected) servers. Each has a shared metadata connection used by
// Object Explorer and row editing, one query at a time.
const live = new Map();
const sessions = new Map();

// anyType: also accept connections handled by ./drivers (otherwise SQL Server only).
function getLive(id, anyType) {
  const c = live.get(id);
  if (!c) {
    const e = new Error('Not connected to this server. Use "Connect" first.');
    e.notConnected = true;
    throw e;
  }
  if (c.generic && !anyType) throw new Error(`This feature is only available for SQL Server connections (this is ${TYPE_LABEL[c.spec.type]}).`);
  return c;
}

function closeLive(c) {
  if (c.editSess) Promise.resolve(c.editSess.close()).catch(() => {});
  if (c.generic) Promise.resolve(c.driver.close(c.handle)).catch(() => {});
  else c.meta.close();
  for (const [id, s] of sessions) if (s.connId === c.spec.id) { s.close(); sessions.delete(id); }
  live.delete(c.spec.id);
}

// Query-tab session for a driver-based connection.
class GenericSession {
  constructor(c) {
    this.c = c;
    this.connId = c.spec.id;
    this.gs = null;
    this.busy = false;
    this.cancelled = false;
    this.lastUsed = Date.now();
  }

  cancel() {
    if (!this.busy || !this.gs) return false;
    this.cancelled = true;
    Promise.resolve(this.gs.cancel()).catch(() => {});
    return true;
  }

  close() {
    if (this.gs) Promise.resolve(this.gs.close()).catch(() => {});
    this.gs = null;
  }
}

function getSession(tabId, c) {
  if (typeof tabId !== 'string' || !/^[\w-]{1,64}$/.test(tabId)) throw new Error('Invalid session id.');
  let s = sessions.get(tabId);
  if (s && (s.connId !== c.spec.id || !!s.c !== !!c.generic)) { s.close(); s = null; }
  if (!s) { s = c.generic ? new GenericSession(c) : new Session(c.cfg, c.spec.id); sessions.set(tabId, s); }
  return s;
}

async function executeGeneric(s, body) {
  if (typeof body.sql !== 'string' || !body.sql.trim()) throw new Error('Nothing to execute.');
  const t0 = Date.now();
  s.busy = true;
  s.cancelled = false;
  try {
    if (!s.gs) s.gs = await s.c.driver.openSession(s.c.handle);
    const r = await s.gs.run(body.sql, {
      database: body.database || undefined,
      maxRows: clampInt(body.maxRows, 1, 1000000, 5000),
      mode: body.plan === 'estimated' ? 'explain' : undefined,
    });
    if (s.cancelled) r.items.push({ type: 'err', message: 'Query was cancelled by user.' });
    return { items: r.items, errors: r.errors, cancelled: s.cancelled, elapsed: Date.now() - t0, database: r.database, tranCount: null, spid: null };
  } catch (e) {
    return { items: [{ type: 'err', message: e.message }], errors: 1, cancelled: s.cancelled, elapsed: Date.now() - t0, tranCount: null, spid: null };
  } finally {
    s.busy = false;
    s.lastUsed = Date.now();
  }
}

setInterval(() => {
  for (const [id, s] of sessions) {
    if (!s.busy && Date.now() - s.lastUsed > IDLE_MS) { s.close(); sessions.delete(id); }
  }
}, 60000).unref();

// Metadata connection: never waits forever on locks or a dead network link,
// so one stuck query cannot block Object Explorer.
const META_INIT = 'SET LOCK_TIMEOUT 10000;';
const META_TIMEOUT = 60000;
const metaConfig = cfg => ({ ...cfg, options: { ...cfg.options, requestTimeout: META_TIMEOUT } });

function metaSets(c, sqlText, params) {
  const run = async () => {
    const s = c.meta;
    await s.open();
    const sets = [];
    let cur = null, lastError = null;
    s.listener = { info() {}, error(m) { lastError = m.message; } };
    const err = await s.batch(sqlText, {
      columns(cols) {
        cur = { names: cols.map(x => x.colName), columns: cols.map(x => ({ name: x.colName, type: x.type.name })), rows: [], cells: [] };
        sets.push(cur);
      },
      row(cols) {
        const o = {};
        cols.forEach((x, i) => { o[cur.names[i]] = x.value; });
        cur.rows.push(o);
        cur.cells.push(cols.map(x => toCell(x.value, x.metadata)));
      },
      done() {},
    }, params);
    s.listener = null;
    if (err) {
      // A timed-out request can leave the connection unusable: start a fresh one next time.
      if (err.code === 'ETIMEOUT' || err.code === 'ESOCKET' || err.code === 'ECLOSE') s.close();
      throw new Error(err.code === 'ETIMEOUT' ? 'The server did not answer within 60 seconds (it may be busy or a table is locked). Try Refresh.' : lastError || err.message);
    }
    return sets;
  };
  const p = c.chain.then(run, run);
  c.chain = p.catch(() => {});
  return p;
}

async function metaQuery(c, sqlText, params) {
  const sets = await metaSets(c, sqlText, params);
  return sets.length ? sets[0].rows : [];
}

// ---------------------------------------------------------------------------
// Script execution

// Splits a script on "GO" lines (optionally "GO n"), ignoring GO inside
// block comments and multi-line string literals.
function splitBatches(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  const st = { block: 0, str: false };
  let buf = [];
  let start = 0;
  lines.forEach((line, i) => {
    const m = !st.block && !st.str && /^\s*go(?:\s+(\d+))?\s*(?:--.*)?$/i.exec(line);
    if (m) {
      out.push({ sql: buf.join('\n'), line: start, repeat: m[1] ? Number(m[1]) : 1 });
      buf = [];
      start = i + 1;
    } else {
      buf.push(line);
      scanLine(line, st);
    }
  });
  out.push({ sql: buf.join('\n'), line: start, repeat: 1 });
  return out.filter(b => b.sql.trim());
}

function scanLine(line, st) {
  for (let i = 0; i < line.length; i++) {
    const ch = line[i], nx = line[i + 1];
    if (st.str) {
      if (ch === "'") { if (nx === "'") i++; else st.str = false; }
    } else if (st.block) {
      if (ch === '*' && nx === '/') { st.block--; i++; } else if (ch === '/' && nx === '*') { st.block++; i++; }
    } else if (ch === '-' && nx === '-') {
      return;
    } else if (ch === '/' && nx === '*') {
      st.block++; i++;
    } else if (ch === "'") {
      st.str = true;
    } else if (ch === '[') {
      const end = line.indexOf(']', i + 1);
      if (end < 0) return;
      i = end;
    }
  }
}

function pad(n, w = 2) { return String(n).padStart(w, '0'); }

function formatDate(d, type) {
  if (isNaN(d)) return String(d);
  const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  if (type === 'Date') return date;
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  const ms = '.' + pad(d.getUTCMilliseconds(), 3);
  if (type === 'Time') return time + ms;
  if (type === 'SmallDateTime') return `${date} ${time}`;
  if (type === 'DateTimeOffset') return `${date} ${time}${ms} +00:00`;
  return `${date} ${time}${ms}`;
}

// Converts a tedious value into something JSON can carry and the grid can show.
function toCell(v, meta) {
  if (v === null || v === undefined) return null;
  const type = meta.type.name;
  if (typeof v === 'string') return v.length > MAX_TEXT ? v.slice(0, MAX_TEXT) + '…' : v;
  if (typeof v === 'number') {
    if (/^(Decimal|Numeric)/.test(type) && meta.scale != null) return v.toFixed(meta.scale);
    if (/Money/.test(type)) return v.toFixed(4);
    return v;
  }
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'bigint') return v.toString();
  if (v instanceof Date) return formatDate(v, type);
  if (Buffer.isBuffer(v)) {
    return '0x' + v.subarray(0, MAX_BINARY).toString('hex').toUpperCase() + (v.length > MAX_BINARY ? '…' : '');
  }
  return String(v);
}

function optionStatements(applied, wanted) {
  const want = {
    nocount: !!wanted.nocount,
    statsIO: !!wanted.statsIO,
    statsTime: !!wanted.statsTime,
    xactAbort: !!wanted.xactAbort,
    isolation: ISOLATION.includes(wanted.isolation) ? wanted.isolation : 'READ COMMITTED',
  };
  const onoff = v => (v ? 'ON' : 'OFF');
  const out = [];
  if (want.nocount !== applied.nocount) out.push(`SET NOCOUNT ${onoff(want.nocount)}`);
  if (want.statsIO !== applied.statsIO) out.push(`SET STATISTICS IO ${onoff(want.statsIO)}`);
  if (want.statsTime !== applied.statsTime) out.push(`SET STATISTICS TIME ${onoff(want.statsTime)}`);
  if (want.xactAbort !== applied.xactAbort) out.push(`SET XACT_ABORT ${onoff(want.xactAbort)}`);
  if (want.isolation !== applied.isolation) out.push(`SET TRANSACTION ISOLATION LEVEL ${want.isolation}`);
  return { want, statements: out };
}

async function execute(s, body) {
  const { sql, database } = body;
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('Nothing to execute.');
  const limit = clampInt(body.maxRows, 1, 1000000, 5000);
  const items = [];
  let grid = null, offset = 0, errors = 0, cells = 0, messages = 0, quiet = false;

  const addMessage = item => {
    if (++messages <= MAX_MESSAGES) items.push(item);
    else if (messages === MAX_MESSAGES + 1) items.push({ type: 'msg', text: `(more than ${MAX_MESSAGES} messages; the rest are hidden)` });
  };

  s.listener = {
    info(m) {
      if (quiet || m.number === 5701 || m.number === 5703) return; // "Changed database context / language" noise
      addMessage({ type: 'msg', text: m.message });
    },
    error(m) {
      errors++;
      addMessage({
        type: 'err', number: m.number, level: m.class, state: m.state, message: m.message,
        proc: m.procName || null, lineNumber: m.lineNumber,
        line: !quiet && !m.procName && m.lineNumber > 0 ? offset + m.lineNumber : null,
      });
    },
  };

  const sink = {
    columns(cols) {
      if (cols.length === 1 && cols[0].colName === PLAN_COLUMN) grid = { type: 'plan', xml: '' };
      else grid = { type: 'grid', columns: cols.map(c => ({ name: c.colName, type: c.type.name })), rows: [], total: 0 };
      items.push(grid);
    },
    row(cols) {
      if (grid.type === 'plan') { grid.xml += cols[0].value || ''; return; }
      grid.total++;
      if (grid.rows.length < limit && cells < MAX_CELLS) {
        grid.rows.push(cols.map(c => toCell(c.value, c.metadata)));
        cells += cols.length;
      }
    },
    done(rowCount) {
      const wasPlan = grid && grid.type === 'plan';
      grid = null;
      if (rowCount !== undefined && !wasPlan && !quiet) {
        addMessage({ type: 'msg', text: `(${rowCount} row${rowCount === 1 ? '' : 's'} affected)` });
      }
    },
  };

  const pre = [], post = [];
  if (body.mode === 'parse') { pre.push('SET PARSEONLY ON'); post.push('SET PARSEONLY OFF'); }
  else if (body.plan === 'estimated') { pre.push('SET SHOWPLAN_XML ON'); post.push('SET SHOWPLAN_XML OFF'); }
  else if (body.plan === 'actual') { pre.push('SET STATISTICS XML ON'); post.push('SET STATISTICS XML OFF'); }

  const t0 = Date.now();
  let tranCount = null, spid = null;
  s.busy = true;
  s.cancelled = false;
  try {
    await s.open();
    quiet = true;
    if (database && database !== s.db) {
      await s.batch('USE ' + quoteName(database));
      if (errors) throw new Error(`Could not switch to database ${quoteName(database)}.`);
    }
    const opts = optionStatements(s.applied, body.options || {});
    if (opts.statements.length) {
      const before = errors;
      await s.batch(opts.statements.join(';\n'));
      if (errors === before) s.applied = opts.want;
    }
    for (const p of pre) await s.batch(p);
    quiet = false;
    try {
      run: for (const b of splitBatches(sql)) {
        for (let i = 0; i < b.repeat; i++) {
          if (s.cancelled) break run;
          if (!s.conn) throw new Error('The connection to the server was lost.');
          offset = b.line;
          const before = errors;
          const err = await s.batch(b.sql, sink);
          grid = null;
          if (s.cancelled) break run;
          if (err && errors === before) { errors++; addMessage({ type: 'err', message: err.message }); }
        }
      }
    } finally {
      quiet = true;
      if (s.conn) for (const p of post) await s.batch(p);
    }
    if (s.cancelled) items.push({ type: 'err', message: 'Query was cancelled by user.' });
    s.listener = null;
    if (s.conn) {
      await s.batch('SELECT @@TRANCOUNT, @@SPID', { columns() {}, row(cols) { tranCount = cols[0].value; spid = cols[1].value; }, done() {} });
    }
  } catch (e) {
    errors++;
    items.push({ type: 'err', message: e.message });
  } finally {
    s.busy = false;
    s.listener = null;
    s.lastUsed = Date.now();
  }
  return { items, errors, cancelled: s.cancelled, elapsed: Date.now() - t0, database: s.db, tranCount, spid };
}

// ---------------------------------------------------------------------------
// Row editing ("Edit Top 200 Rows")

const READONLY_TYPES = new Set(['timestamp', 'rowversion', 'geography', 'geometry', 'hierarchyid', 'sql_variant']);
const isEditable = col => !col.is_identity && !col.computed && !READONLY_TYPES.has(String(col.base_type).toLowerCase());

function sqlType(col) {
  const t = String(col.base_type || col.type).toLowerCase();
  const max = col.max_length === -1 ? 'max' : null;
  if (['varchar', 'char', 'varbinary', 'binary'].includes(t)) return `${t}(${max || col.max_length})`;
  if (['nvarchar', 'nchar'].includes(t)) return `${t}(${max || col.max_length / 2})`;
  if (['decimal', 'numeric'].includes(t)) return `${t}(${col.precision},${col.scale})`;
  if (['datetime2', 'time', 'datetimeoffset'].includes(t)) return `${t}(${col.scale})`;
  if (t === 'timestamp' || t === 'rowversion') return 'binary(8)';
  return t;
}

// Values arrive as text (as shown in the grid); convert them explicitly so
// date formats do not depend on the session language.
function convExpr(col, p) {
  const t = String(col.base_type).toLowerCase();
  if (t === 'datetime' || t === 'smalldatetime') return `CONVERT(${t}, ${p}, 121)`;
  if (['binary', 'varbinary', 'image'].includes(t)) return `CONVERT(varbinary(max), ${p}, 1)`;
  if (['char', 'varchar', 'nchar', 'nvarchar', 'text', 'ntext', 'xml', 'sysname'].includes(t)) return p;
  return `CAST(${p} AS ${sqlType(col)})`;
}

async function editTarget(c, db, schema, name) {
  const full = `${quoteName(db)}.${quoteName(schema)}.${quoteName(name)}`;
  const [o] = await metaQuery(c, `SELECT OBJECT_ID(N'${full.replace(/'/g, "''")}') AS id`);
  if (!o || o.id == null) throw new Error(`Object ${full} was not found.`);
  const info = await tableInfo(c, db, o.id);
  return { full, id: o.id, ...info, byName: new Map(info.columns.map(col => [col.name, col])) };
}

function editParts(t) {
  if (!t.pk) throw new Error('This table has no primary key, so its rows cannot be edited safely.');
  const params = {};
  let n = 0;
  const param = v => { const p = 'p' + n++; params[p] = v == null ? null : String(v); return '@' + p; };
  const keyCols = t.pk.cols.map(k => t.byName.get(k.name));
  const where = key => keyCols.map(col => {
    if (!key || !(col.name in key)) throw new Error(`Missing key value for column ${col.name}.`);
    return `${quoteName(col.name)} = ${convExpr(col, param(key[col.name]))}`;
  }).join(' AND ');
  const header = `SET NOCOUNT ON; SET XACT_ABORT ON;
DECLARE @k TABLE (${keyCols.map((col, i) => `k${i} ${sqlType(col)}`).join(', ')});
BEGIN TRAN;`;
  const output = prefix => `OUTPUT ${keyCols.map(col => `${prefix}.${quoteName(col.name)}`).join(', ')} INTO @k`;
  const check = verb => `
DECLARE @rc int = (SELECT COUNT(*) FROM @k);
IF @rc <> 1
BEGIN
  ROLLBACK;
  DECLARE @msg nvarchar(400) = N'Expected exactly 1 row to ${verb}, but ' + CAST(@rc AS nvarchar(20)) + N' rows matched. Nothing was changed.';
  RAISERROR(@msg, 16, 1);
  RETURN;
END
COMMIT;`;
  const reselect = `SELECT ${t.columns.map(col => 't.' + quoteName(col.name)).join(', ')} FROM ${t.full} AS t
JOIN @k AS k ON ${keyCols.map((col, i) => `t.${quoteName(col.name)} = k.k${i}`).join(' AND ')};`;
  const assign = values => Object.entries(values || {}).map(([name, v]) => {
    const col = t.byName.get(name);
    if (!col || !isEditable(col)) throw new Error(`Column ${name} cannot be edited.`);
    return { col, expr: v === null ? 'NULL' : convExpr(col, param(v)) };
  });
  return { params, where, header, output, check, reselect, assign };
}

async function lastRow(c, sqlText, params) {
  const sets = await metaSets(c, sqlText, params);
  const last = sets[sets.length - 1];
  return last && last.cells.length ? last.cells[0] : null;
}

// ---------------------------------------------------------------------------
// Metadata

function quoteName(name) {
  if (typeof name !== 'string' || !name || name.length > 128) throw new Error('Invalid name.');
  return '[' + name.replace(/]/g, ']]') + ']';
}

function objectId(id) {
  if (!Number.isInteger(id)) throw new Error('Invalid object id.');
  return id;
}

async function tableInfo(c, db, id) {
  const d = quoteName(db), oid = objectId(id);
  const [cols, idx, fks, checks, triggers, descriptions] = await metaSets(c, `
    SELECT c.column_id, c.name, ty.name AS type, ty.is_user_defined,
      CASE WHEN ty.is_user_defined = 1 AND ty.is_assembly_type = 0 THEN TYPE_NAME(c.system_type_id) ELSE ty.name END AS base_type,
      c.max_length, c.precision, c.scale, c.is_nullable, c.is_identity, c.collation_name AS collation,
      CAST(ic.seed_value AS nvarchar(40)) AS seed, CAST(ic.increment_value AS nvarchar(40)) AS incr,
      cc.definition AS computed, cc.is_persisted, dc.name AS dflt_name, dc.definition AS dflt
    FROM ${d}.sys.columns c
    JOIN ${d}.sys.types ty ON ty.user_type_id = c.user_type_id
    LEFT JOIN ${d}.sys.identity_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    LEFT JOIN ${d}.sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
    LEFT JOIN ${d}.sys.default_constraints dc ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.object_id = ${oid} ORDER BY c.column_id;
    SELECT i.index_id, i.name, i.type_desc AS kind, i.is_unique, i.is_primary_key AS is_pk, i.is_unique_constraint AS is_uq,
      i.filter_definition AS filter, i.is_disabled, c.name AS col, ic.is_descending_key AS descending, ic.is_included_column AS included
    FROM ${d}.sys.indexes i
    JOIN ${d}.sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
    JOIN ${d}.sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
    WHERE i.object_id = ${oid} AND i.type > 0
    ORDER BY i.index_id, ic.is_included_column, ic.key_ordinal, ic.index_column_id;
    SELECT fk.name, rs.name AS ref_schema, ro.name AS ref_table, pc.name AS col, rc.name AS ref_col,
      fk.delete_referential_action_desc AS on_delete, fk.update_referential_action_desc AS on_update, fk.is_disabled
    FROM ${d}.sys.foreign_keys fk
    JOIN ${d}.sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN ${d}.sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
    JOIN ${d}.sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
    JOIN ${d}.sys.objects ro ON ro.object_id = fk.referenced_object_id
    JOIN ${d}.sys.schemas rs ON rs.schema_id = ro.schema_id
    WHERE fk.parent_object_id = ${oid} ORDER BY fk.name, fkc.constraint_column_id;
    SELECT k.name, k.definition, k.is_disabled, c.name AS col FROM ${d}.sys.check_constraints k
    LEFT JOIN ${d}.sys.columns c ON c.object_id = k.parent_object_id AND c.column_id = k.parent_column_id
    WHERE k.parent_object_id = ${oid} ORDER BY k.name;
    SELECT object_id AS id, name, is_disabled, is_instead_of_trigger AS instead_of FROM ${d}.sys.triggers WHERE parent_id = ${oid} ORDER BY name;
    SELECT c.name AS col, CAST(ep.value AS nvarchar(4000)) AS description FROM ${d}.sys.extended_properties ep
    JOIN ${d}.sys.columns c ON c.object_id = ep.major_id AND c.column_id = ep.minor_id
    WHERE ep.class = 1 AND ep.major_id = ${oid} AND ep.minor_id > 0 AND ep.name = N'MS_Description';`);

  const indexes = [];
  for (const r of idx.rows) {
    let ix = indexes[indexes.length - 1];
    if (!ix || ix.id !== r.index_id) {
      ix = { id: r.index_id, name: r.name, kind: r.kind, unique: r.is_unique, pk: r.is_pk, uq: r.is_uq, filter: r.filter, disabled: r.is_disabled, cols: [], include: [] };
      indexes.push(ix);
    }
    if (r.included) ix.include.push(r.col);
    else ix.cols.push({ name: r.col, desc: r.descending });
  }
  const foreignKeys = [];
  for (const r of fks.rows) {
    let fk = foreignKeys[foreignKeys.length - 1];
    if (!fk || fk.name !== r.name) {
      fk = { name: r.name, refSchema: r.ref_schema, refTable: r.ref_table, cols: [], refCols: [], onDelete: r.on_delete, onUpdate: r.on_update, disabled: r.is_disabled };
      foreignKeys.push(fk);
    }
    fk.cols.push(r.col);
    fk.refCols.push(r.ref_col);
  }
  const pkIndex = indexes.find(i => i.pk);
  return {
    columns: cols.rows,
    pk: pkIndex ? { name: pkIndex.name, clustered: pkIndex.kind === 'CLUSTERED', cols: pkIndex.cols } : null,
    indexes,
    foreignKeys,
    checks: checks.rows,
    triggers: triggers.rows,
    descriptions: descriptions.rows,
  };
}

const DB_ITEMS = {
  users: d => `SELECT name, type_desc AS kind, default_schema_name AS default_schema FROM ${d}.sys.database_principals
    WHERE type IN ('S','U','G','E','X','C','K') AND sid IS NOT NULL ORDER BY name`,
  roles: d => `SELECT name, is_fixed_role FROM ${d}.sys.database_principals WHERE type = 'R' ORDER BY is_fixed_role, name`,
  schemas: d => `SELECT s.name, p.name AS owner FROM ${d}.sys.schemas s
    LEFT JOIN ${d}.sys.database_principals p ON p.principal_id = s.principal_id ORDER BY s.name`,
  types: d => `SELECT s.name AS sch, t.name, t.is_table_type,
      CASE WHEN t.is_table_type = 1 THEN NULL ELSE TYPE_NAME(t.system_type_id) END AS base_type,
      t.max_length, t.precision, t.scale, t.is_nullable
    FROM ${d}.sys.types t JOIN ${d}.sys.schemas s ON s.schema_id = t.schema_id
    WHERE t.is_user_defined = 1 ORDER BY t.is_table_type, s.name, t.name`,
  dbtriggers: d => `SELECT object_id AS id, name, is_disabled FROM ${d}.sys.triggers WHERE parent_class = 0 ORDER BY name`,
};

const SERVER_ITEMS = {
  logins: `SELECT name, type_desc AS kind, is_disabled, default_database_name AS default_db FROM sys.server_principals
    WHERE type IN ('S','U','G') AND name NOT LIKE '##%' ORDER BY name`,
  jobs: `SELECT CAST(j.job_id AS nvarchar(36)) AS id, j.name, j.enabled, j.description FROM msdb.dbo.sysjobs j ORDER BY j.name`,
};

const routes = {
  async savedConnections() {
    return { saved: savedConns.map(publicSpec), live: [...live.keys()] };
  },

  async connect({ id, spec, save, savePassword }) {
    let s;
    if (spec) {
      s = normalizeSpec(spec);
      const existing = (id && savedConns.find(x => x.id === id)) || savedConns.find(x => sameTarget(x, s));
      if (existing && !s.password) s.password = existing.password || '';
      s.id = existing ? existing.id : crypto.randomUUID();
    } else {
      const found = savedConns.find(x => x.id === id);
      if (!found) throw new Error('Saved connection not found.');
      if (live.has(id)) { const c = live.get(id); return { id, info: c.info, spec: publicSpec(c.spec) }; }
      s = { type: 'mssql', ...found };
      if (needsPassword(s)) {
        const e = new Error('Password required.');
        e.needPassword = true;
        throw e;
      }
    }
    if (live.has(s.id)) closeLive(live.get(s.id));
    let c;
    if (s.type !== 'mssql') {
      const driver = require(DRIVERS[s.type]);
      const handle = await driver.connect({ ...s });
      const gi = handle.info || {};
      const info = {
        serverName: gi.server || s.server || s.file, login: gi.user || s.user || '', db: gi.database || s.database || '',
        version: gi.version || '', level: '', edition: TYPE_LABEL[s.type], language: driver.language || 'sql',
      };
      c = { spec: s, driver, handle, info, generic: true };
    } else {
      const cfg = toTedious(s);
      c = { spec: s, cfg, meta: new Session(metaConfig(cfg), s.id, META_INIT), chain: Promise.resolve(), info: null };
      try {
        const [r] = await metaQuery(c, `SELECT @@SERVERNAME AS serverName, SUSER_NAME() AS login, DB_NAME() AS db,
          CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(50)) AS version,
          CAST(SERVERPROPERTY('ProductLevel') AS nvarchar(50)) AS level,
          CAST(SERVERPROPERTY('Edition') AS nvarchar(100)) AS edition`);
        c.info = { ...r, language: 'sql' };
      } catch (e) {
        c.meta.close();
        throw e;
      }
    }
    live.set(s.id, c);
    if (save) {
      const stored = { ...s, password: savePassword ? s.password : '', rememberPassword: FILE_TYPES.has(s.type) || !!savePassword, create: false };
      const i = savedConns.findIndex(x => x.id === s.id);
      if (i >= 0) savedConns[i] = stored; else savedConns.push(stored);
      writeSaved();
    }
    return { id: s.id, info: c.info, spec: publicSpec(s) };
  },

  async disconnect({ conn }) {
    const c = live.get(conn);
    if (c) closeLive(c);
    return { ok: true };
  },

  async forget({ id }) {
    savedConns = savedConns.filter(x => x.id !== id);
    writeSaved();
    return { ok: true };
  },

  // ---- local files (SQLite database picker, opening .sql scripts by path)

  async browse({ dir }) {
    if (!dir) {
      const home = os.homedir();
      const entries = [
        { name: 'Desktop', path: path.join(home, 'Desktop'), isDir: true },
        { name: 'Documents', path: path.join(home, 'Documents'), isDir: true },
        { name: 'Downloads', path: path.join(home, 'Downloads'), isDir: true },
        { name: `Home (${home})`, path: home, isDir: true },
      ];
      if (process.platform === 'win32') {
        for (const L of 'CDEFGHIJKLMNOPQRSTUVWXYZ') if (fs.existsSync(`${L}:\\`)) entries.push({ name: `${L}:\\`, path: `${L}:\\`, isDir: true });
      } else entries.push({ name: '/', path: '/', isDir: true });
      return { dir: '', parent: null, entries: entries.filter(e => fs.existsSync(e.path)) };
    }
    if (typeof dir !== 'string' || !path.isAbsolute(dir)) throw new Error('Invalid folder.');
    const abs = path.resolve(dir);
    const list = await fs.promises.readdir(abs, { withFileTypes: true });
    const entries = [];
    for (const d of list) {
      if (d.name.startsWith('$') || d.name === 'System Volume Information') continue;
      const p = path.join(abs, d.name);
      if (d.isDirectory()) entries.push({ name: d.name, path: p, isDir: true });
      else if (d.isFile()) {
        let size = null;
        if (entries.length < 3000) { try { size = (await fs.promises.stat(p)).size; } catch { /* locked file */ } }
        entries.push({ name: d.name, path: p, isDir: false, size });
      }
    }
    entries.sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return { dir: abs, parent: path.dirname(abs) === abs ? '' : path.dirname(abs), entries: entries.slice(0, 3000) };
  },

  async readScript({ path: p }) {
    if (typeof p !== 'string' || !path.isAbsolute(p) || !/\.(sql|txt)$/i.test(p)) throw new Error('Only .sql or .txt files can be opened this way.');
    const buf = await fs.promises.readFile(p);
    if (buf.length > 20 * 1024 * 1024) throw new Error('The script is larger than 20 MB.');
    let text;
    if (buf[0] === 0xFF && buf[1] === 0xFE) text = buf.subarray(2).toString('utf16le');
    else if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) text = buf.subarray(3).toString('utf8');
    else text = buf.toString('utf8');
    return { name: path.basename(p), text: text.replace(/\r\n?/g, '\n') };
  },

  // ---- driver-based connections (MySQL, PostgreSQL, Oracle, SQLite, MongoDB, Redis, Cassandra)

  async gdatabases({ conn }) {
    const c = getLive(conn, true);
    if (!c.generic) throw new Error('Use "databases" for SQL Server.');
    return { databases: await c.driver.databases(c.handle) };
  },

  async tree({ conn, path: nodePath }) {
    const c = getLive(conn, true);
    if (!Array.isArray(nodePath) || nodePath.some(p => typeof p !== 'string')) throw new Error('Invalid path.');
    return { nodes: await c.driver.tree(c.handle, nodePath) };
  },

  async gobjects({ conn, db }) {
    const c = getLive(conn, true);
    return { objects: await c.driver.objects(c.handle, db) };
  },

  async gcolumns({ conn, db, schema, name }) {
    const c = getLive(conn, true);
    return { columns: await c.driver.columns(c.handle, db, schema, name) };
  },

  async script({ conn, path: nodePath, kind }) {
    const c = getLive(conn, true);
    if (!Array.isArray(nodePath)) throw new Error('Invalid path.');
    return { script: await c.driver.script(c.handle, nodePath, kind || 'create') };
  },

  async databases({ conn }) {
    const rows = await metaQuery(getLive(conn), `SELECT name, database_id AS id, state_desc AS state,
        HAS_DBACCESS(name) AS access
      FROM sys.databases ORDER BY name`);
    return { databases: rows };
  },

  async objects({ conn, db }) {
    const d = quoteName(db);
    const rows = await metaQuery(getLive(conn), `SELECT o.object_id AS id, s.name AS sch, o.name, RTRIM(o.type) AS type,
        CONVERT(varchar(19), o.create_date, 120) AS created, CONVERT(varchar(19), o.modify_date, 120) AS modified
      FROM ${d}.sys.objects o JOIN ${d}.sys.schemas s ON s.schema_id = o.schema_id
      WHERE o.type IN ('U','V','P','PC','FN','FS','IF','TF','FT','SN','SO') AND o.is_ms_shipped = 0
      ORDER BY s.name, o.name`);
    return { objects: rows };
  },

  async tableInfo({ conn, db, id }) {
    return tableInfo(getLive(conn), db, id);
  },

  // Object Explorer Details: databases with their properties.
  async dbDetails({ conn }) {
    const rows = await metaQuery(getLive(conn), `SELECT d.name, d.database_id AS id, d.state_desc AS state, HAS_DBACCESS(d.name) AS access,
        d.recovery_model_desc AS recovery_model, d.compatibility_level, d.collation_name AS collation,
        SUSER_SNAME(d.owner_sid) AS owner, CONVERT(varchar(19), d.create_date, 120) AS created,
        CAST(SUM(CAST(mf.size AS bigint)) * 8 / 1024.0 AS decimal(18,2)) AS size_mb, d.user_access_desc AS user_access, d.is_read_only
      FROM sys.databases d LEFT JOIN sys.master_files mf ON mf.database_id = d.database_id
      GROUP BY d.name, d.database_id, d.state_desc, d.recovery_model_desc, d.compatibility_level, d.collation_name,
        d.owner_sid, d.create_date, d.user_access_desc, d.is_read_only
      ORDER BY d.name`);
    return { databases: rows };
  },

  // Object Explorer Details: tables with row counts and space used (like SSMS).
  async tableStats({ conn, db }) {
    const d = quoteName(db);
    const rows = await metaQuery(getLive(conn), `SELECT t.object_id AS id, s.name AS sch, t.name,
        CONVERT(varchar(19), t.create_date, 120) AS created, CONVERT(varchar(19), t.modify_date, 120) AS modified,
        CAST(st.row_count AS bigint) AS row_count, st.data_kb, st.used_kb - st.data_kb AS index_kb, st.reserved_kb,
        (SELECT TOP (1) ds.name FROM ${d}.sys.indexes i JOIN ${d}.sys.data_spaces ds ON ds.data_space_id = i.data_space_id
          WHERE i.object_id = t.object_id AND i.index_id < 2) AS file_group,
        CAST(CASE WHEN st.partitions > 1 THEN 1 ELSE 0 END AS bit) AS is_partitioned,
        t.is_replicated, t.lock_escalation_desc AS lock_escalation,
        (SELECT name FROM ${d}.sys.database_principals WHERE principal_id = COALESCE(t.principal_id, s.principal_id)) AS owner
      FROM ${d}.sys.tables t
      JOIN ${d}.sys.schemas s ON s.schema_id = t.schema_id
      LEFT JOIN (
        SELECT p.object_id,
          SUM(CASE WHEN p.index_id < 2 AND a.type = 1 THEN p.rows ELSE 0 END) AS row_count,
          SUM(CASE WHEN p.index_id < 2 THEN CASE WHEN a.type = 1 THEN a.data_pages ELSE a.used_pages END ELSE 0 END) * 8 AS data_kb,
          SUM(a.used_pages) * 8 AS used_kb, SUM(a.total_pages) * 8 AS reserved_kb,
          COUNT(DISTINCT CASE WHEN p.index_id < 2 THEN p.partition_number END) AS partitions
        FROM ${d}.sys.partitions p JOIN ${d}.sys.allocation_units a ON a.container_id = p.partition_id
        GROUP BY p.object_id) st ON st.object_id = t.object_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name`);
    return { tables: rows };
  },

  async params({ conn, db, id }) {
    const d = quoteName(db);
    const params = await metaQuery(getLive(conn), `SELECT p.parameter_id AS id, p.name, ty.name AS type, p.max_length,
        p.precision, p.scale, p.is_output, p.has_default_value, p.is_readonly
      FROM ${d}.sys.parameters p JOIN ${d}.sys.types ty ON ty.user_type_id = p.user_type_id
      WHERE p.object_id = ${objectId(id)} ORDER BY p.parameter_id`);
    return { params };
  },

  async definition({ conn, db, id }) {
    const d = quoteName(db), oid = objectId(id);
    const [mod, syn, seq] = await metaSets(getLive(conn), `
      SELECT m.definition, m.uses_ansi_nulls AS ansiNulls, m.uses_quoted_identifier AS quotedIdentifier
        FROM ${d}.sys.sql_modules m WHERE m.object_id = ${oid};
      SELECT base_object_name AS base FROM ${d}.sys.synonyms WHERE object_id = ${oid};
      SELECT TYPE_NAME(sq.system_type_id) AS type, CAST(sq.start_value AS nvarchar(50)) AS start_value,
        CAST(sq.increment AS nvarchar(50)) AS increment, CAST(sq.minimum_value AS nvarchar(50)) AS min_value,
        CAST(sq.maximum_value AS nvarchar(50)) AS max_value, sq.is_cycling, sq.is_cached, sq.cache_size
        FROM ${d}.sys.sequences sq WHERE sq.object_id = ${oid};`);
    if (mod.rows[0]) return mod.rows[0];
    if (syn.rows[0]) return { definition: null, synonymBase: syn.rows[0].base };
    if (seq.rows[0]) return { definition: null, sequence: seq.rows[0] };
    return { definition: null };
  },

  async dbItems({ conn, db, kind }) {
    if (!Object.hasOwn(DB_ITEMS, kind)) throw new Error('Unknown item kind.');
    return { items: await metaQuery(getLive(conn), DB_ITEMS[kind](quoteName(db))) };
  },

  async serverItems({ conn, kind }) {
    if (!Object.hasOwn(SERVER_ITEMS, kind)) throw new Error('Unknown item kind.');
    return { items: await metaQuery(getLive(conn), SERVER_ITEMS[kind]) };
  },

  async execute(body) {
    const c = getLive(body.conn, true);
    const s = getSession(body.session, c);
    if (s.busy) {
      const e = new Error('A previous query is still running in this tab (probably started before the page was reloaded). Click Cancel to stop it, or wait for it to finish.');
      e.busy = true;
      throw e;
    }
    return c.generic ? executeGeneric(s, body) : execute(s, body);
  },

  async cancel({ session }) {
    const s = sessions.get(session);
    return { cancelled: !!(s && s.cancel()) };
  },

  async close({ session }) {
    const s = sessions.get(session);
    if (s) { s.close(); sessions.delete(session); }
    return { ok: true };
  },

  async editLoad({ conn, db, schema, name, top }) {
    const c = getLive(conn, true);
    if (c.generic) return genericEdit(c, s => editLib.editLoad(s, c.spec.type, { db, schema, name }, clampInt(top, 1, 10000, 200)));
    const t = await editTarget(c, db, schema, name);
    const n = clampInt(top, 1, 10000, 200);
    const [set] = await metaSets(c, `SELECT TOP (${n}) ${t.columns.map(col => quoteName(col.name)).join(', ')} FROM ${t.full}`);
    const truncated = [];
    set.rows.forEach((row, r) => t.columns.forEach((col, ci) => {
      const v = row[col.name];
      if ((typeof v === 'string' && v.length > MAX_TEXT) || (Buffer.isBuffer(v) && v.length > MAX_BINARY)) truncated.push([r, ci]);
    }));
    const pkCols = new Set(t.pk ? t.pk.cols.map(k => k.name) : []);
    return {
      columns: t.columns.map((col, i) => ({
        name: col.name, type: set.columns[i].type, sqlType: sqlType(col), editable: isEditable(col),
        nullable: col.is_nullable, pk: pkCols.has(col.name), identity: col.is_identity, hasDefault: !!col.dflt,
      })),
      pk: t.pk,
      rows: set.cells,
      truncated,
      top: n,
    };
  },

  async editUpdate({ conn, db, schema, name, key, values }) {
    const c = getLive(conn, true);
    if (c.generic) return genericEdit(c, s => editLib.editUpdate(s, c.spec.type, { db, schema, name }, key, values));
    const t = await editTarget(c, db, schema, name);
    const e = editParts(t);
    const sets = e.assign(values);
    if (!sets.length) throw new Error('Nothing to update.');
    const where = e.where(key);
    const row = await lastRow(c, `${e.header}
UPDATE ${t.full} SET ${sets.map(x => `${quoteName(x.col.name)} = ${x.expr}`).join(', ')} ${e.output('INSERTED')} WHERE ${where};
${e.check('change')}
${e.reselect}`, e.params);
    return { row };
  },

  async editInsert({ conn, db, schema, name, values }) {
    const c = getLive(conn, true);
    if (c.generic) return genericEdit(c, s => editLib.editInsert(s, c.spec.type, { db, schema, name }, values));
    const t = await editTarget(c, db, schema, name);
    const e = editParts(t);
    const sets = e.assign(values);
    const insert = sets.length
      ? `INSERT INTO ${t.full} (${sets.map(x => quoteName(x.col.name)).join(', ')}) ${e.output('INSERTED')} VALUES (${sets.map(x => x.expr).join(', ')});`
      : `INSERT INTO ${t.full} ${e.output('INSERTED')} DEFAULT VALUES;`;
    const row = await lastRow(c, `${e.header}\n${insert}\n${e.check('insert')}\n${e.reselect}`, e.params);
    return { row };
  },

  async editDelete({ conn, db, schema, name, key }) {
    const c = getLive(conn, true);
    if (c.generic) return genericEdit(c, s => editLib.editDelete(s, c.spec.type, { db, schema, name }, key));
    const t = await editTarget(c, db, schema, name);
    const e = editParts(t);
    const where = e.where(key);
    await metaSets(c, `${e.header}\nDELETE FROM ${t.full} ${e.output('DELETED')} WHERE ${where};\n${e.check('delete')}`, e.params);
    return { ok: true };
  },

  // ---- table designer

  async designLoad({ conn, db, schema, name, isNew }) {
    const c = getLive(conn, true);
    const dialect = c.generic ? editLib.dialectOf(c.spec.type) : 'mssql';
    if (!dialect) throw new Error(`The table designer is not available for ${TYPE_LABEL[c.spec.type]}.`);
    const supports = Object.fromEntries(Object.entries(designLib.SUPPORTS).map(([k, v]) => [k, v.includes(dialect)]));
    if (isNew) return { dialect, columns: [], info: {}, supports };
    if (c.generic) {
      const meta = await genericEdit(c, s => editLib.loadTable(s, c.spec.type, { db, schema, name }));
      return { dialect, columns: meta.columns, info: { pkName: meta.pkName, constraints: meta.constraints }, supports };
    }
    const t = await editTarget(c, db, schema, name);
    return { dialect, columns: mssqlDesignColumns(t), info: { pkName: t.pk ? t.pk.name : null }, supports };
  },

  async designScript({ conn, db, schema, name, columns, isNew }) {
    const c = getLive(conn, true);
    const target = { db, schema, name };
    if (c.generic && !editLib.dialectOf(c.spec.type)) throw new Error(`The table designer is not available for ${TYPE_LABEL[c.spec.type]}.`);
    if (isNew) return { script: designLib.buildScript(c.generic ? editLib.dialectOf(c.spec.type) : 'mssql', target, [], columns, {}, true) };
    if (c.generic) {
      const meta = await genericEdit(c, s => editLib.loadTable(s, c.spec.type, target));
      return {
        script: designLib.buildScript(meta.dialect, target, meta.columns, columns,
          { pkName: meta.pkName, extras: meta.extras, constraints: meta.constraints }),
      };
    }
    const t = await editTarget(c, db, schema, name);
    return { script: designLib.buildScript('mssql', target, mssqlDesignColumns(t), columns, { pkName: t.pk ? t.pk.name : null }) };
  },

  async designApply({ conn, db, schema, name, script }) {
    const c = getLive(conn, true);
    if (typeof script !== 'string' || !script.trim()) throw new Error('Nothing to apply.');
    if (c.generic) {
      await genericEdit(c, s => editLib.applyScript(s, c.spec.type, { db, schema, name }, script));
      return { ok: true };
    }
    // SQL Server: run the batches on a dedicated connection and stop (rolling back) at the first error.
    const s = new Session(c.cfg, c.spec.id);
    let lastError = null;
    s.listener = { info() {}, error(m) { lastError = m.message; } };
    try {
      await s.open();
      for (const b of splitBatches(script)) {
        const err = await s.batch(b.sql);
        if (err || lastError) {
          const msg = lastError || err.message;
          lastError = null;
          await s.batch('IF @@TRANCOUNT > 0 ROLLBACK');
          throw new Error(msg);
        }
      }
    } finally {
      s.close();
    }
    return { ok: true };
  },
};

function mssqlDesignColumns(t) {
  const pkSet = new Set(t.pk ? t.pk.cols.map(k => k.name) : []);
  // Single-column unique constraints / indexes and column-level checks show up as column properties.
  const unique = new Map(), check = new Map(), descr = new Map();
  for (const ix of t.indexes) if (ix.unique && !ix.pk && ix.cols.length === 1 && !ix.include.length && !ix.filter) unique.set(ix.cols[0].name, ix);
  for (const k of t.checks) if (k.col) check.set(k.col, k);
  for (const r of t.descriptions || []) descr.set(r.col, r.description);
  return t.columns.map(col => {
    const uq = unique.get(col.name), ck = check.get(col.name);
    return {
      name: col.name, type: col.is_user_defined ? col.type : sqlType(col), nullable: !!col.is_nullable, default: col.dflt || '',
      dfltName: col.dflt_name || null, pk: pkSet.has(col.name), identity: !!col.is_identity, generated: !!col.computed, computed: col.computed || '',
      seed: col.seed || '1', incr: col.incr || '1', collation: col.collation || '',
      // A unique index (not a constraint) is dropped with DROP INDEX, so only constraints are editable here.
      unique: !!uq, uniqueName: uq && uq.uq ? uq.name : null, uniqueIndex: uq && !uq.uq ? uq.name : null,
      check: ck ? String(ck.definition).replace(/^\(([\s\S]*)\)$/, '$1') : '', checkName: ck ? ck.name : null,
      description: descr.get(col.name) || '', hasDescription: descr.has(col.name),
    };
  });
}

// Row editing / designer work for driver-based connections runs on one extra session per connection, one job at a time.
function genericEdit(c, fn) {
  if (!editLib.dialectOf(c.spec.type)) return Promise.reject(new Error(`Editing is not available for ${TYPE_LABEL[c.spec.type]}.`));
  const job = async () => {
    if (!c.editSess) c.editSess = await c.driver.openSession(c.handle);
    return fn(c.editSess);
  };
  const p = (c.editChain || Promise.resolve()).then(job, job);
  c.editChain = p.catch(() => {});
  return p;
}

// ---------------------------------------------------------------------------
// HTTP

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};
const allowedHosts = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`]);
const allowedOrigins = new Set([...allowedHosts].map(h => 'http://' + h));

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > 20 * 1024 * 1024) { reject(new Error('Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleApi(req, res, name) {
  // Only same-origin JSON POSTs: blocks other websites from driving the database through the browser.
  const origin = req.headers.origin;
  if (req.method !== 'POST' || !/^application\/json\b/i.test(req.headers['content-type'] || '') ||
      (origin && !allowedOrigins.has(origin)) || !Object.hasOwn(routes, name)) {
    return send(res, 403, { error: 'Forbidden' });
  }
  let body;
  try { body = JSON.parse((await readBody(req)) || '{}'); } catch (e) { return send(res, 400, { error: e.message }); }
  try {
    send(res, 200, await routes[name](body || {}));
  } catch (e) {
    send(res, e.busy ? 409 : 500, { error: e.message, busy: !!e.busy, notConnected: !!e.notConnected, needPassword: !!e.needPassword });
  }
}

function serveStatic(req, res, pathname) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const file = path.join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !MIME[path.extname(file)]) { res.writeHead(404).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)], 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : data);
  });
}

const server = http.createServer((req, res) => {
  if (!allowedHosts.has(req.headers.host)) { res.writeHead(403).end('Forbidden'); return; }
  let pathname;
  try { pathname = new URL(req.url, APP_URL).pathname; } catch { res.writeHead(400).end(); return; }
  if (pathname.startsWith('/api/')) handleApi(req, res, pathname.slice(5));
  else serveStatic(req, res, pathname);
});

function openBrowser(done) {
  if (process.platform !== 'win32') return done && done();
  exec(`start "" "${APP_URL}"`, () => done && done());
}

server.on('error', e => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use (the app is probably already running): ${APP_URL}`);
    openBrowser(() => process.exit(0));
    return;
  }
  throw e;
});

server.listen(PORT, HOST, () => {
  console.log(`Web SQL Studio is running at ${APP_URL}`);
  console.log('Close this window (or press Ctrl+C) to stop it.');
  if (process.argv.includes('--open')) openBrowser();
});
