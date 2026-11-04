// Virtualized results grid: selection, copy, CSV, filter, sort and in-place editing.

import { h, esc, fmtInt, clamp, copyText, download, showText, showMenu, toast, debounce } from './util.js';

export const ROW_H = 22, HEAD_H = 24, CAP_H = 28;
const NUMERIC = /int|decimal|numeric|float|real|money/i;
const measureCtx = document.createElement('canvas').getContext('2d');
const cellText = v => { const s = String(v); return s.length > 250 ? s.slice(0, 250) + '…' : s; };

function compare(a, b, numeric) {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  if (numeric) return Number(a) - Number(b);
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export class Grid {
  // d: { columns: [{ name, type }], rows: [[...]], total }
  // opt: { index, count, edit: { canEdit(row, col), commit(row, col, value), remove(rows) } }
  constructor(d, opt = {}) {
    this.d = d;
    this.opt = opt;
    this.view = null;
    this.sortState = null;
    this.filterText = '';
    this.sel = null;
    this.first = this.last = -1;
    this.num = d.columns.map(c => NUMERIC.test(c.type));
    this.widths = this.measure();
    this.rnW = Math.max(38, String(d.rows.length).length * 8 + 18);

    this.el = h('div', 'grid');
    // Bar above the grid: shown only for a truncation notice or while filtering rows.
    const cap = this.cap = h('div', 'gcap');
    this.label = h('span', 'gtitle');
    this.filterInput = h('input', 'gfilter');
    this.filterInput.type = 'search';
    this.filterInput.placeholder = 'Filter rows (any column)…';
    this.filterInput.spellcheck = false;
    this.filterInput.addEventListener('input', debounce(() => { this.filterText = this.filterInput.value; this.applyView(); }, 200));
    this.filterInput.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); this.closeFilter(); } });
    const closeBtn = h('button', 'gclose', '×');
    closeBtn.title = 'Close filter';
    closeBtn.onclick = () => this.closeFilter();
    this.filterBox = h('span', 'gfbox');
    this.filterBox.append(this.filterInput, closeBtn);
    this.filterBox.hidden = true;
    cap.append(this.label, this.filterBox);
    cap.hidden = !(d.total > d.rows.length);

    this.scroller = h('div', 'gscroll');
    this.scroller.tabIndex = 0;
    this.table = h('table', 'gt');
    const cg = h('colgroup');
    const c0 = h('col');
    c0.style.width = this.rnW + 'px';
    cg.append(c0);
    this.cols = this.widths.map(w => { const c = h('col'); c.style.width = w + 'px'; cg.append(c); return c; });
    const tr = h('tr');
    const corner = h('th', 'corner');
    corner.title = 'Select all';
    tr.append(corner);
    this.ths = d.columns.map((c, i) => {
      const name = c.name || '(No column name)';
      const th = h('th');
      th.dataset.c = i;
      th.title = `${name}  ·  ${c.sqlType || c.type}${c.pk ? '  ·  primary key' : ''}${opt.edit && c.editable === false ? '  ·  read-only' : ''}\nRight-click to sort`;
      th.append(h('span', 'thn', name), h('span', 'sort'), h('span', 'rz'));
      if (c.pk) th.classList.add('pk');
      if (opt.edit && c.editable === false) th.classList.add('ro');
      tr.append(th);
      return th;
    });
    const thead = h('thead');
    thead.append(tr);
    this.tbody = h('tbody');
    this.table.append(cg, thead, this.tbody);
    this.scroller.append(this.table);
    this.emptyNote = h('div', 'gempty', 'The query ran successfully but returned no rows.');
    this.scroller.append(this.emptyNote);
    this.el.append(cap, this.scroller);
    this.setTableWidth();
    this.updateLabel();
    this.bind();
  }

  get n() { return this.view ? this.view.length : this.d.rows.length; }
  dataIndex(i) { return this.view ? this.view[i] : i; }
  rowAt(i) { return this.d.rows[this.dataIndex(i)]; }

  openFilter() {
    this.cap.hidden = false;
    this.filterBox.hidden = false;
    this.filterInput.focus();
    this.filterInput.select();
  }

  closeFilter() {
    this.filterBox.hidden = true;
    this.cap.hidden = !(this.d.total > this.d.rows.length);
    if (this.filterInput.value) { this.filterInput.value = ''; this.filterText = ''; this.applyView(); }
    this.scroller.focus();
  }

  updateLabel() {
    const d = this.d, n = d.rows.length;
    let text = d.total > n
      ? `${fmtInt(d.total)} rows — showing the first ${fmtInt(n)} (raise "Maximum rows" in Tools → Options)`
      : `${fmtInt(n)} row${n === 1 ? '' : 's'}`;
    if (this.view && this.filterText.trim()) text += ` · ${fmtInt(this.view.length)} match the filter`;
    this.label.textContent = text;
    this.emptyNote.hidden = this.n > 0;
    this.emptyNote.textContent = n ? 'No rows match the filter.' : this.opt.emptyText || 'The query ran successfully but returned no rows.';
  }

  measure() {
    const { columns, rows } = this.d;
    const sample = rows.length > 200 ? rows.slice(0, 200) : rows;
    measureCtx.font = '600 12px "Segoe UI", Tahoma, sans-serif';
    const w = columns.map(c => measureCtx.measureText(c.name || '(No column name)').width + 34);
    measureCtx.font = '12px "Segoe UI", Tahoma, sans-serif';
    for (const r of sample) {
      for (let i = 0; i < r.length; i++) {
        const s = r[i] === null ? 'NULL' : String(r[i]).slice(0, 70);
        if (s.length * 9 + 14 <= w[i]) continue;
        const x = measureCtx.measureText(s).width + 14;
        if (x > w[i]) w[i] = x;
      }
    }
    return w.map(x => Math.ceil(clamp(x, 48, 420)));
  }

  setTableWidth() {
    this.table.style.width = this.rnW + this.widths.reduce((a, b) => a + b, 0) + 'px';
  }

  applyView() {
    const rows = this.d.rows;
    const terms = this.filterText.toLowerCase().split(/\s+/).filter(Boolean);
    let idx = null;
    if (terms.length) {
      idx = [];
      for (let i = 0; i < rows.length; i++) {
        const s = rows[i].map(v => (v === null ? 'null' : String(v))).join('\u0001').toLowerCase();
        if (terms.every(t => s.includes(t))) idx.push(i);
      }
    }
    if (this.sortState) {
      const { c, dir } = this.sortState, num = this.num[c];
      idx = idx || rows.map((_, i) => i);
      idx.sort((a, b) => compare(rows[a][c], rows[b][c], num) * dir || a - b);
    }
    this.view = idx;
    this.sel = null;
    this.ths.forEach((th, i) => {
      th.querySelector('.sort').textContent = this.sortState && this.sortState.c === i ? (this.sortState.dir > 0 ? ' ▲' : ' ▼') : '';
    });
    this.updateLabel();
    this.scroller.scrollTop = 0;
    this.render(true);
  }

  sortBy(c, dir) {
    this.sortState = dir ? { c, dir } : null;
    this.applyView();
  }

  rect() {
    if (!this.sel) return null;
    const { a, b } = this.sel;
    return { r1: Math.min(a.r, b.r), r2: Math.max(a.r, b.r), c1: Math.min(a.c, b.c), c2: Math.max(a.c, b.c) };
  }

  render(force) {
    const n = this.n, sc = this.scroller;
    const top = Math.max(0, sc.scrollTop - HEAD_H);
    const first = Math.max(0, Math.floor(top / ROW_H) - 10);
    const last = Math.min(n, Math.ceil((top + sc.clientHeight) / ROW_H) + 10);
    if (!force && first === this.first && last === this.last) return;
    this.first = first;
    this.last = last;
    const R = this.rect(), cur = this.sel && this.sel.b, span = this.d.columns.length + 1;
    const edit = this.opt.edit;
    let html = first ? `<tr class="pad" style="height:${first * ROW_H}px"><td colspan="${span}"></td></tr>` : '';
    for (let r = first; r < last; r++) {
      const di = this.dataIndex(r);
      const row = this.d.rows[di];
      const inRow = R && r >= R.r1 && r <= R.r2;
      html += `<tr data-r="${r}"><td class="rn${inRow ? ' rsel' : ''}">${di + 1}</td>`;
      for (let c = 0; c < row.length; c++) {
        const v = row[c];
        let cls = v === null ? 'null' : this.num[c] ? 'num' : '';
        if (inRow && c >= R.c1 && c <= R.c2) cls += ' sel';
        if (cur && cur.r === r && cur.c === c) cls += ' cur';
        if (edit && !edit.canEdit(di, c)) cls += ' ro';
        html += `<td${cls ? ` class="${cls.trim()}"` : ''}>${v === null ? 'NULL' : esc(cellText(v))}</td>`;
      }
      html += '</tr>';
    }
    if (last < n) html += `<tr class="pad" style="height:${(n - last) * ROW_H}px"><td colspan="${span}"></td></tr>`;
    this.tbody.innerHTML = html;
  }

  // Updates selection classes in place (re-rendering would break double-click detection).
  paint() {
    const R = this.rect(), cur = this.sel && this.sel.b;
    for (const tr of this.tbody.rows) {
      if (tr.dataset.r === undefined) continue;
      const r = +tr.dataset.r;
      const inRow = !!R && r >= R.r1 && r <= R.r2;
      const cells = tr.cells;
      cells[0].classList.toggle('rsel', inRow);
      for (let i = 1; i < cells.length; i++) {
        const c = i - 1;
        cells[i].classList.toggle('sel', inRow && c >= R.c1 && c <= R.c2);
        cells[i].classList.toggle('cur', !!cur && cur.r === r && cur.c === c);
      }
    }
  }

  select(a, b) {
    this.sel = { a, b };
    this.paint();
  }

  cellPos(r, c) {
    let x = this.rnW;
    for (let i = 0; i < c; i++) x += this.widths[i];
    return { x, y: HEAD_H + r * ROW_H, w: this.widths[c] };
  }

  reveal(p) {
    const sc = this.scroller, { x, y, w } = this.cellPos(p.r, p.c);
    if (y < sc.scrollTop + HEAD_H) sc.scrollTop = y - HEAD_H;
    else if (y + ROW_H > sc.scrollTop + sc.clientHeight) sc.scrollTop = y + ROW_H - sc.clientHeight;
    if (x < sc.scrollLeft + this.rnW) sc.scrollLeft = x - this.rnW;
    else if (x + w > sc.scrollLeft + sc.clientWidth) sc.scrollLeft = x + w - sc.clientWidth;
  }

  cellAt(target) {
    const td = target.closest && target.closest('td');
    if (!td || !this.tbody.contains(td) || td.parentElement.dataset.r === undefined) return null;
    return { r: +td.parentElement.dataset.r, c: td.cellIndex - 1 };
  }

  bind() {
    const sc = this.scroller;
    const lastCol = () => this.d.columns.length - 1;
    sc.addEventListener('scroll', () => {
      if (this.raf) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); });
    });

    sc.addEventListener('mousedown', e => {
      if (e.button !== 0 || e.target.classList.contains('gedit')) return;
      const n = this.n;
      const rz = e.target.closest('.rz');
      if (rz) { this.startResize(e, +rz.parentElement.dataset.c); return; }
      const th = e.target.closest('th');
      if (th) {
        e.preventDefault();
        sc.focus();
        if (!n) return;
        if (th.classList.contains('corner')) this.select({ r: 0, c: 0 }, { r: n - 1, c: lastCol() });
        else {
          const c = +th.dataset.c;
          this.select({ r: 0, c: e.shiftKey && this.sel ? this.sel.a.c : c }, { r: n - 1, c });
        }
        return;
      }
      const p = this.cellAt(e.target);
      if (!p) return;
      e.preventDefault();
      sc.focus();
      if (p.c < 0) {
        this.select({ r: e.shiftKey && this.sel ? this.sel.a.r : p.r, c: 0 }, { r: p.r, c: lastCol() });
        this.drag = 'row';
      } else {
        this.select(e.shiftKey && this.sel ? this.sel.a : p, p);
        this.drag = 'cell';
      }
    });

    sc.addEventListener('mousemove', e => {
      if (!this.drag) return;
      if (!(e.buttons & 1)) { this.drag = null; return; }
      const p = this.cellAt(e.target);
      if (!p) return;
      const b = this.drag === 'row' ? { r: p.r, c: lastCol() } : { r: p.r, c: Math.max(0, p.c) };
      if (b.r !== this.sel.b.r || b.c !== this.sel.b.c) this.select(this.sel.a, b);
    });

    sc.addEventListener('dblclick', e => {
      const p = this.cellAt(e.target);
      if (!p || p.c < 0) return;
      if (this.opt.edit) { this.beginEdit(p.r, p.c); return; }
      const v = this.rowAt(p.r)[p.c];
      const col = this.d.columns[p.c];
      showText(`${col.name || '(No column name)'} — row ${this.dataIndex(p.r) + 1}`, v === null ? 'NULL' : String(v));
    });

    sc.addEventListener('contextmenu', e => {
      const th = e.target.closest('th');
      if (th && th.dataset.c !== undefined) {
        e.preventDefault();
        const c = +th.dataset.c, name = this.d.columns[c].name;
        showMenu(e.clientX, e.clientY, [
          ['Sort Ascending', () => this.sortBy(c, 1)],
          ['Sort Descending', () => this.sortBy(c, -1)],
          ['Clear Sort', () => this.sortBy(c, 0), { disabled: !this.sortState }],
          null,
          ['Filter Rows…', () => this.openFilter(), { icon: 'filter', hint: 'Ctrl+F' }],
          ['Copy Column Name', () => copyText(name), { icon: 'copy' }],
        ]);
        return;
      }
      const p = this.cellAt(e.target);
      if (!p || p.c < 0) return;
      e.preventDefault();
      const R = this.rect();
      if (!R || p.r < R.r1 || p.r > R.r2 || p.c < R.c1 || p.c > R.c2) this.select(p, p);
      const v = this.rowAt(p.r)[p.c];
      const n = this.n;
      const items = [
        ['Copy', () => this.copy(false), { hint: 'Ctrl+C', icon: 'copy' }],
        ['Copy with Headers', () => this.copy(true), { hint: 'Ctrl+Shift+C' }],
        ['Select All', () => this.select({ r: 0, c: 0 }, { r: n - 1, c: this.d.columns.length - 1 }), { hint: 'Ctrl+A' }],
        null,
        ['Save Results As…', () => this.csv(), { icon: 'save' }],
        null,
        ['Filter Rows…', () => this.openFilter(), { icon: 'filter', hint: 'Ctrl+F' }],
        ['Filter Rows by This Value', () => { this.openFilter(); this.filterInput.value = v === null ? 'null' : String(v); this.filterText = this.filterInput.value; this.applyView(); }],
        ['View Full Value', () => showText(this.d.columns[p.c].name, v === null ? 'NULL' : String(v))],
      ];
      if (this.opt.edit) {
        items.push(null,
          ['Edit cell', () => this.beginEdit(p.r, p.c), { hint: 'F2' }],
          ['Set to NULL', () => this.commitCell(p.r, p.c, null), { hint: 'Ctrl+0' }],
          ['Delete selected rows', () => this.deleteSelected(), { hint: 'Del' }]);
      }
      showMenu(e.clientX, e.clientY, items);
    });

    sc.addEventListener('keydown', e => {
      if (e.target !== sc) return;
      const ctrl = e.ctrlKey || e.metaKey, n = this.n;
      if (ctrl && e.code === 'KeyC') { e.preventDefault(); this.copy(e.shiftKey); return; }
      if (ctrl && e.code === 'KeyA') { e.preventDefault(); if (n) this.select({ r: 0, c: 0 }, { r: n - 1, c: lastCol() }); return; }
      if (ctrl && e.code === 'KeyF') { e.preventDefault(); e.stopPropagation(); this.openFilter(); return; }
      const cur = this.sel && this.sel.b;
      if (this.opt.edit && cur) {
        if (e.key === 'F2' || e.key === 'Enter') { e.preventDefault(); this.beginEdit(cur.r, cur.c); return; }
        if (ctrl && (e.key === '0' || e.code === 'Digit0')) { e.preventDefault(); this.commitCell(cur.r, cur.c, null); return; }
        if (e.key === 'Delete') { e.preventDefault(); this.deleteSelected(); return; }
        if (e.key.length === 1 && !ctrl && !e.altKey) { e.preventDefault(); this.beginEdit(cur.r, cur.c, e.key); return; }
      }
      const page = Math.max(1, Math.floor(sc.clientHeight / ROW_H) - 2);
      const mv = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], PageUp: [-page, 0], PageDown: [page, 0] }[e.key];
      if (!mv || !n) return;
      e.preventDefault();
      const from = cur || { r: 0, c: 0 };
      const b = { r: clamp(from.r + mv[0], 0, n - 1), c: clamp(from.c + mv[1], 0, lastCol()) };
      this.select(e.shiftKey && this.sel ? this.sel.a : b, b);
      this.reveal(b);
    });
  }

  startResize(e, c) {
    e.preventDefault();
    e.stopPropagation();
    const x0 = e.clientX, w0 = this.widths[c];
    const move = ev => {
      this.widths[c] = Math.max(30, w0 + ev.clientX - x0);
      this.cols[c].style.width = this.widths[c] + 'px';
      this.setTableWidth();
    };
    const up = () => {
      removeEventListener('mousemove', move);
      removeEventListener('mouseup', up);
      document.body.classList.remove('resizing');
    };
    document.body.classList.add('resizing');
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
  }

  // ---- editing

  beginEdit(r, c, initial) {
    const edit = this.opt.edit;
    if (!edit) return;
    const di = this.dataIndex(r);
    if (!edit.canEdit(di, c)) { toast('This cell is read-only (identity, computed, truncated or unsupported type).', true); return; }
    this.reveal({ r, c });
    const v = this.d.rows[di][c];
    const original = v === null ? '' : String(v);
    const { x, y, w } = this.cellPos(r, c);
    const inp = h('input', 'gedit');
    inp.value = initial != null ? initial : original;
    inp.placeholder = v === null ? 'NULL' : '';
    Object.assign(inp.style, { left: x + 'px', top: y + 'px', width: Math.max(w, 120) + 'px', height: ROW_H + 'px' });
    this.scroller.append(inp);
    inp.focus();
    if (initial == null) inp.select();
    let done = false;
    const finish = (commit, value, then) => {
      if (done) return;
      done = true;
      inp.remove();
      this.scroller.focus();
      if (commit && (value === null || value !== original || (v === null && value !== ''))) {
        this.commitCell(r, c, value === 'NULL' ? null : value).then(then);
      } else if (then) then();
    };
    inp.addEventListener('keydown', e => {
      e.stopPropagation();
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === 'Enter') { e.preventDefault(); finish(true, inp.value); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        finish(true, inp.value, () => {
          const nc = clamp(c + (e.shiftKey ? -1 : 1), 0, this.d.columns.length - 1);
          this.select({ r, c: nc }, { r, c: nc });
          this.reveal({ r, c: nc });
        });
      } else if (ctrl && (e.key === '0' || e.code === 'Digit0')) { e.preventDefault(); finish(true, null); }
    });
    inp.addEventListener('blur', () => finish(true, inp.value));
  }

  async commitCell(r, c, value) {
    const edit = this.opt.edit;
    const di = this.dataIndex(r);
    if (!edit || !edit.canEdit(di, c)) return;
    const tr = [...this.tbody.rows].find(x => x.dataset.r === String(r));
    if (tr) tr.cells[c + 1].classList.add('pending');
    try {
      const row = await edit.commit(di, c, value);
      if (row) this.d.rows[di] = row;
    } catch (e) {
      toast(e.message, true);
    }
    this.render(true);
  }

  async deleteSelected() {
    const edit = this.opt.edit, R = this.rect();
    if (!edit || !R) return;
    const rows = [];
    for (let r = R.r1; r <= R.r2; r++) rows.push(this.dataIndex(r));
    await edit.remove(rows);
  }

  // ---- export

  copy(headers) {
    const { columns } = this.d, n = this.n;
    if (!n && !headers) return;
    const R = this.rect() || { r1: 0, r2: n - 1, c1: 0, c2: columns.length - 1 };
    const cell = v => {
      if (v === null) return 'NULL';
      const s = String(v);
      return /[\t\n\r"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [];
    if (headers) lines.push(columns.slice(R.c1, R.c2 + 1).map(c => cell(c.name)).join('\t'));
    for (let r = R.r1; r <= R.r2; r++) lines.push(this.rowAt(r).slice(R.c1, R.c2 + 1).map(cell).join('\t'));
    const count = Math.max(0, R.r2 - R.r1 + 1);
    copyText(lines.join('\r\n'), `Copied ${fmtInt(count)} row${count === 1 ? '' : 's'}`);
  }

  csv() {
    const q = v => {
      if (v === null) return '';
      const s = String(v);
      return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [this.d.columns.map(c => q(c.name)).join(',')];
    for (let r = 0; r < this.n; r++) lines.push(this.rowAt(r).map(q).join(','));
    const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    download('﻿' + lines.join('\r\n'), `result-${(this.opt.index || 0) + 1}-${stamp}.csv`, 'text/csv;charset=utf-8');
  }
}
