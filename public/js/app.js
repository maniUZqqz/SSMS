// Main application: menus, toolbars, tabs, execution, results, edit and details tabs.

import { $, h, sqlStr, uid, clamp, fmtInt, fmtMs, countNl, debounce, fmtType, api, toast, download, formDialog, askText, confirmBox, showText, showMenu, hideMenu, menuOpen, setMenuCloseHook } from './util.js';
import { ICONS, hydrateIcons } from './icons.js';
import { app } from './state.js';
import { Editor, setEditorFont } from './editor.js';
import { attachIntellisense, closeIntellisense } from './intellisense.js';
import { openFind, closeFind, findNext, findAttach, findSwitch } from './find.js';
import { Grid, ROW_H, HEAD_H, CAP_H } from './grid.js';
import { renderPlan } from './plan.js';
import { DetailsView } from './details.js';
import {
  addServerNode, removeServerNode, showEmptyHint, getObjects, getTableInfo, objectsSync, tableInfoSync,
  selectedNode, oeRefresh, oeDisconnect, oeFilter, activityMonitor,
} from './explorer.js';
import { connectDialog, SERVER_TYPES } from './connect.js';

hydrateIcons();
const els = {
  menubar: $('#menubar'), db: $('#dbSelect'), explorer: $('#explorer'), filter: $('#filter'), tree: $('#tree'),
  work: $('#work'), tabs: $('#tabs'), editors: $('#editors'), splitX: $('#splitX'), splitY: $('#splitY'), resultsHost: $('#resultsHost'),
  qsState: $('#qsState'), qsServer: $('#qsServer'), qsLogin: $('#qsLogin'), qsDb: $('#qsDb'), qsTime: $('#qsTime'), qsRows: $('#qsRows'),
  sbState: $('#sbState'), sbTran: $('#sbTran'), sbLn: $('#sbLn'), sbCol: $('#sbCol'), sbCh: $('#sbCh'), file: $('#fileInput'),
};
const tb = id => $('#' + id);

// ---------------------------------------------------------------- settings

const STORE = 'webSqlStudio.v2';
const HISTORY = 'webSqlStudio.history';
const load = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
const settings = Object.assign({
  counter: 0, explorerW: 300, splitRatio: 0.45, maxRows: '5000', theme: 'blue', resultsMode: 'grid', actualPlan: false,
  intellisense: true, fontSize: 13, lineNumbers: true, explorerVisible: true, treeRowCounts: true,
  options: { nocount: false, statsIO: false, statsTime: false, xactAbort: false, isolation: 'READ COMMITTED' },
  detailsCols: {}, openConns: null, lastConn: null, tabs: null, active: null,
}, load(STORE) || {});
if (!['blue', 'light', 'dark'].includes(settings.theme)) settings.theme = settings.theme === 'dark' ? 'dark' : 'blue';
if (!settings.tabs) {
  const v1 = load('webSqlStudio.v1');
  if (v1 && Array.isArray(v1.tabs)) settings.tabs = v1.tabs.map(t => ({ ...t, kind: 'query', conn: null }));
}

app.settings = settings;
let resultsHidden = false;

function persistNow() {
  settings.tabs = app.tabs.map(t => ({
    id: t.id, kind: t.kind, title: t.title, conn: t.conn, db: t.db, dirty: t.dirty,
    sql: t.editor ? t.editor.value : undefined, target: t.target,
  }));
  settings.active = app.active && app.active.id;
  try { localStorage.setItem(STORE, JSON.stringify(settings)); } catch { /* storage full */ }
}
const persist = debounce(persistNow, 400);
addEventListener('beforeunload', persistNow);

// ---------------------------------------------------------------- theme & layout

function applyTheme(theme) {
  settings.theme = theme;
  document.documentElement.dataset.theme = theme;
  persist();
}

function applyLayout() {
  els.explorer.hidden = els.splitX.hidden = !settings.explorerVisible;
  els.explorer.style.width = settings.explorerW + 'px';
  els.editors.style.flex = resultsHidden ? '1 1 auto' : `0 0 ${(settings.splitRatio * 100).toFixed(2)}%`;
  els.editors.classList.toggle('no-lines', !settings.lineNumbers);
}

function dragSplit(handle, bodyClass, onMove) {
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    document.body.classList.add(bodyClass);
    const up = () => {
      removeEventListener('mousemove', onMove);
      removeEventListener('mouseup', up);
      document.body.classList.remove(bodyClass);
      persist();
    };
    addEventListener('mousemove', onMove);
    addEventListener('mouseup', up);
  });
}
dragSplit(els.splitX, 'resizing', e => { settings.explorerW = clamp(e.clientX - 4, 180, innerWidth - 360); applyLayout(); });
dragSplit(els.splitY, 'resizing-y', e => {
  const work = els.work.getBoundingClientRect();
  const top = els.editors.getBoundingClientRect().top;
  settings.splitRatio = clamp((e.clientY - top) / work.height, 0.08, 0.85);
  applyLayout();
});

function toggleResults(show = resultsHidden) {
  resultsHidden = !show;
  els.resultsHost.hidden = resultsHidden;
  els.splitY.hidden = resultsHidden;
  applyLayout();
}

function toggleExplorer(show = !settings.explorerVisible) {
  settings.explorerVisible = show;
  applyLayout();
  if (show) els.tree.focus();
  persist();
}

// ---------------------------------------------------------------- connections

const connOf = t => (t && t.conn ? app.conns.get(t.conn) : null);
const typeOf = t => { const c = connOf(t); return c ? c.spec.type || 'mssql' : 'mssql'; };
const langOf = t => { const c = connOf(t); return (c && c.info.language) || 'sql'; };

// Identifier quoting per SQL dialect (used by IntelliSense when inserting names).
function quoteFor(type) {
  if (type === 'mysql' || type === 'mariadb') return s => (/^[A-Za-z_][\w$]*$/.test(s) ? s : '`' + s.replace(/`/g, '``') + '`');
  if (type === 'postgres' || type === 'sqlite' || type === 'cdb' || type === 'cassandra') return s => (/^[a-z_][a-z0-9_$]*$/.test(s) ? s : '"' + s.replace(/"/g, '""') + '"');
  if (type === 'oracle') return s => (/^[A-Z][A-Z0-9_$#]*$/.test(s) ? s : '"' + s.replace(/"/g, '""') + '"');
  return null;
}

// IntelliSense data for driver-based connections.
const gObjects = new Map(), gColumns = new Map();
function cachedPromise(map, key, load) {
  if (!map.has(key)) {
    const p = load();
    p.then(v => { p.done = true; p.value = v; }, () => map.delete(key));
    map.set(key, p);
  }
  return map.get(key);
}
const gObjectsFor = (conn, db) => cachedPromise(gObjects, conn + '|' + db, () => api('gobjects', { conn, db })
  .then(r => r.objects.map(o => ({ id: `${o.schema || ''}.${o.name}`, sch: o.schema || '', name: o.name, type: o.type === 'view' ? 'V' : 'U' }))));
const gColumnsFor = (conn, db, o) => cachedPromise(gColumns, `${conn}|${db}|${o.id}`, () => api('gcolumns', { conn, db, schema: o.sch, name: o.name })
  .then(r => r.columns.map(c => ({ name: c.name, typeText: c.type || '' }))));
function connName(id) {
  const c = app.conns.get(id);
  return c ? c.spec.name : '(not connected)';
}

function defaultConn() {
  const a = app.active;
  if (a && a.conn && app.conns.has(a.conn)) return a.conn;
  const sel = selectedNode();
  if (settings.lastConn && app.conns.has(settings.lastConn)) return settings.lastConn;
  return app.conns.size ? app.conns.keys().next().value : (sel ? null : null);
}

function defaultDbFor(conn) {
  const c = app.conns.get(conn);
  return c ? c.info.db : '';
}

async function ensureDatabases(conn) {
  const c = app.conns.get(conn);
  if (!c || c.databases || c.loadingDbs) return;
  c.loadingDbs = true;
  try {
    if (c.spec.type && c.spec.type !== 'mssql') {
      c.databases = (await api('gdatabases', { conn })).databases.map(name => ({ name: String(name), access: 1, state: 'ONLINE' }));
    } else {
      c.databases = (await api('databases', { conn })).databases;
    }
  } catch { /* shown in explorer */ }
  c.loadingDbs = false;
  if (app.active && app.active.conn === conn) syncToolbar();
}
app.onDatabases = conn => { if (app.active && app.active.conn === conn) syncToolbar(); };

function registerConn(r) {
  const c = { id: r.id, spec: r.spec, info: r.info, databases: null };
  app.conns.set(r.id, c);
  addServerNode(c);
  settings.lastConn = r.id;
  settings.openConns = [...app.conns.keys()];
  for (const t of app.tabs) if (!t.conn && t.kind === 'query') { t.conn = r.id; if (!t.db) t.db = r.info.db; }
  ensureDatabases(r.id);
  for (const t of app.tabs) {
    if (t.kind === 'edit' && t.conn === r.id && !t.loaded) loadEdit(t);
    if (t.kind === 'design' && t.conn === r.id && !t.loaded) loadDesign(t);
  }
  refreshUi();
  persist();
}

async function connectNew(prefill) {
  const r = await connectDialog(prefill);
  if (!r) return r;
  registerConn(r);
  if (r.openScript) {
    try {
      const s = await api('readScript', { path: r.openScript });
      newTab({ title: s.name, conn: r.id, db: r.info.db, sql: s.text });
      toast('Script opened. Press F5 to run it and create the tables.');
    } catch (e) { toast(e.message, true); }
  }
  return r;
}
app.connectDialog = connectNew;

// "Connect ▾" menu: one entry per supported database type (opens the dialog preset to it).
const connectMenuItems = () => SERVER_TYPES.map(([type, label]) =>
  [`${label}…`, () => connectNew({ blank: true, type }), { icon: type === 'mssql' ? 'server' : type === 'sqlite' || type === 'cdb' ? 'open' : 'db' }]);
function showConnectMenu(anchor) {
  const r = anchor.getBoundingClientRect();
  showMenu(r.left, r.bottom, connectMenuItems());
}

app.disconnect = async id => {
  try { await api('disconnect', { conn: id }); } catch { /* server gone */ }
  app.conns.delete(id);
  for (const m of [gObjects, gColumns]) for (const k of [...m.keys()]) if (k.startsWith(id + '|')) m.delete(k);
  removeServerNode(id);
  settings.openConns = [...app.conns.keys()];
  refreshUi();
  persist();
};

// Makes sure the tab's server is connected (reconnecting a saved connection if needed).
async function ensureConnected(t, force) {
  if (t.conn && app.conns.has(t.conn) && !force) return true;
  if (t.conn) {
    try {
      registerConn(await api('connect', { id: t.conn }));
      return true;
    } catch (e) {
      if (!e.needPassword && !/not found/i.test(e.message)) { toast(e.message, true); return false; }
      const r = await connectNew(e.needPassword ? { id: t.conn } : {});
      if (r) { t.conn = r.id; return true; }
      return false;
    }
  }
  const r = await connectNew();
  if (!r) return false;
  t.conn = r.id;
  t.db = r.info.db;
  return true;
}

async function restoreConnections() {
  let saved = [];
  try { saved = (await api('savedConnections')).saved; } catch (e) { toast(e.message, true); showEmptyHint(); return; }
  const wanted = settings.openConns || (saved[0] ? [saved[0].id] : []);
  const ids = wanted.filter(id => saved.some(s => s.id === id));
  for (const id of ids) {
    try {
      registerConn(await api('connect', { id }));
    } catch (e) {
      if (e.needPassword) await connectNew({ id });
      else toast(`Could not connect to ${saved.find(s => s.id === id).name}:\n${e.message}`, true);
    }
  }
  showEmptyHint();
  if (!saved.length) connectNew({ blank: true });
}

function changeConnection(anchor) {
  const t = app.active;
  if (!t || t.kind !== 'query') return;
  const r = anchor.getBoundingClientRect();
  showMenu(r.left, r.bottom, [
    ...[...app.conns.values()].map(c => [c.spec.name, () => setTabConn(t, c.id), { checked: c.id === t.conn }]),
    ...(app.conns.size ? [null] : []),
    ['Connect to another server…', async () => { const res = await connectNew({ blank: true }); if (res) setTabConn(t, res.id); }, { icon: 'connect' }],
    ...(t.conn ? [['Disconnect this tab', () => { api('close', { session: t.id }).catch(() => {}); t.spid = null; t.tranCount = 0; refreshUi(); }]] : []),
  ]);
}

function setTabConn(t, id) {
  if (t.conn !== id) {
    api('close', { session: t.id }).catch(() => {});
    t.conn = id;
    t.db = defaultDbFor(id);
    t.tranCount = 0;
    t.spid = null;
    settings.lastConn = id;
  }
  refreshUi();
  persist();
}

// ---------------------------------------------------------------- toolbar state

function refreshUi() {
  syncToolbar();
  renderTabs();
  updateStatus();
}

function syncToolbar() {
  const t = app.active;
  const isQuery = !!t && t.kind === 'query';
  els.db.innerHTML = '';
  const c = connOf(t);
  const dbs = c && c.databases ? c.databases.filter(d => d.access && d.state === 'ONLINE').map(d => d.name) : [];
  if (t && t.db && !dbs.includes(t.db)) dbs.unshift(t.db);
  for (const name of dbs) els.db.append(new Option(name, name));
  els.db.value = (t && t.db) || '';
  els.db.disabled = !isQuery || t.running;
  tb('tbExecute').disabled = !t || t.running || t.kind === 'details';
  tb('tbCancel').disabled = !t || !(t.running || t.stale) || !isQuery;
  for (const id of ['tbParse', 'tbEstPlan', 'tbActPlan', 'tbText', 'tbGrid', 'tbComment', 'tbUncomment', 'tbOutdent', 'tbIndent', 'tbChangeConn', 'tbSave', 'tbUndo', 'tbRedo', 'tbCut', 'tbPaste', 'tbFind']) {
    tb(id).disabled = !isQuery;
  }
  if (isQuery) {
    const lang = langOf(t), generic = typeOf(t) !== 'mssql';
    t.editor.setMode(lang);
    tb('tbParse').disabled = generic;
    tb('tbActPlan').disabled = generic;
    tb('tbEstPlan').disabled = lang === 'redis' || typeOf(t) === 'cassandra';
  }
  tb('tbActPlan').classList.toggle('on', settings.actualPlan);
  tb('tbText').classList.toggle('on', settings.resultsMode === 'text');
  tb('tbGrid').classList.toggle('on', settings.resultsMode !== 'text');
  tb('tbIntelli').classList.toggle('on', settings.intellisense);
  tb('tbBack').disabled = navPos <= 0;
  tb('tbForward').disabled = navPos >= navStack.length - 1;
  if (c) ensureDatabases(c.id);
}

els.db.onchange = () => {
  const t = app.active;
  if (!t) return;
  t.db = els.db.value;
  refreshUi();
  persist();
};

// ---------------------------------------------------------------- tabs

function provider(t) {
  const ready = () => t.conn && t.db && app.conns.has(t.conn);
  const generic = () => typeOf(t) !== 'mssql';
  return {
    get db() { return t.db; },
    get quote() { return quoteFor(typeOf(t)); },
    get defaultSchema() { return { mssql: 'dbo', postgres: 'public', mysql: t.db, mariadb: t.db, oracle: t.db, sqlite: 'main', cdb: 'main', cassandra: t.db }[typeOf(t)] || ''; },
    enabled: () => langOf(t) === 'sql',
    autoOpen: () => settings.intellisense && langOf(t) === 'sql',
    objects: () => {
      if (!ready()) return [];
      if (!generic()) return objectsSync(t.conn, t.db);
      const p = gObjectsFor(t.conn, t.db);
      return p.done ? p.value : null;
    },
    ensureObjects: () => (!ready() ? Promise.resolve([]) : generic() ? gObjectsFor(t.conn, t.db) : getObjects(t.conn, t.db)),
    columns: o => {
      if (generic()) { const p = gColumnsFor(t.conn, t.db, o); return p.done ? p.value : null; }
      const info = tableInfoSync(t.conn, t.db, o.id);
      return info ? info.columns.map(c => ({ name: c.name, typeText: fmtType(c) })) : null;
    },
    ensureColumns: o => (generic() ? gColumnsFor(t.conn, t.db, o) : getTableInfo(t.conn, t.db, o.id)),
  };
}

function newTab(opts = {}) {
  const kind = opts.kind || 'query';
  const t = {
    id: opts.id || uid(),
    kind,
    title: opts.title || `SQLQuery${++settings.counter}.sql`,
    conn: opts.conn !== undefined ? opts.conn : (kind === 'details' ? null : defaultConn()),
    db: opts.db || '',
    dirty: !!opts.dirty,
    target: opts.target,
    running: false, stale: false, result: null, tranCount: 0, spid: null, grids: [], view: 'grid',
  };
  if (!t.db && t.conn) t.db = defaultDbFor(t.conn);
  if (kind === 'query') {
    const ed = t.editor = new Editor(els.editors, opts.sql || '');
    ed.addEventListener('change', () => {
      if (!t.dirty) { t.dirty = true; renderTabs(); }
      persist();
    });
    ed.addEventListener('cursor', () => { if (t === app.active) updateCursor(); });
    attachIntellisense(ed, provider(t));
    findAttach(ed);
  }
  buildResults(t);
  if (kind === 'edit') buildEditView(t);
  if (kind === 'design') buildDesignView(t);
  if (kind === 'details') {
    t.res.el.innerHTML = '';
    t.details = new DetailsView(t.res.el, settings.detailsCols, persist);
    t.pendingNode = selectedNode();
  }
  app.tabs.push(t);
  activate(t);
  persist();
  if (opts.run) execute(t);
  if (kind === 'edit' && t.conn && app.conns.has(t.conn)) loadEdit(t);
  if (kind === 'design' && t.conn && app.conns.has(t.conn)) loadDesign(t);
  return t;
}
app.newTab = newTab;

app.openEditTab = ({ conn, db, schema, name }) => newTab({ kind: 'edit', conn, db, title: `${name} (Edit Top 200)`, target: { schema, name } });

// Database Map (3D): a page of its own (map.html) served by the same local server. For a SQL Server database
// it first makes sure the database is on the map; without one it opens the list of mapped databases.
app.openMap = async ({ conn, db, table } = {}) => {
  const win = window.open('about:blank', 'webSqlStudioMap');    // opened right away, so the browser does not block it
  let url = '/map.html';
  try {
    const c = conn && app.conns.get(conn);
    if (c && (c.spec.type || 'mssql') === 'mssql' && db) {
      const r = await api('mapOpen', { conn, db });
      url += '?db=' + encodeURIComponent(r.id) + (table ? '&table=' + encodeURIComponent(table) : '');
    }
  } catch (e) {
    toast(e.message, true);
  }
  if (win) win.location.href = url; else window.open(url, 'webSqlStudioMap');
};
function openMapForActive() {
  const t = app.active, c = t && app.conns.get(t.conn);
  app.openMap(c ? { conn: c.id, db: t.db || c.info.db } : {});
}
app.openDesignTab = ({ conn, db, schema, name, isNew }) =>
  newTab({ kind: 'design', conn, db, title: isNew ? 'New Table (Design)' : `${name} (Design)`, target: { schema, name, isNew: !!isNew } });

function openDetails() {
  let t = app.tabs.find(x => x.kind === 'details');
  if (t) { t.pendingNode = selectedNode() || t.pendingNode; activate(t); }
  else t = newTab({ kind: 'details', title: 'Object Explorer Details' });
}

app.onTreeSelect = node => {
  const t = app.tabs.find(x => x.kind === 'details');
  if (!t || !node) return;
  if (t === app.active) t.details.show(node);
  else t.pendingNode = node;
};

app.insertText = text => {
  const t = app.active;
  if (t && t.editor) t.editor.insert(text);
};

function tabCaption(t) {
  if (t.kind !== 'query') return t.title;
  const c = connOf(t);
  if (!c) return `${t.title} - not connected`;
  const who = `${c.info.login || ''}${t.spid ? ` (${t.spid})` : ''}`;
  return `${t.title} - ${c.spec.server || c.info.serverName}.${t.db}${who ? ` (${who})` : ''}`;
}

function renderTabs() {
  els.tabs.innerHTML = '';
  for (const t of app.tabs) {
    const el = h('div', `tab kind-${t.kind}` + (t === app.active ? ' on' : ''));
    const caption = tabCaption(t) + (t.dirty && (t.kind === 'design' || (t.editor && t.editor.value.trim())) ? '*' : '');
    el.title = caption + '\nDouble-click to rename · middle-click to close';
    if (t.running) el.append(h('span', 'spin'));
    else if (t.tranCount > 0) el.append(h('span', 'trandot', '●'));
    el.append(h('span', 'title', caption));
    const x = h('button', 'x', '×');
    x.title = 'Close';
    x.onclick = e => { e.stopPropagation(); closeTab(t); };
    el.append(x);
    el.onclick = () => { if (t !== app.active) activate(t); };
    el.onauxclick = e => { if (e.button === 1) { e.preventDefault(); closeTab(t); } };
    el.ondblclick = async () => {
      if (t.kind === 'details') return;
      const name = await askText('Rename tab', 'Tab name', t.title);
      if (name && name.trim()) { t.title = name.trim(); renderTabs(); persist(); }
    };
    els.tabs.append(el);
  }
  const add = h('button', 'add', '+');
  add.title = 'New Query (Alt+N)';
  add.onclick = () => newTab();
  els.tabs.append(add);
}

// Navigate Backward / Forward between recently active tabs.
let navStack = [], navPos = -1, navigating = false;

function activate(t) {
  app.active = t;
  if (!navigating) {
    navStack = navStack.slice(0, navPos + 1).filter(x => x !== t);
    navStack.push(t);
    navPos = navStack.length - 1;
  }
  for (const x of app.tabs) {
    if (x.editor) x.editor.hidden = x !== t;
    x.res.el.hidden = x !== t;
  }
  els.work.classList.toggle('doc-only', t.kind !== 'query');
  closeIntellisense();
  findSwitch(t.editor || null);
  if (t.kind === 'details' && t.pendingNode) { t.details.show(t.pendingNode); t.pendingNode = null; }
  refreshUi();
  updateCursor();
  requestAnimationFrame(() => {
    layoutGrids(t);
    if (app.active === t && t.editor) t.editor.focus();
  });
  persist();
}

function navigate(step) {
  navStack = navStack.filter(x => app.tabs.includes(x));
  navPos = Math.min(navPos, navStack.length - 1);
  const p = navPos + step;
  if (p < 0 || p >= navStack.length) return;
  navPos = p;
  navigating = true;
  activate(navStack[p]);
  navigating = false;
}

async function closeTab(t, force) {
  if (!force && t.tranCount > 0 && !(await confirmBox('Microsoft SQL Server Management Studio',
    `There are uncommitted transactions in "${t.title}".\n\nClosing the tab will ROLL BACK them. Close anyway?`, 'Close and roll back'))) return false;
  if (!force && t.dirty && t.editor && t.editor.value.trim() && !(await confirmBox('Save changes?', `"${t.title}" has not been saved to a file. Close it anyway?`, 'Close without saving'))) return false;
  if (!force && t.dirty && t.kind === 'design' && !(await confirmBox('Discard changes?', `The table design "${t.title}" has unsaved changes. Close it anyway?`, 'Discard changes'))) return false;
  api('close', { session: t.id }).catch(() => {});
  const i = app.tabs.indexOf(t);
  app.tabs.splice(i, 1);
  t.res.observer.disconnect();
  if (t.editor) t.editor.wrap.remove();
  t.res.el.remove();
  if (!app.tabs.length) newTab();
  else if (app.active === t) activate(app.tabs[Math.min(i, app.tabs.length - 1)]);
  else renderTabs();
  persist();
  return true;
}

async function closeAll(except) {
  for (const t of [...app.tabs]) if (t !== except && !(await closeTab(t))) return;
}

// ---------------------------------------------------------------- status bars

function updateCursor() {
  const t = app.active;
  if (!t || !t.editor) { els.sbLn.textContent = els.sbCol.textContent = els.sbCh.textContent = ''; return; }
  const { start } = t.editor.selection();
  const v = t.editor.value;
  const ls = v.lastIndexOf('\n', start - 1) + 1;
  let col = 0;
  for (let i = ls; i < start; i++) col = v[i] === '\t' ? (Math.floor(col / 4) + 1) * 4 : col + 1;
  els.sbLn.textContent = `Ln ${countNl(v, start) + 1}`;
  els.sbCol.textContent = `Col ${col + 1}`;
  els.sbCh.textContent = `Ch ${start - ls + 1}`;
}

function totalRows(r) {
  return r.items.reduce((n, i) => n + (i.type === 'grid' ? i.total : 0), 0);
}

const hms = ms => {
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':');
};

function updateStatus() {
  const t = app.active;
  if (!t) return;
  const c = connOf(t);
  let cls = '', text = c ? 'Connected.' : 'Disconnected.';
  if (t.running) { cls = ''; text = 'Executing query…'; }
  else if (t.result) {
    if (t.result.cancelled) { cls = 'warn'; text = 'Query was canceled by user.'; }
    else if (t.result.errors) { cls = 'bad'; text = 'Query completed with errors.'; }
    else { cls = 'ok'; text = t.result.parsed ? 'Commands completed successfully.' : 'Query executed successfully.'; }
  }
  els.qsState.className = 'qs-state ' + cls;
  els.qsState.textContent = text;
  if (t.running) els.qsState.prepend(h('span', 'spin'));
  let ver = '';
  if (c && c.info.version) {
    ver = typeOf(t) === 'mssql'
      ? ` (${c.info.version.split('.').slice(0, 2).join('.')} ${c.info.level || ''})`.replace(' )', ')')
      : typeOf(t) === 'cdb' ? ` (${c.info.edition}, ${c.info.version})`
        : ` (${c.info.edition} ${String(c.info.version).split(/[\s-]/)[0]})`;
  }
  els.qsServer.textContent = c ? (c.spec.server || c.info.serverName || '') + ver : '';
  els.qsLogin.textContent = c ? `${c.info.login}${t.spid ? ` (${t.spid})` : ''}` : '';
  els.qsDb.textContent = t.db || '';
  const done = t.result && !t.running;
  els.qsTime.textContent = t.running ? hms(Date.now() - t.started) : done ? hms(t.result.elapsed) : '00:00:00';
  els.qsRows.textContent = `${fmtInt(done && t.result.items ? totalRows(t.result) : 0)} rows`;

  els.sbState.textContent = t.running ? 'Executing query…' : t.result && !t.result.errors && !t.result.cancelled ? 'Query executed successfully.' : 'Ready';
  els.sbTran.hidden = !(t.tranCount > 0);
  els.sbTran.textContent = `⚠ ${t.tranCount} open transaction${t.tranCount > 1 ? 's' : ''} — COMMIT or ROLLBACK`;
}

let timer = 0;
function startTimer() {
  if (timer) return;
  timer = setInterval(() => {
    if (!app.tabs.some(t => t.running)) { clearInterval(timer); timer = 0; return; }
    if (app.active && app.active.running) updateStatus();
  }, 250);
}

// ---------------------------------------------------------------- execution

async function execute(t = app.active, mode = {}) {
  if (!t) return;
  if (t.kind === 'edit') return loadEdit(t);
  if (t.kind === 'design') return loadDesign(t);
  if (t.kind === 'details') return t.details.refresh();
  if (t.running) return;
  if (!(await ensureConnected(t))) return;
  if (mode.parse && typeOf(t) !== 'mssql') { toast('Parse is available for SQL Server connections.', true); return; }
  const ed = t.editor;
  const { start, end, text } = ed.selection();
  let sql = ed.value, offset = 0;
  if (mode.sql) sql = mode.sql;
  else if (end > start) { sql = text; offset = countNl(ed.value, start); }
  if (!sql.trim()) return;
  Object.assign(t, { running: true, stale: false, started: Date.now(), execOffset: offset, result: null });
  if (resultsHidden) toggleResults(true);
  renderResults(t);
  refreshUi();
  startTimer();

  const body = {
    conn: t.conn, session: t.id, database: t.db, sql, maxRows: Number(settings.maxRows), options: settings.options,
    plan: mode.plan || (settings.actualPlan && !mode.parse ? 'actual' : null), mode: mode.parse ? 'parse' : undefined,
  };
  const fail = e => ({ items: [{ type: 'err', message: e.message }], errors: 1, elapsed: Date.now() - t.started, busy: e.busy });
  let r;
  try {
    r = await api('execute', body);
  } catch (e) {
    if (e.notConnected && (await ensureConnected(t, true))) {
      body.conn = t.conn;
      try { r = await api('execute', body); } catch (e2) { r = fail(e2); }
    } else r = fail(e);
  }
  r.finished = new Date().toLocaleString();
  r.parsed = !!mode.parse;
  r.textMode = settings.resultsMode === 'text';
  t.running = false;
  t.stale = !!r.busy;
  t.result = r;
  if (r.tranCount != null) t.tranCount = r.tranCount;
  if (r.spid != null) t.spid = r.spid;
  if (r.database && r.database !== t.db) t.db = r.database;
  addHistory(t, sql, r);
  renderResults(t);
  refreshUi();
  if (t === app.active) layoutGrids(t);
  persist();
}
app.execute = execute;

async function cancelQuery() {
  const t = app.active;
  if (!t || !(t.running || t.stale)) return;
  try { await api('cancel', { session: t.id }); } catch (e) { toast(e.message, true); }
  if (t.stale) { t.stale = false; syncToolbar(); }
}

// ---------------------------------------------------------------- results pane

function buildResults(t) {
  const el = h('div', 'results');
  el.innerHTML = `<div class="rbar">
      <button class="rt on" data-v="grid"><i class="ico">${ICONS.resultsGrid}</i><span class="rtl">Results</span></button>
      <button class="rt" data-v="msg"><i class="ico">${ICONS.messages}</i><span class="rtl">Messages</span></button>
      <button class="rt" data-v="plan" hidden><i class="ico">${ICONS.estPlan}</i><span class="rtl">Execution plan</span></button>
      <span class="rinfo"></span></div>
    <div class="grids"></div><div class="msgs" hidden></div><div class="plans" hidden></div>`;
  els.resultsHost.append(el);
  t.res = {
    el, grids: $('.grids', el), msgs: $('.msgs', el), plans: $('.plans', el), info: $('.rinfo', el),
    btns: [...el.querySelectorAll('.rt')],
  };
  t.res.btns.forEach(b => { b.onclick = () => setView(t, b.dataset.v); });
  t.res.observer = new ResizeObserver(() => { if (t === app.active) layoutGrids(t); });
  t.res.observer.observe(t.res.grids);
  if (t.kind === 'query') renderResults(t);
}

function setView(t, v) {
  t.view = v;
  t.res.btns.forEach(b => b.classList.toggle('on', b.dataset.v === v));
  t.res.grids.hidden = v !== 'grid';
  t.res.msgs.hidden = v !== 'msg';
  t.res.plans.hidden = v !== 'plan';
  if (v === 'grid') layoutGrids(t);
}

function errorText(it, offset) {
  if (!it.number) return it.line != null ? `Line ${it.line + offset}: ${it.message}` : it.message;
  let head = `Msg ${it.number}, Level ${it.level}, State ${it.state}`;
  if (it.proc) head += `, Procedure ${it.proc}, Line ${it.lineNumber}`;
  else if (it.line != null) head += `, Line ${it.line + offset}`;
  return head + '\n' + it.message;
}

function textResults(items, offset) {
  const out = [];
  const show = v => (v === null ? 'NULL' : String(v).replace(/[\r\n\t]+/g, ' '));
  for (const it of items) {
    if (it.type === 'grid') {
      const widths = it.columns.map((c, i) => {
        let w = (c.name || '').length;
        for (const r of it.rows) { const n = show(r[i]).length; if (n > w) w = n; if (w >= 256) { w = 256; break; } }
        return Math.max(w, 4);
      });
      const fmt = cells => cells.map((s, i) => (s.length > widths[i] ? s.slice(0, widths[i]) : s.padEnd(widths[i]))).join(' ').trimEnd();
      out.push(fmt(it.columns.map(c => c.name || '')));
      out.push(widths.map(w => '-'.repeat(w)).join(' '));
      for (const r of it.rows) out.push(fmt(r.map(show)));
      if (it.total > it.rows.length) out.push(`… ${fmtInt(it.total - it.rows.length)} more rows not shown (raise "Maximum rows" in Tools → Options)`);
      out.push('');
    } else if (it.type === 'msg') out.push(it.text);
    else if (it.type === 'err') out.push(errorText(it, offset));
    else if (it.type === 'plan') out.push('(execution plan — see the Execution plan tab)');
  }
  return out.join('\n');
}

function renderResults(t) {
  const R = t.res, r = t.result;
  R.grids.innerHTML = '';
  R.msgs.innerHTML = '';
  R.plans.innerHTML = '';
  R.info.textContent = '';
  R.btns[1].classList.remove('bad');
  R.btns[2].hidden = true;
  t.grids = [];
  if (t.running) {
    R.grids.innerHTML = '<div class="empty"><span class="spin"></span>Executing query…</div>';
    setView(t, 'grid');
    return;
  }
  if (!r) return;
  const offset = t.execOffset || 0;
  const sets = r.items.filter(i => i.type === 'grid');
  const plans = r.items.filter(i => i.type === 'plan');
  R.btns[0].querySelector('.rtl').textContent = r.textMode ? 'Results' : 'Results';
  if (r.textMode) {
    R.grids.append(h('pre', 'textres', textResults(r.items, offset)));
  } else {
    sets.forEach((d, i) => {
      const g = new Grid(d, { index: i, count: sets.length });
      t.grids.push(g);
      R.grids.append(g.el);
    });
    if (!sets.length) R.grids.innerHTML = `<div class="empty">${plans.length ? 'See the Execution plan tab.' : 'No result sets were returned. See the Messages tab.'}</div>`;
  }

  const frag = document.createDocumentFragment();
  let any = false;
  for (const it of r.items) {
    if (it.type === 'grid' || it.type === 'plan') continue;
    any = true;
    const line = h('div', 'm' + (it.type === 'err' ? ' err' : ''), it.type === 'err' ? errorText(it, offset) : it.text);
    if (it.type === 'err' && !it.proc && it.line != null) {
      const ln = it.line + offset;
      line.classList.add('link');
      line.title = `Go to line ${ln}`;
      line.onclick = () => t.editor.gotoLine(ln);
    }
    frag.append(line);
  }
  if (!any) frag.append(h('div', 'm', 'Commands completed successfully.'));
  frag.append(h('div', 'm dim', `Completion time: ${r.finished}`));
  R.msgs.append(frag);
  R.btns[1].classList.toggle('bad', !!r.errors);
  if (plans.length) {
    R.btns[2].hidden = false;
    plans.forEach((p, i) => R.plans.append(renderPlan(p.xml, i)));
  }
  const onlyPlan = plans.length && !sets.length;
  setView(t, onlyPlan ? 'plan' : sets.length || r.textMode ? 'grid' : 'msg');
}

function layoutGrids(t) {
  const host = t.res.grids, gs = t.grids;
  if (!gs.length || host.hidden || !host.clientHeight) return;
  const avail = host.clientHeight - 8;
  if (gs.length === 1) {
    gs[0].el.style.height = Math.max(80, avail) + 'px';
  } else {
    const per = Math.max(150, Math.floor((avail - (gs.length - 1) * 4) / Math.min(gs.length, 3)));
    for (const g of gs) {
      const need = (g.cap.hidden ? 0 : CAP_H) + HEAD_H + Math.max(2, g.d.rows.length) * ROW_H + 20;
      g.el.style.height = Math.min(need, per) + 'px';
    }
  }
  gs.forEach(g => g.render(true));
}

// ---------------------------------------------------------------- edit tabs ("Edit Top 200 Rows")

function buildEditView(t) {
  const R = t.res;
  R.el.innerHTML = '';
  const bar = h('div', 'editbar');
  const title = h('span', 'etitle');
  const info = h('span', 'einfo');
  const top = h('select');
  for (const n of [200, 1000, 5000]) top.append(new Option(`Top ${n}`, n));
  const btn = (text, tip, fn, cls) => { const b = h('button', cls, text); b.title = tip; b.onclick = fn; return b; };
  bar.append(title, info, h('span', 'spacer'), top,
    btn('Refresh', 'Reload rows (F5)', () => loadEdit(t)),
    btn('+ Add row', 'Insert a new row', () => addRow(t)),
    btn('Delete selected', 'Delete the selected rows (Del)', () => t.edit.grid && t.edit.grid.deleteSelected(), 'danger'));
  const body = h('div', 'editbody');
  R.el.append(bar, body);
  top.onchange = () => loadEdit(t);
  t.edit = { bar, body, title, info, top, grid: null, data: null };
  title.textContent = `${t.db}.${t.target.schema}.${t.target.name}`;
  body.append(h('div', 'empty', 'Connecting…'));
}

async function loadEdit(t) {
  const E = t.edit;
  if (!(await ensureConnected(t))) { E.body.replaceChildren(h('div', 'empty', 'Not connected.')); return; }
  const c = app.conns.get(t.conn);
  E.title.textContent = `${c.spec.server || c.info.serverName}.${t.db} - ${t.target.schema && t.target.schema !== t.db ? t.target.schema + '.' : ''}${t.target.name}`;
  E.body.replaceChildren(h('div', 'empty', 'Loading…'));
  t.running = true;
  refreshUi();
  try {
    const data = await api('editLoad', { conn: t.conn, db: t.db, schema: t.target.schema, name: t.target.name, top: Number(E.top.value) });
    t.loaded = true;
    E.data = data;
    const readOnly = new Map();
    for (const [r, ci] of data.truncated) {
      if (!readOnly.has(data.rows[r])) readOnly.set(data.rows[r], new Set());
      readOnly.get(data.rows[r]).add(ci);
    }
    const target = { conn: t.conn, db: t.db, schema: t.target.schema, name: t.target.name };
    const keyOf = row => Object.fromEntries(data.pk.cols.map(k => [k.name, row[data.columns.findIndex(c => c.name === k.name)]]));
    const grid = new Grid({ columns: data.columns, rows: data.rows, total: data.rows.length }, {
      emptyText: `This table is empty — it has no rows. ${data.pk ? 'Use "+ Add row" to insert one.' : ''}`,
      edit: {
        canEdit: (r, c) => !!data.pk && data.columns[c].editable && !(readOnly.get(data.rows[r]) || { has: () => false }).has(c),
        commit: async (r, c, value) => {
          const res = await api('editUpdate', { ...target, key: keyOf(data.rows[r]), values: { [data.columns[c].name]: value } });
          toast('Saved');
          return res.row;
        },
        remove: async rows => {
          if (!data.pk) { toast('This table has no primary key; rows cannot be deleted here.', true); return; }
          if (!rows.length || !(await confirmBox('Delete rows', `Permanently delete ${rows.length} row${rows.length > 1 ? 's' : ''} from ${target.schema}.${target.name}?`, 'Delete'))) return;
          let deleted = 0;
          for (const r of [...rows].sort((a, b) => b - a)) {
            try {
              await api('editDelete', { ...target, key: keyOf(data.rows[r]) });
              data.rows.splice(r, 1);
              deleted++;
            } catch (e) { toast(e.message, true); break; }
          }
          grid.applyView();
          E.info.textContent = editInfo(data);
          if (deleted) toast(`Deleted ${deleted} row${deleted > 1 ? 's' : ''}`);
        },
      },
    });
    E.grid = grid;
    grid.el.classList.add('fill');
    E.body.replaceChildren(grid.el);
    E.info.textContent = editInfo(data);
    requestAnimationFrame(() => grid.render(true));
  } catch (e) {
    E.body.replaceChildren(h('div', 'empty err', e.message));
  }
  t.running = false;
  refreshUi();
}

function editInfo(data) {
  return `· ${fmtInt(data.rows.length)} rows · ${data.pk ? 'double-click a cell (or F2) to edit, Ctrl+0 = NULL — changes are saved immediately' : 'read-only: this table has no primary key'}`;
}

async function addRow(t) {
  const data = t.edit.data;
  if (!data) return;
  if (!data.pk) { toast('This table has no primary key; rows cannot be added here.', true); return; }
  const cols = data.columns.filter(c => c.editable);
  const res = await formDialog({
    title: `Add row — ${t.target.schema}.${t.target.name}`,
    intro: 'Leave a field empty to use the column default (or NULL). Type NULL to store NULL explicitly.',
    width: '560px',
    fields: cols.map(c => ({ name: c.name, label: `${c.name}  (${c.sqlType}${c.nullable ? ', null' : ''}${c.hasDefault ? ', has default' : ''})`, value: '' })),
    ok: 'Insert',
    onSubmit: async v => {
      const vals = {};
      for (const c of cols) if (v[c.name] !== '') vals[c.name] = v[c.name] === 'NULL' ? null : v[c.name];
      return api('editInsert', { conn: t.conn, db: t.db, schema: t.target.schema, name: t.target.name, values: vals });
    },
  });
  if (!res) return;
  if (res.reload) { toast('Row inserted'); return loadEdit(t); }
  if (res.row) data.rows.push(res.row);
  t.edit.grid.applyView();
  t.edit.info.textContent = editInfo(data);
  const sc = t.edit.grid.scroller;
  sc.scrollTop = sc.scrollHeight;
  toast('Row inserted');
}

// ---------------------------------------------------------------- table designer ("Design")

const TYPE_HINTS = {
  mssql: ['int', 'bigint', 'smallint', 'tinyint', 'bit', 'decimal(18, 2)', 'numeric(18, 2)', 'money', 'smallmoney', 'float', 'real',
    'date', 'datetime', 'datetime2(7)', 'smalldatetime', 'datetimeoffset(7)', 'time(7)', 'char(10)', 'varchar(50)', 'varchar(max)',
    'nchar(10)', 'nvarchar(50)', 'nvarchar(max)', 'text', 'ntext', 'binary(50)', 'varbinary(50)', 'varbinary(max)', 'image',
    'uniqueidentifier', 'xml', 'sql_variant', 'hierarchyid', 'geography', 'geometry'],
  mysql: ['INT', 'BIGINT', 'MEDIUMINT', 'SMALLINT', 'TINYINT', 'TINYINT(1)', 'BOOLEAN', 'BIT(1)', 'DECIMAL(18,2)', 'DOUBLE', 'FLOAT',
    'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR', 'CHAR(10)', 'VARCHAR(255)', 'TINYTEXT', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
    'BINARY(16)', 'VARBINARY(255)', 'BLOB', 'LONGBLOB', 'JSON', "ENUM('a','b')", "SET('a','b')"],
  postgres: ['integer', 'bigint', 'smallint', 'serial', 'bigserial', 'boolean', 'numeric(18,2)', 'real', 'double precision', 'money',
    'date', 'time', 'timestamp', 'timestamptz', 'interval', 'character varying(255)', 'varchar(255)', 'char(10)', 'text',
    'json', 'jsonb', 'uuid', 'bytea', 'inet', 'cidr', 'macaddr', 'xml', 'integer[]', 'text[]'],
  sqlite: ['INTEGER', 'TEXT', 'REAL', 'NUMERIC', 'BLOB', 'VARCHAR(255)', 'CHAR(10)', 'BOOLEAN', 'DATE', 'DATETIME',
    'DECIMAL(10,2)', 'DOUBLE', 'FLOAT', 'BIGINT', 'JSON'],
  oracle: ['NUMBER', 'NUMBER(1)', 'NUMBER(10)', 'NUMBER(18,2)', 'INTEGER', 'FLOAT', 'BINARY_FLOAT', 'BINARY_DOUBLE',
    'VARCHAR2(255 CHAR)', 'VARCHAR2(4000 CHAR)', 'NVARCHAR2(255)', 'CHAR(1)', 'DATE', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE',
    'INTERVAL DAY TO SECOND', 'CLOB', 'NCLOB', 'BLOB', 'RAW(16)', 'XMLTYPE'],
};
const DIALECT_OF = { mssql: 'mssql', mysql: 'mysql', mariadb: 'mysql', postgres: 'postgres', sqlite: 'sqlite', oracle: 'oracle' };

function typeList(dialect) {
  const id = 'types-' + dialect;
  if (!document.getElementById(id)) {
    const dl = h('datalist');
    dl.id = id;
    for (const ty of TYPE_HINTS[dialect] || []) dl.append(new Option(ty));
    document.body.append(dl);
  }
  return id;
}

// "nvarchar(50)" -> { base: 'nvarchar', args: '50', rest: '' }; "int(11) unsigned" -> rest 'unsigned'.
function parseType(s) {
  const m = /^\s*([^(]*?)\s*(?:\(([^)]*)\)\s*(.*))?$/.exec(String(s || ''));
  return { base: m[1], args: m[2] == null ? '' : m[2].trim(), rest: (m[3] || '').trim() };
}
const formatType = (base, args, rest) => `${base}${args ? `(${args})` : ''}${rest ? ' ' + rest : ''}`;
const LEN_TYPE = /^(n?varchar2?|n?char|varbinary|binary|character( varying)?|raw|bit varying|varbit)$/i;
const DEC_TYPE = /^(decimal|numeric|number|dec)$/i;

const PROP_HELP = {
  name: 'The name of the column.',
  nullable: 'Whether the column accepts NULL (empty) values.',
  type: 'The data type of the column. Pick one from the list or type any type the database supports.',
  default: "The value stored when a new row gives no value for this column: a constant like 0 or 'text', or an expression like getdate().",
  length: 'The maximum number of characters (or bytes) the column can hold.',
  precision: 'The total number of digits the number can have.',
  scale: 'How many of those digits come after the decimal point.',
  collation: 'How text in this column is sorted and compared (case / accent sensitivity). Leave empty for the database default.',
  computed: 'The expression this column is computed from. It cannot be changed here.',
  description: 'A description of the column, stored in the database with the table.',
  identity: 'Whether the database numbers new rows automatically (IDENTITY / AUTO_INCREMENT).',
  identityMssql: 'Whether the database numbers new rows automatically. SQL Server cannot turn IDENTITY on or off for an existing column — add a new column instead.',
  identitySqlite: 'SQLite numbers rows automatically (AUTOINCREMENT) only for a single INTEGER PRIMARY KEY column.',
  seed: 'The first number the identity column gives out.',
  incr: 'How much the identity number grows for each new row.',
  unique: 'Whether duplicate values are rejected (UNIQUE constraint). A primary key is always unique.',
  check: 'A condition every value must satisfy (CHECK constraint), for example Price >= 0.',
};

function buildDesignView(t) {
  const R = t.res;
  R.el.innerHTML = '';
  const bar = h('div', 'editbar');
  const title = h('span', 'etitle');
  const btn = (text, tip, fn, cls) => { const b = h('button', cls, text); b.title = tip; b.onclick = fn; return b; };
  const nameBox = h('span', 'design-name');
  const schemaInput = h('input');
  schemaInput.placeholder = 'schema';
  schemaInput.value = t.target.schema || '';
  const nameInput = h('input');
  nameInput.placeholder = 'Table name';
  nameBox.append('Schema ', schemaInput, '  Name ', nameInput);
  bar.append(title, nameBox, h('span', 'spacer'),
    btn('+ Add Column', 'Add a new column at the end', () => designAdd(t)),
    btn('Delete Column', 'Delete the selected column', () => designDelete(t), 'danger'),
    btn('↑', 'Move the selected column up', () => designMove(t, -1)),
    btn('↓', 'Move the selected column down', () => designMove(t, 1)),
    h('span', 'tsep'),
    btn('Generate Change Script…', 'Show the SQL that Save would run', () => saveDesign(t, true)),
    btn('Save', 'Apply the changes to the database', () => saveDesign(t, false), 'primary'),
    btn('Refresh', 'Reload the table structure (discard changes)', () => loadDesign(t)));
  const wrap = h('div', 'designbody');
  const body = h('div', 'design-grid');
  const split = h('div', 'dsplit');
  const props = { el: h('div', 'dprops'), title: h('div', 'dprops-title', 'Column Properties'), list: h('div', 'dprops-list'), help: h('div', 'dprops-help') };
  props.el.append(props.title, props.list, props.help);
  props.el.style.height = (settings.designPropsH || 250) + 'px';
  props.el.hidden = split.hidden = true;
  wrap.append(body, split, props.el);
  dragSplit(split, 'resizing-y', e => {
    const box = wrap.getBoundingClientRect();
    settings.designPropsH = clamp(box.bottom - e.clientY, 90, box.height - 90);
    props.el.style.height = settings.designPropsH + 'px';
  });
  const note = h('div', 'design-note', 'Nothing is changed in the database until you click Save — the exact SQL is shown for your approval first.');
  R.el.append(bar, wrap, note);
  t.design = { bar, title, body, split, props, nameBox, schemaInput, nameInput, rows: [], sel: -1, dialect: null, supports: {}, collapsed: new Set(), trs: [] };
  body.append(h('div', 'empty', 'Connecting…'));
}

async function loadDesign(t) {
  const D = t.design;
  if (!(await ensureConnected(t))) { D.body.replaceChildren(h('div', 'empty', 'Not connected.')); return; }
  const c = app.conns.get(t.conn);
  D.dialect = DIALECT_OF[c.spec.type || 'mssql'];
  if (!D.dialect) { D.body.replaceChildren(h('div', 'empty err', `The table designer is not available for ${c.info.edition}.`)); return; }
  D.nameBox.hidden = !t.target.isNew;
  D.schemaInput.hidden = !t.target.isNew || D.dialect === 'mysql' || D.dialect === 'sqlite';
  D.title.textContent = t.target.isNew
    ? `New table in ${c.spec.server || c.info.serverName}.${t.db}`
    : `${c.spec.server || c.info.serverName}.${t.db} - ${t.target.schema && t.target.schema !== t.db ? t.target.schema + '.' : ''}${t.target.name}`;
  D.body.replaceChildren(h('div', 'empty', 'Loading…'));
  D.props.el.hidden = D.split.hidden = true;
  try {
    const r = await api('designLoad', { conn: t.conn, db: t.db, schema: t.target.schema, name: t.target.name, isNew: !!t.target.isNew });
    t.loaded = true;
    D.supports = r.supports || {};
    if (t.target.isNew) {
      D.rows = [newDesignRow({ name: 'id', type: { mssql: 'int', mysql: 'INT', postgres: 'integer', sqlite: 'INTEGER', oracle: 'NUMBER(10)' }[D.dialect], nullable: false, pk: true, identity: true })];
      D.sel = 0;
    } else {
      D.rows = r.columns.map(col => ({ ...col, orig: col.name }));
      D.sel = D.rows.length ? 0 : -1;
      t.dirty = false;
    }
    renderDesign(t);
    renderTabs();
  } catch (e) {
    D.body.replaceChildren(h('div', 'empty err', e.message));
  }
}

function newDesignRow(over = {}) {
  return {
    name: '', type: '', nullable: true, default: '', pk: false, identity: false, seed: '1', incr: '1',
    unique: false, check: '', collation: '', description: '', ...over,
  };
}

function designChanged(t) {
  if (!t.dirty) { t.dirty = true; renderTabs(); }
}

function designSelect(t, i) {
  const D = t.design;
  if (D.sel === i) return;
  D.sel = i;
  D.trs.forEach((x, k) => { x.classList.toggle('sel', k === i); x.firstChild.textContent = k === i ? '▶' : ''; });
  renderProps(t);
}

function renderDesign(t) {
  const D = t.design;
  const list = typeList(D.dialect);
  const table = h('table', 'designer');
  table.innerHTML = '<thead><tr><th></th><th>Column Name</th><th>Data Type</th><th>Allow Nulls</th><th>Default Value</th><th>Primary Key</th><th>Identity</th></tr></thead>';
  const tbody = h('tbody');
  D.trs = D.rows.map((row, i) => {
    const tr = h('tr', i === D.sel ? 'sel' : '');
    if (row.generated) tr.classList.add('ro');
    const marker = h('td', 'dmark', i === D.sel ? '▶' : '');
    const cell = el => { const td = h('td'); td.append(el); return td; };
    const text = (key, attrs = {}) => {
      const inp = h('input');
      inp.value = row[key] || '';
      Object.assign(inp, attrs);
      inp.disabled = !!row.generated;
      inp.oninput = () => { row[key] = inp.value; designChanged(t); renderProps(t); };
      return inp;
    };
    const check = key => {
      const inp = h('input');
      inp.type = 'checkbox';
      inp.checked = !!row[key];
      inp.disabled = !!row.generated || (key === 'nullable' && row.pk);
      inp.onchange = () => {
        row[key] = inp.checked;
        if (key === 'pk' && inp.checked) row.nullable = false;
        designChanged(t);
        if (key === 'pk') renderDesign(t);
        else renderProps(t);
      };
      return inp;
    };
    const name = text('name', { spellcheck: false });
    const typeInput = text('type', { spellcheck: false });
    typeInput.setAttribute('list', list);
    const nullable = check('nullable'), dflt = text('default', { spellcheck: false, placeholder: row.generated ? '' : '(none)' });
    const pk = check('pk'), identity = check('identity');
    // Called when the Column Properties pane changes this row.
    tr.sync = () => {
      name.value = row.name || '';
      typeInput.value = row.generated ? (row.computed ? `computed: ${row.computed}` : `${row.type} (generated)`) : row.type || '';
      nullable.checked = !!row.nullable;
      nullable.disabled = !!row.generated || !!row.pk;
      dflt.value = row.default || '';
      identity.checked = !!row.identity;
    };
    tr.sync();
    tr.append(marker, cell(name), cell(typeInput), cell(nullable), cell(dflt), cell(pk), cell(identity));
    tr.addEventListener('focusin', () => designSelect(t, i));
    marker.onclick = () => { designSelect(t, i); name.focus(); };
    tbody.append(tr);
    return tr;
  });
  table.append(tbody);
  D.body.replaceChildren(table);
  D.props.el.hidden = D.split.hidden = false;
  renderProps(t);
}

// SSMS-style Column Properties pane for the selected column.
function renderProps(t, focusKey) {
  const D = t.design, P = D.props;
  const row = D.rows[D.sel];
  const S = D.supports || {}, dl = D.dialect;
  P.title.textContent = row ? `Column Properties — ${row.name || '(new column)'}` : 'Column Properties';
  if (!row) {
    P.list.replaceChildren(h('div', 'empty', 'Click a column above to see and change its properties.'));
    P.help.replaceChildren();
    return;
  }
  const ro = !!row.generated;
  const table = h('table', 'props');
  const showHelp = (label, key) => P.help.replaceChildren(h('b', null, label), h('div', null, PROP_HELP[key] || ''));
  const changed = rerender => {
    designChanged(t);
    if (D.trs[D.sel]) D.trs[D.sel].sync();
    P.title.textContent = `Column Properties — ${row.name || '(new column)'}`;
    // Length / Precision / Scale rewrite the data type shown above them.
    const typeEl = P.list.querySelector('[data-key="type"]');
    if (typeEl && typeEl !== document.activeElement && !ro) typeEl.value = row.type || '';
    if (rerender) renderProps(t, rerender);
  };
  let tb;
  const group = (key, label) => {
    const closed = D.collapsed.has(key);
    tb = h('tbody', closed ? 'collapsed' : '');
    const tr = h('tr', 'cat');
    const td = h('td', null);
    td.colSpan = 2;
    td.append(h('span', 'tog', closed ? '+' : '−'), label);
    tr.append(td);
    tr.onclick = () => { if (closed) D.collapsed.delete(key); else D.collapsed.add(key); renderProps(t); };
    tb.append(tr);
    table.append(tb);
  };
  const prop = (key, label, control, opts = {}) => {
    const tr = h('tr', opts.sub ? 'sub' : '');
    const val = h('td', 'pv');
    control.dataset.key = key;
    val.append(control);
    tr.append(h('td', 'pn', label), val);
    const helpKey = opts.help || key;
    tr.addEventListener('focusin', () => showHelp(label, helpKey));
    tr.addEventListener('mousedown', () => showHelp(label, helpKey));
    tb.append(tr);
  };
  const text = (key, opts = {}) => {
    const inp = h('input');
    inp.value = opts.value != null ? opts.value : row[key] == null ? '' : String(row[key]);
    inp.spellcheck = false;
    if (opts.placeholder) inp.placeholder = opts.placeholder;
    inp.disabled = ro || !!opts.disabled;
    inp.oninput = () => { (opts.set || (v => { row[key] = v; }))(inp.value); changed(false); };
    // Changing the data type can show or hide Length / Precision, so refresh when it is committed.
    if (opts.rerender) inp.onchange = () => renderProps(t, key);
    return inp;
  };
  const yesno = (key, opts = {}) => {
    const sel = h('select');
    sel.append(new Option('Yes', '1'), new Option('No', ''));
    sel.value = row[key] ? '1' : '';
    sel.disabled = ro || !!opts.disabled;
    sel.onchange = () => { row[key] = !!sel.value; changed(key); };
    return sel;
  };

  group('general', '(General)');
  prop('name', '(Name)', text('name'));
  prop('nullable', 'Allow Nulls', yesno('nullable', { disabled: row.pk }));
  const typeInp = text('type', { rerender: true, value: ro ? (row.computed ? 'computed' : `${row.type} (generated)`) : row.type || '' });
  typeInp.setAttribute('list', typeList(dl));
  prop('type', 'Data Type', typeInp);
  prop('default', 'Default Value or Binding', text('default', { placeholder: row.identity ? '(identity)' : '(none)', disabled: row.identity }));
  const ty = parseType(row.type);
  if (!ro && LEN_TYPE.test(ty.base)) {
    prop('length', 'Length', text('length', {
      value: ty.args,
      placeholder: dl === 'mssql' ? 'e.g. 50 or max' : 'e.g. 255',
      set: v => { const p = parseType(row.type); row.type = formatType(p.base, v.trim(), p.rest); },
    }));
  }
  if (!ro && DEC_TYPE.test(ty.base)) {
    const [p0 = '', s0 = ''] = ty.args.split(',').map(x => x.trim());
    const setPart = (idx, v) => {
      const p = parseType(row.type);
      const parts = p.args ? p.args.split(',').map(x => x.trim()) : ['', ''];
      parts[idx] = v.trim();
      if (!parts[0] && parts[1]) parts[0] = dl === 'oracle' ? '38' : '18';
      row.type = formatType(p.base, parts[1] ? `${parts[0]},${parts[1]}` : parts[0], p.rest);
    };
    prop('precision', 'Precision', text('precision', { value: p0, placeholder: dl === 'oracle' ? '(any)' : '18', set: v => setPart(0, v) }));
    prop('scale', 'Scale', text('scale', { value: s0, placeholder: '0', set: v => setPart(1, v) }));
  }

  group('designer', 'Table Designer');
  if (S.collation) prop('collation', 'Collation', text('collation', { placeholder: '<database default>' }));
  if (ro) prop('computed', 'Computed Column Specification', text('computed', { value: row.computed || row.rawDef || row.type, disabled: true }));
  if (S.description) prop('description', 'Description', text('description', { placeholder: '(none)' }));
  const fixedIdentity = dl === 'mssql' && !!row.orig;
  prop('identity', '(Is Identity)', yesno('identity', { disabled: fixedIdentity }),
    { help: dl === 'mssql' ? 'identityMssql' : dl === 'sqlite' ? 'identitySqlite' : 'identity' });
  if (row.identity && S.seed) {
    prop('incr', 'Identity Increment', text('incr', { placeholder: '1', disabled: fixedIdentity }), { sub: true });
    prop('seed', 'Identity Seed', text('seed', { placeholder: '1', disabled: fixedIdentity }), { sub: true });
  }
  prop('unique', 'Is Unique', yesno('unique', { disabled: row.pk }));
  prop('check', 'Check Constraint', text('check', { placeholder: '(none)' }));

  P.list.replaceChildren(table);
  if (focusKey) {
    const el = P.list.querySelector(`[data-key="${focusKey}"]`);
    if (el) el.focus();
  } else {
    P.help.replaceChildren(h('div', 'muted', 'Click a property to see what it means.'));
  }
}

function designAdd(t) {
  const D = t.design;
  if (!D.dialect) return;
  D.rows.push(newDesignRow());
  D.sel = D.rows.length - 1;
  designChanged(t);
  renderDesign(t);
  const last = D.body.querySelector('tbody tr:last-child input');
  if (last) last.focus();
}

function designDelete(t) {
  const D = t.design;
  if (D.sel < 0 || !D.rows[D.sel]) { toast('Click a column first, then Delete Column.', true); return; }
  D.rows.splice(D.sel, 1);
  D.sel = Math.min(D.sel, D.rows.length - 1);
  designChanged(t);
  renderDesign(t);
}

function designMove(t, step) {
  const D = t.design, i = D.sel, j = i + step;
  if (i < 0 || j < 0 || j >= D.rows.length) return;
  [D.rows[i], D.rows[j]] = [D.rows[j], D.rows[i]];
  D.sel = j;
  designChanged(t);
  renderDesign(t);
  if (D.dialect !== 'sqlite') toast('Column order is only used for new tables; existing tables keep their column order.');
}

function reviewScript(script, dialect, onlyShow) {
  const transactional = dialect === 'mssql' || dialect === 'postgres' || dialect === 'sqlite';
  return formDialog({
    title: onlyShow ? 'Change Script' : 'Save changes to the table?',
    width: '820px',
    ok: onlyShow ? 'Close' : 'Apply changes',
    intro: onlyShow
      ? 'This is the SQL that Save would run.'
      : `The following SQL will run now.${transactional ? ' It runs in a transaction: if any statement fails, nothing is changed.' : ' Note: this database commits each structure change immediately (no rollback of DDL).'}`,
    build(d) {
      const ta = h('textarea', 'script-view');
      ta.value = script;
      ta.readOnly = true;
      ta.spellcheck = false;
      d.body.insertBefore(ta, d.body.lastChild);
      const open = h('button', null, 'Open in Query Window');
      open.type = 'button';
      open.onclick = () => d.close('open');
      d.foot.prepend(open);
      if (onlyShow) d.foot.querySelector('button[type=button]:last-child').hidden = true;
    },
  });
}

async function saveDesign(t, onlyShow) {
  const D = t.design;
  if (!D.dialect) return;
  const isNew = !!t.target.isNew;
  const name = isNew ? D.nameInput.value.trim() : t.target.name;
  const schema = isNew && !D.schemaInput.hidden ? D.schemaInput.value.trim() || t.target.schema : t.target.schema;
  if (isNew && !name) { toast('Enter a name for the new table.', true); D.nameInput.focus(); return; }
  const target = { conn: t.conn, db: t.db, schema, name };
  let script;
  try {
    ({ script } = await api('designScript', { ...target, columns: D.rows, isNew }));
  } catch (e) { toast(e.message, true); return; }
  if (!script.trim()) { toast('There are no changes to save.'); return; }
  const answer = await reviewScript(script, D.dialect, onlyShow);
  if (answer === 'open') { newTab({ conn: t.conn, db: t.db, title: `${name} (change script)`, sql: script }); return; }
  if (!answer || onlyShow) return;
  try {
    await api('designApply', { ...target, script });
  } catch (e) {
    showText('The changes could not be saved', `Nothing was changed${D.dialect === 'mysql' || D.dialect === 'oracle' ? ' by the failing statement (earlier statements in the script may already be committed)' : ''}.\n\n${e.message}\n\n--- Script ---\n${script}`);
    return;
  }
  toast(isNew ? `Table ${name} created. Refresh Object Explorer to see it.` : 'Table saved.');
  if (isNew) {
    t.target = { schema, name };
    t.title = `${name} (Design)`;
  }
  t.dirty = false;
  await loadDesign(t);
  renderTabs();
  persist();
}

// ---------------------------------------------------------------- history

function addHistory(t, sql, r) {
  try {
    const list = load(HISTORY) || [];
    list.unshift({ at: Date.now(), conn: t.conn, server: connName(t.conn), db: t.db, sql: sql.slice(0, 20000), ms: r.elapsed, ok: !r.errors });
    localStorage.setItem(HISTORY, JSON.stringify(list.slice(0, 300)));
  } catch { /* storage full */ }
}

function showHistory() {
  const list = load(HISTORY) || [];
  formDialog({
    title: 'Query History',
    width: '820px',
    ok: 'Close',
    cancel: 'Clear history',
    fields: [{ name: 'q', label: 'Search', placeholder: 'Filter by text, server or database…' }],
    build(d) {
      const box = h('div', 'hist');
      d.body.append(box);
      const render = () => {
        const q = d.inputs.q.value.toLowerCase();
        box.innerHTML = '';
        const hits = list.filter(e => !q || (e.sql + ' ' + e.server + ' ' + e.db).toLowerCase().includes(q)).slice(0, 150);
        for (const e of hits) {
          const row = h('div', 'hrow' + (e.ok ? '' : ' bad'));
          row.append(h('div', 'hmeta', `${new Date(e.at).toLocaleString()} · ${e.server} · ${e.db} · ${fmtMs(e.ms)}${e.ok ? '' : ' · errors'}`));
          row.append(h('pre', 'hsql', e.sql.length > 400 ? e.sql.slice(0, 400) + '…' : e.sql));
          row.title = 'Click: open in a new tab · Shift+click: insert into the current editor';
          row.onclick = ev => {
            if (ev.shiftKey && app.active && app.active.editor) app.insertText(e.sql);
            else newTab({ conn: app.conns.has(e.conn) ? e.conn : defaultConn(), db: e.db, sql: e.sql });
            d.close(null);
          };
          box.append(row);
        }
        if (!hits.length) box.append(h('div', 'empty', list.length ? 'No matches.' : 'No queries have been executed yet.'));
      };
      d.inputs.q.addEventListener('input', render);
      d.foot.querySelector('button[type=button]').onclick = () => {
        localStorage.removeItem(HISTORY);
        list.length = 0;
        render();
      };
      render();
    },
  });
}

// ---------------------------------------------------------------- options, files, help

async function showQueryOptions() {
  const o = settings.options;
  const r = await formDialog({
    title: 'Query Options',
    intro: 'Applied to every query window before its next execution.',
    width: '520px',
    fields: [
      { name: 'nocount', label: 'SET NOCOUNT', type: 'checkbox', value: o.nocount },
      { name: 'statsIO', label: 'SET STATISTICS IO', type: 'checkbox', value: o.statsIO },
      { name: 'statsTime', label: 'SET STATISTICS TIME', type: 'checkbox', value: o.statsTime },
      { name: 'xactAbort', label: 'SET XACT_ABORT', type: 'checkbox', value: o.xactAbort },
      { name: 'isolation', label: 'SET TRANSACTION ISOLATION LEVEL', type: 'select', value: o.isolation,
        options: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SNAPSHOT', 'SERIALIZABLE'] },
      { name: 'maxRows', label: 'Maximum rows per result set', type: 'select', value: String(settings.maxRows), options: ['1000', '5000', '20000', '100000'] },
    ],
  });
  if (!r) return;
  const { maxRows, ...opts } = r;
  settings.options = opts;
  settings.maxRows = maxRows;
  persist();
}

async function showOptions() {
  const r = await formDialog({
    title: 'Options',
    width: '520px',
    fields: [
      { name: 'theme', label: 'Color theme', type: 'select', value: settings.theme, options: [['blue', 'Blue (classic SSMS)'], ['light', 'Light'], ['dark', 'Dark']] },
      { name: 'fontSize', label: 'Editor font size', type: 'select', value: String(settings.fontSize), options: ['11', '12', '13', '14', '16', '18'] },
      { name: 'lineNumbers', label: 'Show line numbers', type: 'checkbox', value: settings.lineNumbers },
      { name: 'intellisense', label: 'Enable IntelliSense', type: 'checkbox', value: settings.intellisense },
      { name: 'treeRowCounts', label: 'Show row counts next to tables in Object Explorer', type: 'checkbox', value: settings.treeRowCounts },
      { name: 'maxRows', label: 'Maximum rows per result set', type: 'select', value: String(settings.maxRows), options: ['1000', '5000', '20000', '100000'] },
    ],
  });
  if (!r) return;
  applyTheme(r.theme);
  settings.fontSize = Number(r.fontSize);
  setEditorFont(settings.fontSize);
  settings.lineNumbers = r.lineNumbers;
  settings.intellisense = r.intellisense;
  settings.treeRowCounts = r.treeRowCounts;
  settings.maxRows = r.maxRows;
  for (const t of app.tabs) if (t.editor) t.editor.refresh();
  applyLayout();
  syncToolbar();
  persist();
}

async function readTextFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0xFF && buf[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf.subarray(2));
  if (buf[0] === 0xFE && buf[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf.subarray(2));
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { return new TextDecoder('windows-1256').decode(buf); }
}

els.file.onchange = async () => {
  const f = els.file.files[0];
  els.file.value = '';
  if (!f) return;
  try {
    const text = (await readTextFile(f)).replace(/\r\n?/g, '\n');
    newTab({ title: f.name, sql: text });
  } catch (e) { toast(e.message, true); }
};

function saveFile(t = app.active) {
  if (!t || !t.editor) return;
  const name = t.title.replace(/[\\/:*?"<>|]+/g, '_') + (/\.sql$/i.test(t.title) ? '' : '.sql');
  download('﻿' + t.editor.value.replace(/\n/g, '\r\n'), name, 'application/sql;charset=utf-8');
  t.dirty = false;
  renderTabs();
  persist();
}

const editorCmd = fn => () => { const t = app.active; if (t && t.editor) { t.editor.focus(); fn(t.editor); } };
const execCmd = cmd => editorCmd(() => document.execCommand(cmd));
const pasteCmd = editorCmd(async ed => {
  try { ed.insert(await navigator.clipboard.readText()); } catch { toast('Use Ctrl+V to paste.', true); }
});
const goToLine = editorCmd(async ed => {
  const v = await askText('Go To Line', `Line number (1 - ${ed.lineCount}):`, '', { type: 'number' });
  if (v) ed.gotoLine(clamp(parseInt(v, 10) || 1, 1, ed.lineCount));
});

const HELP = `Execute ............................ F5 · Ctrl+Enter · Ctrl+E   (runs only the selection, if any)
Parse (check syntax) ............... Ctrl+F5
Estimated execution plan ........... Ctrl+L
Include actual execution plan ...... Ctrl+M
Cancel running query ............... Alt+Break
Show / hide results pane ........... Ctrl+R
Object Explorer / Details .......... F8 / F7
IntelliSense ....................... Ctrl+Space · Ctrl+J
sp_help on selected name ........... Alt+F1
Find / Replace ..................... Ctrl+F · Ctrl+H   (F3 / Shift+F3 = next / previous)
Go to line ......................... Ctrl+G
Comment / uncomment ................ Ctrl+K Ctrl+C · Ctrl+K Ctrl+U · Ctrl+/
Upper / lower case ................. Ctrl+Shift+U · Ctrl+Shift+L
New query window ................... Alt+N
Open / save .sql file .............. Ctrl+O · Ctrl+S
Database list ...................... Ctrl+U

Results grid
  Select ........................... click, drag, Shift+click, click row number / column header
  Copy / copy with headers ......... Ctrl+C · Ctrl+Shift+C
  Filter rows ...................... Ctrl+F inside a grid, or right-click → Filter Rows…
  Sort ............................. right-click a column header
  Full cell value .................. double-click

Object Explorer
  Click to select, double-click or ⊞ to expand; arrow keys work too.
  Right-click any node for scripts, reports and actions.
  Funnel button (or right-click a folder → Filter) filters Tables, Views, Procedures…
  F7 opens Object Explorer Details for the selected node: right-click its header to choose columns
  (Row Count, Data Space Used, Index Space Used, …).

Edit Top 200 Rows (right-click a table)
  Edit cell: double-click · F2 · just start typing     Set NULL: Ctrl+0     Delete rows: select row numbers + Del`;

// ---------------------------------------------------------------- menus

const MENUS = {
  file: () => [
    ['Connect Object Explorer', connectMenuItems(), { icon: 'connect' }],
    ['Disconnect Object Explorer', oeDisconnect, { icon: 'disconnect' }],
    null,
    ['New Query', () => newTab(), { icon: 'newQuery', hint: 'Alt+N' }],
    ['Open File…', () => els.file.click(), { icon: 'open', hint: 'Ctrl+O' }],
    null,
    ['Close', () => app.active && closeTab(app.active)],
    ['Save', () => saveFile(), { icon: 'save', hint: 'Ctrl+S', disabled: !(app.active && app.active.editor) }],
    ['Save All', () => app.tabs.filter(t => t.editor && t.dirty).forEach(t => saveFile(t)), { icon: 'saveAll' }],
  ],
  edit: () => [
    ['Undo', execCmd('undo'), { icon: 'undo', hint: 'Ctrl+Z' }],
    ['Redo', execCmd('redo'), { icon: 'redo', hint: 'Ctrl+Y' }],
    null,
    ['Cut', execCmd('cut'), { icon: 'cut', hint: 'Ctrl+X' }],
    ['Copy', execCmd('copy'), { icon: 'copy', hint: 'Ctrl+C' }],
    ['Paste', pasteCmd, { icon: 'paste', hint: 'Ctrl+V' }],
    ['Select All', editorCmd(ed => ed.ta.select()), { hint: 'Ctrl+A' }],
    null,
    ['Find…', editorCmd(ed => openFind(ed, false)), { icon: 'find', hint: 'Ctrl+F' }],
    ['Replace…', editorCmd(ed => openFind(ed, true)), { hint: 'Ctrl+H' }],
    ['Go To…', goToLine, { hint: 'Ctrl+G' }],
    null,
    ['Advanced', [
      ['Make Uppercase', editorCmd(ed => ed.changeCase(true)), { hint: 'Ctrl+Shift+U' }],
      ['Make Lowercase', editorCmd(ed => ed.changeCase(false)), { hint: 'Ctrl+Shift+L' }],
      ['Comment Selection', editorCmd(ed => ed.commentLines('add')), { icon: 'comment', hint: 'Ctrl+K, Ctrl+C' }],
      ['Uncomment Selection', editorCmd(ed => ed.commentLines('remove')), { icon: 'uncomment', hint: 'Ctrl+K, Ctrl+U' }],
      ['Increase Indent', editorCmd(ed => ed.editLines(ls => ls.map(l => '    ' + l))), { icon: 'indent' }],
      ['Decrease Indent', editorCmd(ed => ed.editLines(ls => ls.map(l => l.replace(/^( {1,4}|\t)/, '')))), { icon: 'outdent' }],
    ]],
  ],
  view: () => [
    ['Object Explorer', () => toggleExplorer(true), { hint: 'F8', checked: settings.explorerVisible }],
    ['Object Explorer Details', openDetails, { icon: 'details', hint: 'F7' }],
    ['Query History', showHistory, { icon: 'history' }],
    null,
    ['Results Pane', () => toggleResults(), { hint: 'Ctrl+R', checked: !resultsHidden }],
    ['Line Numbers', () => { settings.lineNumbers = !settings.lineNumbers; applyLayout(); persist(); }, { checked: settings.lineNumbers }],
    null,
    ['Color Theme', [
      ['Blue', () => applyTheme('blue'), { checked: settings.theme === 'blue' }],
      ['Light', () => applyTheme('light'), { checked: settings.theme === 'light' }],
      ['Dark', () => applyTheme('dark'), { checked: settings.theme === 'dark' }],
    ]],
  ],
  query: () => [
    ['Connection', [
      ['Change Connection…', () => changeConnection(tb('tbChangeConn')), { icon: 'changeConn' }],
      ['Connect to another server…', () => connectNew({ blank: true }), { icon: 'connect' }],
    ]],
    null,
    ['Execute', () => execute(), { icon: 'execute', hint: 'F5' }],
    ['Parse', () => execute(app.active, { parse: true }), { icon: 'parse', hint: 'Ctrl+F5' }],
    ['Cancel Executing Query', cancelQuery, { icon: 'cancel', hint: 'Alt+Break', disabled: !(app.active && (app.active.running || app.active.stale)) }],
    null,
    ['Display Estimated Execution Plan', () => execute(app.active, { plan: 'estimated' }), { icon: 'estPlan', hint: 'Ctrl+L' }],
    ['Include Actual Execution Plan', toggleActualPlan, { icon: 'actualPlan', hint: 'Ctrl+M', checked: settings.actualPlan }],
    ['IntelliSense Enabled', toggleIntellisense, { checked: settings.intellisense }],
    null,
    ['Results To', [
      ['Results to Text', () => setResultsMode('text'), { icon: 'resultsText', checked: settings.resultsMode === 'text' }],
      ['Results to Grid', () => setResultsMode('grid'), { icon: 'resultsGrid', checked: settings.resultsMode !== 'text' }],
    ]],
    ['Query Options…', showQueryOptions, { icon: 'queryOptions' }],
  ],
  tools: () => [
    ['Activity Monitor', activityMonitor, { icon: 'activity' }],
    ['Query History', showHistory, { icon: 'history' }],
    ['Database Map (3D)', openMapForActive, { icon: 'map' }],
    null,
    ['Options…', showOptions, { icon: 'queryOptions' }],
  ],
  window: () => [
    ['New Query Window', () => newTab(), { icon: 'newQuery', hint: 'Alt+N' }],
    ['Close All Documents', () => closeAll()],
    ['Close All But This', () => closeAll(app.active)],
    null,
    ...app.tabs.map((t, i) => [`${i + 1} ${tabCaption(t)}`, () => activate(t), { checked: t === app.active }]),
  ],
  help: () => [
    ['Keyboard Shortcuts & Tips', () => showText('Keyboard shortcuts & tips', HELP), { hint: 'F1' }],
    ['About', () => showText('About Web SQL Studio', 'Web SQL Studio\nA lightweight, browser-based SQL Server management tool modeled on SQL Server Management Studio.\n\nRuns locally (127.0.0.1) on Node.js with the tedious driver.')],
  ],
};

let openMenuItem = null;
function openMenu(item) {
  els.menubar.querySelectorAll('.mb-item.open').forEach(x => x.classList.remove('open'));
  openMenuItem = item;
  item.classList.add('open');
  const r = item.getBoundingClientRect();
  showMenu(r.left, r.bottom - 1, MENUS[item.dataset.menu]());
}
setMenuCloseHook(() => {
  openMenuItem = null;
  els.menubar.querySelectorAll('.mb-item.open').forEach(x => x.classList.remove('open'));
});
els.menubar.addEventListener('mousedown', e => {
  const item = e.target.closest('.mb-item');
  if (!item) return;
  e.preventDefault();
  if (openMenuItem === item) hideMenu();
  else openMenu(item);
});
els.menubar.addEventListener('mouseover', e => {
  const item = e.target.closest('.mb-item');
  if (item && openMenuItem && item !== openMenuItem && menuOpen()) openMenu(item);
});

// ---------------------------------------------------------------- toolbar wiring

function toggleActualPlan() {
  settings.actualPlan = !settings.actualPlan;
  syncToolbar();
  persist();
}
function toggleIntellisense() {
  settings.intellisense = !settings.intellisense;
  syncToolbar();
  persist();
}
function setResultsMode(mode) {
  settings.resultsMode = mode;
  syncToolbar();
  persist();
}

const on = (id, fn) => { tb(id).onclick = fn; };
on('tbBack', () => navigate(-1));
on('tbForward', () => navigate(1));
on('tbNewQuery', () => newTab());
on('tbOpen', () => els.file.click());
on('tbSave', () => saveFile());
on('tbSaveAll', () => app.tabs.filter(t => t.editor && t.dirty).forEach(t => saveFile(t)));
on('tbCut', execCmd('cut'));
on('tbCopy', () => { const t = app.active; if (t && t.editor && document.activeElement !== t.editor.ta) t.editor.focus(); document.execCommand('copy'); });
on('tbPaste', pasteCmd);
on('tbUndo', execCmd('undo'));
on('tbRedo', execCmd('redo'));
on('tbActivity', activityMonitor);
on('tbMap', openMapForActive);
on('tbHistory', showHistory);
on('tbFind', editorCmd(ed => openFind(ed, false)));
on('tbConnect', e => showConnectMenu(e.currentTarget));
on('tbChangeConn', () => changeConnection(tb('tbChangeConn')));
on('tbExecute', () => execute());
on('tbCancel', cancelQuery);
on('tbParse', () => execute(app.active, { parse: true }));
on('tbEstPlan', () => execute(app.active, { plan: 'estimated' }));
on('tbOptions', showQueryOptions);
on('tbIntelli', toggleIntellisense);
on('tbActPlan', toggleActualPlan);
on('tbText', () => setResultsMode('text'));
on('tbGrid', () => setResultsMode('grid'));
on('tbComment', editorCmd(ed => ed.commentLines('add')));
on('tbUncomment', editorCmd(ed => ed.commentLines('remove')));
on('tbOutdent', editorCmd(ed => ed.editLines(ls => ls.map(l => l.replace(/^( {1,4}|\t)/, '')))));
on('tbIndent', editorCmd(ed => ed.editLines(ls => ls.map(l => '    ' + l))));
on('oeConnect', e => showConnectMenu(e.currentTarget));
on('oeConnectIcon', () => connectNew({ blank: true }));
on('oeDisconnect', oeDisconnect);
on('oeFilter', oeFilter);
on('oeRefresh', oeRefresh);
on('oeActivity', activityMonitor);
on('oeDetails', openDetails);
on('oeClose', () => toggleExplorer(false));
on('oePin', () => toast('Object Explorer is docked. Use View → Object Explorer (F8) to show or hide it.'));

// ---------------------------------------------------------------- keyboard

document.addEventListener('keydown', e => {
  const ctrl = e.ctrlKey || e.metaKey;
  const t = app.active;
  if (document.querySelector('.dlg-wrap') || !$('#modal').hidden) {
    if (e.key === 'Escape') $('#modal').hidden = true;
    return;
  }
  if (e.key === 'Escape') { hideMenu(); closeFind(true); return; }
  if (e.key === 'F5' && ctrl) { e.preventDefault(); execute(t, { parse: true }); }
  else if (e.key === 'F5' || (ctrl && !e.shiftKey && (e.key === 'Enter' || e.code === 'KeyE'))) { e.preventDefault(); execute(); }
  else if (e.key === 'F7') { e.preventDefault(); openDetails(); }
  else if (e.key === 'F8') { e.preventDefault(); toggleExplorer(true); }
  else if (e.key === 'F1') { e.preventDefault(); showText('Keyboard shortcuts & tips', HELP); }
  else if (e.altKey && (e.key === 'Pause' || e.key === 'Cancel')) { e.preventDefault(); cancelQuery(); }
  else if (e.altKey && e.key === 'F1') {
    e.preventDefault();
    if (t && t.editor) {
      const name = t.editor.selection().text.trim() || wordAtCursor(t.editor);
      if (name) execute(t, { sql: `EXEC sp_help ${sqlStr(name.replace(/^\[|\]$/g, ''))};` });
    }
  } else if (e.altKey && e.code === 'KeyN') { e.preventDefault(); newTab(); }
  else if (!ctrl) {
    if (e.key === 'F3' && t && t.editor) { e.preventDefault(); findNext(e.shiftKey ? -1 : 1); }
  } else if (e.code === 'KeyS' && !e.shiftKey) { e.preventDefault(); saveFile(); }
  else if (e.code === 'KeyO' && !e.shiftKey) { e.preventDefault(); els.file.click(); }
  else if (e.code === 'KeyR' && !e.shiftKey) { e.preventDefault(); toggleResults(); }
  else if (e.code === 'KeyD' && !e.shiftKey) { e.preventDefault(); setResultsMode('grid'); }
  else if (e.code === 'KeyU' && !e.shiftKey && t && t.kind === 'query') { e.preventDefault(); els.db.focus(); }
  else if (e.code === 'KeyL' && !e.shiftKey && t && t.editor) { e.preventDefault(); execute(t, { plan: 'estimated' }); }
  else if (e.code === 'KeyM' && !e.shiftKey && t && t.editor) { e.preventDefault(); toggleActualPlan(); }
  else if ((e.code === 'KeyF' || e.code === 'KeyH') && !e.shiftKey && t && t.editor) { e.preventDefault(); openFind(t.editor, e.code === 'KeyH'); }
  else if (e.code === 'KeyG' && !e.shiftKey && t && t.editor) { e.preventDefault(); goToLine(); }
});

function wordAtCursor(ed) {
  const v = ed.value, p = ed.selection().start;
  const left = /[\w.\[\]#@$]*$/.exec(v.slice(0, p))[0];
  const right = /^[\w.\[\]#@$]*/.exec(v.slice(p))[0];
  return left + right;
}

// ---------------------------------------------------------------- start

applyTheme(settings.theme);
setEditorFont(settings.fontSize);
applyLayout();
if (Array.isArray(settings.tabs) && settings.tabs.length) {
  for (const s of settings.tabs) {
    if (s.kind === 'edit' && !s.target) continue;
    newTab({ ...s, run: false });
  }
  const last = app.tabs.find(t => t.id === settings.active);
  if (last) activate(last);
}
if (!app.tabs.length) newTab();
restoreConnections();
