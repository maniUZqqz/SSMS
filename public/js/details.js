// Object Explorer Details (F7): the children of the selected Object Explorer
// node as a sortable table with selectable columns, like SSMS.

import { h, esc, fmtInt, showMenu, toast } from './util.js';
import { ICONS } from './icons.js';
import { detailsRows, nodePath, editFolderFilter } from './explorer.js';

const C = (key, label, opt = {}) => ({ key, label, ...opt });
const NAME = C('name', 'Name');
const COLUMNS = {
  generic: [NAME],
  databases: [NAME, C('recovery_model', 'Recovery Model'), C('compatibility_level', 'Compatibility Level', { num: true }),
    C('collation', 'Collation'), C('size_mb', 'Size (MB)', { num: true }), C('owner', 'Owner'), C('created', 'Create Date', { date: true }),
    C('state', 'State', { hidden: true }), C('user_access', 'User Access', { hidden: true }), C('is_read_only', 'Read-Only', { bool: true, hidden: true })],
  tables: [NAME, C('sch', 'Schema'), C('created', 'Create Date', { date: true }), C('row_count', 'Row Count', { num: true }),
    C('data_kb', 'Data Space Used (KB)', { num: true }), C('index_kb', 'Index Space Used (KB)', { num: true }),
    C('modified', 'Modify Date', { date: true, hidden: true }), C('reserved_kb', 'Reserved Space (KB)', { num: true, hidden: true }),
    C('file_group', 'File Group', { hidden: true }), C('owner', 'Owner', { hidden: true }),
    C('is_partitioned', 'Is Partitioned', { bool: true, hidden: true }), C('is_replicated', 'Replicated', { bool: true, hidden: true }),
    C('lock_escalation', 'Lock Escalation', { hidden: true })],
  objects: [NAME, C('sch', 'Schema'), C('created', 'Create Date', { date: true }), C('modified', 'Modify Date', { date: true }),
    C('type_desc', 'Type', { hidden: true })],
  columns: [NAME, C('data_type', 'Data Type'), C('nullable', 'Allow Nulls', { bool: true }), C('pk', 'Primary Key', { bool: true }),
    C('fk', 'Foreign Key', { bool: true }), C('identity', 'Identity', { bool: true }), C('computed', 'Computed', { bool: true, hidden: true }),
    C('default', 'Default Value'), C('collation', 'Collation', { hidden: true })],
  keys: [NAME, C('kind', 'Type'), C('cols', 'Columns'), C('ref', 'References')],
  constraints: [NAME, C('kind', 'Type'), C('column', 'Column'), C('definition', 'Definition')],
  triggers: [NAME, C('instead_of', 'Instead Of', { bool: true }), C('disabled', 'Disabled', { bool: true })],
  indexes: [NAME, C('kind', 'Index Type'), C('unique', 'Unique', { bool: true }), C('keys', 'Key Columns'), C('include', 'Included Columns'),
    C('filter', 'Filter', { hidden: true }), C('disabled', 'Disabled', { bool: true, hidden: true })],
  params: [NAME, C('data_type', 'Data Type'), C('direction', 'Direction'), C('has_default', 'Has Default', { bool: true })],
  users: [NAME, C('kind', 'Type'), C('default_schema', 'Default Schema')],
  roles: [NAME, C('fixed', 'Fixed Role', { bool: true })],
  schemas: [NAME, C('owner', 'Owner')],
  types: [NAME, C('sch', 'Schema'), C('base', 'Base Type'), C('nullable', 'Allow Nulls', { bool: true })],
  dbtriggers: [NAME, C('disabled', 'Disabled', { bool: true })],
  logins: [NAME, C('kind', 'Type'), C('disabled', 'Disabled', { bool: true }), C('default_db', 'Default Database')],
  jobs: [NAME, C('enabled', 'Enabled', { bool: true }), C('description', 'Description')],
  // driver-based connections
  gdatabases: [NAME, C('size_mb', 'Size (MB)', { num: true }), C('owner', 'Owner'), C('encoding', 'Encoding / Collation')],
  collections: [NAME, C('documents', 'Documents', { num: true }), C('size_kb', 'Size (KB)', { num: true }), C('indexes', 'Indexes', { num: true })],
  rediskeys: [NAME, C('type', 'Type'), C('ttl', 'TTL (s)', { num: true })],
};

// Row icons as CSS backgrounds (cheap even for thousands of rows).
const style = h('style');
style.textContent = Object.entries(ICONS)
  .map(([k, v]) => `.dico.ico-${k}{background-image:url("data:image/svg+xml,${encodeURIComponent(v)}")}`).join('\n');
document.head.append(style);

function fmtDate(s) {
  const m = /^(\d{4})-(\d\d)-(\d\d)(?:[ T](\d\d):(\d\d))?/.exec(s || '');
  if (!m) return s || '';
  let hh = +(m[4] || 0);
  const ap = hh >= 12 ? 'PM' : 'AM';
  hh = hh % 12 || 12;
  return `${+m[2]}/${+m[3]}/${m[1]} ${hh}:${m[5] || '00'} ${ap}`;
}

function show(col, v) {
  if (v === null || v === undefined || v === '') return '';
  if (col.date) return fmtDate(String(v));
  if (col.bool) return v === true || v === 1 || v === '1' ? 'True' : 'False';
  if (col.num) return Number.isFinite(Number(v)) ? Number(v).toLocaleString('en-US') : String(v);
  return String(v);
}

function compare(a, b, col) {
  if (a == null || a === '') return b == null || b === '' ? 0 : -1;
  if (b == null || b === '') return 1;
  if (col.num) return Number(a) - Number(b);
  if (col.bool) return (a ? 1 : 0) - (b ? 1 : 0);
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

export class DetailsView {
  constructor(host, prefs, savePrefs) {
    this.prefs = prefs;
    this.savePrefs = savePrefs;
    this.history = [];
    this.pos = -1;
    this.node = null;
    this.rows = [];
    this.sort = null;
    this.selIndex = -1;
    this.el = h('div', 'details');
    this.el.innerHTML = `
      <div class="dt-toolbar">
        <button class="tb" data-a="back" title="Back (Backspace)"><i class="ico">${ICONS.back}</i></button>
        <button class="tb" data-a="forward" title="Forward"><i class="ico">${ICONS.forward}</i></button>
        <span class="tsep"></span>
        <button class="tb" data-a="refresh" title="Refresh (F5)"><i class="ico">${ICONS.refresh}</i></button>
        <button class="tb" data-a="filter" title="Filter Settings (for Tables, Views, Stored Procedures…)"><i class="ico">${ICONS.filter}</i></button>
        <span class="spacer"></span>
        <input class="dt-search" type="search" placeholder="Search" spellcheck="false">
      </div>
      <div class="dt-path"></div>
      <div class="dt-scroll" tabindex="0"><table class="dt"><thead></thead><tbody></tbody></table><div class="dt-empty"></div></div>
      <div class="dt-foot"><span class="dt-title"></span><span class="dt-count"></span></div>`;
    host.append(this.el);
    const q = s => this.el.querySelector(s);
    this.$ = { path: q('.dt-path'), scroll: q('.dt-scroll'), thead: q('thead'), tbody: q('tbody'), empty: q('.dt-empty'), title: q('.dt-title'), count: q('.dt-count'), search: q('.dt-search'), back: q('[data-a=back]'), forward: q('[data-a=forward]') };
    this.el.querySelector('.dt-toolbar').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'back') this.go(-1);
      else if (a === 'forward') this.go(1);
      else if (a === 'refresh') this.refresh();
      else if (a === 'filter') this.filter();
    });
    this.$.search.addEventListener('input', () => this.render());
    this.$.thead.addEventListener('click', e => {
      const th = e.target.closest('th');
      if (!th) return;
      const key = th.dataset.k;
      this.sort = this.sort && this.sort.key === key ? { key, dir: -this.sort.dir } : { key, dir: 1 };
      this.render();
    });
    this.$.thead.addEventListener('contextmenu', e => { e.preventDefault(); this.columnMenu(e.clientX, e.clientY); });
    this.$.tbody.addEventListener('click', e => { const tr = e.target.closest('tr'); if (tr) this.select(+tr.dataset.i); });
    this.$.tbody.addEventListener('dblclick', e => { const tr = e.target.closest('tr'); if (tr) this.open(+tr.dataset.i); });
    this.$.tbody.addEventListener('contextmenu', e => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      e.preventDefault();
      this.select(+tr.dataset.i);
      const node = this.nodeOf(this.view[+tr.dataset.i]);
      const items = [];
      if (node && node.expandable) items.push(['Open', () => this.open(+tr.dataset.i)], null);
      if (node && node.menuFn) items.push(...node.menuFn());
      if (items.length) showMenu(e.clientX, e.clientY, items);
    });
    this.$.scroll.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.select(Math.max(0, Math.min(this.view.length - 1, this.selIndex + (e.key === 'ArrowDown' ? 1 : -1))));
      } else if (e.key === 'Enter') { e.preventDefault(); this.open(this.selIndex); }
      else if (e.key === 'Backspace') { e.preventDefault(); this.go(-1); }
      else if (e.key === 'F5') { e.preventDefault(); e.stopPropagation(); this.refresh(); }
    });
  }

  show(node, push = true) {
    if (!node) return;
    if (push && this.node !== node) {
      this.history = this.history.slice(0, this.pos + 1);
      this.history.push(node);
      if (this.history.length > 50) this.history.shift();
      this.pos = this.history.length - 1;
    }
    this.node = node;
    this.sort = null;
    this.$.search.value = '';
    this.load();
  }

  go(step) {
    const p = this.pos + step;
    if (p < 0 || p >= this.history.length) return;
    this.pos = p;
    this.show(this.history[p], false);
  }

  async refresh() {
    if (!this.node) return;
    try { if (this.node.refresh) await this.node.refresh(); } catch (e) { toast(e.message, true); }
    this.load();
  }

  async filter() {
    if (!this.node || !this.node.isCategory) { toast('Filtering is available for folders such as Tables, Views and Stored Procedures.', true); return; }
    await editFolderFilter(this.node);
    this.load();
  }

  async load() {
    const node = this.node;
    this.$.back.disabled = this.pos <= 0;
    this.$.forward.disabled = this.pos >= this.history.length - 1;
    this.$.path.textContent = nodePath(node).join('\\');
    this.$.title.textContent = node.baseLabel;
    this.$.tbody.innerHTML = '';
    this.$.empty.textContent = 'Loading…';
    this.$.empty.hidden = false;
    this.$.count.textContent = '';
    try {
      const rows = await detailsRows(node);
      if (this.node !== node) return;
      this.rows = rows;
      this.selIndex = -1;
      this.render();
    } catch (e) {
      if (this.node === node) this.$.empty.textContent = e.message;
    }
  }

  defs() { return COLUMNS[this.node.detailsKind] || COLUMNS.generic; }

  visibleCols() {
    const kind = this.node.detailsKind, chosen = this.prefs[kind];
    return this.defs().filter(c => c.key === 'name' || (chosen ? chosen.includes(c.key) : !c.hidden));
  }

  columnMenu(x, y) {
    if (!this.node) return;
    const kind = this.node.detailsKind;
    const visible = new Set(this.visibleCols().map(c => c.key));
    const toggle = key => {
      if (visible.has(key)) visible.delete(key); else visible.add(key);
      this.prefs[kind] = this.defs().map(c => c.key).filter(k => visible.has(k) && k !== 'name');
      this.savePrefs();
      this.render();
    };
    const sortBy = dir => { const k = this.sort ? this.sort.key : 'name'; this.sort = { key: k, dir }; this.render(); };
    showMenu(x, y, [
      ['Sort Ascending', () => sortBy(1)],
      ['Sort Descending', () => sortBy(-1)],
      null,
      ...this.defs().map(c => [c.label, () => toggle(c.key), { checked: visible.has(c.key), disabled: c.key === 'name' }]),
      null,
      ['Reset View', () => { delete this.prefs[kind]; this.savePrefs(); this.sort = null; this.render(); }],
    ]);
  }

  render() {
    if (!this.node) return;
    const cols = this.visibleCols();
    const term = this.$.search.value.trim().toLowerCase();
    let view = this.rows.map((r, i) => ({ r, i }));
    if (term) view = view.filter(x => String(x.r.values.name || '').toLowerCase().includes(term));
    if (this.sort) {
      const col = this.defs().find(c => c.key === this.sort.key) || NAME;
      view.sort((a, b) => compare(a.r.values[col.key], b.r.values[col.key], col) * this.sort.dir || a.i - b.i);
    }
    this.view = view.map(x => x.r);
    this.$.thead.innerHTML = '<tr>' + cols.map(c => {
      const arrow = this.sort && this.sort.key === c.key ? (this.sort.dir > 0 ? ' ▲' : ' ▼') : '';
      return `<th data-k="${c.key}" class="${c.num ? 'num' : ''}">${esc(c.label)}<span class="dt-sort">${arrow}</span></th>`;
    }).join('') + '</tr>';
    let html = '';
    this.view.forEach((r, i) => {
      html += `<tr data-i="${i}" class="${r.dim ? 'dim' : ''}${i === this.selIndex ? ' sel' : ''}">`;
      cols.forEach((c, ci) => {
        const text = esc(show(c, r.values[c.key]));
        html += ci === 0 ? `<td><span class="dico ico-${r.icon}"></span>${text}</td>` : `<td class="${c.num ? 'num' : ''}">${text}</td>`;
      });
      html += '</tr>';
    });
    this.$.tbody.innerHTML = html;
    this.$.empty.hidden = this.view.length > 0;
    this.$.empty.textContent = this.rows.length ? 'No items match the search.' : 'This folder is empty.';
    this.$.count.textContent = `${fmtInt(this.view.length)} Item${this.view.length === 1 ? '' : 's'}`;
  }

  select(i) {
    this.selIndex = i;
    for (const tr of this.$.tbody.rows) tr.classList.toggle('sel', +tr.dataset.i === i);
    const tr = this.$.tbody.rows[i];
    if (tr) tr.scrollIntoView({ block: 'nearest' });
    this.$.scroll.focus({ preventScroll: true });
  }

  nodeOf(row) {
    if (!row) return null;
    if (typeof row.node === 'function') row.node = row.node();
    return row.node;
  }

  open(i) {
    const node = this.nodeOf(this.view[i]);
    if (node && node.expandable) this.show(node);
  }
}
