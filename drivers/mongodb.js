'use strict';
// MongoDB driver (mongosh-like JavaScript scripts evaluated in a node:vm context).
//
// Object Explorer paths (each element is a node `key`):
//   []                         databases                  (key = database name)
//   [db]                       'Collections' (c) and 'Views' (v) folders
//   [db,'c']                   collections                (key = collection name)
//   [db,'c',coll]              'Indexes' (i) and 'Fields (sample)' (f) folders
//   [db,'c',coll,'i' | 'f']    indexes | sampled fields
//   [db,'v']                   views                      (key = view name)
//   [db,'v',view]              'Fields (sample)' (f) folder
//   [db,'v',view,'f']          sampled fields
//
// A script is split into top-level statements (strings, template literals, comments, regex literals and
// bracket depth are respected); each statement runs through vm.Script.runInContext in one context per
// session, so `var`/function declarations persist. Top-level `const`/`let` are rewritten to `var` so a
// script can be re-run in the same tab, and `const x = <promise>` is awaited before the binding is made.

const vm = require('vm');
const { cell, grid, requireDriver } = require('./common');

const language = 'js';

const SCRIPT_CAP = 100000;     // documents read by an explicit toArray()/map()/await cursor inside a script
const SAMPLE_DOCS = 100;       // documents inspected for "Fields (sample)"
const VM_TIMEOUT = 30000;      // synchronous script execution limit (ms); awaiting server calls is not counted
const MAX_MSG = 1000000;

// ---------------------------------------------------------------------------------------------
// BSON helpers
// ---------------------------------------------------------------------------------------------

const bt = v => (v !== null && typeof v === 'object' ? v._bsontype : undefined);
const TEXT = Symbol('showAsText');                 // marks command results that are displayed as text
const IDENT = /^[A-Za-z_$][\w$]*$/;

function isPlainProto(p) {
  return p === null || (Object.getPrototypeOf(p) === null && typeof p.constructor === 'function' && p.constructor.name === 'Object');
}

// Copies values created inside the vm context (other realm: Array/Object/Date/RegExp) into host-realm values so
// the driver / cell() recognise them. BSON values and host wrapper objects are left untouched.
function hostify(v, depth = 0) {
  if (v === null || typeof v !== 'object') return v;
  if (depth > 200) return v;
  if (bt(v) || v.__kind !== undefined || v[TEXT]) return v;
  const tag = Object.prototype.toString.call(v);
  switch (tag) {
    case '[object Date]': return new Date(v.getTime());
    case '[object RegExp]': return new RegExp(v.source, v.flags);
    case '[object Array]': return Array.from(v, x => hostify(x, depth + 1));
    case '[object Uint8Array]': return Buffer.isBuffer(v) ? v : Buffer.from(v);
    case '[object Map]': { const m = new Map(); for (const [k, x] of v) m.set(hostify(k, depth + 1), hostify(x, depth + 1)); return m; }
    case '[object Set]': { const s = new Set(); for (const x of v) s.add(hostify(x, depth + 1)); return s; }
    case '[object Object]': {
      if (!isPlainProto(Object.getPrototypeOf(v))) return v;
      const o = {};
      for (const k of Object.keys(v)) o[k] = hostify(v[k], depth + 1);
      return o;
    }
    default: return v;
  }
}

const hex = b => Buffer.from(b).toString('hex');
const uuidText = h => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
const binBytes = v => Buffer.from(v.buffer.subarray(0, v.position));

function binText(v) {
  const b = binBytes(v);
  if (v.sub_type === 4 && b.length === 16) return uuidText(hex(b));
  return '0x' + hex(b.subarray(0, 1024)).toUpperCase() + (b.length > 1024 ? '…' : '');
}

// Converts a BSON value to something JSON-friendly (nested values in grid cells).
function norm(v, depth = 0) {
  if (v === undefined) return null;
  if (v === null) return null;
  if (typeof v === 'bigint') return v.toString();
  if (typeof v === 'function') return '[function]';
  if (typeof v !== 'object') return v;
  if (depth > 40) return '[nested too deep]';
  if (v instanceof Date) return v;
  const t = bt(v);
  if (t) {
    switch (t) {
      case 'ObjectId': return v.toHexString();
      case 'Long': { const n = v.toNumber(); return Number.isSafeInteger(n) ? n : v.toString(); }
      case 'Decimal128': return v.toString();
      case 'Int32': case 'Double': return v.value;
      case 'Binary': return binText(v);
      case 'Timestamp': return `Timestamp(${v.high}, ${v.low})`;
      case 'BSONRegExp': return `/${v.pattern}/${v.options}`;
      case 'MinKey': return 'MinKey';
      case 'MaxKey': return 'MaxKey';
      case 'Code': return v.code;
      case 'BSONSymbol': return String(v.valueOf());
      case 'DBRef': return { $ref: v.collection, $id: norm(v.oid, depth + 1), ...(v.db ? { $db: v.db } : {}) };
      default: return String(v);
    }
  }
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return '0x' + hex(Buffer.from(v).subarray(0, 1024)).toUpperCase();
  if (v instanceof RegExp) return String(v);
  if (Array.isArray(v)) return v.map(x => norm(x, depth + 1));
  if (v instanceof Map) { const o = {}; for (const [k, x] of v) o[String(k)] = norm(x, depth + 1); return o; }
  if (v instanceof Set) return [...v].map(x => norm(x, depth + 1));
  if (v instanceof Error) return v.message;
  const o = {};
  for (const k of Object.keys(v)) { const x = v[k]; if (x !== undefined) o[k] = norm(x, depth + 1); }
  return o;
}

// Observed type name of a value (Fields (sample), grid column types).
function typeOf(v) {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return 'array';
  if (v instanceof Date) return 'date';
  switch (typeof v) {
    case 'string': return 'string';
    case 'boolean': return 'bool';
    case 'number': return 'number';
    case 'bigint': return 'long';
    default: break;
  }
  switch (bt(v)) {
    case 'ObjectId': return 'objectId';
    case 'Long': return 'long';
    case 'Decimal128': return 'decimal';
    case 'Int32': return 'int';
    case 'Double': return 'double';
    case 'Binary': return v.sub_type === 4 ? 'uuid' : 'binData';
    case 'Timestamp': return 'timestamp';
    case 'BSONRegExp': return 'regex';
    case 'MinKey': return 'minKey';
    case 'MaxKey': return 'maxKey';
    case 'Code': return 'javascript';
    case 'DBRef': return 'dbRef';
    case 'BSONSymbol': return 'symbol';
    case undefined: break;
    default: return 'object';
  }
  if (v instanceof RegExp) return 'regex';
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return 'binData';
  return 'object';
}

const isDoc = x => x !== null && typeof x === 'object' && !Array.isArray(x) && !(x instanceof Date) && !bt(x)
  && !(x instanceof RegExp) && !Buffer.isBuffer(x) && !(x instanceof Uint8Array) && !(x instanceof Map) && !(x instanceof Set)
  && !(x instanceof Error) && !x.__kind;

// ---- mongosh-style value printer: { acknowledged: true, insertedId: ObjectId("...") }

const key = k => (IDENT.test(k) ? k : JSON.stringify(k));

function inline(v, depth = 0) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  switch (typeof v) {
    case 'string': return JSON.stringify(v);
    case 'number': case 'boolean': return String(v);
    case 'bigint': return v + 'n';
    case 'function': return `[Function${v.name ? ': ' + v.name : ''}]`;
    default: break;
  }
  if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : `ISODate("${v.toISOString()}")`;
  const t = bt(v);
  if (t) {
    switch (t) {
      case 'ObjectId': return `ObjectId("${v.toHexString()}")`;
      case 'Long': return `NumberLong("${v.toString()}")`;
      case 'Decimal128': return `NumberDecimal("${v.toString()}")`;
      case 'Int32': case 'Double': return String(v.value);
      case 'Binary': {
        const b = binBytes(v);
        return v.sub_type === 4 && b.length === 16 ? `UUID("${uuidText(hex(b))}")` : `BinData(${v.sub_type}, "${b.toString('base64')}")`;
      }
      case 'Timestamp': return `Timestamp({ t: ${v.high}, i: ${v.low} })`;
      case 'BSONRegExp': return `/${v.pattern}/${v.options}`;
      case 'MinKey': return 'MinKey()';
      case 'MaxKey': return 'MaxKey()';
      case 'Code': return `Code(${JSON.stringify(v.code)})`;
      case 'DBRef': return `DBRef(${JSON.stringify(v.collection)}, ${inline(v.oid, depth + 1)}${v.db ? ', ' + JSON.stringify(v.db) : ''})`;
      default: return String(v);
    }
  }
  if (depth > 30) return '[...]';
  if (v instanceof RegExp) return String(v);
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return `BinData(0, "${Buffer.from(v).toString('base64')}")`;
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (Array.isArray(v)) return v.length ? `[ ${v.map(x => inline(x, depth + 1)).join(', ')} ]` : '[]';
  if (v instanceof Set) return inline([...v], depth);
  if (v.__kind === 'db') return String(v.__name);
  if (v.__kind === 'collection') return String(v.__ns);
  const ents = v instanceof Map ? [...v].map(([k, x]) => [String(k), x]) : Object.keys(v).map(k => [k, v[k]]);
  return ents.length ? `{ ${ents.map(([k, x]) => `${key(k)}: ${inline(x, depth + 1)}`).join(', ')} }` : '{}';
}

function fmt(v, ind = '', depth = 0) {
  const s = inline(v, 0);
  if (s.length <= 80 || typeof v !== 'object' || v === null || bt(v) || v instanceof Date || v instanceof RegExp || depth > 30) return s;
  if (Array.isArray(v) || v instanceof Set) {
    const arr = [...v];
    return '[\n' + arr.map(x => `${ind}  ${fmt(x, ind + '  ', depth + 1)}`).join(',\n') + `\n${ind}]`;
  }
  const ents = v instanceof Map ? [...v].map(([k, x]) => [String(k), x]) : Object.keys(v).map(k => [k, v[k]]);
  return '{\n' + ents.map(([k, x]) => `${ind}  ${key(k)}: ${fmt(x, ind + '  ', depth + 1)}`).join(',\n') + `\n${ind}}`;
}

const clipMsg = s => (s.length > MAX_MSG ? s.slice(0, MAX_MSG) + '…' : s);
const showText = v => fmt(hostify(v));
const msg = text => ({ type: 'msg', text: clipMsg(String(text)) });

const markText = o => {
  if (o && typeof o === 'object' && !Array.isArray(o)) { try { Object.defineProperty(o, TEXT, { value: true, enumerable: false }); } catch { /* frozen */ } }
  return o;
};

// ---------------------------------------------------------------------------------------------
// JavaScript statement splitter
// ---------------------------------------------------------------------------------------------

const REGEX_AFTER_WORD = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
const CONTINUE_WORD = new Set(['new', 'typeof', 'instanceof', 'in', 'of', 'void', 'delete', 'await', 'else', 'do', 'yield', 'async']);
const OPERATOR_END = '+-*/%=<>&|^!?:,.~';
const isSpace = c => c === ' ' || c === '\n' || c === '\t' || c === '\r' || c === '\f' || c === '\v' || c === '\u00a0' || c === '\ufeff';

// Returns `text` with the content of comments, strings and template literals blanked out (same length, quote
// characters kept) and regex literals replaced by "r" characters, so structural scanning can ignore them.
function maskJs(text) {
  const n = text.length;
  const out = text.split('');
  const blank = (a, b) => { for (let k = a; k < b; k++) out[k] = ' '; };
  let closed = false;

  const skipString = (i, q) => {            // returns the exclusive end offset
    let j = i + 1;
    closed = false;
    while (j < n && text[j] !== '\n') {
      if (text[j] === '\\') { j += 2; continue; }
      if (text[j] === q) { closed = true; return j + 1; }
      j++;
    }
    return Math.max(Math.min(j, n), i + 1);
  };
  const skipBraced = j => {                 // j = first offset after "${"; returns the offset after the matching "}"
    let depth = 1;
    while (j < n) {
      const c = text[j];
      if (c === '"' || c === "'") { j = skipString(j, c); continue; }
      if (c === '`') { j = skipTemplate(j); continue; }
      if (c === '{') depth++;
      else if (c === '}' && --depth === 0) return j + 1;
      j++;
    }
    return n;
  };
  function skipTemplate(i) {                // returns the exclusive end offset
    let j = i + 1;
    closed = false;
    while (j < n) {
      const c = text[j];
      if (c === '\\') { j += 2; continue; }
      if (c === '`') { closed = true; return j + 1; }
      if (c === '$' && text[j + 1] === '{') { j = skipBraced(j + 2); continue; }
      j++;
    }
    closed = false;
    return n;
  }
  const skipRegex = i => {                  // returns the exclusive end offset or -1 when not a regex literal
    let j = i + 1, inClass = false;
    while (j < n) {
      const c = text[j];
      if (c === '\n') return -1;
      if (c === '\\') { j += 2; continue; }
      if (inClass) { if (c === ']') inClass = false; }
      else if (c === '[') inClass = true;
      else if (c === '/') {
        j++;
        while (j < n && /[a-z]/i.test(text[j])) j++;
        return j;
      }
      j++;
    }
    return -1;
  };

  let i = 0, prev = '', prevWord = '';
  while (i < n) {
    const c = text[i], d = text[i + 1];
    if (c === '/' && d === '/') { let e = text.indexOf('\n', i); if (e < 0) e = n; blank(i, e); i = e; continue; }
    if (c === '/' && d === '*') { let e = text.indexOf('*/', i + 2); e = e < 0 ? n : e + 2; blank(i, e); i = e; continue; }
    if (c === '"' || c === "'") {
      const e = skipString(i, c);
      blank(i + 1, closed ? e - 1 : e);
      prev = c; prevWord = ''; i = e;
      continue;
    }
    if (c === '`') {
      const e = skipTemplate(i);
      blank(i + 1, closed ? e - 1 : e);
      prev = '`'; prevWord = ''; i = e;
      continue;
    }
    if (c === '/') {
      const allowed = prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev) || (prev === 'a' && REGEX_AFTER_WORD.has(prevWord));
      if (allowed) {
        const e = skipRegex(i);
        if (e > 0) { for (let k = i; k < e; k++) out[k] = 'r'; prev = 'r'; prevWord = ''; i = e; continue; }
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[\w$]/.test(text[j])) j++;
      prevWord = text.slice(i, j); prev = 'a'; i = j;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < n && /[\w.]/.test(text[j])) j++;
      prev = '0'; prevWord = ''; i = j;
      continue;
    }
    if (!isSpace(c)) { prev = c; prevWord = ''; }
    i++;
  }
  return out.join('');
}

// Splits a script into top-level statements: [{ src, masked, line }].
function splitJs(text) {
  const lineAt = off => { let ln = 1; for (let k = text.indexOf('\n'); k !== -1 && k < off; k = text.indexOf('\n', k + 1)) ln++; return ln; };
  const m = maskJs(text);
  const n = m.length;
  const out = [];

  // Does the newline at offset nl (depth 0) continue the statement that starts at `start`?
  const continues = (start, nl, lastIdx, ctl) => {
    if (lastIdx < start) return false;
    const lc = m[lastIdx];
    if (OPERATOR_END.includes(lc)) {
      if (!((lc === '+' || lc === '-') && m[lastIdx - 1] === lc)) return true;     // a++ / a-- end the statement
    }
    const w = /([A-Za-z_$][\w$]*)$/.exec(m.slice(Math.max(start, lastIdx - 24), lastIdx + 1));
    if (w && CONTINUE_WORD.has(w[1]) && m[lastIdx - w[1].length] !== '.') return true;
    if (ctl.hdrClosed >= 0 && ctl.hdrClosed === lastIdx) return true;              // if (x)\n statement
    let q = nl + 1;
    while (q < n && isSpace(m[q])) q++;
    if (q >= n) return false;
    const c = m[q];
    if (c === '.' && !(m[q + 1] >= '0' && m[q + 1] <= '9')) return true;           // .sort(...) chains
    if (c === '?' || c === ':' || c === ',') return true;
    if (m.startsWith('&&', q) || m.startsWith('||', q) || m.startsWith('=>', q)) return true;
    if (/^(else|catch|finally|instanceof|in)\b/.test(m.slice(q, q + 12))) return true;
    return false;
  };

  let i = 0;
  while (i < n) {
    while (i < n && (isSpace(m[i]) || m[i] === ';')) i++;
    if (i >= n) break;
    const start = i;
    const ctl = { hdrClosed: -1 };
    const isCtl = /^(if|for|while|with)\b/.test(m.slice(start, start + 6));
    let depth = 0, lastIdx = start - 1, end = -1;
    for (let j = start; j < n; j++) {
      const c = m[j];
      if (c === '(' || c === '[' || c === '{') depth++;
      else if (c === ')' || c === ']' || c === '}') {
        depth = Math.max(0, depth - 1);
        if (isCtl && c === ')' && depth === 0 && ctl.hdrClosed < 0) ctl.hdrClosed = j;
      } else if (depth === 0) {
        if (c === ';') { end = j; break; }
        if (c === '\n' && !continues(start, j, lastIdx, ctl)) { end = j; break; }
      }
      if (!isSpace(c)) lastIdx = j;
    }
    if (end < 0) end = n;
    const src = text.slice(start, end).replace(/\s+$/, '');
    if (src) out.push({ src, masked: m.slice(start, start + src.length), line: lineAt(start) });
    i = end + 1;
  }
  return out;
}

// Index of the bracket matching the opener at i (in masked text), or -1.
function matchBracket(m, i) {
  let depth = 0;
  for (let j = i; j < m.length; j++) {
    const c = m[j];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if ((c === ')' || c === ']' || c === '}') && --depth === 0) return j;
  }
  return -1;
}

function hasTopLevelComma(m) {
  let depth = 0;
  for (let j = 0; j < m.length; j++) {
    const c = m[j];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth = Math.max(0, depth - 1);
    else if (c === ',' && depth === 0) return true;
  }
  return false;
}

// Recognises `const|let|var <pattern> = <init>` and `name = <init>` statements.
//   -> { kind: 'decl', pattern, init, initOffset } | { kind: 'assign', pattern, init, initOffset } | { kind: 'plain-decl' } | null
function parseBinding(src, m) {
  let x = /^(const|let|var)\s+/.exec(m);
  if (x) {
    const i = x[0].length;
    let end;
    if (m[i] === '{' || m[i] === '[') {
      const e = matchBracket(m, i);
      if (e < 0) return { kind: 'plain-decl' };
      end = e + 1;
    } else {
      const id = /^[A-Za-z_$][\w$]*/.exec(m.slice(i));
      if (!id) return null;
      end = i + id[0].length;
    }
    let k = end;
    while (k < m.length && isSpace(m[k])) k++;
    if (m[k] !== '=' || m[k + 1] === '=' || m[k + 1] === '>') return { kind: 'plain-decl' };       // `let x;`, `let a, b = 1`
    if (hasTopLevelComma(m.slice(k + 1))) return { kind: 'plain-decl' };
    return { kind: 'decl', pattern: src.slice(i, end), init: src.slice(k + 1), initOffset: k + 1 };
  }
  x = /^([A-Za-z_$][\w$]*)\s*=(?![=>])/.exec(m);
  if (x && !hasTopLevelComma(m.slice(x[0].length))) return { kind: 'assign', pattern: x[1], init: src.slice(x[0].length), initOffset: x[0].length };
  return null;
}

// ---------------------------------------------------------------------------------------------
// Cursor wrappers
// ---------------------------------------------------------------------------------------------

const CHAIN = ['sort', 'limit', 'skip', 'project', 'batchSize', 'hint', 'min', 'max', 'maxTimeMS', 'comment', 'collation',
  'allowDiskUse', 'returnKey', 'showRecordId', 'maxAwaitTimeMS', 'match', 'group', 'unwind', 'lookup', 'out', 'geoNear', 'redact'];

class Cur {
  constructor(S, make, countFn) {
    this._S = S;
    this._make = make;
    this._countFn = countFn || null;
    this._ops = [];
    this._explain = null;
    this._iter = null;
    this.__kind = 'cursor';
  }

  _build() {
    const cur = this._make();
    for (const [name, args] of this._ops) {
      if (typeof cur[name] !== 'function') throw new TypeError(`cursor.${name} is not supported here`);
      cur[name](...args);
    }
    return cur;
  }

  // Reads up to `limit` documents (or the explain output) and closes the cursor.
  async _run(limit) {
    const S = this._S;
    S.checkCancel();
    const verbosity = this._explain || (S.explain ? 'queryPlanner' : null);
    const cur = this._build();
    if (verbosity) {
      try { return { explain: await cur.explain(verbosity) }; } finally { await cur.close().catch(() => {}); }
    }
    const docs = [];
    try {
      while (docs.length < limit) {
        const d = await cur.next();
        if (d === null) break;
        docs.push(d);
        S.checkCancel();
      }
    } finally {
      await cur.close().catch(() => {});
    }
    return { docs };
  }

  // Thenable: `await cursor` / auto-await of a declaration reads the whole result (bounded by SCRIPT_CAP).
  then(res, rej) {
    return this._run(SCRIPT_CAP).then(r => {
      if (r.docs && r.docs.length >= SCRIPT_CAP) this._S.print(`Warning: result limited to ${SCRIPT_CAP} documents.`);
      return r.explain || r.docs;
    }).then(res, rej);
  }

  toArray() { return new LazyArr(this); }
  explain(verbosity) {
    const c = Object.create(this);                       // new cursor sharing the ops, but marked as explain
    c._explain = verbosity || 'queryPlanner';
    return new LazyArr(c);
  }
  pretty() { return this; }
  readPref() { return this; }
  noCursorTimeout() { return this; }

  async forEach(fn) {
    const S = this._S, cur = this._build();
    try {
      for (;;) {
        const d = await cur.next();
        if (d === null) break;
        S.checkCancel();
        const r = fn(d);
        if (r && typeof r.then === 'function') await r;
      }
    } finally { await cur.close().catch(() => {}); }
  }

  async map(fn) {
    const r = await this._run(SCRIPT_CAP);
    if (r.explain) return r.explain;
    return r.docs.map((d, i) => fn(d, i));
  }

  async itcount() {
    const S = this._S, cur = this._build();
    let n = 0;
    try {
      while (await cur.next() !== null) { n++; S.checkCancel(); }
    } finally { await cur.close().catch(() => {}); }
    return n;
  }
  size() { return this.itcount(); }
  async count() {
    if (!this._countFn) return this.itcount();
    return this._countFn();
  }

  async hasNext() { this._iter = this._iter || this._build(); return this._iter.hasNext(); }
  async next() {
    this._iter = this._iter || this._build();
    const d = await this._iter.next();
    if (d === null) throw new Error('Cursor has no more documents');
    return d;
  }
  async tryNext() { this._iter = this._iter || this._build(); return this._iter.tryNext(); }
  async close() { if (this._iter) { await this._iter.close(); this._iter = null; } }

  async *[Symbol.asyncIterator]() {
    const S = this._S, cur = this._build();
    try {
      for (;;) {
        const d = await cur.next();
        if (d === null) break;
        S.checkCancel();
        yield d;
      }
    } finally { await cur.close().catch(() => {}); }
  }
}
for (const name of CHAIN) {
  Cur.prototype[name] = function (...a) {
    this._ops.push([name, a.map(x => hostify(x))]);
    return this;
  };
}
Cur.prototype.allowDiskUse = function (v = true) { this._ops.push(['allowDiskUse', [!!v]]); return this; };

// Lazy array: awaiting it reads everything (bounded); as the value of the last statement it is rendered with the
// session's row limit instead.
class LazyArr {
  constructor(cur) { this._cur = cur; this.__kind = 'lazy'; }
  then(res, rej) { return this._cur.then(res, rej); }
}

// ---------------------------------------------------------------------------------------------
// Session (one vm context per query tab)
// ---------------------------------------------------------------------------------------------

const DENY_PROPS = new Set(['then', 'toJSON', 'toBSON', 'inspect', 'constructor', 'toString', 'valueOf', 'length', 'asymmetricMatch']);

function createApi(S, mongodb) {
  const { ObjectId, Long, Decimal128, Int32, Double, Binary, UUID, Timestamp, MinKey, MaxKey, DBRef, Code } = mongodb;
  const H = hostify;
  const client = () => S.conn.client;
  const dbs = new Map(), colls = new Map();
  const w = () => { if (S.explain) throw new Error('Execution plans are available for find() and aggregate() only; the statement was not executed.'); };

  const findOpts = (projection, options) => {
    const o = options ? H(options) : {};
    if (projection !== undefined && projection !== null) o.projection = H(projection);
    return o;
  };
  const shape = r => {                       // class instances (BulkWriteResult, ...) -> plain object
    if (r && typeof r === 'object' && !Array.isArray(r) && !bt(r) && r.constructor && r.constructor !== Object) {
      const o = {};
      for (const k of Object.keys(r)) if (r[k] !== undefined && k !== 'result') o[k] = r[k];
      return markText(o);
    }
    return r;
  };
  const modifyOpts = options => {
    const o = options ? H(options) : {};
    if (o.returnNewDocument !== undefined) { o.returnDocument = o.returnNewDocument ? 'after' : 'before'; delete o.returnNewDocument; }
    if (o.new !== undefined) { o.returnDocument = o.new ? 'after' : 'before'; delete o.new; }
    return o;
  };

  function collFor(dbName, name) {
    const id = dbName + '\u0000' + name;
    let p = colls.get(id);
    if (p) return p;
    const coll = () => client().db(dbName).collection(name);
    const find = (filter, projection, options) => new Cur(S, () => coll().find(H(filter || {}), findOpts(projection, options)),
      () => coll().countDocuments(H(filter || {})));
    const aggregate = (...a) => {
      let pipeline = a[0], options = a[1];
      if (!Array.isArray(pipeline) && !(pipeline && Object.prototype.toString.call(pipeline) === '[object Array]')) { pipeline = a; options = undefined; }
      return new Cur(S, () => coll().aggregate(H(pipeline), H(options || {})));
    };
    const stats = async () => {
      w();
      try {
        const docs = await coll().aggregate([{ $collStats: { storageStats: {}, count: {} } }]).toArray();
        const d = docs[0] || {};
        return markText({ ns: `${dbName}.${name}`, ...(d.storageStats || {}), count: d.count !== undefined ? d.count : (d.storageStats || {}).count });
      } catch (e) {
        return markText(await client().db(dbName).command({ collStats: name }));
      }
    };
    const c = {
      __kind: 'collection', __ns: `${dbName}.${name}`,
      getName: () => name,
      getFullName: () => `${dbName}.${name}`,
      getDB: () => dbFor(dbName),
      find,
      findOne: async (filter, projection, options) => { w(); return coll().findOne(H(filter || {}), findOpts(projection, options)); },
      aggregate,
      countDocuments: async (filter, options) => { w(); return coll().countDocuments(H(filter || {}), H(options || {})); },
      count: async (filter, options) => { w(); return coll().countDocuments(H(filter || {}), H(options || {})); },
      estimatedDocumentCount: async options => { w(); return coll().estimatedDocumentCount(H(options || {})); },
      distinct: async (field, query, options) => { w(); return coll().distinct(field, H(query || {}), H(options || {})); },
      insertOne: async (doc, options) => { w(); return coll().insertOne(H(doc), H(options || {})); },
      insertMany: async (docs, options) => { w(); return coll().insertMany(H(docs), H(options || {})); },
      insert: async (docs, options) => { w(); return Array.isArray(docs) || Object.prototype.toString.call(docs) === '[object Array]' ? coll().insertMany(H(docs), H(options || {})) : coll().insertOne(H(docs), H(options || {})); },
      updateOne: async (filter, update, options) => { w(); return coll().updateOne(H(filter), H(update), H(options || {})); },
      updateMany: async (filter, update, options) => { w(); return coll().updateMany(H(filter), H(update), H(options || {})); },
      update: async (filter, update, options) => { w(); const o = H(options || {}); return o.multi ? coll().updateMany(H(filter), H(update), o) : coll().updateOne(H(filter), H(update), o); },
      replaceOne: async (filter, doc, options) => { w(); return coll().replaceOne(H(filter), H(doc), H(options || {})); },
      deleteOne: async (filter, options) => { w(); return coll().deleteOne(H(filter || {}), H(options || {})); },
      deleteMany: async (filter, options) => { w(); return coll().deleteMany(H(filter || {}), H(options || {})); },
      remove: async (filter, options) => { w(); const o = H(options || {}); const justOne = o === true || (o && o.justOne); return justOne ? coll().deleteOne(H(filter || {})) : coll().deleteMany(H(filter || {})); },
      findOneAndUpdate: async (filter, update, options) => { w(); return coll().findOneAndUpdate(H(filter), H(update), modifyOpts(options)); },
      findOneAndReplace: async (filter, doc, options) => { w(); return coll().findOneAndReplace(H(filter), H(doc), modifyOpts(options)); },
      findOneAndDelete: async (filter, options) => { w(); return coll().findOneAndDelete(H(filter || {}), modifyOpts(options)); },
      findAndModify: async spec => {
        w();
        const s = H(spec || {});
        const o = modifyOpts({ sort: s.sort, upsert: s.upsert, new: s.new, projection: s.fields, collation: s.collation, arrayFilters: s.arrayFilters });
        for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
        if (s.remove) return coll().findOneAndDelete(s.query || {}, o);
        return coll().findOneAndUpdate(s.query || {}, s.update, o);
      },
      bulkWrite: async (ops, options) => { w(); return shape(await coll().bulkWrite(H(ops), H(options || {}))); },
      createIndex: async (keys, options) => { w(); return coll().createIndex(H(keys), H(options || {})); },
      createIndexes: async (specs, options) => { w(); return coll().createIndexes(H(specs), H(options || {})); },
      dropIndex: async index => { w(); return coll().dropIndex(typeof index === 'string' ? index : H(index)); },
      dropIndexes: async () => { w(); return coll().dropIndexes(); },
      getIndexes: async () => { w(); return coll().indexes(); },
      indexes: async () => { w(); return coll().indexes(); },
      drop: async options => { w(); return coll().drop(H(options || {})); },
      renameCollection: async (to, dropTarget) => { w(); await coll().rename(String(to), { dropTarget: !!dropTarget }); return markText({ ok: 1 }); },
      stats,
      dataSize: async () => (await stats()).size,
      storageSize: async () => (await stats()).storageSize,
      totalIndexSize: async () => (await stats()).totalIndexSize,
      totalSize: async () => { const s = await stats(); return (s.storageSize || 0) + (s.totalIndexSize || 0); },
      explain: (verbosity = 'queryPlanner') => ({
        find: (...a) => { const cur = find(...a); cur._explain = verbosity; return cur; },
        aggregate: (...a) => { const cur = aggregate(...a); cur._explain = verbosity; return cur; },
      }),
    };
    p = new Proxy(c, {
      get(t, prop) {
        if (prop in t) return t[prop];
        if (typeof prop === 'symbol' || DENY_PROPS.has(prop) || prop[0] === '_' || prop[0] === '$') return undefined;
        return collFor(dbName, `${name}.${prop}`);                       // db.system.users style sub-collections
      },
    });
    colls.set(id, p);
    return p;
  }

  function dbFor(name) {
    let p = dbs.get(name);
    if (p) return p;
    const d = () => client().db(name);
    const cmd = async (c, o) => { w(); return markText(await d().command(typeof c === 'string' ? { [c]: 1 } : H(c), H(o || {}))); };
    const impl = {
      __kind: 'db', __name: name,
      getName: () => name,
      getSiblingDB: n => dbFor(String(n)),
      getCollection: n => collFor(name, String(n)),
      getCollectionNames: async () => { w(); return (await d().listCollections({}, { nameOnly: true }).toArray()).map(c => c.name).sort(); },
      getCollectionInfos: async (filter, options) => { w(); return d().listCollections(H(filter || {}), H(options || {})).toArray(); },
      listCollections: async (filter, options) => { w(); return d().listCollections(H(filter || {}), H(options || {})).toArray(); },
      runCommand: cmd,
      adminCommand: async (c, o) => { w(); return markText(await client().db('admin').command(typeof c === 'string' ? { [c]: 1 } : H(c), H(o || {}))); },
      createCollection: async (n, o) => { w(); await d().createCollection(String(n), H(o || {})); return markText({ ok: 1 }); },
      createView: async (view, source, pipeline, o) => { w(); await d().createCollection(String(view), { viewOn: String(source), pipeline: H(pipeline || []), ...H(o || {}) }); return markText({ ok: 1 }); },
      dropDatabase: async () => { w(); await d().dropDatabase(); return markText({ ok: 1, dropped: name }); },
      stats: async scale => cmd({ dbStats: 1, ...(scale ? { scale } : {}) }),
      serverStatus: async () => cmd({ serverStatus: 1 }),
      hello: async () => cmd({ hello: 1 }),
      version: async () => { w(); return (await client().db('admin').command({ buildInfo: 1 })).version; },
      getUsers: async () => cmd({ usersInfo: 1 }),
      aggregate: (pipeline, options) => new Cur(S, () => d().aggregate(H(pipeline), H(options || {}))),
    };
    p = new Proxy(impl, {
      get(t, prop) {
        if (prop in t) return t[prop];
        if (typeof prop === 'symbol' || DENY_PROPS.has(prop) || prop[0] === '_' || prop[0] === '$') return undefined;
        return collFor(name, prop);
      },
    });
    dbs.set(name, p);
    return p;
  }

  // `db` follows the session's current database (use("x") switches it).
  const dbProxy = new Proxy({}, {
    get: (_, prop) => dbFor(S.db)[prop],
    has: (_, prop) => prop in dbFor(S.db),
  });

  const callable = C => new Proxy(C, { apply: (t, _, a) => new t(...a) });
  function ISODate(s) {
    if (s === undefined) return new Date();
    if (typeof s === 'string' && /^\d{4}-\d\d-\d\d(T\d\d:\d\d(:\d\d(\.\d+)?)?)?$/.test(s)) s += s.length === 10 ? 'T00:00:00Z' : 'Z';
    const d = new Date(s);
    if (isNaN(d)) throw new Error(`Invalid Date: ${s}`);
    return d;
  }
  function NumberLong(v) { return v instanceof Long ? v : Long.fromString(String(v)); }
  function NumberDecimal(v) { return Decimal128.fromString(String(v)); }
  function NumberInt(v) { return new Int32(Number(v)); }
  function Timestamp_(t, i) { return t && typeof t === 'object' ? new Timestamp(t) : new Timestamp({ t: Number(t) || 0, i: Number(i) || 0 }); }
  function MinKey_() { return new MinKey(); }
  function MaxKey_() { return new MaxKey(); }
  function BinData(sub, b64) { return Binary.createFromBase64(String(b64), Number(sub) || 0); }
  function HexData(sub, h) { return new Binary(Buffer.from(String(h), 'hex'), Number(sub) || 0); }

  const toText = args => args.map(a => (typeof a === 'string' ? a : fmt(hostify(a)))).join(' ');
  const print = (...args) => { S.print(toText(args)); };
  const printjson = v => { S.print(fmt(hostify(v))); };

  const globals = {
    db: dbProxy,
    use: name => { S.db = String(name); return `switched to db ${S.db}`; },
    ObjectId: callable(ObjectId),
    ISODate,
    NumberLong, NumberDecimal, NumberInt,
    UUID: callable(UUID),
    Long: callable(Long), Decimal128: callable(Decimal128), Int32: callable(Int32), Double: callable(Double),
    Timestamp: Timestamp_, MinKey: MinKey_, MaxKey: MaxKey_, BinData, HexData,
    DBRef: callable(DBRef), Code: callable(Code),
    print, printjson,
    console: { log: print, info: print, warn: print, error: print },
    sleep: ms => new Promise(r => setTimeout(r, Math.min(Math.max(0, Number(ms) || 0), 30000))),
  };
  return { globals, dbFor, collFor, H };
}

function errItem(e, st) {
  let message = e && e.message != null ? String(e.message) : String(e);
  const name = e && e.name;
  if (name === 'SyntaxError' || name === 'ReferenceError' || name === 'TypeError' || name === 'RangeError') message = `${name}: ${message}`;
  else if (name === 'MongoServerError' && e.codeName && !message.includes(e.codeName)) message += ` (${e.codeName})`;
  let line = st.line;
  const m = e && typeof e.stack === 'string' ? /\bmongo:(\d+)/.exec(e.stack) : null;
  if (m) line = Math.max(st.line, Number(m[1]));
  return { type: 'err', message, line };
}

async function openSession(conn) {
  const mongodb = requireDriver('mongodb');
  const S = {
    conn,
    db: conn.defaultDb,
    maxRows: 1000,
    explain: false,
    items: [],
    abort: null,
    cancelled: false,
    print(text) { this.items.push(msg(text)); },
    checkCancel() { if (this.cancelled) throw new Error('Operation cancelled'); },
  };
  const api = createApi(S, mongodb);
  const sandbox = { ...api.globals };
  const ctx = vm.createContext(sandbox, { name: 'mongo-session' });

  const compile = (code, firstLine) => new vm.Script(code, { filename: 'mongo', lineOffset: firstLine - 1 });
  const exec = (code, firstLine) => compile(code, firstLine).runInContext(ctx, { timeout: VM_TIMEOUT });

  // Awaits promises / thenables, but keeps cursors (so `const c = db.x.find()` stays a cursor). The result is
  // boxed as { v }: returning a cursor (a thenable) from an async function would resolve it.
  async function settle(v, keepLazy) {
    for (let k = 0; k < 10 && v && (typeof v === 'object' || typeof v === 'function') && typeof v.then === 'function'; k++) {
      if (v instanceof Cur || (keepLazy && v instanceof LazyArr)) break;
      v = await v;
    }
    return { v };
  }

  const usesAwait = masked => /\bawait\b/.test(masked);

  // Evaluates `expr` (an expression) and returns the settled value.
  async function evalExpr(expr, masked, firstLine, keepLazy) {
    const code = usesAwait(masked) ? `(async () => (\n${expr}\n))()` : `(\n${expr}\n)`;
    return settle(exec(code, firstLine - 1), keepLazy);
  }

  const lineOf = (st, offset) => st.line + (st.src.slice(0, offset).split('\n').length - 1);

  async function showDbs() {
    const r = await listDatabases(conn);
    return r.map(d => ({ name: d.name, size_mb: round(d.sizeOnDisk / 1048576) }));
  }

  // Runs one statement; returns its value.
  async function evalStatement(st) {
    const { src, masked } = st;
    let m;
    if ((m = /^use\s+([^\s;()]+)$/.exec(src))) return { v: api.globals.use(m[1].replace(/^["'`]|["'`]$/g, '')) };
    if (/^show\s+(dbs|databases)$/i.test(src)) return { v: await showDbs() };
    if (/^show\s+(collections|tables)$/i.test(src)) return { v: await api.dbFor(S.db).getCollectionNames() };

    const b = parseBinding(src, masked);
    if (b && b.kind === 'plain-decl') {
      exec(src.replace(/^(const|let)\b/, 'var'), st.line);
      return { v: undefined };
    }
    if (b) {
      const initMasked = masked.slice(b.initOffset);
      const { v } = await evalExpr(b.init, initMasked, lineOf(st, b.initOffset), false);
      sandbox.__v = v;                                             // visible to the binding script below
      try { exec(b.kind === 'decl' ? `var ${b.pattern} = __v;` : `${b.pattern} = __v;`, st.line); }
      finally { delete sandbox.__v; }
      return { v: undefined };
    }

    let code = src;
    if (/^class\s+[A-Za-z_$][\w$]*/.test(masked)) code = code.replace(/^class\s+([A-Za-z_$][\w$]*)/, 'var $1 = class $1');
    // Loops, try/switch and declarations have a completion value in a script (the last expression evaluated);
    // it is noise, so only expression statements and `if` produce output.
    const silent = /^(for|while|do|switch|try|with|function|class|async\s+function)\b/.test(masked);
    const declaration = /^(function|class|async\s+function)\b/.test(masked);     // must run at top level to persist
    if (usesAwait(masked) && !declaration) {
      let value;
      try { value = exec(`(async () => (\n${src}\n))()`, st.line - 1); }
      catch (e) {
        if (!(e instanceof SyntaxError || (e && e.name === 'SyntaxError'))) throw e;
        value = exec(`(async () => {\n${src}\n})()`, st.line - 1);
      }
      const r = await settle(value, true);
      return silent ? { v: undefined } : r;
    }
    let value;
    if (src[0] === '{') {
      try { value = exec(`(\n${src}\n)`, st.line - 1); }
      catch (e) { if (!(e && e.name === 'SyntaxError')) throw e; value = exec(code, st.line); }
    } else {
      value = exec(code, st.line);
    }
    return silent ? { v: undefined } : settle(value, true);
  }

  // ---- result rendering -----------------------------------------------------------------

  function docsGrid(docs) {
    const rows = docs.slice(0, S.maxRows);
    const cols = new Map();
    for (const d of rows) {
      for (const k of Object.keys(d)) {
        let s = cols.get(k);
        if (!s) cols.set(k, s = new Set());
        if (s.size < 4) s.add(typeOf(d[k]));
      }
    }
    let names = [...cols.keys()];
    if (cols.has('_id')) names = ['_id', ...names.filter(n => n !== '_id')];
    if (!names.length) names = ['_id'];
    const g = grid(names.map(n => {
      const types = [...(cols.get(n) || [])].filter(t => t !== 'null');
      return { name: n, type: types.length ? types.join(' | ') : (cols.has(n) ? 'null' : '') };
    }), S.maxRows);
    docs.forEach((d, i) => g.add(i < S.maxRows ? names.map(n => norm(d[n])) : []));
    return g.item;
  }

  function valuesGrid(arr) {
    const g = grid([{ name: 'value', type: '' }], S.maxRows);
    arr.forEach((x, i) => g.add(i < S.maxRows ? [norm(x)] : []));
    return g.item;
  }

  async function render(v, items) {
    if (v === undefined) return;
    if (v instanceof Cur || v instanceof LazyArr) {
      const cur = v instanceof LazyArr ? v._cur : v;
      const r = await cur._run(S.maxRows + 1);
      items.push(r.explain ? msg(showText(r.explain)) : docsGrid(r.docs));
      return;
    }
    v = hostify(v);
    if (v === null) { items.push(msg('null')); return; }
    if (typeof v === 'string') { items.push(msg(v)); return; }
    if (typeof v !== 'object') { items.push(msg(typeof v === 'function' ? fmt(v) : String(v))); return; }
    if (v.__kind === 'db') { items.push(msg(v.__name)); return; }
    if (v.__kind === 'collection') { items.push(msg(v.__ns)); return; }
    if (Array.isArray(v)) {
      if (!v.length) items.push(msg('[]'));
      else items.push(v.every(isDoc) ? docsGrid(v) : valuesGrid(v));
      return;
    }
    if (isDoc(v) && !v[TEXT] && !('acknowledged' in v)) {
      const names = Object.keys(v);
      const g = grid(names.map(n => ({ name: n, type: typeOf(v[n]) })), S.maxRows);
      g.add(names.map(n => norm(v[n])));
      items.push(g.item);
      return;
    }
    items.push(msg(fmt(v)));
  }

  let running = false;

  return {
    async run(text, opts = {}) {
      S.maxRows = Math.max(1, Number(opts.maxRows) || 1000);
      S.explain = opts.mode === 'explain';
      if (opts.database) S.db = String(opts.database);
      const items = [];
      S.items = items;
      S.cancelled = false;
      const cancelled = new Promise((_, rej) => { S.abort = () => { S.cancelled = true; rej(new Error('Operation cancelled')); }; });
      cancelled.catch(() => {});
      running = true;
      let errors = 0;
      try {
        for (const st of splitJs(String(text || ''))) {
          try {
            await Promise.race([(async () => { await render((await evalStatement(st)).v, items); })(), cancelled]);
          } catch (e) {
            items.push(errItem(e, st));
            errors++;
            break;
          }
        }
      } finally {
        running = false;
        S.abort = null;
      }
      return { items, errors, database: S.db };
    },
    cancel() {
      if (running && S.abort) { S.abort(); return true; }
      return false;
    },
    async close() { running = false; },
  };
}

// ---------------------------------------------------------------------------------------------
// Connection and metadata
// ---------------------------------------------------------------------------------------------

function buildUri(spec) {
  const host = String(spec.server || 'localhost').trim();
  const port = Number(spec.port) || 27017;
  let hostPart;
  if (host.includes(',') || host.startsWith('[')) hostPart = host;
  else if ((host.match(/:/g) || []).length > 1) hostPart = `[${host}]:${port}`;       // bare IPv6
  else hostPart = host.includes(':') ? host : `${host}:${port}`;
  const creds = spec.user ? `${encodeURIComponent(spec.user)}:${encodeURIComponent(spec.password || '')}@` : '';
  return { uri: `mongodb://${creds}${hostPart}/${spec.database ? encodeURIComponent(spec.database) : ''}`, multi: host.includes(',') };
}

async function connect(spec) {
  const { MongoClient } = requireDriver('mongodb');
  const timeout = Math.max(1, Number(spec.connectTimeout) || 15) * 1000;
  const opts = { appName: spec.appName || 'Web SQL Studio' };
  let uri = String(spec.connectionString || '').trim();
  if (uri) {
    if (!/^mongodb(\+srv)?:\/\//i.test(uri)) throw new Error('The connection string must start with mongodb:// or mongodb+srv://');
    if (!/[?&]serverSelectionTimeoutMS=/i.test(uri)) opts.serverSelectionTimeoutMS = timeout;
    if (!/[?&]connectTimeoutMS=/i.test(uri)) opts.connectTimeoutMS = timeout;
    if (spec.encrypt && !/[?&](tls|ssl)=/i.test(uri)) opts.tls = true;
    if (spec.encrypt && spec.trustServerCertificate && !/[?&]tlsAllowInvalidCertificates=/i.test(uri)) opts.tlsAllowInvalidCertificates = true;
  } else {
    const b = buildUri(spec);
    uri = b.uri;
    opts.serverSelectionTimeoutMS = timeout;
    opts.connectTimeoutMS = timeout;
    if (spec.user) opts.authSource = spec.authSource || 'admin';
    if (!b.multi) opts.directConnection = true;
    if (spec.encrypt) {
      opts.tls = true;
      if (spec.trustServerCertificate) opts.tlsAllowInvalidCertificates = true;
    }
  }
  const client = new MongoClient(uri, opts);
  client.on('error', () => {});
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
  } catch (e) {
    await client.close().catch(() => {});
    throw e;
  }
  let version = '';
  try { version = (await client.db('admin').command({ buildInfo: 1 })).version || ''; } catch { /* not authorized */ }
  const creds = client.options && client.options.credentials;
  const defaultDb = spec.database || (client.options && client.options.dbName) || 'test';
  return {
    client, defaultDb, spec, cache: new Map(),
    info: { version, user: spec.user || (creds && creds.username) || '', database: defaultDb, server: spec.server || '' },
  };
}

async function close(conn) { await conn.client.close(); }

// [{ name, sizeOnDisk }] — falls back to the configured database when the user may not list databases.
async function listDatabases(conn) {
  const admin = conn.client.db('admin').admin();
  const attempts = [() => admin.listDatabases({ authorizedDatabases: true }), () => admin.listDatabases()];
  for (const f of attempts) {
    try {
      const r = await f();
      const list = (r.databases || []).map(d => ({ name: d.name, sizeOnDisk: d.sizeOnDisk }));
      // MongoDB lists only databases that hold data; keep the configured one visible anyway.
      if (conn.defaultDb && !list.some(d => d.name === conn.defaultDb)) list.push({ name: conn.defaultDb, sizeOnDisk: null });
      return list.sort((a, b) => a.name.localeCompare(b.name));
    } catch { /* try the next form */ }
  }
  return [{ name: conn.defaultDb, sizeOnDisk: null }];
}

async function databases(conn) { return (await listDatabases(conn)).map(d => d.name); }

const SYSTEM_DBS = new Set(['admin', 'config', 'local']);
const round = (n, d = 2) => (n === null || n === undefined || !Number.isFinite(n) ? null : Math.round(n * 10 ** d) / 10 ** d);
const qs = s => JSON.stringify(s);

function collRef(name) {
  return /^[A-Za-z_]\w*$/.test(name) && !['getCollection', 'getName', 'stats', 'runCommand', 'aggregate', 'version', 'hello'].includes(name)
    ? `db.${name}` : `db.getCollection(${qs(name)})`;
}

async function listColls(conn, dbName) {
  const infos = await conn.client.db(dbName).listCollections({}, { nameOnly: false }).toArray();
  return infos.sort((a, b) => a.name.localeCompare(b.name));
}

async function collStats(conn, dbName, names) {
  const out = new Map();
  if (names.length > 400) return out;
  const deadline = Date.now() + 4000;
  let denied = false, idx = 0;
  const worker = async () => {
    while (idx < names.length && Date.now() < deadline && !denied) {
      const name = names[idx++];
      try {
        const docs = await conn.client.db(dbName).collection(name).aggregate([{ $collStats: { storageStats: {} } }], { maxTimeMS: 3000 }).toArray();
        const s = (docs[0] && docs[0].storageStats) || {};
        out.set(name, { documents: s.count, size_kb: round(s.size / 1024, 1), indexes: s.nindexes });
      } catch (e) {
        if (e && (e.code === 13 || /not authorized|unauthorized/i.test(e.message || ''))) denied = true;
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return out;
}

// Fields observed in the first documents of a collection.
async function sampleFields(conn, dbName, coll) {
  const id = `${dbName}\u0000${coll}`;
  const hit = conn.cache.get(id);
  if (hit && Date.now() - hit.at < 30000) return hit.value;
  const docs = await conn.client.db(dbName).collection(coll).find({}, { limit: SAMPLE_DOCS, maxTimeMS: 10000 }).toArray();
  const fields = new Map();
  for (const d of docs) {
    for (const k of Object.keys(d)) {
      let f = fields.get(k);
      if (!f) fields.set(k, f = { types: new Set(), n: 0 });
      f.types.add(typeOf(d[k]));
      f.n++;
    }
  }
  let names = [...fields.keys()];
  if (fields.has('_id')) names = ['_id', ...names.filter(n => n !== '_id')];
  const value = names.map(name => {
    const f = fields.get(name);
    return { name, types: [...f.types], nullable: f.types.has('null') || f.n < docs.length };
  });
  conn.cache.set(id, { at: Date.now(), value });
  return value;
}

function indexKind(ix) {
  const key = ix.key || {};
  const vals = Object.values(key);
  if (vals.includes('text')) return 'Text';
  if (vals.includes('2dsphere')) return '2dsphere';
  if (vals.includes('2d')) return '2d';
  if (vals.includes('hashed')) return 'Hashed';
  if (Object.keys(key).some(k => k.includes('$**'))) return 'Wildcard';
  if (ix.expireAfterSeconds !== undefined) return 'TTL';
  return Object.keys(key).length > 1 ? 'Compound' : 'Single field';
}

function indexKeys(ix) {
  if (ix.weights) return Object.keys(ix.weights).join(', ');
  return Object.entries(ix.key || {}).map(([k, v]) => `${k} ${v === 1 ? 'ASC' : v === -1 ? 'DESC' : v}`).join(', ');
}

const node = (key, label, o = {}) => ({ key, label, icon: 'folder', expandable: false, ...o });

async function tree(conn, p = []) {
  const [dbName, folder, name, sub] = p;

  if (p.length === 0) {
    const list = await listDatabases(conn);
    return list.map(d => node(d.name, d.name, {
      icon: 'db', expandable: true, kind: 'generic', dim: SYSTEM_DBS.has(d.name),
      row: { name: d.name, size_mb: round(d.sizeOnDisk / 1048576), owner: null, encoding: null },
      actions: [
        { label: 'List collections', sql: 'db.getCollectionNames()', run: true, db: d.name },
        { label: 'Database statistics', sql: 'db.stats()', run: true, db: d.name },
      ],
    }));
  }

  if (p.length === 1) {
    return [
      node('c', 'Collections', { expandable: true, kind: 'collections', row: { name: 'Collections' } }),
      node('v', 'Views', { expandable: true, kind: 'generic', row: { name: 'Views' } }),
    ];
  }

  if (folder === 'c' && p.length === 2) {
    const infos = (await listColls(conn, dbName)).filter(c => c.type !== 'view');
    const stats = await collStats(conn, dbName, infos.map(c => c.name));
    return infos.map(c => {
      const s = stats.get(c.name) || {};
      return node(c.name, c.name, {
        icon: 'table', expandable: true, kind: 'generic', dim: c.name.startsWith('system.'), drag: collRef(c.name),
        row: { name: c.name, documents: s.documents ?? null, size_kb: s.size_kb ?? null, indexes: s.indexes ?? null },
        actions: [
          { label: 'Find first 100 documents', sql: `db.getCollection(${qs(c.name)}).find({}).limit(100)`, run: true, db: dbName },
          { label: 'Count documents', sql: `db.getCollection(${qs(c.name)}).countDocuments({})`, run: true, db: dbName },
          { label: 'Aggregate template', sql: `db.getCollection(${qs(c.name)}).aggregate([\n  { $match: {} },\n  { $group: { _id: "$field", count: { $sum: 1 } } },\n  { $sort: { count: -1 } },\n  { $limit: 100 }\n])`, run: false, db: dbName },
          { label: 'Insert template', sql: `db.getCollection(${qs(c.name)}).insertOne({\n  \n})`, run: false, db: dbName },
          { label: 'Script as CREATE', script: 'create' },
        ],
      });
    });
  }

  if (folder === 'c' && p.length === 3) {
    return [
      node('i', 'Indexes', { expandable: true, kind: 'indexes', row: { name: 'Indexes' } }),
      node('f', 'Fields (sample)', { expandable: true, kind: 'columns', row: { name: 'Fields (sample)' } }),
    ];
  }

  if (folder === 'c' && p.length === 4 && sub === 'i') {
    const indexes = await conn.client.db(dbName).collection(name).indexes();
    return indexes.map(ix => node(ix.name, ix.name, {
      icon: 'index', sub: `(${indexKeys(ix)})`,
      row: { name: ix.name, kind: indexKind(ix), unique: !!ix.unique || ix.name === '_id_', keys: indexKeys(ix), include: '' },
    }));
  }

  if ((folder === 'c' || folder === 'v') && p.length === 4 && sub === 'f') return fieldNodes(conn, dbName, name);

  if (folder === 'v' && p.length === 2) {
    const infos = (await listColls(conn, dbName)).filter(c => c.type === 'view');
    return infos.map(c => node(c.name, c.name, {
      icon: 'view', expandable: true, kind: 'generic', drag: collRef(c.name), row: { name: c.name },
      actions: [{ label: 'Find first 100 documents', sql: `db.getCollection(${qs(c.name)}).find({}).limit(100)`, run: true, db: dbName }],
    }));
  }

  if (folder === 'v' && p.length === 3) return [node('f', 'Fields (sample)', { expandable: true, kind: 'columns', row: { name: 'Fields (sample)' } })];
  return [];
}

async function fieldNodes(conn, dbName, coll) {
  const fields = await sampleFields(conn, dbName, coll);
  return fields.map(f => node(f.name, f.name, {
    icon: f.name === '_id' ? 'key' : 'col', sub: `(${f.types.join(', ')})`,
    row: { name: f.name, data_type: f.types.join(', '), nullable: f.nullable, pk: f.name === '_id', fk: false, identity: false, default: null },
  }));
}

async function objects(conn, dbName) {
  const infos = await listColls(conn, dbName || conn.defaultDb);
  return infos.map(c => ({ schema: '', name: c.name, type: c.type === 'view' ? 'view' : 'table' }));
}

async function columns(conn, dbName, schema, name) {
  const fields = await sampleFields(conn, dbName || conn.defaultDb, name);
  return fields.map(f => ({ name: f.name, type: f.types.join(', ') }));
}

async function script(conn, p, kind) {
  if (kind !== 'create') throw new Error(`Scripting "${kind}" is not supported for MongoDB.`);
  const [dbName, folder, name] = p;
  if (!dbName || !name || (folder !== 'c' && folder !== 'v')) throw new Error('Select a collection or view to script.');
  const info = (await conn.client.db(dbName).listCollections({ name }, { nameOnly: false }).toArray())[0];
  if (!info) throw new Error(`Collection ${dbName}.${name} was not found.`);
  const opt = info.options || {};
  const lines = [`use(${qs(dbName)});`, ''];
  if (info.type === 'view') {
    const { viewOn, pipeline, ...rest } = opt;
    lines.push(`db.createView(${qs(name)}, ${qs(viewOn)}, ${fmt(pipeline || [])}${Object.keys(rest).length ? ', ' + fmt(rest) : ''});`);
    return lines.join('\n');
  }
  lines.push(`db.createCollection(${qs(name)}${Object.keys(opt).length ? ', ' + fmt(opt) : ''});`);
  const indexes = await conn.client.db(dbName).collection(name).indexes().catch(() => []);
  const skip = new Set(['v', 'key', 'ns', 'background']);
  for (const ix of indexes) {
    if (ix.name === '_id_') continue;
    const o = {};
    for (const k of Object.keys(ix)) if (!skip.has(k)) o[k] = ix[k];
    lines.push(`db.getCollection(${qs(name)}).createIndex(${fmt(ix.key)}, ${fmt(o)});`);
  }
  return lines.join('\n');
}

module.exports = {
  language, connect, close, databases, tree, objects, columns, script, openSession,
  // exported for tests
  _internal: { maskJs, splitJs, parseBinding, hostify, norm, fmt, typeOf, indexKind, buildUri, Cur, LazyArr, createApi },
};
