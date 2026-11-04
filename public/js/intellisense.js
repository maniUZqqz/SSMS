// IntelliSense: completion popup for keywords, objects, columns (with alias
// resolution) and variables.

import { h, esc } from './util.js';
import { KEYWORD_LIST, TYPE_LIST, FUNC_LIST, KEYWORDS, quoteIfNeeded } from './sql.js';

const popup = h('div', 'ac');
popup.hidden = true;
document.body.append(popup);
popup.addEventListener('mousedown', e => {
  e.preventDefault();
  const row = e.target.closest('[data-i]');
  if (row) accept(+row.dataset.i);
});

let state = null;      // { ed, provider, ctx, items, index }
let suppress = false;
let quote = quoteIfNeeded;   // identifier quoting of the current provider's SQL dialect

const KIND = {
  alias: ['A', 'Alias'], col: ['C', 'Column'], table: ['T', 'Table'], view: ['V', 'View'], proc: ['P', 'Procedure'],
  func: ['F', 'Function'], syn: ['S', 'Synonym'], schema: ['{}', 'Schema'], kw: ['K', 'Keyword'], fn: ['ƒ', 'Function'],
  type: ['τ', 'Type'], var: ['@', 'Variable'],
};
const OBJ_KIND = { U: 'table', V: 'view', P: 'proc', PC: 'proc', FN: 'func', FS: 'func', IF: 'func', TF: 'func', FT: 'func', SN: 'syn' };
const RANK = { alias: 0, col: 1, var: 1, table: 2, view: 2, func: 3, proc: 3, syn: 3, schema: 4, kw: 5, fn: 5, type: 6 };

const unbracket = s => (s.startsWith('[') ? s.slice(1, s.endsWith(']') ? -1 : undefined).replace(/]]/g, ']') : s);

function splitParts(qual) {
  const out = [];
  const re = /\[((?:[^\]]|\]\])*)\]|([\w@#$]+)/g;
  let m;
  while ((m = re.exec(qual))) out.push(m[1] != null ? m[1].replace(/]]/g, ']') : m[2]);
  return out;
}

function inStringOrComment(line) {
  let str = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (str) { if (ch === "'") str = line[i + 1] === "'" ? (i++, true) : false; }
    else if (ch === "'") str = true;
    else if (ch === '-' && line[i + 1] === '-') return true;
    else if (ch === '[') { const e = line.indexOf(']', i); if (e < 0) return false; i = e; }
  }
  return str;
}

function context(ed) {
  const { start, end } = ed.selection();
  if (start !== end) return null;
  const v = ed.value;
  const ls = v.lastIndexOf('\n', start - 1) + 1;
  const line = v.slice(ls, start);
  if (inStringOrComment(line.replace(/\[[^\]]*$/, ''))) return null;
  const m = /((?:(?:\[[^\]]*\]|[\w@#$]+)\s*\.\s*)*)(\[[^\]]*|[\w@#$]*)$/.exec(line);
  return {
    caret: start,
    partial: m[2],
    parts: m[1] ? splitParts(m[1]) : [],
    from: start - m[2].length,
    lastChar: v[start - 1] || '',
  };
}

function resolve(objs, parts) {
  if (!parts.length) return null;
  const name = parts[parts.length - 1].toLowerCase();
  const sch = parts.length > 1 ? parts[parts.length - 2].toLowerCase() : null;
  const hits = objs.filter(o => o.name.toLowerCase() === name && (!sch || o.sch.toLowerCase() === sch));
  return hits.find(o => o.sch === 'dbo') || hits[0] || null;
}

// Tables/views referenced in the current batch, with their aliases.
function tablesInScope(text, caret, objs) {
  const goRe = /^[ \t]*GO[ \t]*\d*[ \t]*$/gim;
  let a = 0, b = text.length, m;
  while ((m = goRe.exec(text))) {
    if (m.index < caret) a = m.index + m[0].length;
    else { b = m.index; break; }
  }
  const seg = text.slice(a, b);
  const re = /(?:\b(?:FROM|JOIN|UPDATE|INTO|APPLY)\b|,)\s*((?:(?:\[[^\]]+\]|[\w#$@]+)\s*\.\s*){0,3}(?:\[[^\]]+\]|[\w#$@]+))(?:\s+(?:AS\s+)?(\[[^\]]+\]|[A-Za-z_][\w$#]*))?/gi;
  const out = [];
  while ((m = re.exec(seg))) {
    const obj = resolve(objs, splitParts(m[1]));
    if (!obj || !['U', 'V', 'IF', 'TF', 'FT', 'SN'].includes(obj.type)) continue;
    let alias = m[2] ? unbracket(m[2]) : null;
    if (alias && KEYWORDS.has(alias.toUpperCase())) alias = null;
    if (!out.some(x => x.alias === (alias || obj.name) && x.obj === obj)) out.push({ alias: alias || obj.name, obj });
  }
  return out;
}

function columnItems(prov, obj, detailPrefix) {
  const cols = prov.columns(obj);
  if (!cols) {
    prov.ensureColumns(obj).then(() => { if (state) refresh(); }, () => {});
    return [];
  }
  return cols.map(c => ({ label: c.name, kind: 'col', detail: `${detailPrefix ? detailPrefix + ' · ' : ''}${c.typeText}`, insert: quote(c.name) }));
}

function buildItems(ctx, prov, ed) {
  quote = prov.quote || quoteIfNeeded;
  const defSchema = (prov.defaultSchema || 'dbo').toLowerCase();
  const objs = prov.objects();
  if (!objs) prov.ensureObjects().then(() => { if (state) refresh(); }, () => {});
  const list = objs || [];
  let items = [];
  if (ctx.partial.startsWith('@')) {
    const seen = new Set();
    for (const m of ed.value.matchAll(/(?<![@\w])@[\w#$]+/g)) {
      const k = m[0].toLowerCase();
      if (!seen.has(k) && m.index !== ctx.from) { seen.add(k); items.push({ label: m[0], kind: 'var', insert: m[0] }); }
    }
  } else if (!ctx.parts.length) {
    const scope = tablesInScope(ed.value, ctx.caret, list);
    for (const s of scope) {
      items.push({ label: s.alias, kind: 'alias', detail: `${s.obj.sch}.${s.obj.name}`, insert: quote(s.alias) });
      items.push(...columnItems(prov, s.obj, s.alias));
    }
    const schemas = new Set();
    for (const o of list) {
      if (o.sch) schemas.add(o.sch);
      const kind = OBJ_KIND[o.type];
      const plain = !o.sch || o.sch.toLowerCase() === defSchema;
      if (kind) items.push({ label: o.name, kind, detail: o.sch, insert: plain ? quote(o.name) : `${quote(o.sch)}.${quote(o.name)}` });
    }
    for (const s of schemas) items.push({ label: s, kind: 'schema', insert: quote(s) });
    for (const k of KEYWORD_LIST) items.push({ label: k, kind: 'kw', insert: k });
    for (const k of FUNC_LIST) items.push({ label: k, kind: 'fn', insert: k });
    for (const k of TYPE_LIST) items.push({ label: k.toLowerCase(), kind: 'type', insert: k.toLowerCase() });
  } else {
    const parts = ctx.parts;
    const last = parts[parts.length - 1].toLowerCase();
    let target = null;
    if (parts.length === 1) {
      const a = tablesInScope(ed.value, ctx.caret, list).find(s => s.alias.toLowerCase() === last);
      target = a ? a.obj : null;
      if (!target && list.some(o => o.sch.toLowerCase() === last)) {
        items = list.filter(o => o.sch.toLowerCase() === last && OBJ_KIND[o.type])
          .map(o => ({ label: o.name, kind: OBJ_KIND[o.type], detail: o.sch, insert: quote(o.name) }));
      }
      if (!target && !items.length) target = resolve(list, parts);
    } else {
      target = resolve(list, parts.slice(-2));
      if (!target && parts.length === 2 && parts[0].toLowerCase() === String(prov.db).toLowerCase()) {
        items = list.filter(o => o.sch.toLowerCase() === last && OBJ_KIND[o.type])
          .map(o => ({ label: o.name, kind: OBJ_KIND[o.type], detail: o.sch, insert: quote(o.name) }));
      }
    }
    if (target && ['U', 'V', 'IF', 'TF', 'FT'].includes(target.type)) items = columnItems(prov, target, null);
  }

  const p = unbracket(ctx.partial).toLowerCase();
  if (p) items = items.filter(it => it.label.toLowerCase().includes(p));
  items.sort((x, y) => {
    if (p) {
      const xs = x.label.toLowerCase().startsWith(p), ys = y.label.toLowerCase().startsWith(p);
      if (xs !== ys) return xs ? -1 : 1;
    }
    return (RANK[x.kind] - RANK[y.kind]) || x.label.localeCompare(y.label);
  });
  return items.slice(0, 200);
}

function render() {
  const { items, index, ctx, ed } = state;
  if (!items.length) { popup.hidden = true; return; }
  popup.innerHTML = items.map((it, i) => {
    const [badge, title] = KIND[it.kind];
    return `<div class="ac-row${i === index ? ' on' : ''}" data-i="${i}" title="${title}"><span class="ac-k k-${it.kind}">${badge}</span><span class="ac-l">${esc(it.label)}</span>${it.detail ? `<span class="ac-d">${esc(it.detail)}</span>` : ''}</div>`;
  }).join('');
  popup.hidden = false;
  const pt = ed.caretPoint(ctx.from);
  const r = popup.getBoundingClientRect();
  const below = pt.y + r.height < innerHeight - 8;
  popup.style.left = Math.max(4, Math.min(pt.x - 26, innerWidth - r.width - 8)) + 'px';
  popup.style.top = (below ? pt.y + 2 : pt.y - 19 - r.height - 2) + 'px';
  const on = popup.children[index];
  if (on) on.scrollIntoView({ block: 'nearest' });
}

function refresh() {
  if (!state) return;
  const ctx = context(state.ed);
  if (!ctx) return close();
  state.ctx = ctx;
  state.items = buildItems(ctx, state.provider, state.ed);
  state.index = 0;
  render();
}

function open(ed, provider) {
  state = { ed, provider, ctx: null, items: [], index: 0 };
  refresh();
}

export function closeIntellisense() { close(); }

function close() {
  state = null;
  popup.hidden = true;
}

function accept(i) {
  if (!state || !state.items[i]) return;
  const { ed, ctx } = state;
  const it = state.items[i];
  const text = ctx.partial.startsWith('[') && it.kind !== 'kw' && it.kind !== 'fn' && it.kind !== 'type'
    ? '[' + it.label.replace(/]/g, ']]') + ']'
    : it.insert;
  close();
  suppress = true;
  try { ed.replaceRange(ctx.from, ctx.caret, text); } finally { suppress = false; }
}

export function attachIntellisense(ed, provider) {
  ed.keyHooks.push(e => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && (e.code === 'Space' || e.code === 'KeyJ')) {
      e.preventDefault();
      if (!provider.enabled || provider.enabled()) open(ed, provider);
      return true;
    }
    if (!state || state.ed !== ed || popup.hidden) return false;
    const n = state.items.length;
    const move = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 }[e.key];
    if (move) {
      e.preventDefault();
      state.index = Math.max(0, Math.min(n - 1, state.index + move));
      render();
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      accept(state.index);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
      return true;
    }
    return false;
  });

  ed.ta.addEventListener('input', e => {
    if (suppress) return;
    const ctx = context(ed);
    if (!ctx) { close(); return; }
    if (state && state.ed === ed) {
      if (/[\w@#$.\]\[]/.test(ctx.lastChar) || e.inputType.startsWith('delete')) refresh();
      else close();
      return;
    }
    if (e.inputType !== 'insertText' || (provider.autoOpen && !provider.autoOpen())) return;
    const word = unbracket(ctx.partial);
    if (ctx.lastChar === '.' || (/[\w@#$]/.test(ctx.lastChar) && word.length >= 2 && !/^\d/.test(word))) open(ed, provider);
  });
  ed.addEventListener('blur', () => setTimeout(() => { if (state && state.ed === ed && document.activeElement !== ed.ta) close(); }, 120));
  ed.addEventListener('scroll', () => { if (state && state.ed === ed) close(); });
  ed.ta.addEventListener('mousedown', () => { if (state) close(); });
}
