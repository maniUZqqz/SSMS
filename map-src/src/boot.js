// Page shell of the database map: which database to show, getting its stored structure from the app's server,
// keeping the picture in step with the real database, and the dialogs (add a database, change history, SQL text).
import { run } from './app.js';
import { fromStructure } from './model.js';
import { createData } from './data.js';
import { $, fa, esc, faDate, ago } from './util.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function api(name, body) {
  let r;
  try {
    r = await fetch('/api/' + name, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  } catch (e) { throw new Error('ارتباط با برنامه برقرار نیست (start.bat بسته شده؟)'); }
  const j = await r.json().catch(() => ({ error: `پاسخ نامعتبر (${r.status})` }));
  if (!r.ok || j.error) throw new Error(j.error || r.statusText);
  return j;
}

let app = null, cur = null, dbs = [], checkEvery = 5, loadedChangedAt = null;
const params = new URLSearchParams(location.search);

// ============================== small UI pieces ==============================
const dlg = $('#dlg');
function openDialog(title, html, wide) {
  $('#dlg-title').textContent = title;
  $('#dlg-body').innerHTML = html;
  dlg.classList.toggle('wide', !!wide);
  if (!dlg.open) dlg.showModal();
  return $('#dlg-body');
}
$('#dlg-close').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', ev => { if (ev.target === dlg) dlg.close(); });

let toastTimer;
function toast(html, ms = 6000) {
  const t = $('#toast');
  t.innerHTML = html; t.classList.add('show');
  clearTimeout(toastTimer);
  if (ms) toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}
$('#toast').addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  $('#toast').classList.remove('show');
  if (b.dataset.act === 'changes') showChanges();
  if (b.dataset.act === 'new') spotlightEntry(0);
});

function setLoading(text, actionsHtml = '') {
  $('#loading').classList.remove('hide');
  $('#loading-text').innerHTML = text;
  $('#loading-actions').innerHTML = actionsHtml;
}
const otherDbButtons = () => dbs.filter(d => !cur || d.id !== cur.id).map(d => `<button data-db="${esc(d.id)}">${esc(d.title)}</button>`).join('') + '<button data-add="1">+ افزودن دیتابیس</button>';
$('#loading-actions').addEventListener('click', ev => {
  const b = ev.target.closest('button');
  if (!b) return;
  if (b.dataset.db) go(b.dataset.db);
  else if (b.dataset.add) showAdd();
  else if (b.dataset.retry) api('mapRefresh', { id: cur.id }).then(() => location.reload(), () => location.reload());
});
const go = id => { location.search = '?db=' + encodeURIComponent(id); };

// ============================== change history ==============================
const WORDS = {
  'table+': 'جدول جدید', 'table-': 'جدول حذف‌شده', 'column+': 'ستون جدید', 'column-': 'ستون حذف‌شده', 'column~': 'ستون تغییرکرده',
  'fk+': 'رابطهٔ جدید', 'fk-': 'رابطهٔ حذف‌شده', 'view+': 'ویو جدید', 'view-': 'ویو حذف‌شده', 'view~': 'ویو تغییرکرده',
  'routine+': 'پروسیجر/تابع جدید', 'routine-': 'پروسیجر/تابع حذف‌شده', 'routine~': 'پروسیجر/تابع تغییرکرده',
};
const summaryText = s => Object.keys(WORDS).filter(k => s && s[k]).map(k => `${fa(s[k])} ${WORDS[k]}`).join('، ');
let changes = null;
async function loadChanges() {
  try { changes = await api('mapChanges', { id: cur.id }); } catch (e) { changes = { entries: [] }; }
  if (!Array.isArray(changes.entries)) changes.entries = [];
  return changes;
}
function touchedNodes(entry) {
  const names = new Set(entry.items.filter(i => /^(table\+|column|fk|view[+~])/.test(i.t)).map(i => i.n));
  return [...names].map(n => app.byFull(n)).filter(Boolean);
}
function spotlightEntry(i) {
  const entry = changes && changes.entries[i];
  if (!entry || !app) return;
  const added = entry.items.filter(x => x.t === 'table+' || x.t === 'view+').map(x => app.byFull(x.n)).filter(Boolean);
  const list = added.length ? added : touchedNodes(entry);
  if (list.some(n => n.isView)) app.setToggle('showViews', true);
  if (list.length) app.spotlight(list, 'تغییرات');
  if (list.length === 1) app.select(list[0]);
}
async function showChanges() {
  await loadChanges();
  const real = changes.entries.filter(e => !e.first);
  let h = '';
  if (!real.length) h = '<p class="muted">از اولین خواندن ساختار تا الان تغییری در ساختار این دیتابیس ثبت نشده است. هر تغییر (جدول، ستون، رابطه، ویو، پروسیجر) که در دیتابیس رخ دهد، اینجا فهرست می‌شود.</p>';
  changes.entries.slice(0, 40).forEach((e, ei) => {
    if (e.first) { h += `<div class="chg"><div class="chg-h"><b>${faDate(e.at)}</b><span>اولین خواندن ساختار</span></div></div>`; return; }
    const sign = t => (t.endsWith('+') ? '<i class="sg add">+</i>' : t.endsWith('-') ? '<i class="sg del">−</i>' : '<i class="sg mod">~</i>');
    const rows = e.items.slice(0, 250).map(i => {
      let body;
      if (i.t.startsWith('column')) body = `<span class="mono">${esc(i.n.replace(/^dbo\./, ''))}.<b>${esc(i.c)}</b></span><small class="mono">${i.t === 'column~' ? esc(i.from) + ' → ' + esc(i.to) : esc(i.type || '')}</small>`;
      else if (i.t.startsWith('fk')) body = `<span class="mono">${esc(i.n.replace(/^dbo\./, ''))} → ${esc(i.to.replace(/^dbo\./, ''))}</span><small class="mono">${esc(i.c || i.fk)}</small>`;
      else body = `<span class="mono"><b>${esc(i.n.replace(/^dbo\./, ''))}</b></span>${i.columns ? `<small>${fa(i.columns)} ستون</small>` : ''}`;
      const target = i.t.startsWith('routine') ? `data-code="${esc(i.n)}"` : `data-full="${esc(i.n)}" data-col="${esc(i.c || '')}"`;
      const gone = i.t === 'table-' || i.t === 'view-' || i.t === 'routine-';
      return `<${gone ? 'div' : 'button'} class="chg-i" ${gone ? '' : target}>${sign(i.t)}<em>${WORDS[i.t] || i.t}</em>${body}</${gone ? 'div' : 'button'}>`;
    }).join('');
    h += `<div class="chg"><div class="chg-h"><b>${faDate(e.at)}</b><span>${summaryText(e.summary)}</span><button class="mini" data-spot="${ei}">نمایش در صحنه</button></div>` +
      rows + (e.total > 250 ? `<div class="muted">… و ${fa(e.total - 250)} مورد دیگر (فهرست کامل در فایل <span class="mono">map-data/${esc(cur.id)}.changes.json</span>)</div>` : '') + '</div>';
  });
  const body = openDialog(`تغییرات ساختار «${cur.title}»`, h, true);
  body.onclick = ev => {
    const s = ev.target.closest('[data-spot]');
    if (s) { dlg.close(); return spotlightEntry(+s.dataset.spot); }
    const c = ev.target.closest('[data-code]');
    if (c) return showCode(c.dataset.code);
    const b = ev.target.closest('[data-full]');
    if (!b) return;
    const n = app.byFull(b.dataset.full);
    if (n) { dlg.close(); app.select(n, { col: b.dataset.col || undefined }); }
  };
}

// ============================== SQL text of views / procedures / functions / triggers ==============================
async function showCode(name) {
  const body = openDialog(name.replace(/^dbo\./, ''), '<p class="muted">در حال دریافت متن…</p>', true);
  body.onclick = null;
  try {
    const { text } = await api('mapCode', { id: cur.id, name });
    if (text == null) { body.innerHTML = '<p class="muted">متن این شیء در دسترس نیست (کاربر دیتابیس اجازهٔ دیدن آن را ندارد).</p>'; return; }
    body.innerHTML = `<div class="code-bar"><button class="mini" id="code-copy">کپی متن</button><span class="muted">${fa(text.split('\n').length)} خط</span></div><pre class="code" dir="ltr"></pre>`;
    body.querySelector('pre').textContent = text;
    body.querySelector('#code-copy').onclick = ev => { if (navigator.clipboard) navigator.clipboard.writeText(text); ev.target.textContent = 'کپی شد'; };
  } catch (e) { body.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
}

// ============================== add a database (from the connections saved in Web SQL Studio) ==============================
async function showAdd() {
  const body = openDialog('افزودن دیتابیس به نقشه', '<p class="muted">در حال خواندن اتصال‌ها…</p>');
  body.onclick = null;
  let src;
  try { src = (await api('mapSources')).connections; } catch (e) { body.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
  if (!src.length) {
    body.innerHTML = '<p>هنوز هیچ اتصال SQL Server در Web SQL Studio ذخیره نشده است. ابتدا در <a href="/" target="_blank">Web SQL Studio</a> به سرور وصل شوید (با ذخیرهٔ رمز)، بعد همین‌جا دیتابیس را انتخاب کنید.</p>';
    return;
  }
  body.innerHTML = `
    <p>یکی از اتصال‌های Web SQL Studio را انتخاب کنید تا دیتابیس‌های آن سرور فهرست شود. فقط ساختار از کاتالوگ سیستم خوانده می‌شود و چیزی در دیتابیس تغییر نمی‌کند.</p>
    <label class="fld"><span>اتصال</span><select id="add-conn">${src.map(c => `<option value="${esc(c.id)}"${c.ready ? '' : ' disabled'}>${esc(c.name)}${c.ready ? '' : ' — رمز ذخیره نشده؛ ابتدا در Studio وصل شوید'}</option>`).join('')}</select></label>
    <div class="btns"><button class="primary" id="add-find">یافتن دیتابیس‌ها</button><span id="add-msg" class="muted"></span></div>
    <div id="add-list"></div>
    <div class="btns"><button class="primary" id="add-go" disabled>افزودن و خواندن ساختار</button></div>
    <p class="muted">برای سرور جدید، در <a href="/" target="_blank">Web SQL Studio</a> به آن وصل شوید؛ دیتابیسِ همان اتصال خودکار به نقشه اضافه می‌شود.</p>`;
  const q = s => body.querySelector(s);
  q('#add-find').onclick = async () => {
    q('#add-msg').textContent = 'در حال اتصال…'; q('#add-list').innerHTML = ''; q('#add-go').disabled = true;
    try {
      const r = await api('mapDatabases', { conn: q('#add-conn').value });
      q('#add-msg').textContent = `سرور ${r.server}: ${fa(r.databases.length)} دیتابیسِ قابل‌دسترس`;
      q('#add-list').innerHTML = r.databases.map(d => `<label class="chk"><input type="checkbox" value="${esc(d.name)}"${d.added ? ' disabled' : ''}><span class="mono">${esc(d.name)}</span>${d.added ? '<small>قبلاً اضافه شده</small>' : ''}</label>`).join('');
      q('#add-list').onchange = () => { q('#add-go').disabled = !q('#add-list').querySelector('input:checked'); };
    } catch (e) { q('#add-msg').textContent = 'اتصال برقرار نشد: ' + e.message; }
  };
  q('#add-go').onclick = async () => {
    const names = [...q('#add-list').querySelectorAll('input:checked')].map(i => i.value);
    q('#add-go').disabled = true;
    try {
      const r = await api('mapAdd', { conn: q('#add-conn').value, databases: names });
      if (r.added && r.added.length) go(r.added[0]); else dlg.close();
    } catch (e) { q('#add-msg').textContent = e.message; q('#add-go').disabled = false; }
  };
}

// ============================== database menu & sync status ==============================
const busy = d => d.state === 'extracting' || d.state === 'checking' || d.state === 'new';
function renderMenu() {
  const st = d => (d.state === 'error' ? '<i class="st err" title="خطا"></i>' : busy(d) ? '<i class="st busy"></i>' : d.state === 'offline' ? '<i class="st off"></i>' : '<i class="st ok"></i>');
  $('#dbmenu').innerHTML = dbs.map(d => `<div class="dbrow${cur && d.id === cur.id ? ' cur' : ''}">
      <button class="dbgo" data-db="${esc(d.id)}">${st(d)}<span class="mono">${esc(d.title)}</span><small>${d.counts ? fa(d.counts.tables) + ' جدول · ' + fa(d.counts.foreignKeys) + ' رابطه' : d.state === 'error' || d.state === 'offline' ? 'خوانده نشده' : 'در حال خواندن…'}${d.server ? ' · <span class="mono">' + esc(d.server) + '</span>' : ''}</small></button>
      <button class="dbdel" data-del="${esc(d.id)}" title="حذف از نقشه">✕</button></div>`).join('') +
    '<button id="db-add">+ افزودن دیتابیس…</button><a id="db-studio" href="/" target="_blank">بازکردن Web SQL Studio ↗</a>';
}
$('#dbbtn').addEventListener('click', ev => { ev.stopPropagation(); renderMenu(); $('#dbmenu').classList.toggle('open'); });
document.addEventListener('pointerdown', ev => { if (!ev.target.closest('#dbmenu') && !ev.target.closest('#dbbtn')) $('#dbmenu').classList.remove('open'); });
$('#dbmenu').addEventListener('click', async ev => {
  const g = ev.target.closest('[data-db]'), d = ev.target.closest('[data-del]');
  if (ev.target.closest('#db-add')) { $('#dbmenu').classList.remove('open'); return showAdd(); }
  if (g) { if (!cur || g.dataset.db !== cur.id) go(g.dataset.db); else $('#dbmenu').classList.remove('open'); return; }
  if (d) {
    const db = dbs.find(x => x.id === d.dataset.del);
    if (!db || !confirm(`«${db.title}» از نقشه حذف شود؟\nفایل‌های ساختارِ ذخیره‌شدهٔ آن (JSON) هم پاک می‌شوند. به خودِ دیتابیس دست زده نمی‌شود.`)) return;
    await api('mapRemove', { id: db.id });
    if (cur && db.id === cur.id) location.href = location.pathname; else { await refreshList(); renderMenu(); }
  }
});

function renderSync() {
  if (!cur) return;
  $('#asof').textContent = cur.extractedAt ? 'آخرین خواندن ساختار: ' + faDate(cur.extractedAt) : '';
  const s = $('#sync-state');
  if (cur.state === 'extracting') s.innerHTML = '<i class="st busy"></i>در حال خواندن ساختار از دیتابیس…';
  else if (cur.state === 'checking') s.innerHTML = '<i class="st busy"></i>در حال بررسی تغییرات…';
  else if (cur.state === 'offline') s.innerHTML = '<i class="st off"></i>اتصال به این سرور برقرار نیست؛ نما از ساختار ذخیره‌شده است. برای به‌روزرسانی، در Web SQL Studio به سرور وصل شوید.';
  else if (cur.state === 'error') s.innerHTML = `<i class="st err"></i>دیتابیس در دسترس نیست؛ نما از ساختار ذخیره‌شده است. <span class="muted" dir="auto">${esc(cur.error || '')}</span>`;
  else s.innerHTML = `<i class="st ok"></i>بررسی خودکار هر ${fa(checkEvery)} دقیقه${cur.checkedAt ? ' · آخرین بررسی ' + ago(cur.checkedAt) : ''}`;
}
async function refreshList() {
  const r = await api('mapList');
  dbs = r.maps; checkEvery = r.checkEveryMinutes;
  if (cur) cur = dbs.find(d => d.id === cur.id) || null;
  return dbs;
}
let manual = null;       // set while the user's own "check now" is running
$('#btn-check').addEventListener('click', async () => {
  if (!cur) return;
  manual = { before: cur.extractedAt, at: Date.now() };
  $('#sync-state').innerHTML = '<i class="st busy"></i>در حال بررسی تغییرات…';
  try { await api('mapRefresh', { id: cur.id }); } catch (e) { toast(esc(e.message)); manual = null; }
  setTimeout(poll, 1500);
});
$('#btn-changes').addEventListener('click', () => showChanges());

function reloadKeepingView() {
  try { sessionStorage.setItem('dbmap.restore', JSON.stringify(Object.assign({ db: cur.id, updated: true }, app ? app.viewState() : {}))); } catch (e) { /* ignore */ }
  location.reload();
}
let pollTimer;
async function poll() {
  clearTimeout(pollTimer);
  try {
    await refreshList();
    if (!cur) { location.href = location.pathname; return; }
    renderSync();
    if ($('#dbmenu').classList.contains('open')) renderMenu();
    if (app && cur.changedAt && cur.changedAt !== loadedChangedAt) {
      toast('ساختار دیتابیس تغییر کرده است؛ نما به‌روز می‌شود…', 0);
      setTimeout(reloadKeepingView, 900);
      return;
    }
    if (manual && !busy(cur) && (cur.extractedAt !== manual.before || cur.state !== 'ok' || Date.now() - manual.at > 20000)) {
      const ok = cur.state === 'ok';
      manual = null;
      toast(ok ? 'ساختار دوباره خوانده شد؛ تغییری نسبت به قبل نداشت.' : 'دیتابیس در دسترس نبود؛ نما از ساختار ذخیره‌شده است.');
    }
  } catch (e) {
    $('#sync-state').innerHTML = `<i class="st err"></i>${esc(e.message)}`;
  }
  pollTimer = setTimeout(poll, manual || (cur && busy(cur)) ? 2500 : 10000);
}

// ============================== start ==============================
boot().catch(err => {
  console.error(err);
  setLoading(`<span class="err">${esc(err && err.message ? err.message : String(err))}</span>`, (cur ? '<button data-retry="1">تلاش دوباره</button>' : '') + otherDbButtons());
});

async function boot() {
  await refreshList();
  if (!dbs.length) {
    setLoading('هنوز هیچ دیتابیسی در نقشه نیست. در Web SQL Studio به یک SQL Server وصل شوید، یا از اتصال‌های ذخیره‌شده یکی را انتخاب کنید.', '<button data-add="1">+ افزودن دیتابیس</button>');
    return;
  }
  let want = params.get('db');
  if (!want) { try { want = localStorage.getItem('dbmap.last'); } catch (e) { /* ignore */ } }
  cur = dbs.find(d => d.id === want) || dbs[0];
  while (!cur.extractedAt) {
    if (cur.state === 'error' || cur.state === 'offline') throw new Error(`ساختار «${cur.title}» هنوز خوانده نشده و دیتابیس در دسترس نیست: ${cur.error || ''}`);
    setLoading(`در حال خواندن ساختار «${esc(cur.title)}» از سرور… (اولین بار چند ثانیه طول می‌کشد)`, otherDbButtons());
    await sleep(1500);
    await refreshList();
    if (!cur) { location.href = location.pathname; return; }
  }
  try { localStorage.setItem('dbmap.last', cur.id); } catch (e) { /* ignore */ }
  setLoading('در حال دریافت ساختار…');
  const json = await api('mapStructure', { id: cur.id });
  loadedChangedAt = cur.changedAt;
  let restore = null;
  try { restore = JSON.parse(sessionStorage.getItem('dbmap.restore') || 'null'); sessionStorage.removeItem('dbmap.restore'); } catch (e) { /* ignore */ }
  if (restore && restore.db !== cur.id) restore = null;
  document.title = `${cur.title} — نقشهٔ پایگاه‌داده`;

  const data = createData({ api, mapId: cur.id });
  app = await run(fromStructure(json), {
    title: cur.title, cacheId: cur.id, restore, showCode,
    detailOverride: data.detailOverride, detailActions: data.detailActions, onSelect: data.onSelect,
  });
  data.attach(app);
  document.body.classList.add('server-mode');
  renderSync();
  pollTimer = setTimeout(poll, 4000);

  // opened from Object Explorer on a particular table
  const focus = params.get('table');
  if (focus && !restore) { const n = app.byFull(focus) || app.find(focus); if (n) setTimeout(() => app.select(n), 600); }

  if (restore && restore.updated) {
    await loadChanges();
    const e = changes.entries[0];
    if (e && !e.first) {
      const added = e.items.some(x => x.t === 'table+' || x.t === 'view+');
      toast(`ساختار «${esc(cur.title)}» به‌روز شد: ${summaryText(e.summary)}` +
        `<span class="t-btns">${added ? '<button data-act="new">نمایش جدول‌های جدید</button>' : ''}<button data-act="changes">جزئیات</button></span>`, 15000);
    }
  }
}
