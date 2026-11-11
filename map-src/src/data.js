// Row explorer of the database map: the rows of a table, and "one row" mode - a single row together with the rows
// it points to (through its foreign keys) and the rows in other tables that point to it. Read-only.
// In "one row" mode the cards in the 3D scene show the row's values under the column names, and a click on a
// lit table moves on to its related row(s).
import { $, fa, esc, trunc } from './util.js';

const PAGE = 60;           // rows fetched at a time
const MAX_COLS = 60;       // columns drawn in the grid; the row card always shows all of them
const COUNT_CAP = 1000;    // "1,000+" beyond this
const CHILD_CARDS = 6;     // related tables (pointing to the row) whose latest row is fetched for their card
const F_PK = 1, F_FK = 16;

export function createData({ api, mapId }) {
  let app = null;
  let view = null;         // the drawer: { node, where, columns, rows, more, loading, error, min }
  let cur = null;          // the open row: { node, cols, row, val, parents, children, structure }
  let trail = [];          // rows visited before the open one
  let moving = false;      // true while this module itself changes the selected table

  const tableName = n => `${n.schema}.${n.name}`;
  // binary values are shown as a short hex prefix: nobody reads a kilobyte of hex
  const cell = (v, max = 90) => (v === null || v === undefined ? '<i class="null">NULL</i>'
    : esc(trunc(String(v), /^0x[0-9A-F]{30,}/.test(v) ? 28 : max)));
  const whereText = w => (w || []).map(x => `${x.col} ${x.op === 'contains' ? '∋' : x.op === 'starts' ? '^' : x.op === 'null' ? 'IS NULL' : '='} ${x.op === 'null' ? '' : x.value}`).join(' , ');
  const valuesOf = (columns, row) => new Map(columns.map((c, i) => [(c.name || c).toLowerCase(), row[i]]));
  const childWhere = (c, ch) => ch.fk.cols.map(([col, ref]) => ({ col, op: '=', value: c.val.get(ref.toLowerCase()) }));

  // ============================== drawer: rows of one table ==============================
  async function load(append) {
    const v = view;
    v.loading = true; v.error = null;
    renderDrawer();
    try {
      const r = await api('mapRows', { id: mapId, table: tableName(v.node), where: v.where, top: PAGE, offset: append ? v.rows.length : 0 });
      if (view !== v) return;
      v.columns = r.columns;
      v.rows = append ? v.rows.concat(r.rows) : r.rows;
      v.more = r.more;
    } catch (e) {
      if (view !== v) return;
      v.error = e.message;
    }
    v.loading = false;
    renderDrawer();
  }
  function openTable(node, where) {
    view = { node, where: where && where.length ? where : null, columns: [], rows: [], more: false, min: false };
    load(false);
  }
  function closeDrawer() { view = null; renderDrawer(); }

  function renderDrawer() {
    const el = $('#data');
    el.hidden = !view;
    document.body.classList.toggle('has-data', !!view);
    if (!view) return;
    const v = view, n = v.node;
    el.classList.toggle('min', !!v.min);
    $('#data-toggle').textContent = v.min ? 'نمایش سطرها ▴' : 'جمع‌کردن ▾';
    $('#data-title').textContent = n.full;
    $('#data-info').innerHTML = v.loading ? 'در حال خواندن سطرها…'
      : v.error ? `<span class="err">خواندن سطرها ممکن نشد: <span dir="auto">${esc(v.error)}</span></span>`
        : `${fa(v.rows.length)} سطر${v.more ? ' (ادامه دارد)' : ''}${n.rows != null && !v.where ? ' از ' + fa(n.rows) : ''}` +
          (v.where ? ` · فیلتر: <span class="mono">${esc(whereText(v.where))}</span>` : '') + (n.t.c.some(c => c[2] & F_PK) ? ' · جدیدترین‌ها اول' : '');
    const sel = $('#f-col');
    if (sel.dataset.for !== n.full) {
      sel.innerHTML = n.t.c.map(c => `<option>${esc(c[0])}</option>`).join('');
      sel.dataset.for = n.full;
      $('#f-val').value = '';
    }
    $('#f-clear').hidden = !v.where;
    // until a row is open, say what a click on a row does
    $('#data-hint').hidden = !!cur || !v.rows.length;
    const flags = new Map(n.t.c.map(c => [c[0], c[2]]));
    const cols = v.columns.slice(0, MAX_COLS);
    let h = '';
    if (cols.length) {
      h = '<table class="grid"><thead><tr><th class="rn">#</th>' + cols.map(c => {
        const f = flags.get(c.name) || 0;
        return `<th>${f & F_PK ? '<i class="k pk">PK</i>' : ''}${f & F_FK ? '<i class="k fk">FK</i>' : ''}${esc(c.name)}</th>`;
      }).join('') + (v.columns.length > MAX_COLS ? `<th class="muted">+${v.columns.length - MAX_COLS} ستون دیگر (در کارت سطر)</th>` : '') + '</tr></thead><tbody>' +
        v.rows.map((r, i) => `<tr data-i="${i}"${cur && cur.node === n && cur.row === r ? ' class="on"' : ''}><td class="rn">${i + 1}</td>` + cols.map((c, k) => `<td>${cell(r[k])}</td>`).join('') + (v.columns.length > MAX_COLS ? '<td></td>' : '') + '</tr>').join('') +
        '</tbody></table>';
      if (!v.rows.length && !v.loading) h += '<p class="muted pad">سطری با این شرط پیدا نشد.</p>';
      if (v.more) h += '<button class="mini more-rows" id="data-more">سطرهای بعدی</button>';
    } else if (!v.loading && !v.error) h = '<p class="muted pad">این جدول سطری ندارد.</p>';
    $('#data-grid').innerHTML = h;
  }

  $('#data-grid').addEventListener('click', ev => {
    if (ev.target.closest('#data-more')) return load(true);
    const tr = ev.target.closest('tr[data-i]');
    if (tr && view) openCase(view.node, view.columns.map(c => c.name), view.rows[+tr.dataset.i]);
  });
  $('#data-close').addEventListener('click', closeDrawer);
  $('#data-toggle').addEventListener('click', () => { if (view) { view.min = !view.min; renderDrawer(); } });
  const applyFilter = () => {
    if (!view) return;
    const op = $('#f-op').value, value = $('#f-val').value;
    if (op !== 'null' && value === '') return;
    view.where = [{ col: $('#f-col').value, op, value }];
    load(false);
  };
  $('#f-go').addEventListener('click', applyFilter);
  $('#f-val').addEventListener('keydown', ev => { if (ev.key === 'Enter') applyFilter(); ev.stopPropagation(); });
  $('#f-clear').addEventListener('click', () => { if (view) { view.where = null; load(false); } });

  // ============================== one row and everything related to it ==============================
  const keyCols = c => { const pk = c.node.t.c.filter(x => x[2] & F_PK).map(x => x[0]); return pk.length ? pk : c.cols.slice(0, 1); };
  const keyText = c => keyCols(c).map(nm => `${nm} = ${c.val.get(nm.toLowerCase())}`).join(' , ');
  const keyValues = c => keyCols(c).map(nm => c.val.get(nm.toLowerCase())).join(' , ');
  // a short human hint for a row: its first few text values
  function preview(columns, row) {
    const out = [];
    for (let i = 0; i < columns.length && out.length < 3; i++) {
      const v = row[i];
      if (typeof v === 'string' && v.trim() && !/^\d{4}-\d\d-\d\d|^0x/.test(v) && /char|text/i.test(columns[i].type || 'char')) out.push(trunc(v.trim(), 40));
    }
    return out.join(' · ');
  }

  function openCase(node, cols, row) {
    // another row of the same table replaces the open one; a row of another table is a step forward
    if (cur && cur.node !== node) trail.push(cur);
    cur = {
      node, cols, row, val: valuesOf(cols, row), structure: false,
      parents: [...node.out, ...node.self].map(fk => ({ fk, state: 'wait' })),
      children: node.inc.map(fk => ({ fk, count: undefined })),
    };
    show();
    loadParents(cur);
    loadChildren(cur);
  }
  function show() {
    document.body.classList.add('case-on');      // the drawer makes room for the row's card in the scene
    if (view) renderDrawer();
    moving = true;
    app.select(cur.node);            // the detail panel asks detailOverride() below and draws the row card
    moving = false;
    paint3D();
  }
  function endCase() {
    cur = null; trail = [];
    document.body.classList.remove('case-on');
    app.setCase(null);
    if (view) renderDrawer();
  }

  // The scene: the tables holding related rows stay lit, their labels carry the number of rows,
  // and their cards show the related row itself (see cardData below).
  function paint3D() {
    if (!cur) return;
    const related = new Map();
    for (const p of cur.parents) if (p.state === 'found') related.set(app.nodes[p.fk.to], '');
    for (const c of cur.children) {
      if (!c.count) continue;
      const n = app.nodes[c.fk.from];
      const prev = related.get(n);
      related.set(n, { n: (prev && prev.n ? prev.n : 0) + c.count });
    }
    for (const [n, v] of related) if (v && v.n) related.set(n, `× ${v.n > COUNT_CAP ? COUNT_CAP + '+' : v.n}`);
    app.setCase(related);
  }
  function cardData(n) {
    if (!cur || cur.structure) return null;
    if (n === cur.node) return { values: cur.val, note: 'همین سطر', key: keyValues(cur) };
    const p = cur.parents.find(x => x.state === 'found' && app.nodes[x.fk.to] === n);
    if (p) return { values: valuesOf(p.columns, p.row), note: 'سطر مرجع', key: p.fk.cols.map(([col]) => cur.val.get(col.toLowerCase())).join(' , ') };
    const ch = cur.children.find(x => x.row && app.nodes[x.fk.from] === n);
    if (ch) return { values: valuesOf(ch.columns, ch.row), note: `جدیدترین از ${ch.count > COUNT_CAP ? COUNT_CAP + '+' : ch.count} سطر`, key: '' };
    return null;
  }

  async function loadParents(c) {
    for (let i = 0; i < c.parents.length; i++) {
      const p = c.parents[i];
      const values = p.fk.cols.map(([col]) => c.val.get(col.toLowerCase()));
      if (values.some(v => v === null || v === undefined)) p.state = 'null';
      else {
        try {
          const r = await api('mapRows', { id: mapId, table: tableName(app.nodes[p.fk.to]), where: p.fk.cols.map(([, ref], k) => ({ col: ref, op: '=', value: values[k] })), top: 1 });
          if (cur !== c) return;
          if (r.rows.length) { p.state = 'found'; p.columns = r.columns; p.row = r.rows[0]; } else p.state = 'missing';
        } catch (e) { if (cur !== c) return; p.state = 'error'; p.error = e.message; }
      }
      patch(`p${i}`, parentState(p));
    }
    paint3D();
  }
  async function loadChildren(c, only) {
    const list = only !== undefined ? [only] : c.children.map((x, i) => i);
    for (let at = 0; at < list.length; at += 12) {
      const slice = list.slice(at, at + 12);
      const items = slice.map(i => ({ table: tableName(app.nodes[c.children[i].fk.from]), where: childWhere(c, c.children[i]) }));
      // a row whose key is NULL cannot be referenced
      const usable = items.map(it => it.where.every(w => w.value !== null && w.value !== undefined));
      try {
        const r = await api('mapCounts', { id: mapId, items: items.filter((it, k) => usable[k]), cap: COUNT_CAP, force: only !== undefined });
        if (cur !== c) return;
        let k = 0;
        slice.forEach((i, j) => { c.children[i].count = usable[j] ? r.counts[k++] : 0; });
      } catch (e) {
        if (cur !== c) return;
        slice.forEach(i => { c.children[i].count = null; c.children[i].error = e.message; });
      }
      slice.forEach(i => patch(`c${i}`, childState(c.children[i])));
      paint3D();
    }
    patch('child-sum', childSummary(c));
    // now that the counts are known, the tables that do have rows come first in the list (without redrawing the card)
    const firstChild = document.querySelector('#detail [data-case="child"]');
    if (firstChild && cur === c) {
      const sec = firstChild.parentElement;
      [...sec.querySelectorAll('[data-case="child"]')]
        .sort((a, b) => (c.children[+b.dataset.i].count || 0) - (c.children[+a.dataset.i].count || 0))
        .forEach(b => sec.appendChild(b));
    }
    // the nearest related tables also get their latest row, to show on their card in the scene
    const s = c.node;
    const near = c.children.filter(x => x.count > 0 && !x.row)
      .sort((a, b) => { const A = app.nodes[a.fk.from], B = app.nodes[b.fk.from]; return Math.hypot(A.x - s.x, A.y - s.y, A.z - s.z) - Math.hypot(B.x - s.x, B.y - s.y, B.z - s.z); })
      .slice(0, CHILD_CARDS);
    for (const ch of near) {
      try {
        const r = await api('mapRows', { id: mapId, table: tableName(app.nodes[ch.fk.from]), where: childWhere(c, ch), top: 1 });
        if (cur !== c) return;
        if (r.rows.length) { ch.columns = r.columns; ch.row = r.rows[0]; }
      } catch (e) { if (cur !== c) return; }
    }
    if (near.length) paint3D();
  }

  const parentState = p => (p.state === 'wait' ? '<span class="muted">…</span>'
    : p.state === 'null' ? '<span class="muted">مقدار ندارد (NULL)</span>'
      : p.state === 'missing' ? '<span class="err">سطر مرجع پیدا نشد</span>'
        : p.state === 'error' ? `<span class="err" dir="auto">${esc(trunc(p.error, 90))}</span>`
          : `<span class="ok">✓</span> <span dir="auto">${esc(preview(p.columns, p.row)) || 'سطر موجود است'}</span>`);
  const childState = c => (c.count === undefined ? '<span class="muted">…</span>'
    : c.error ? '<span class="err">خطا</span>'
      : c.count === null ? '<span class="muted" title="جدول بزرگ است و روی این ستون ایندکس ندارد؛ برای شمارش کلیک کنید">شمارش نشده</span>'
        : c.count === 0 ? '<span class="muted">۰</span>'
          : `<b class="cnt">${c.count > COUNT_CAP ? fa(COUNT_CAP) + '+' : fa(c.count)}</b> سطر`);
  const childSummary = c => {
    const done = c.children.filter(x => x.count !== undefined), hit = done.filter(x => x.count > 0);
    return done.length < c.children.length ? `بررسی ${fa(done.length)} از ${fa(c.children.length)} رابطه…` : `${fa(hit.length)} رابطه سطر دارد`;
  };
  function patch(key, html) {
    const el = document.querySelector(`#detail [data-rel="${key}"]`);
    if (el) el.innerHTML = html;
  }

  function caseHtml(c) {
    const n = c.node;
    const fkOf = new Map();
    c.parents.forEach((p, i) => p.fk.cols.forEach(([col]) => { if (!fkOf.has(col)) fkOf.set(col, i); }));
    const flags = new Map(n.t.c.map(x => [x[0], x[2]]));
    // the way here, row by row; a click on a step goes back to it
    const steps = [...trail, c];
    const path = steps.length > 1 ? `<div class="case-path">${steps.map((s, i) =>
      `<button class="crumb${s === c ? ' on' : ''}" data-case="jump" data-i="${i}" title="${esc(keyText(s))}"><span class="mono">${esc(s.node.name)}</span><small class="mono">${esc(trunc(keyValues(s), 22))}</small></button>`).join('<i>›</i>')}</div>` : '';
    let h = `<header><div class="d-kind">یک سطر از جدول<span class="mono">${esc(n.schema)}</span></div>` +
      `<h2 class="mono">${esc(n.name)}</h2><button class="x" id="d-close" title="بستن (Esc)">✕</button>` +
      `<div class="case-key mono">${esc(trunc(keyText(c), 120))}</div>${path}` +
      `<p class="case-hint">مقدارهای این سطر روی کارتِ جدول در صحنه هم هست. برای جلو رفتن روی یک <b class="lnk">مقدار آبی</b>، یکی از فهرست‌های پایین، یا یک جدولِ روشن در صحنه کلیک کنید.</p></header>` +
      `<div class="d-actions">${trail.length ? `<button data-case="back">→ سطر قبلی</button>` : ''}` +
      `<button data-case="rows">سطرهای این جدول</button><button data-case="structure">ساختار جدول</button></div>`;

    h += `<details class="sec" open><summary>مقدارها<b>${fa(c.cols.length)}</b></summary><table class="cols vals"><tbody>` +
      c.cols.map((name, i) => {
        const f = flags.get(name) || 0, pi = fkOf.get(name), v = c.row[i];
        return `<tr><td class="ck">${f & F_PK ? '<i class="k pk">PK</i>' : ''}${f & F_FK ? '<i class="k fk">FK</i>' : ''}</td>` +
          `<td class="cn"><span class="mono${f & F_PK ? ' b' : ''}">${esc(name)}</span></td>` +
          `<td class="cv" dir="auto">${pi !== undefined && v !== null ? `<a data-case="parent" data-i="${pi}">${cell(v, 200)}</a>` : cell(v, 400)}</td></tr>`;
      }).join('') + '</tbody></table></details>';

    if (c.parents.length) {
      h += `<details class="sec" open><summary><i class="ln" style="background:#7fb2f5"></i>این سطر به این سطرها اشاره می‌کند<b>${fa(c.parents.length)}</b></summary>` +
        c.parents.map((p, i) => `<button class="rel" data-case="parent" data-i="${i}"><span class="mono rel-t">${esc(app.nodes[p.fk.to].full)}</span>` +
          `<span class="mono rel-c">${p.fk.cols.map(([col, ref]) => `${esc(col)} = ${cell(c.val.get(col.toLowerCase()), 40)} → ${esc(ref)}`).join(' , ')}</span>` +
          `<span class="rel-s" data-rel="p${i}">${parentState(p)}</span></button>`).join('') + '</details>';
    }
    if (c.children.length) {
      // tables with rows first once the counts are known
      const order = c.children.map((x, i) => i).sort((a, b) => (c.children[b].count || 0) - (c.children[a].count || 0));
      h += `<details class="sec" open><summary><i class="ln" style="background:#f2a65a"></i>سطرهایی که به این سطر اشاره می‌کنند<b data-rel="child-sum">${childSummary(c)}</b></summary>` +
        order.map(i => {
          const ch = c.children[i];
          return `<button class="rel" data-case="child" data-i="${i}"><span class="mono rel-t">${esc(app.nodes[ch.fk.from].full)}</span>` +
            `<span class="mono rel-c">${ch.fk.cols.map(([col]) => esc(col)).join(' , ')}</span><span class="rel-s" data-rel="c${i}">${childState(ch)}</span></button>`;
        }).join('') + '</details>';
    }
    if (!c.parents.length && !c.children.length) h += '<p class="muted pad">این جدول با کلید خارجی به جدول دیگری وصل نیست؛ سطر مرتبطی برای نمایش وجود ندارد.</p>';
    return h;
  }

  function goParent(p) {
    if (p.state === 'found') openCase(app.nodes[p.fk.to], p.columns.map(x => x.name), p.row);
  }
  function goChild(i) {
    const ch = cur.children[i];
    if (ch.count === null && !ch.error) { ch.count = undefined; patch(`c${i}`, childState(ch)); return loadChildren(cur, i); }
    openTable(app.nodes[ch.fk.from], childWhere(cur, ch));
  }

  $('#detail').addEventListener('click', ev => {
    const b = ev.target.closest('[data-case]');
    if (!b) return;
    ev.stopPropagation();
    const act = b.dataset.case, sel = app.state.selected;
    if (act === 'open') return openTable(sel);                           // from the structure view
    if (act === 'resume' && cur) { cur.structure = false; app.refreshDetail(); return app.refreshCards(); }
    if (!cur) return;
    if (act === 'structure') { cur.structure = true; app.refreshDetail(); return app.refreshCards(); }
    if (act === 'rows') return openTable(cur.node);
    if (act === 'back') { cur = trail.pop(); return show(); }
    const i = +b.dataset.i;
    if (act === 'jump') {
      if (i < trail.length) { cur = trail[i]; trail = trail.slice(0, i); show(); }
      return;
    }
    if (act === 'parent') goParent(cur.parents[i]);
    else if (act === 'child') goChild(i);
  }, true);

  return {
    attach(a) { app = a; },
    openTable,
    // what the detail panel shows instead of the structure, while a row of this table is open
    detailOverride: n => (cur && cur.node === n && !cur.structure ? caseHtml(cur) : null),
    detailActions: n => `<button data-case="open" class="go" title="سطرهای این جدول را نشان می‌دهد؛ با کلیک روی هر سطر، سطرهای مرتبطش در جدول‌های دیگر را دنبال کنید">سطرها و دنبال‌کردن موردی ▸</button>${cur && cur.node === n ? '<button data-case="resume">بازگشت به سطر</button>' : ''}`,
    onSelect: n => { if (!moving && cur && n !== cur.node) endCase(); },
    // the cards in the scene: the row's values instead of column types
    cardData,
    // a click on a lit table in the scene moves on: to the row this row points to, or to the rows pointing to it
    onNodeClick: n => {
      if (!cur || cur.structure || n === cur.node) return false;
      const p = cur.parents.find(x => x.state === 'found' && app.nodes[x.fk.to] === n);
      if (p) { goParent(p); return true; }
      const i = cur.children.findIndex(x => x.count > 0 && app.nodes[x.fk.from] === n);
      if (i >= 0) { goChild(i); return true; }
      return false;
    },
  };
}
