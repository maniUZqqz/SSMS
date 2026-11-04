'use strict';
// Redis driver (node-redis 5/6). One command per line, redis-cli style argument parsing.
//
// Databases are named "db0", "db1", ... everywhere (databases(), tree(), session.run() option/result).
//
// Object Explorer paths (each element is a node `key`):
//   []                        databases that hold keys (db0 always)      key = "db<N>"
//   [db]                      keys / prefix folders (SCAN, capped)       folder key = "f:<segment>", key leaf = "k:<key>"
//   [db,'f:user']             keys matching "user:*", grouped again by the next ':' segment
//   ...

const net = require('net');
const { grid, requireDriver } = require('./common');

const language = 'redis';

const SCAN_CAP = 1000;          // keys listed per Object Explorer node
const SCAN_BUDGET_MS = 5000;
const SEP = ':';

// ---------------------------------------------------------------------------------------------
// Argument parsing (redis-cli / sdssplitargs rules)
// ---------------------------------------------------------------------------------------------

const hexVal = c => '0123456789abcdef'.indexOf(c.toLowerCase());
const isHex = c => c !== undefined && hexVal(c) >= 0;

function toArg(chunks) {
  const buf = Buffer.concat(chunks);
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return buf; }   // keep raw bytes for \xHH escapes
}

// Splits one command line into arguments. Throws on unbalanced quotes.
function parseArgs(line) {
  const args = [];
  const n = line.length;
  let i = 0;
  while (i < n) {
    while (i < n && /\s/.test(line[i])) i++;
    if (i >= n) break;
    const chunks = [];
    let text = '';
    const flush = () => { if (text) { chunks.push(Buffer.from(text, 'utf8')); text = ''; } };
    let inDq = false, inSq = false, done = false;
    while (!done) {
      const c = line[i];
      if (inDq) {
        if (i >= n) throw new Error('Unbalanced quotes in request');
        if (c === '\\' && line[i + 1] === 'x' && isHex(line[i + 2]) && isHex(line[i + 3])) {
          flush();
          chunks.push(Buffer.from([hexVal(line[i + 2]) * 16 + hexVal(line[i + 3])]));
          i += 4;
        } else if (c === '\\' && i + 1 < n) {
          const e = line[i + 1];
          text += e === 'n' ? '\n' : e === 'r' ? '\r' : e === 't' ? '\t' : e === 'b' ? '\b' : e === 'a' ? '\x07' : e;
          i += 2;
        } else if (c === '"') {
          if (i + 1 < n && !/\s/.test(line[i + 1])) throw new Error('Invalid argument(s): closing quote must be followed by a space');
          i++;
          done = true;
        } else { text += c; i++; }
      } else if (inSq) {
        if (i >= n) throw new Error('Unbalanced quotes in request');
        if (c === '\\' && line[i + 1] === "'") { text += "'"; i += 2; }
        else if (c === "'") {
          if (i + 1 < n && !/\s/.test(line[i + 1])) throw new Error('Invalid argument(s): closing quote must be followed by a space');
          i++;
          done = true;
        } else { text += c; i++; }
      } else if (i >= n || /\s/.test(c)) {
        done = true;
      } else if (c === '"') { inDq = true; i++; }
      else if (c === "'") { inSq = true; i++; }
      else { text += c; i++; }
    }
    flush();
    args.push(toArg(chunks));
  }
  return args;
}

// Splits a script into commands: [{ args, line }] (blank lines and #, // comments are skipped).
function splitCommands(text) {
  const out = [];
  String(text || '').split(/\r?\n/).forEach((raw, idx) => {
    const t = raw.trim();
    if (!t || t[0] === '#' || t.startsWith('//')) return;
    out.push({ raw: t, line: idx + 1 });
  });
  return out;
}

// Quotes an argument for display / generated commands (redis-cli style).
function escapeText(s) {
  let o = '';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '\\') o += '\\\\';
    else if (ch === '"') o += '\\"';
    else if (ch === '\n') o += '\\n';
    else if (ch === '\r') o += '\\r';
    else if (ch === '\t') o += '\\t';
    else if (c < 0x20 || c === 0x7f) o += '\\x' + c.toString(16).padStart(2, '0');
    else o += ch;
  }
  return o;
}
function quoteArg(a) {
  const s = Buffer.isBuffer(a) ? bufEscape(a) : String(a);
  return /^[A-Za-z0-9_.:\-/@#%+=]+$/.test(s) && s.length ? s : `"${Buffer.isBuffer(a) ? s : escapeText(s)}"`;
}

function bufEscape(b) {
  let o = '';
  for (const c of b) {
    if (c === 0x5c) o += '\\\\';
    else if (c === 0x22) o += '\\"';
    else if (c === 0x0a) o += '\\n';
    else if (c === 0x0d) o += '\\r';
    else if (c === 0x09) o += '\\t';
    else if (c >= 0x20 && c < 0x7f) o += String.fromCharCode(c);
    else o += '\\x' + c.toString(16).padStart(2, '0');
  }
  return o;
}

// Bulk string -> text: valid UTF-8 as is, binary data in redis-cli escaped form.
function bufText(b) {
  if (!Buffer.isBuffer(b)) return String(b);
  let s;
  try { s = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch { return `"${bufEscape(b)}"`; }
  // eslint-disable-next-line no-control-regex
  return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(s) ? `"${escapeText(s)}"` : s;
}

// ---------------------------------------------------------------------------------------------
// Reply formatting
// ---------------------------------------------------------------------------------------------

// Buffers -> text, Map/Set/objects -> plain values (recursively).
function conv(v, depth = 0) {
  if (v === null || v === undefined) return null;
  if (Buffer.isBuffer(v)) return bufText(v);
  if (typeof v === 'bigint') return v.toString();
  if (typeof v !== 'object') return v;
  if (depth > 30) return '[...]';
  if (Array.isArray(v)) return v.map(x => conv(x, depth + 1));
  if (v instanceof Set) return [...v].map(x => conv(x, depth + 1));
  if (v instanceof Map) { const o = {}; for (const [k, x] of v) o[String(conv(k))] = conv(x, depth + 1); return o; }
  const o = {};
  for (const k of Object.keys(v)) o[k] = conv(v[k], depth + 1);
  return o;
}

const msg = text => ({ type: 'msg', text });

const PAIR_CMDS = new Set(['HGETALL', 'HELLO', 'CONFIG GET', 'XINFO STREAM', 'MEMORY STATS', 'ACL GETUSER', 'CLIENT TRACKINGINFO', 'FUNCTION STATS']);
const RECORD_CMDS = new Set(['XINFO GROUPS', 'XINFO CONSUMERS', 'MODULE LIST', 'ACL LOG', 'SENTINEL MASTERS', 'SENTINEL REPLICAS', 'SENTINEL SLAVES', 'SENTINEL SENTINELS']);
const SUBCOMMAND_CMDS = new Set(['CONFIG', 'XINFO', 'MEMORY', 'ACL', 'CLIENT', 'FUNCTION', 'MODULE', 'SENTINEL', 'OBJECT', 'CLUSTER', 'COMMAND', 'SCRIPT', 'SLOWLOG', 'LATENCY', 'PUBSUB', 'XGROUP']);

function cmdName(args) {
  const first = String(args[0] || '').toUpperCase();
  if (SUBCOMMAND_CMDS.has(first) && args.length > 1) return `${first} ${String(args[1]).toUpperCase()}`;
  return first;
}

const hasArg = (args, word) => args.some(a => typeof a === 'string' && a.toUpperCase() === word);

function pairsGrid(flat, names, maxRows) {
  const g = grid(names, maxRows);
  for (let i = 0; i < flat.length; i += 2) g.add([flat[i], i + 1 < flat.length ? flat[i + 1] : null]);
  return g.item;
}

function listGrid(arr, maxRows) {
  const g = grid([{ name: '#', type: 'integer' }, { name: 'value', type: '' }], maxRows);
  arr.forEach((x, i) => g.add([i + 1, x]));
  return g.item;
}

// Stream entries [[id, [f, v, ...]], ...] -> id + one column per field.
function entriesGrid(entries, maxRows, stream) {
  const fields = [];
  const seen = new Set();
  const norm = entries.map(e => {
    const id = Array.isArray(e) ? e[0] : e;
    const kv = Array.isArray(e) && Array.isArray(e[1]) ? e[1] : [];
    const row = new Map();
    for (let i = 0; i < kv.length; i += 2) {
      const f = String(kv[i]);
      if (!seen.has(f) && seen.size < 200) { seen.add(f); fields.push(f); }
      row.set(f, kv[i + 1]);
    }
    return { id, row };
  });
  const g = grid([...(stream !== undefined ? ['stream'] : []), 'id', ...fields], maxRows);
  for (const e of norm) g.add([...(stream !== undefined ? [stream] : []), e.id, ...fields.map(f => (e.row.has(f) ? e.row.get(f) : null))]);
  return g.item;
}

function recordsGrid(records, maxRows) {
  const cols = [];
  const seen = new Set();
  const recs = records.map(r => {
    const m = new Map();
    for (let i = 0; i + 1 < r.length; i += 2) {
      const k = String(r[i]);
      if (!seen.has(k)) { seen.add(k); cols.push(k); }
      m.set(k, r[i + 1]);
    }
    return m;
  });
  const g = grid(cols, maxRows);
  for (const m of recs) g.add(cols.map(c => (m.has(c) ? m.get(c) : null)));
  return g.item;
}

const isRecordList = arr => arr.length > 0 && arr.every(r => Array.isArray(r) && r.length >= 2 && r.length % 2 === 0
  && r.filter((_, i) => i % 2 === 0).every(k => typeof k === 'string'));

// Turns one command reply into result items.
function formatReply(args, rawReply, maxRows) {
  const reply = conv(rawReply);
  const name = cmdName(args);
  const base = String(args[0] || '').toUpperCase();

  if (reply === null) return [msg('(nil)')];
  if (typeof reply === 'number') return [msg(`(integer) ${reply}`)];
  if (typeof reply === 'boolean') return [msg(`(${reply})`)];
  if (typeof reply === 'string') return [msg(reply === '' ? '(empty string)' : reply)];

  if (!Array.isArray(reply)) {                                           // RESP3 map
    const flat = [];
    for (const k of Object.keys(reply)) flat.push(k, reply[k]);
    return flat.length ? [pairsGrid(flat, ['field', 'value'], maxRows)] : [msg('(empty hash)')];
  }
  if (!reply.length) return [msg('(empty array)')];

  // SCAN family: [cursor, [items]]
  if (/^[SHZ]?SCAN$/.test(base) && reply.length === 2 && Array.isArray(reply[1])) {
    const items = reply[1];
    const grd = base === 'HSCAN' ? pairsGrid(items, ['field', 'value'], maxRows)
      : base === 'ZSCAN' ? pairsGrid(items, ['member', 'score'], maxRows)
        : listGrid(items, maxRows);
    return [grd, msg(`Next cursor: ${reply[0]}${String(reply[0]) === '0' ? ' (iteration complete)' : ''}`)];
  }
  if (base === 'XRANGE' || base === 'XREVRANGE') return [entriesGrid(reply, maxRows)];
  if ((base === 'XREAD' || base === 'XREADGROUP') && Array.isArray(reply[0]) && Array.isArray(reply[0][1])) {
    return reply.map(s => entriesGrid(s[1] || [], maxRows, s[0]));        // one grid per stream
  }
  if (RECORD_CMDS.has(name) && isRecordList(reply)) return [recordsGrid(reply, maxRows)];
  if (PAIR_CMDS.has(name) && reply.length % 2 === 0) return [pairsGrid(reply, ['field', 'value'], maxRows)];
  if (/^Z/.test(base) && hasArg(args, 'WITHSCORES') && reply.length % 2 === 0) return [pairsGrid(reply, ['member', 'score'], maxRows)];
  if ((base === 'ZPOPMIN' || base === 'ZPOPMAX') && reply.length % 2 === 0) return [pairsGrid(reply, ['member', 'score'], maxRows)];
  if (base === 'HRANDFIELD' && hasArg(args, 'WITHVALUES') && reply.length % 2 === 0) return [pairsGrid(reply, ['field', 'value'], maxRows)];
  return [listGrid(reply, maxRows)];
}

// ---------------------------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------------------------

const dbName = n => `db${n}`;
function parseDb(v) {
  const m = /^(?:db)?(\d+)$/i.exec(String(v === undefined || v === null ? '' : v).trim());
  return m ? Number(m[1]) : null;
}

function makeClient(spec, db) {
  const { createClient } = requireDriver('redis');
  const timeout = Math.max(1, Number(spec.connectTimeout) || 15) * 1000;
  const state = { ready: false };
  const socket = {
    connectTimeout: timeout,
    // Fail fast while connecting; once connected, ride out short outages.
    reconnectStrategy: retries => (state.ready && retries < 8 ? Math.min(200 * 2 ** retries, 3000) : false),
  };
  // RESP2: works with every Redis version (node-redis 6 defaults to RESP3/HELLO 3) and returns the flat
  // replies redis-cli shows (HGETALL as field/value pairs, ZRANGE WITHSCORES as member/score pairs).
  const opts = { RESP: 2, socket, maintNotifications: 'disabled' };
  const cs = String(spec.connectionString || '').trim();
  if (/^rediss?:\/\//i.test(cs)) {
    opts.url = cs;
    if (/^rediss:/i.test(cs) && spec.trustServerCertificate) { socket.tls = true; socket.rejectUnauthorized = false; }
  } else {
    socket.host = String(spec.server || '127.0.0.1').trim();
    socket.port = Number(spec.port) || 6379;
    if (spec.encrypt) {
      socket.tls = true;
      socket.rejectUnauthorized = !spec.trustServerCertificate;
      if (!net.isIP(socket.host)) socket.servername = socket.host;
    }
  }
  if (spec.user) opts.username = spec.user;
  if (spec.password) opts.password = spec.password;
  if (db) opts.database = db;
  const name = String(spec.appName || '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (name) opts.name = name;
  const client = createClient(opts);
  client.on('error', () => {});                  // surfaced through rejected commands; an unhandled 'error' would crash the process
  client.__state = state;
  return client;
}

async function openClient(spec, db) {
  const client = makeClient(spec, db);
  try {
    await client.connect();
  } catch (e) {
    try { client.destroy(); } catch { /* already closed */ }
    throw e;
  }
  client.__state.ready = true;
  return client;
}

const sendRaw = (client, args) => client.sendCommand(args);
const sendBuf = (client, args) => {
  const { RESP_TYPES } = requireDriver('redis');
  return client.sendCommand(args, { typeMapping: { [RESP_TYPES.BLOB_STRING]: Buffer } });
};

function parseInfo(text) {
  const o = {};
  for (const line of String(text || '').split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i > 0 && line[0] !== '#') o[line.slice(0, i)] = line.slice(i + 1).trim();
  }
  return o;
}

async function connect(spec) {
  const client = await openClient(spec, parseDb(spec.database) || 0);
  const conn = { spec, clients: new Map(), client, db: parseDb(spec.database) || 0, closed: false };
  conn.clients.set(conn.db, client);
  let version = '';
  try {
    const info = parseInfo(await sendRaw(client, ['INFO', 'server']));
    version = info.redis_version || info.valkey_version || '';
  } catch { /* INFO restricted by ACL */ }
  conn.info = { version, user: spec.user || 'default', database: dbName(conn.db), server: spec.server || '' };
  return conn;
}

async function close(conn) {
  conn.closed = true;
  for (const c of conn.clients.values()) {
    try { await c.close(); } catch { try { c.destroy(); } catch { /* ignore */ } }
  }
  conn.clients.clear();
}

// Client bound to database n (one connection per database used by the Object Explorer).
async function clientFor(conn, n) {
  let c = conn.clients.get(n);
  if (c && c.isOpen) return c;
  c = await openClient(conn.spec, n);
  conn.clients.set(n, c);
  return c;
}

async function keyspace(conn) {
  const out = new Map();
  try {
    const info = parseInfo(await sendRaw(conn.client, ['INFO', 'keyspace']));
    for (const k of Object.keys(info)) {
      const m = /^db(\d+)$/.exec(k);
      if (!m) continue;
      const keys = /keys=(\d+)/.exec(info[k]);
      out.set(Number(m[1]), keys ? Number(keys[1]) : 0);
    }
  } catch { /* INFO restricted */ }
  if (!out.has(0)) out.set(0, 0);
  if (!out.has(conn.db)) out.set(conn.db, 0);
  return out;
}

async function databases(conn) {
  return [...(await keyspace(conn)).keys()].sort((a, b) => a - b).map(dbName);
}

// ---------------------------------------------------------------------------------------------
// Object Explorer
// ---------------------------------------------------------------------------------------------

const node = (key, label, o = {}) => ({ key, label, icon: 'folder', expandable: false, ...o });

const globEscape = s => s.replace(/[\\*?[\]]/g, '\\$&');

// SCAN keys (capped), optionally restricted to a prefix.
async function scanKeys(client, prefix) {
  const keys = new Set();
  const t0 = Date.now();
  let cursor = '0', truncated = false;
  const pattern = prefix ? `${globEscape(prefix)}*` : '*';
  do {
    const r = await sendRaw(client, ['SCAN', cursor, 'MATCH', pattern, 'COUNT', '1000']);
    cursor = String(r[0]);
    for (const k of r[1]) {
      if (keys.size >= SCAN_CAP && !keys.has(String(k))) { truncated = true; break; }
      keys.add(String(k));
    }
    if (truncated) break;
    if (keys.size >= SCAN_CAP && cursor !== '0') { truncated = true; break; }
    if (Date.now() - t0 > SCAN_BUDGET_MS) { truncated = true; break; }
  } while (cursor !== '0');
  return { keys: [...keys].sort(), truncated };
}

const TYPE_ICON = { string: 'key', hash: 'table', list: 'seq', set: 'schema', zset: 'index', stream: 'proc', 'ReJSON-RL': 'view' };

function showCommand(type, key) {
  const k = quoteArg(key);
  switch (type) {
    case 'string': return `GET ${k}`;
    case 'hash': return `HGETALL ${k}`;
    case 'list': return `LRANGE ${k} 0 -1`;
    case 'set': return `SMEMBERS ${k}`;
    case 'zset': return `ZRANGE ${k} 0 -1 WITHSCORES`;
    case 'stream': return `XRANGE ${k} - + COUNT 100`;
    case 'ReJSON-RL': return `JSON.GET ${k}`;
    default: return `TYPE ${k}`;
  }
}

async function tree(conn, p = []) {
  if (p.length === 0) {
    const ks = await keyspace(conn);
    return [...ks.keys()].sort((a, b) => a - b).map(n => node(dbName(n), dbName(n), {
      icon: 'db', expandable: true, kind: 'rediskeys', count: ks.get(n),
      row: { name: dbName(n), size_mb: null, owner: null, encoding: null },
    }));
  }
  const n = parseDb(p[0]);
  if (n === null) throw new Error(`Unknown Redis database "${p[0]}".`);
  const parts = p.slice(1);
  if (parts.some(x => !String(x).startsWith('f:'))) return [];
  const prefix = parts.length ? parts.map(x => String(x).slice(2)).join(SEP) + SEP : '';
  const client = await clientFor(conn, n);
  const { keys, truncated } = await scanKeys(client, prefix);

  const folders = new Map();
  const leaves = [];
  for (const k of keys) {
    const rest = k.slice(prefix.length);
    const i = rest.indexOf(SEP);
    if (i >= 0) {
      const seg = rest.slice(0, i);
      folders.set(seg, (folders.get(seg) || 0) + 1);
    } else leaves.push(k);
  }

  // Types and TTLs of the leaves, pipelined (node-redis batches commands issued in the same tick).
  const info = new Array(leaves.length);
  await Promise.all(leaves.map(async (k, i) => {
    const [type, ttl] = await Promise.all([sendRaw(client, ['TYPE', k]), sendRaw(client, ['TTL', k])]);
    info[i] = { type: String(type), ttl: Number(ttl) };
  }));

  const out = [];
  for (const seg of [...folders.keys()].sort()) {
    out.push(node(`f:${seg}`, seg === '' ? '(empty)' : seg, {
      expandable: true, kind: 'rediskeys', count: folders.get(seg),
      row: { name: seg + SEP, type: null, ttl: null },
    }));
  }
  leaves.forEach((k, i) => {
    const { type, ttl } = info[i];
    out.push(node(`k:${k}`, k.slice(prefix.length) || k, {
      icon: TYPE_ICON[type] || 'key', sub: `(${type})`, drag: quoteArg(k),
      row: { name: k, type, ttl: ttl >= 0 ? ttl : null },
      actions: [
        { label: 'Show value', sql: showCommand(type, k), run: true, db: dbName(n) },
        { label: 'TTL', sql: `TTL ${quoteArg(k)}`, run: true, db: dbName(n) },
        { label: 'Script as CREATE', script: 'create' },
      ],
    }));
  });
  if (truncated) out.push(node('more', `… more keys not shown (first ${SCAN_CAP} scanned)`, { dim: true, row: { name: `… more keys not shown (first ${SCAN_CAP} scanned)` } }));
  return out;
}

async function objects() { return []; }
async function columns() { return []; }

// Command(s) that recreate a key (first SCAN_CAP elements of collections).
async function script(conn, p, kind) {
  if (kind !== 'create') throw new Error(`Scripting "${kind}" is not supported for Redis.`);
  const last = String(p[p.length - 1] || '');
  const n = parseDb(p[0]);
  if (n === null || !last.startsWith('k:')) throw new Error('Select a key to script.');
  const key = last.slice(2);
  const client = await clientFor(conn, n);
  const q = quoteArg(key);
  const type = String(await sendRaw(client, ['TYPE', key]));
  const lines = [];
  const bufs = await (async () => {
    switch (type) {
      case 'string': return [await sendBuf(client, ['GET', key])];
      case 'hash': return await sendBuf(client, ['HGETALL', key]);
      case 'list': return await sendBuf(client, ['LRANGE', key, '0', String(SCAN_CAP - 1)]);
      case 'set': return (await sendBuf(client, ['SSCAN', key, '0', 'COUNT', String(SCAN_CAP)]))[1];
      case 'zset': return await sendBuf(client, ['ZRANGE', key, '0', String(SCAN_CAP - 1), 'WITHSCORES']);
      case 'ReJSON-RL': return [await sendBuf(client, ['JSON.GET', key])];
      case 'none': throw new Error(`Key ${key} no longer exists.`);
      default: throw new Error(`Scripting keys of type "${type}" is not supported.`);
    }
  })();
  const items = bufs.map(b => quoteArg(Buffer.isBuffer(b) ? (isTextBuf(b) ? b.toString('utf8') : b) : String(b)));
  switch (type) {
    case 'string': lines.push(`SET ${q} ${items[0]}`); break;
    case 'hash': lines.push(`HSET ${q} ${items.join(' ')}`); break;
    case 'list': lines.push(`RPUSH ${q} ${items.join(' ')}`); break;
    case 'set': lines.push(`SADD ${q} ${items.join(' ')}`); break;
    case 'zset': {
      const parts = [];
      for (let i = 0; i + 1 < items.length; i += 2) parts.push(`${items[i + 1]} ${items[i]}`);   // ZADD takes score first
      lines.push(`ZADD ${q} ${parts.join(' ')}`);
      break;
    }
    case 'ReJSON-RL': lines.push(`JSON.SET ${q} $ ${quoteArg(bufs[0].toString('utf8'))}`); break;
    default: break;
  }
  const pttl = Number(await sendRaw(client, ['PTTL', key]));
  if (pttl > 0) lines.push(`PEXPIRE ${q} ${pttl}`);
  return `SELECT ${n}\n${lines.join('\n')}`;
}

function isTextBuf(b) {
  try { new TextDecoder('utf-8', { fatal: true }).decode(b); return true; } catch { return false; }
}

// ---------------------------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------------------------

const REFUSED = new Set(['SUBSCRIBE', 'PSUBSCRIBE', 'SSUBSCRIBE', 'UNSUBSCRIBE', 'PUNSUBSCRIBE', 'SUNSUBSCRIBE', 'MONITOR', 'SYNC', 'PSYNC']);

async function openSession(conn) {
  const S = { db: conn.db, client: null, running: false, cancelled: false };

  async function ensureClient() {
    if (S.client && S.client.isOpen) return S.client;
    S.client = await openClient(conn.spec, S.db);
    return S.client;
  }

  return {
    async run(text, opts = {}) {
      const maxRows = Math.max(1, Number(opts.maxRows) || 1000);
      const items = [];
      const fail = (message, line) => { items.push({ type: 'err', message, line }); return { items, errors: 1, database: dbName(S.db) }; };
      if (opts.mode === 'explain') return fail('Redis has no execution plans.', null);
      const want = opts.database !== undefined && opts.database !== null && opts.database !== '' ? parseDb(opts.database) : null;
      if (want !== null && want !== S.db) {
        S.db = want;
        if (S.client) { try { S.client.destroy(); } catch { /* ignore */ } S.client = null; }
      }
      S.running = true;
      S.cancelled = false;
      try {
        for (const cmd of splitCommands(text)) {
          let args;
          try { args = parseArgs(cmd.raw); } catch (e) { return fail(e.message, cmd.line); }
          if (!args.length) continue;
          const name = String(args[0]).toUpperCase();
          if (REFUSED.has(name)) return fail(`${name} is not supported in the query editor (it would block the session).`, cmd.line);
          if (name === 'QUIT') { items.push(msg('OK')); continue; }
          let reply;
          try {
            const client = await ensureClient();
            reply = await sendBuf(client, args);
          } catch (e) {
            if (S.cancelled) return fail('Command cancelled.', cmd.line);
            return fail(e && e.message ? e.message : String(e), cmd.line);
          }
          if (name === 'SELECT') {
            const n = parseDb(args[1]);
            if (n !== null) S.db = n;
          }
          items.push(...formatReply(args, reply, maxRows));
        }
      } finally {
        S.running = false;
      }
      return { items, errors: 0, database: dbName(S.db) };
    },
    // Blocking commands (BLPOP, XREAD BLOCK, ...) can only be interrupted by dropping the session's connection;
    // the next run reconnects to the same database.
    cancel() {
      if (!S.running || !S.client) return false;
      S.cancelled = true;
      try { S.client.destroy(); } catch { /* ignore */ }
      S.client = null;
      return true;
    },
    async close() {
      if (S.client) { try { await S.client.close(); } catch { try { S.client.destroy(); } catch { /* ignore */ } } S.client = null; }
    },
  };
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  // exported for tests
  _internal: { parseArgs, splitCommands, formatReply, quoteArg, bufText, conv, cmdName, parseDb, parseInfo, scanKeys },
};
