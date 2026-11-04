'use strict';
// Mold data files (.cdb, e.g. "moldset.cdb") saved by injection-moulding machine controllers.
//
// The file is a run of equal-size records, one per mold. Each record starts with
//   0x00 char[14] mold name     0x0E u8 day, u8 month, u16 year, u8 weekday   (save date)
//   0x14 char[6]  material      0x1A char[6] code
// followed by 16-bit little-endian settings; 0xFFFF means "not set".
// What each setting means is not documented, so settings are listed by their byte offset
// in the record. On connect the file is converted to a temporary SQLite database that is
// opened read-only, and the SQLite driver does everything else (tree, queries, scripts).

const fs = require('fs');
const os = require('os');
const nodePath = require('path');
const crypto = require('crypto');
const sqlite = require('./sqlite');

const HEADER = 0x20;            // settings start here
const UNSET = 0xffff;
const TEMP_DIR = nodePath.join(os.tmpdir(), 'web-sql-studio');

const text = (b, start, len) => {
  let s = '';
  for (let i = start; i < start + len && b[i]; i++) s += String.fromCharCode(b[i]);
  return s.trim();
};
const hex = (n, digits) => '0x' + n.toString(16).toUpperCase().padStart(digits, '0');

// A record starts with a printable name and a valid save date.
function headerOk(b, o) {
  for (let i = 0; i < 14; i++) {
    const c = b[o + i];
    if (c === 0) break;
    if (c < 32 || c > 126) return false;
  }
  const day = b[o + 0x0e], month = b[o + 0x0f], year = b.readUInt16LE(o + 0x10), weekday = b[o + 0x12];
  return day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1980 && year <= 2200 && weekday <= 6;
}

// Record size: the smallest size that splits the file into records that all look like one.
function parse(b) {
  let size = 0;
  if (b.length >= HEADER + 2 && b[0] !== 0) {
    for (let s = HEADER + 2; s <= b.length; s += 2) {
      if (b.length % s) continue;
      let ok = true;
      for (let o = 0; o < b.length && ok; o += s) ok = headerOk(b, o);
      if (ok) { size = s; break; }
    }
  }
  if (!size) throw new Error('This file is not a mold data (.cdb) file in a layout this app can read.');
  const molds = [];
  for (let o = 0; o < b.length; o += size) {
    const words = [];
    for (let p = HEADER; p + 1 < size; p += 2) words.push(b.readUInt16LE(o + p));
    const pad = n => String(n).padStart(2, '0');
    molds.push({
      name: text(b, o, 14),
      material: text(b, o + 0x14, 6),
      code: text(b, o + 0x1a, 6),
      saved: `${b.readUInt16LE(o + 0x10)}-${pad(b[o + 0x0f])}-${pad(b[o + 0x0e])}`,
      fileOffset: o,
      words,
    });
  }
  return { size, molds };
}

function build(parsed, source, out) {
  const { DatabaseSync } = sqlite._internal.loadSqlite();
  const db = new DatabaseSync(out);
  try {
    const { size, molds } = parsed;
    // One column per mold in "compare", named after the mold (made unique, case-insensitively).
    const used = new Set(['byte_offset', 'hex', 'differs']);
    const colNames = molds.map((m, i) => {
      let n = m.name || `mold_${i + 1}`;
      while (used.has(n.toLowerCase())) n = `${m.name || 'mold'}_${i + 1}`;
      used.add(n.toLowerCase());
      return n;
    });
    const q = s => '"' + s.replace(/"/g, '""') + '"';
    db.exec(`
CREATE TABLE file_info (property TEXT PRIMARY KEY, value TEXT);
CREATE TABLE molds (
  mold_no INTEGER PRIMARY KEY, name TEXT, material TEXT, code TEXT, saved_on TEXT,
  settings_used INTEGER, file_offset INTEGER);
CREATE TABLE settings (
  mold_no INTEGER NOT NULL REFERENCES molds (mold_no), byte_offset INTEGER NOT NULL, hex TEXT NOT NULL,
  value INTEGER, raw TEXT NOT NULL, PRIMARY KEY (mold_no, byte_offset)) WITHOUT ROWID;
CREATE TABLE compare (byte_offset INTEGER PRIMARY KEY, hex TEXT NOT NULL, ${colNames.map(n => q(n) + ' INTEGER').join(', ')}, differs INTEGER NOT NULL);
BEGIN;`);
    const st = fs.statSync(source);
    const local = new Date(st.mtimeMs - st.mtime.getTimezoneOffset() * 60000);
    const info = db.prepare('INSERT INTO file_info VALUES (?, ?)');
    for (const [k, v] of [
      ['file', source], ['size_bytes', st.size], ['modified', local.toISOString().slice(0, 19).replace('T', ' ')],
      ['molds', molds.length], ['record_size_bytes', size],
      ['note', 'Read-only view of the file. Settings are raw 16-bit numbers listed by byte offset in the record; 0xFFFF (not set) is shown as NULL.'],
    ]) info.run(k, String(v));
    const mold = db.prepare('INSERT INTO molds VALUES (?, ?, ?, ?, ?, ?, ?)');
    const setting = db.prepare('INSERT INTO settings VALUES (?, ?, ?, ?, ?)');
    molds.forEach((m, i) => {
      mold.run(i + 1, m.name, m.material, m.code, m.saved, m.words.filter(w => w !== UNSET).length, m.fileOffset);
      m.words.forEach((w, k) => {
        const off = HEADER + k * 2;
        setting.run(i + 1, off, hex(off, 4), w === UNSET ? null : w, w.toString(16).toUpperCase().padStart(4, '0'));
      });
    });
    const cmp = db.prepare(`INSERT INTO compare VALUES (${['?', '?', ...molds.map(() => '?'), '?'].join(', ')})`);
    for (let k = 0; k < molds[0].words.length; k++) {
      const ws = molds.map(m => m.words[k]);
      if (ws.every(w => w === UNSET)) continue;
      const off = HEADER + k * 2;
      cmp.run(off, hex(off, 4), ...ws.map(w => (w === UNSET ? null : w)), ws.every(w => w === ws[0]) ? 0 : 1);
    }
    db.exec('COMMIT');
  } finally {
    db.close();
  }
}

// Temporary copies left behind by a crash are removed after a day.
function removeStale() {
  try {
    for (const f of fs.readdirSync(TEMP_DIR)) {
      const p = nodePath.join(TEMP_DIR, f);
      if (/^cdb-.*\.sqlite$/.test(f) && Date.now() - fs.statSync(p).mtimeMs > 86400000) fs.unlinkSync(p);
    }
  } catch { /* in use or already gone */ }
}

async function connect(spec) {
  const full = nodePath.resolve(String(spec.file || '').trim().replace(/^"(.*)"$/, '$1'));
  let buf;
  try {
    buf = fs.readFileSync(full);
  } catch (e) {
    if (e.code === 'ENOENT') throw new Error(`File not found: ${full}`);
    if (e.code === 'EISDIR') throw new Error(`"${full}" is a folder, not a file.`);
    throw e;
  }
  const parsed = parse(buf);
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  removeStale();
  const tmp = nodePath.join(TEMP_DIR, `cdb-${crypto.randomBytes(6).toString('hex')}.sqlite`);
  try {
    build(parsed, full, tmp);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* not created */ }
    throw e;
  }
  const conn = await sqlite.connect({ file: tmp, readOnly: true });
  const n = parsed.molds.length;
  conn.shownAs = full;
  conn.tempFile = tmp;
  conn.info = { ...conn.info, server: full, version: `${n} mold${n === 1 ? '' : 's'}` };
  return conn;
}

async function close(conn) {
  await sqlite.close(conn);
  try { fs.unlinkSync(conn.tempFile); } catch { /* removed later by removeStale */ }
}

module.exports = { ...sqlite, connect, close, _internal: { ...sqlite._internal, parse } };
