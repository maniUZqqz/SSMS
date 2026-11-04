// Shared helpers: DOM, formatting, API calls, toasts, menus and dialogs.

import { ICONS } from './icons.js';

export const $ = (sel, el = document) => el.querySelector(sel);

export function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const qn = s => '[' + String(s).replace(/]/g, ']]') + ']';
export const sqlStr = s => "N'" + String(s).replace(/'/g, "''") + "'";
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const fmtInt = n => Number(n).toLocaleString('en-US');
export const fmtMs = ms => (ms < 1000 ? `${ms} ms` : ms < 60000 ? `${(ms / 1000).toFixed(2)} s`
  : `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')} min`);

export function countNl(s, end) {
  let n = 0;
  for (let i = s.indexOf('\n'); i !== -1 && i < end; i = s.indexOf('\n', i + 1)) n++;
  return n;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

// SQL type display, e.g. nvarchar(50), decimal(18,2), varchar(max).
export function fmtType(c) {
  const t = String(c.type).toLowerCase();
  const max = c.max_length === -1 ? 'max' : null;
  if (['varchar', 'char', 'varbinary', 'binary'].includes(t)) return `${t}(${max || c.max_length})`;
  if (['nvarchar', 'nchar'].includes(t)) return `${t}(${max || c.max_length / 2})`;
  if (['decimal', 'numeric'].includes(t)) return `${t}(${c.precision},${c.scale})`;
  if (['datetime2', 'time', 'datetimeoffset'].includes(t)) return `${t}(${c.scale})`;
  return t;
}

export async function api(name, body) {
  let res;
  try {
    res = await fetch('/api/' + name, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
  } catch {
    throw new Error('Cannot reach the local server. Is start.bat still running?');
  }
  const data = await res.json().catch(() => ({ error: `Unexpected response (${res.status})` }));
  if (!res.ok || data.error) {
    const e = new Error(data.error || res.statusText);
    Object.assign(e, { busy: !!data.busy, notConnected: !!data.notConnected, needPassword: !!data.needPassword });
    throw e;
  }
  return data;
}

// ---------------------------------------------------------------- toast

let toastTimer;
export function toast(msg, bad) {
  const el = $('#toast');
  el.textContent = msg;
  el.className = 'toast' + (bad ? ' bad' : '');
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, bad ? 7000 : 2200);
}

export async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); toast(msg || 'Copied'); } catch (e) { toast('Copy failed: ' + e.message, true); }
}

export function download(text, name, type) {
  const a = h('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------------------------------------------------------------- full-value viewer

export function showText(title, text) {
  const modal = $('#modal');
  $('#mTitle').textContent = title;
  const ta = $('#mText');
  ta.value = text;
  modal.hidden = false;
  ta.focus();
  ta.setSelectionRange(0, 0);
  ta.scrollTop = 0;
}
$('#mClose').onclick = () => { $('#modal').hidden = true; };
$('#mCopy').onclick = () => copyText($('#mText').value);
$('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') e.target.hidden = true; });

// ---------------------------------------------------------------- context menus
// items: [label, action | subItems[], { disabled, hint, checked, icon }] or null for a separator.

const menus = [];
let onMenusClosed = null;
export function setMenuCloseHook(fn) { onMenusClosed = fn; }

export function hideMenu(level = 0) {
  while (menus.length > level) menus.pop().remove();
  if (!menus.length && onMenusClosed) onMenusClosed();
}

export const menuOpen = () => menus.length > 0;

export function showMenu(x, y, items, level = 0) {
  while (menus.length > level) menus.pop().remove();
  const m = h('div', 'menu');
  menus.push(m);
  for (const it of items) {
    if (!it) { m.append(h('div', 'msep')); continue; }
    const [label, action, opt = {}] = it;
    const b = h('button', Array.isArray(action) ? 'sub' : null);
    const mc = h('span', 'mc' + (opt.checked ? ' on' : ''));
    if (opt.icon) mc.innerHTML = ICONS[opt.icon] || '';
    else if (opt.checked) mc.textContent = '✓';
    b.append(mc, h('span', 'ml', label));
    if (opt.hint) b.append(h('span', 'mh', opt.hint));
    if (Array.isArray(action)) b.append(h('span', 'mh', '›'));
    b.disabled = !!opt.disabled;
    b.onmouseenter = () => {
      if (Array.isArray(action)) {
        const r = b.getBoundingClientRect();
        showMenu(r.right - 2, r.top - 4, action, level + 1);
      } else hideMenu(level + 1);
    };
    b.onclick = async () => {
      if (Array.isArray(action)) return;
      hideMenu();
      try { await action(); } catch (e) { toast(e.message, true); }
    };
    m.append(b);
  }
  document.body.append(m);
  const r = m.getBoundingClientRect();
  m.style.left = Math.max(4, Math.min(x, innerWidth - r.width - 4)) + 'px';
  m.style.top = Math.max(4, Math.min(y, innerHeight - r.height - 4)) + 'px';
  return m;
}

document.addEventListener('mousedown', e => {
  if (!menus.some(m => m.contains(e.target)) && !e.target.closest('.mb-item')) hideMenu();
});
// Escape closes an open menu first, otherwise the topmost dialog (wherever the focus is).
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (menus.length) { e.stopImmediatePropagation(); e.preventDefault(); hideMenu(); return; }
  const top = [...document.querySelectorAll('.dlg-wrap')].pop();
  if (top && top._cancel) { e.stopImmediatePropagation(); e.preventDefault(); top._cancel(); }
}, true);
addEventListener('blur', () => hideMenu());

// ---------------------------------------------------------------- dialogs
// fields: { name, label, type: text|password|number|select|checkbox|date|textarea, value, options, placeholder, hint }

export function formDialog({ title, fields = [], ok = 'OK', cancel = 'Cancel', intro, width, onSubmit, build }) {
  return new Promise(resolve => {
    const wrap = h('div', 'dlg-wrap');
    const form = h('form', 'dlg');
    if (width) form.style.width = width;
    form.append(h('div', 'dlg-head', title));
    const body = h('div', 'dlg-body');
    if (intro) body.append(h('div', 'dlg-intro', intro));
    const inputs = {};
    const rows = {};
    for (const f of fields) {
      const row = h('label', 'dlg-row' + (f.type === 'checkbox' ? ' check' : ''));
      let input;
      if (f.type === 'select') {
        input = h('select');
        for (const o of f.options) {
          const [value, label] = Array.isArray(o) ? o : [o, o];
          input.append(new Option(label, value));
        }
        input.value = f.value ?? '';
      } else if (f.type === 'textarea') {
        input = h('textarea');
        input.value = f.value ?? '';
        input.rows = f.rows || 4;
      } else {
        input = h('input');
        input.type = f.type || 'text';
        if (f.type === 'checkbox') input.checked = !!f.value;
        else input.value = f.value ?? '';
      }
      if (f.placeholder) input.placeholder = f.placeholder;
      input.name = f.name;
      input.spellcheck = false;
      input.autocomplete = 'off';
      if (f.type === 'checkbox') row.append(input, h('span', null, f.label));
      else row.append(h('span', 'dlg-label', f.label), input);
      if (f.hint) row.append(h('span', 'dlg-hint', f.hint));
      inputs[f.name] = input;
      rows[f.name] = row;
      body.append(row);
    }
    const error = h('div', 'dlg-error');
    error.hidden = true;
    body.append(error);
    form.append(body);
    const foot = h('div', 'dlg-foot');
    const okBtn = h('button', 'primary', ok);
    okBtn.type = 'submit';
    const cancelBtn = h('button', null, cancel);
    cancelBtn.type = 'button';
    foot.append(h('span', 'spacer'), okBtn, cancelBtn);
    form.append(foot);
    wrap.append(form);
    document.body.append(wrap);

    const values = () => {
      const v = {};
      for (const [k, el] of Object.entries(inputs)) v[k] = el.type === 'checkbox' ? el.checked : el.value;
      return v;
    };
    const close = result => { wrap.remove(); resolve(result); };
    const api = {
      inputs, rows, values, close, form, foot, body,
      setError(msg) { error.textContent = msg || ''; error.hidden = !msg; },
      setBusy(busy) { okBtn.disabled = busy; form.classList.toggle('busy', busy); },
    };
    if (build) build(api);
    cancelBtn.onclick = () => close(null);
    wrap._cancel = () => close(null);
    form.onsubmit = async e => {
      e.preventDefault();
      if (!onSubmit) return close(values());
      api.setError('');
      api.setBusy(true);
      try {
        const r = await onSubmit(values(), api);
        if (r !== undefined) close(r);
      } catch (err) {
        api.setError(err.message);
      } finally {
        api.setBusy(false);
      }
    };
    const first = fields.find(f => f.type !== 'checkbox' && !f.noFocus);
    setTimeout(() => {
      const el = first ? inputs[first.name] : okBtn;
      el.focus();
      if (el.select && first && first.type !== 'select') el.select();
    }, 0);
  });
}

export async function askText(title, label, value = '', opts = {}) {
  const r = await formDialog({ title, fields: [{ name: 'v', label, value, ...opts }] });
  return r ? r.v : null;
}

export async function confirmBox(title, message, ok = 'OK') {
  const r = await formDialog({ title, intro: message, ok });
  return !!r;
}
