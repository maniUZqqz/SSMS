// Object Explorer: servers, databases and their objects, with filtering,
// scripting, reports and data for the Object Explorer Details window.

import { $, h, qn, sqlStr, fmtInt, fmtType, debounce, api, copyText, formDialog, askText, showMenu, toast } from './util.js';
import { ICONS } from './icons.js';
import { app } from './state.js';

const TYPE_ICON = { U: 'table', V: 'view', P: 'proc', PC: 'proc', FN: 'func', FS: 'func', IF: 'func', TF: 'func', FT: 'func', SN: 'syn', SO: 'seq' };
const TYPE_NAME = {
  U: 'Table', V: 'View', P: 'Stored procedure', PC: 'CLR stored procedure', FN: 'Scalar function', FS: 'CLR scalar function',
  IF: 'Inline table-valued function', TF: 'Table-valued function', FT: 'CLR table-valued function', SN: 'Synonym', SO: 'Sequence',
};
const DROP_KIND = { U: 'TABLE', V: 'VIEW', P: 'PROCEDURE', PC: 'PROCEDURE', FN: 'FUNCTION', FS: 'FUNCTION', IF: 'FUNCTION', TF: 'FUNCTION', FT: 'FUNCTION', SN: 'SYNONYM', SO: 'SEQUENCE', TR: 'TRIGGER' };
const RENDER_LIMIT = 500;

const els = { tree: $('#tree'), filter: $('#filter') };
const objCache = new Map();    // conn|db -> objects
const infoCache = new Map();   // conn|db|id -> table info
const categories = new Set();
let filterTerms = [];
let selected = null;

// ---------------------------------------------------------------- data

// Cached promises remember their value so IntelliSense can read them synchronously.
function cached(cache, key, load) {
  if (!cache.has(key)) {
    const p = load();
    p.then(v => { p.done = true; p.value = v; }, () => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}

export const getObjects = (conn, db) => cached(objCache, conn + '|' + db, () => api('objects', { conn, db }).then(r => r.objects));
export const getTableInfo = (conn, db, id) => cached(infoCache, `${conn}|${db}|${id}`, () => api('tableInfo', { conn, db, id }));

export function objectsSync(conn, db) {
  const p = objCache.get(conn + '|' + db);
  return p && p.done ? p.value : null;
}

export function tableInfoSync(conn, db, id) {
  const p = infoCache.get(`${conn}|${db}|${id}`);
  return p && p.done ? p.value : null;
}

function invalidate(conn, db) {
  for (const k of [...objCache.keys()]) if (k.startsWith(conn + '|') && (!db || k === conn + '|' + db)) objCache.delete(k);
  for (const k of [...infoCache.keys()]) if (k.startsWith(conn + '|' + (db ? db + '|' : ''))) infoCache.delete(k);
}

// ---------------------------------------------------------------- tree nodes

function infoRow(text, depth, cls) {
  const r = h('div', 'row tinfo' + (cls ? ' ' + cls : ''), text);
  r.style.paddingLeft = 22 + depth * 16 + 'px';
  return r;
}

// Options: label, icon, depth, count, sub, tip, expandable, reload, load(frag, node), menu(), drag, dim,
// row (values shown in Object Explorer Details), kind (details layout for children), list() (custom details rows),
// refresh() (custom refresh), parentRef (logical parent when the node is not in the tree).
function treeNode(o) {
  const { label, icon, depth, count, sub, tip, expandable, reload, load, menu, drag, dim } = o;
  const n = h('div', 'node'), row = h('div', 'row' + (dim ? ' dim' : '')), kids = h('div', 'kids');
  row.style.paddingLeft = 4 + depth * 16 + 'px';
  const tw = h('span', 'tw' + (expandable ? ' has' : ''));
  row.append(tw);
  const ic = h('span', 'ic');
  ic.innerHTML = ICONS[icon] || '';
  const lb = h('span', 'lb', label);
  row.append(ic, lb);
  if (sub) row.append(h('span', 'sub', sub));
  const ct = h('span', 'ct', count == null ? '' : fmtInt(count));
  row.append(ct);
  if (tip) row.title = tip;
  kids.hidden = true;
  n.append(row, kids);
  Object.assign(n, {
    row, kids, ct, lb, isOpen: false, iconName: icon, baseLabel: label, expandable: !!expandable,
    rowData: o.row || { name: label }, detailsKind: o.kind || 'generic', listDetails: o.list || null,
    menuFn: menu || null, parentRef: o.parentRef || null,
  });
  let loaded = false, loading = null;

  n.load = async force => {
    if (!expandable) return;
    if (loaded && !reload && !force) return;
    if (loading) return loading;
    loading = (async () => {
      kids.replaceChildren(infoRow('Loading…', depth + 1));
      try {
        const frag = document.createDocumentFragment();
        await load(frag, n);
        kids.replaceChildren(frag);
        loaded = true;
      } catch (e) {
        loaded = false;
        kids.replaceChildren(infoRow(e.message, depth + 1, 'err'));
        throw e;
      } finally {
        loading = null;
      }
    })();
    return loading;
  };
  n.toggle = async (open = !n.isOpen) => {
    if (!expandable) return;
    n.isOpen = open;
    n.classList.toggle('open', open);
    kids.hidden = !open;
    if (open && (!loaded || reload)) await n.load(true).catch(() => {});
  };
  n.reload = async () => {
    loaded = false;
    if (n.isOpen) await n.toggle(true);
    if (n === selected && app.onTreeSelect) app.onTreeSelect(n);
  };
  n.refresh = o.refresh || n.reload;

  tw.onclick = e => { e.stopPropagation(); selectNode(n); n.toggle(); };
  row.onclick = () => selectNode(n);
  row.ondblclick = () => { if (expandable) n.toggle(); };
  row.oncontextmenu = e => {
    e.preventDefault();
    selectNode(n);
    if (menu) showMenu(e.clientX, e.clientY, menu());
  };
  if (drag) {
    row.draggable = true;
    row.ondragstart = e => { e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'copy'; };
  }
  return n;
}

const folder = (label, depth, load, extra = {}) => treeNode({ label, icon: 'folder', depth, expandable: true, load, ...extra });

export function selectNode(n, focus) {
  if (selected && selected !== n) selected.row.classList.remove('sel');
  selected = n;
  if (!n) return;
  n.row.classList.add('sel');
  if (n.isConnected) n.row.scrollIntoView({ block: 'nearest' });
  if (focus) els.tree.focus();
  app.onTreeSelect && app.onTreeSelect(n);
}

export const selectedNode = () => selected;

// Children of a node as rows for Object Explorer Details.
export async function detailsRows(n) {
  if (n.listDetails) return n.listDetails();
  if (!n.expandable) return [];
  await n.load();
  return [...n.kids.children].filter(c => c.classList.contains('node'))
    .map(c => ({ icon: c.iconName, values: c.rowData, node: c, dim: c.row.classList.contains('dim') }));
}

export function nodePath(n) {
  const parts = [];
  for (let cur = n; cur; cur = cur.parentRef || (cur.parentElement && cur.parentElement.closest('.node'))) parts.unshift(cur.baseLabel);
  return parts;
}

function serverOf(n) {
  let cur = n;
  while (cur && !cur.dataset.conn) cur = cur.parentRef || (cur.parentElement && cur.parentElement.closest('.node'));
  return cur;
}

// ---- Object Explorer toolbar actions

export function oeRefresh() {
  if (!selected) { for (const c of app.conns.values()) addServerNode(c); return; }
  return selected.refresh();
}

export function oeDisconnect() {
  const s = selected && serverOf(selected);
  if (s) app.disconnect(s.dataset.conn);
  else toast('Select a server (or any object on it) to disconnect.', true);
}

export function oeFilter() {
  if (selected && selected.isCategory) return editFolderFilter(selected);
  toast('Select a folder such as Tables, Views or Stored Procedures, then click Filter.', true);
}

// Keyboard navigation like a Windows tree view.
els.tree.addEventListener('keydown', e => {
  const rows = [...els.tree.querySelectorAll('.node > .row')].filter(r => r.offsetParent !== null);
  const cur = selected && selected.isConnected ? selected : null;
  const i = cur ? rows.indexOf(cur.row) : -1;
  const go = r => { if (r) { e.preventDefault(); selectNode(r.parentElement, true); } };
  if (e.key === 'ArrowDown') go(rows[Math.min(rows.length - 1, i + 1)] || rows[0]);
  else if (e.key === 'ArrowUp') go(rows[Math.max(0, i - 1)]);
  else if (e.key === 'Home') go(rows[0]);
  else if (e.key === 'End') go(rows[rows.length - 1]);
  else if (!cur) return;
  else if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (cur.expandable && !cur.isOpen) cur.toggle(true);
    else if (cur.isOpen) go(cur.kids.querySelector(':scope > .node > .row'));
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (cur.isOpen) cur.toggle(false);
    else { const p = cur.parentElement.closest('.node'); if (p) go(p.row); }
  } else if (e.key === 'Enter') { e.preventDefault(); cur.toggle(); }
  else if (e.key === 'F5') { e.preventDefault(); e.stopPropagation(); cur.refresh(); }
  else if ((e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) && cur.menuFn) {
    e.preventDefault();
    const r = cur.row.getBoundingClientRect();
    showMenu(r.left + 40, r.bottom, cur.menuFn());
  }
});

// ---------------------------------------------------------------- servers

// ---- servers handled by ./drivers (MySQL, PostgreSQL, Oracle, SQLite, MongoDB, Redis, Cassandra):
// the server describes its own tree through api('tree').

function genericNode(c, item, depth, parentPath, parentRef) {
  const path = [...parentPath, item.key];
  const node = treeNode({
    label: item.label, icon: item.icon || 'folder', depth, expandable: !!item.expandable, count: item.count, sub: item.sub,
    dim: item.dim, tip: item.tip, drag: item.drag, row: item.row || { name: item.label }, kind: item.kind || 'generic', parentRef,
    load: async frag => {
      const { nodes } = await api('tree', { conn: c.id, path });
      for (const ch of nodes) frag.append(genericNode(c, ch, depth + 1, path));
      if (!nodes.length) frag.append(infoRow('(none)', depth + 1));
    },
    menu: () => genericMenu(c, item, path, node),
  });
  return node;
}

// Database types whose tables support Design / Edit Top 200 Rows.
const EDITABLE = new Set(['sqlite', 'mysql', 'mariadb', 'postgres', 'oracle']);

// { db, schema, name } of a table from its node path (keys like 'db:shop', 's:public', 't:orders').
function pathTarget(type, p) {
  const parts = {};
  for (const k of p) { const i = k.indexOf(':'); if (i > 0) parts[k.slice(0, i)] = k.slice(i + 1); }
  if (type === 'postgres') return { db: parts.db, schema: parts.s, name: parts.t };
  if (type === 'oracle') return { db: parts.s, schema: parts.s, name: parts.t };
  if (type === 'sqlite') return { db: parts.d, schema: parts.d, name: parts.t };
  return { db: parts.db, schema: parts.db, name: parts.t };
}

function genericMenu(c, item, path, node) {
  const items = [];
  if (EDITABLE.has(c.spec.type)) {
    const tg = pathTarget(c.spec.type, path);
    if (item.key.startsWith('t:')) {
      items.push(['Design', () => app.openDesignTab({ conn: c.id, ...tg }), { icon: 'details' }]);
      items.push(['Edit Top 200 Rows', () => app.openEditTab({ conn: c.id, ...tg }), { icon: 'table' }]);
    } else if (item.key === 'tables') {
      items.push(['New Table…', () => app.openDesignTab({ conn: c.id, ...tg, name: '', isNew: true }), { icon: 'table' }]);
    }
  }
  for (const a of item.actions || []) {
    if (a.script) {
      items.push([a.label, async () => {
        const { script } = await api('script', { conn: c.id, path, kind: a.script });
        app.newTab({ title: `${item.label} (${String(a.script).toUpperCase()})`, conn: c.id, db: a.db, sql: script });
      }]);
    } else {
      items.push([a.label, () => app.newTab({ title: item.label, conn: c.id, db: a.db, sql: a.sql, run: !!a.run }), { icon: a.run ? 'execute' : undefined }]);
    }
  }
  if (items.length) items.push(null);
  if (item.drag) items.push(['Insert name into editor', () => app.insertText(item.drag)], ['Copy name', () => copyText(item.drag), { icon: 'copy' }]);
  if (item.expandable) items.push(['Refresh', () => node.refresh(), { icon: 'refresh', hint: 'F5' }]);
  return items;
}

function addGenericServerNode(c) {
  const label = c.spec.type === 'sqlite' || c.spec.type === 'cdb' ? c.spec.file.split(/[\\/]/).pop() : (c.spec.server || c.info.serverName);
  const node = treeNode({
    label, sub: `(${c.info.edition} ${c.info.version}${c.info.login ? ' - ' + c.info.login : ''})`, icon: 'server', depth: 0, expandable: true,
    tip: `${c.spec.name}\n${c.info.edition} ${c.info.version}`, kind: 'gdatabases', row: { name: label },
    load: async frag => {
      const { nodes } = await api('tree', { conn: c.id, path: [] });
      let def = null;
      for (const ch of nodes) {
        const n = genericNode(c, ch, 1, []);
        frag.append(n);
        if (ch.label === c.info.db && ch.expandable) def = n;
      }
      if (!nodes.length) frag.append(infoRow('(none)', 1));
      if (def) setTimeout(() => def.toggle(true), 0);
    },
    menu: () => [
      ['New Query', () => app.newTab({ conn: c.id, db: c.info.db }), { icon: 'newQuery' }],
      ['Disconnect', () => app.disconnect(c.id), { icon: 'disconnect' }],
      null,
      ['Refresh', () => node.refresh(), { icon: 'refresh', hint: 'F5' }],
    ],
  });
  node.dataset.conn = c.id;
  els.tree.querySelector('.tree-empty')?.remove();
  els.tree.append(node);
  node.toggle(true);
  if (!selected || !selected.isConnected) selectNode(node);
  return node;
}

export function addServerNode(c) {
  removeServerNode(c.id, true);
  if (c.spec.type && c.spec.type !== 'mssql') return addGenericServerNode(c);
  const ver = c.info && c.info.version ? `SQL Server ${c.info.version}` : '';
  const node = treeNode({
    label: c.spec.server, sub: `(${ver} - ${c.info ? c.info.login : c.spec.user})`, icon: 'server', depth: 0, expandable: true,
    tip: `${c.info.serverName} · ${c.info.edition}\nLogin: ${c.info.login}`,
    row: { name: `${c.spec.server} (${ver} - ${c.info.login})` },
    load: frag => {
      const dbs = databasesFolder(c, 1, node);
      frag.append(dbs);
      frag.append(folder('Security', 1, f => { f.append(serverItemsFolder(c, 'Logins', 'logins', 2)); }));
      frag.append(folder('SQL Server Agent', 1, f => { f.append(serverItemsFolder(c, 'Jobs', 'jobs', 2)); }));
      node.dbFolder = dbs;
    },
    refresh: () => { invalidate(c.id); c.databases = null; return node.reload(); },
    menu: () => [
      ['Connect…', () => app.connectDialog({ blank: true }), { icon: 'connect' }],
      ['Disconnect', () => app.disconnect(c.id), { icon: 'disconnect' }],
      null,
      ['New Query', () => app.newTab({ conn: c.id, db: c.info.db }), { icon: 'newQuery' }],
      ['Activity Monitor', () => report(c, c.info.db, 'Activity Monitor', ACTIVITY_SQL), { icon: 'activity' }],
      ['Reports', [
        ['Server Properties', () => report(c, 'master', 'Server Properties', SERVER_PROPS_SQL)],
        ['Top Queries by CPU', () => report(c, 'master', 'Top Queries by CPU', TOP_CPU_SQL)],
        ['Database Sizes', () => report(c, 'master', 'Database Sizes', DB_SIZES_SQL)],
      ]],
      null,
      ['Refresh', () => node.refresh(), { icon: 'refresh', hint: 'F5' }],
    ],
  });
  node.dataset.conn = c.id;
  els.tree.querySelector('.tree-empty')?.remove();
  els.tree.append(node);
  node.toggle(true).then(() => node.dbFolder && node.dbFolder.toggle(true));
  if (!selected || !selected.isConnected) selectNode(node);
  return node;
}

export function removeServerNode(id, keepHint) {
  for (const n of els.tree.querySelectorAll(':scope > .node')) if (n.dataset.conn === id) n.remove();
  invalidate(id);
  if (selected && !selected.isConnected && !selected.parentRef) selected = null;
  if (!keepHint) showEmptyHint();
}

export function showEmptyHint() {
  if (els.tree.querySelector(':scope > .node') || els.tree.querySelector('.tree-empty')) return;
  const box = h('div', 'tree-empty');
  box.append(h('div', null, 'Not connected to any server.'));
  const b = h('button', 'primary', 'Connect…');
  b.onclick = () => app.connectDialog();
  box.append(b);
  els.tree.append(box);
}

function databasesFolder(c, depth, serverNode) {
  let details = null;
  const usable = d => d.access && d.state === 'ONLINE';
  const node = folder('Databases', depth, async frag => {
    const { databases } = await api('databases', { conn: c.id });
    const entry = app.conns.get(c.id);
    if (entry) entry.databases = databases;
    app.onDatabases && app.onDatabases(c.id);
    const system = databases.filter(d => d.id <= 4);
    const user = databases.filter(d => d.id > 4 && usable(d));
    const other = databases.filter(d => d.id > 4 && !usable(d));
    frag.append(folder('System Databases', depth + 1, f => system.forEach(d => f.append(dbNode(c, d, depth + 2)))));
    let def = null;
    for (const d of user) {
      const n = dbNode(c, d, depth + 1);
      frag.append(n);
      if (d.name === c.info.db) def = n;
    }
    if (other.length) {
      frag.append(treeNode({
        label: 'No access / offline', icon: 'folder', depth: depth + 1, expandable: true, count: other.length, dim: true,
        tip: 'Databases on this server that your login cannot open (or that are offline).',
        load: f => other.forEach(d => f.append(dbNode(c, d, depth + 2))),
      }));
    }
    if (def) setTimeout(() => def.toggle(true), 0);
  }, {
    kind: 'databases',
    refresh: () => { details = null; return node.reload(); },
    list: async () => {
      await node.load();
      details = details || (await api('dbDetails', { conn: c.id })).databases;
      const byName = new Map(details.map(d => [d.name, d]));
      const rows = [];
      for (const ch of node.kids.children) {
        if (!ch.classList.contains('node')) continue;
        rows.push({ icon: ch.iconName, values: { ...(byName.get(ch.baseLabel) || {}), name: ch.baseLabel }, node: ch, dim: ch.row.classList.contains('dim') });
      }
      return rows;
    },
    menu: () => [['Refresh', () => node.refresh(), { icon: 'refresh', hint: 'F5' }]],
  });
  node.parentServer = serverNode;
  return node;
}

function serverItemsFolder(c, label, kind, depth) {
  return folder(label, depth, async f => {
    const { items } = await api('serverItems', { conn: c.id, kind });
    for (const it of items) {
      if (kind === 'logins') {
        f.append(treeNode({
          label: it.name, sub: `(${it.kind.toLowerCase().replace(/_/g, ' ')}${it.is_disabled ? ', disabled' : ''})`, icon: 'login', depth: depth + 1, dim: it.is_disabled,
          drag: qn(it.name),
          row: { name: it.name, kind: it.kind.replace(/_/g, ' '), disabled: !!it.is_disabled, default_db: it.default_db },
          menu: () => [
            ['Script Login as CREATE', () => openScript(c, 'master', it.name, it.kind === 'SQL_LOGIN'
              ? `CREATE LOGIN ${qn(it.name)} WITH PASSWORD = N'<password>', DEFAULT_DATABASE = ${qn(it.default_db || 'master')};\nGO\n`
              : `CREATE LOGIN ${qn(it.name)} FROM WINDOWS WITH DEFAULT_DATABASE = ${qn(it.default_db || 'master')};\nGO\n`)],
            ['Copy name', () => copyText(it.name), { icon: 'copy' }],
          ],
        }));
      } else {
        f.append(treeNode({
          label: it.name, sub: it.enabled ? '' : '(disabled)', icon: 'job', depth: depth + 1, dim: !it.enabled, tip: it.description || '',
          row: { name: it.name, enabled: !!it.enabled, description: it.description },
          menu: () => [
            ['View History', () => report(c, 'msdb', it.name + ' history', `SELECT TOP (200) h.run_date, h.run_time, h.step_id, h.step_name,
       CASE h.run_status WHEN 0 THEN 'Failed' WHEN 1 THEN 'Succeeded' WHEN 2 THEN 'Retry' WHEN 3 THEN 'Canceled' ELSE 'In progress' END AS status,
       h.run_duration, h.message
  FROM msdb.dbo.sysjobhistory h
 WHERE h.job_id = '${it.id}'
 ORDER BY h.instance_id DESC;`)],
            ['Start Job (script)', () => openScript(c, 'msdb', 'Start ' + it.name, `EXEC msdb.dbo.sp_start_job @job_name = ${sqlStr(it.name)};\n`)],
            ['Copy name', () => copyText(it.name), { icon: 'copy' }],
          ],
        }));
      }
    }
    if (!items.length) f.append(infoRow('(none)', depth + 1));
  }, { kind: kind });
}

// ---------------------------------------------------------------- databases

function dbNode(c, d, depth) {
  const db = d.name;
  const usable = d.access && d.state === 'ONLINE';
  const node = treeNode({
    label: db, icon: usable ? 'db' : 'dbOff', depth, expandable: usable, drag: qn(db), dim: !usable,
    sub: usable ? '' : `(${d.state !== 'ONLINE' ? d.state.toLowerCase() : 'no access'})`,
    row: { name: db, state: d.state },
    load: async frag => {
      const objs = await getObjects(c.id, db);
      const D = depth + 1;
      const cat = (label, types, d, kind = 'objects') =>
        categoryNode(c, db, label, objs.filter(o => types.includes(o.type)), d, node, kind, types);
      frag.append(cat('Tables', ['U'], D, 'tables'));
      frag.append(cat('Views', ['V'], D));
      frag.append(cat('Synonyms', ['SN'], D));
      frag.append(folder('Programmability', D, f => {
        f.append(cat('Stored Procedures', ['P', 'PC'], D + 1));
        f.append(folder('Functions', D + 1, g => {
          g.append(cat('Table-valued Functions', ['IF', 'TF', 'FT'], D + 2));
          g.append(cat('Scalar-valued Functions', ['FN', 'FS'], D + 2));
        }));
        f.append(dbItemsFolder(c, db, 'Database Triggers', 'dbtriggers', D + 1));
        f.append(dbItemsFolder(c, db, 'Types', 'types', D + 1));
        f.append(cat('Sequences', ['SO'], D + 1));
      }));
      frag.append(folder('Security', D, f => {
        f.append(dbItemsFolder(c, db, 'Users', 'users', D + 1));
        f.append(dbItemsFolder(c, db, 'Roles', 'roles', D + 1));
        f.append(dbItemsFolder(c, db, 'Schemas', 'schemas', D + 1));
      }));
    },
    refresh: () => { invalidate(c.id, db); return node.reload(); },
    menu: () => [
      ['New Query', () => app.newTab({ conn: c.id, db }), { icon: 'newQuery' }],
      ['Search in Code…', () => searchInCode(c, db), { icon: 'find' }],
      ['Reports', [
        ['Database Properties', () => report(c, db, db + ' properties', DB_PROPS_SQL)],
        ['Disk Usage by Table', () => report(c, db, 'Disk usage', DISK_USAGE_SQL)],
        ['Missing Indexes', () => report(c, db, 'Missing indexes', MISSING_INDEX_SQL)],
        ['Index Usage', () => report(c, db, 'Index usage', INDEX_USAGE_SQL)],
      ]],
      null,
      ['Copy name', () => copyText(db), { icon: 'copy' }],
      ['Refresh', () => node.refresh(), { icon: 'refresh', hint: 'F5' }],
    ],
  });
  return node;
}

function dbItemsFolder(c, db, label, kind, depth) {
  return folder(label, depth, async f => {
    const { items } = await api('dbItems', { conn: c.id, db, kind });
    const D = depth + 1;
    if (kind === 'types') {
      const scalar = items.filter(t => !t.is_table_type), table = items.filter(t => t.is_table_type);
      const typeNode = t => treeNode({
        label: `${t.sch}.${t.name}`, sub: t.is_table_type ? '' : `(${fmtType({ ...t, type: t.base_type })}${t.is_nullable ? ', null' : ', not null'})`,
        icon: 'type', depth: D + 1, drag: `${qn(t.sch)}.${qn(t.name)}`,
        row: { name: t.name, sch: t.sch, base: t.is_table_type ? 'table' : fmtType({ ...t, type: t.base_type }), nullable: !!t.is_nullable },
        menu: () => [
          ...(t.is_table_type ? [] : [['Script Type as CREATE', () => openScript(c, db, t.name,
            `CREATE TYPE ${qn(t.sch)}.${qn(t.name)} FROM ${fmtType({ ...t, type: t.base_type })}${t.is_nullable ? ' NULL' : ' NOT NULL'};\nGO\n`)]]),
          ['Script Type as DROP', () => openScript(c, db, t.name, `DROP TYPE ${qn(t.sch)}.${qn(t.name)};\nGO\n`)],
          ['Copy name', () => copyText(`${qn(t.sch)}.${qn(t.name)}`), { icon: 'copy' }],
        ],
      });
      f.append(folder('User-Defined Data Types', D, g => { scalar.forEach(t => g.append(typeNode(t))); if (!scalar.length) g.append(infoRow('(none)', D + 1)); }, { kind: 'types' }));
      f.append(folder('User-Defined Table Types', D, g => { table.forEach(t => g.append(typeNode(t))); if (!table.length) g.append(infoRow('(none)', D + 1)); }, { kind: 'types' }));
      return;
    }
    for (const it of items) {
      if (kind === 'dbtriggers') {
        const o = { id: it.id, sch: '', name: it.name, type: 'TR', parentDb: true };
        f.append(treeNode({
          label: it.name, sub: it.is_disabled ? '(disabled)' : '', icon: 'trigger', depth: D, dim: it.is_disabled,
          row: { name: it.name, disabled: !!it.is_disabled },
          menu: () => [
            ['Modify', () => scriptModule(c, db, o, 'alter')],
            ['Script as CREATE', () => scriptModule(c, db, o, 'create')],
            ['Script as DROP', () => openScript(c, db, it.name, `DROP TRIGGER ${qn(it.name)} ON DATABASE;\nGO\n`)],
            [it.is_disabled ? 'Enable (script)' : 'Disable (script)', () => openScript(c, db, it.name, `${it.is_disabled ? 'ENABLE' : 'DISABLE'} TRIGGER ${qn(it.name)} ON DATABASE;\nGO\n`)],
          ],
        }));
      } else if (kind === 'users') {
        f.append(treeNode({
          label: it.name, sub: `(${it.kind.toLowerCase().replace(/_/g, ' ')})`, icon: 'user', depth: D, drag: qn(it.name),
          row: { name: it.name, kind: it.kind.replace(/_/g, ' '), default_schema: it.default_schema },
          menu: () => [
            ['Script User as CREATE', () => openScript(c, db, it.name, `CREATE USER ${qn(it.name)} FOR LOGIN ${qn(it.name)}${it.default_schema ? ` WITH DEFAULT_SCHEMA = ${qn(it.default_schema)}` : ''};\nGO\n`)],
            ['Permissions', () => report(c, db, it.name + ' permissions', `SELECT p.state_desc, p.permission_name, p.class_desc,
       COALESCE(OBJECT_SCHEMA_NAME(p.major_id) + '.' + OBJECT_NAME(p.major_id), SCHEMA_NAME(p.major_id)) AS securable
  FROM sys.database_permissions p
 WHERE p.grantee_principal_id = DATABASE_PRINCIPAL_ID(${sqlStr(it.name)})
 ORDER BY securable, p.permission_name;
SELECT r.name AS member_of_role
  FROM sys.database_role_members m JOIN sys.database_principals r ON r.principal_id = m.role_principal_id
 WHERE m.member_principal_id = DATABASE_PRINCIPAL_ID(${sqlStr(it.name)});`)],
            ['Copy name', () => copyText(it.name), { icon: 'copy' }],
          ],
        }));
      } else if (kind === 'roles') {
        f.append(treeNode({
          label: it.name, sub: it.is_fixed_role ? '(fixed)' : '', icon: 'role', depth: D, drag: qn(it.name),
          row: { name: it.name, fixed: !!it.is_fixed_role },
          menu: () => [
            ['Members', () => report(c, db, it.name + ' members', `SELECT m.name AS member, m.type_desc
  FROM sys.database_role_members rm JOIN sys.database_principals m ON m.principal_id = rm.member_principal_id
 WHERE rm.role_principal_id = DATABASE_PRINCIPAL_ID(${sqlStr(it.name)})
 ORDER BY m.name;`)],
            ...(it.is_fixed_role ? [] : [['Script Role as CREATE', () => openScript(c, db, it.name, `CREATE ROLE ${qn(it.name)};\nGO\n`)]]),
            ['Copy name', () => copyText(it.name), { icon: 'copy' }],
          ],
        }));
      } else if (kind === 'schemas') {
        f.append(treeNode({
          label: it.name, sub: it.owner ? `(owner: ${it.owner})` : '', icon: 'schema', depth: D, drag: qn(it.name),
          row: { name: it.name, owner: it.owner },
          menu: () => [
            ['Script Schema as CREATE', () => openScript(c, db, it.name, `CREATE SCHEMA ${qn(it.name)}${it.owner ? ` AUTHORIZATION ${qn(it.owner)}` : ''};\nGO\n`)],
            ['Copy name', () => copyText(it.name), { icon: 'copy' }],
          ],
        }));
      }
    }
    if (!items.length) f.append(infoRow('(none)', D));
  }, { kind: kind === 'types' ? 'generic' : kind });
}

// ---------------------------------------------------------------- object categories + filters

function matches(cat, o, quick = true) {
  if (quick && filterTerms.length) {
    const s = (o.sch + '.' + o.name).toLowerCase();
    if (!filterTerms.every(t => s.includes(t))) return false;
  }
  const f = cat.filterSettings;
  if (f) {
    if (f.name && !o.name.toLowerCase().includes(f.name.toLowerCase())) return false;
    if (f.schema && !o.sch.toLowerCase().includes(f.schema.toLowerCase())) return false;
    if (f.created && o.created < f.created) return false;
    if (f.modified && o.modified < f.modified) return false;
  }
  return true;
}

function updateCount(cat) {
  const filtered = filterTerms.length || cat.filterSettings;
  cat.matchCount = filtered ? cat.items.filter(o => matches(cat, o)).length : cat.items.length;
  cat.ct.textContent = filtered ? `${fmtInt(cat.matchCount)} / ${fmtInt(cat.items.length)}` : fmtInt(cat.items.length);
  cat.lb.textContent = cat.baseLabel + (cat.filterSettings ? ' (filtered)' : '');
  cat.row.classList.toggle('filtered', !!cat.filterSettings);
}

export async function editFolderFilter(cat) {
  const f = cat.filterSettings || {};
  const r = await formDialog({
    title: `Filter Settings — ${cat.baseLabel}`,
    intro: 'Show only objects that match all of the conditions below. Leave a field empty to ignore it.',
    fields: [
      { name: 'name', label: 'Name contains', value: f.name || '' },
      { name: 'schema', label: 'Schema contains', value: f.schema || '' },
      { name: 'created', label: 'Created on or after', type: 'date', value: f.created || '' },
      { name: 'modified', label: 'Modified on or after', type: 'date', value: f.modified || '' },
    ],
    ok: 'Apply filter',
  });
  if (!r) return;
  const active = r.name.trim() || r.schema.trim() || r.created || r.modified;
  cat.filterSettings = active ? { name: r.name.trim(), schema: r.schema.trim(), created: r.created, modified: r.modified } : null;
  updateCount(cat);
  if (cat.isOpen) cat.toggle(true);
  if (cat === selected) app.onTreeSelect && app.onTreeSelect(cat);
}

function categoryNode(c, db, label, items, depth, dbn, kind, types) {
  let stats = null;
  const loadStats = async () => {
    if (stats) return stats;
    stats = new Map();
    try { for (const t of (await api('tableStats', { conn: c.id, db })).tables) stats.set(t.id, t); } catch { /* no permission: no counts */ }
    return stats;
  };
  const cat = treeNode({
    label, icon: 'folder', depth, expandable: true, reload: true, kind,
    load: async frag => {
      const list = cat.items.filter(o => matches(cat, o));
      const counts = kind === 'tables' && (!app.settings || app.settings.treeRowCounts !== false) ? await loadStats() : null;
      list.slice(0, RENDER_LIMIT).forEach(o => {
        const st = counts && counts.get(o.id);
        frag.append(objectNode(c, db, o, depth + 1, undefined, st ? st.row_count : undefined));
      });
      if (list.length > RENDER_LIMIT) {
        frag.append(infoRow(`… ${fmtInt(list.length - RENDER_LIMIT)} more — use the filter box above, Filter (funnel), or Object Explorer Details (F7)`, depth + 1));
      }
      if (!list.length) frag.append(infoRow(filterTerms.length || cat.filterSettings ? 'No matches' : '(none)', depth + 1));
    },
    list: async () => {
      if (kind === 'tables') await loadStats();
      return cat.items.filter(o => matches(cat, o, false)).map(o => {
        const values = { ...o, ...(stats && stats.get(o.id)), type_desc: TYPE_NAME[o.type] };
        return { icon: TYPE_ICON[o.type], values, node: () => objectNode(c, db, o, depth + 1, cat) };
      });
    },
    refresh: async () => {
      invalidate(c.id, db);
      stats = null;
      const objs = await getObjects(c.id, db);
      cat.items = objs.filter(o => types.includes(o.type));
      updateCount(cat);
      if (cat.isOpen) await cat.toggle(true);
      if (cat === selected && app.onTreeSelect) app.onTreeSelect(cat);
    },
    menu: () => [
      ...(kind === 'tables' ? [['New Table…', () => app.openDesignTab({ conn: c.id, db, schema: 'dbo', name: '', isNew: true }), { icon: 'table' }], null] : []),
      ['Filter', [
        ['Filter Settings…', () => editFolderFilter(cat), { icon: 'filter' }],
        ['Remove Filter', () => { cat.filterSettings = null; updateCount(cat); cat.toggle(cat.isOpen); if (cat === selected) app.onTreeSelect(cat); }, { disabled: !cat.filterSettings }],
      ]],
      ['Refresh', () => cat.refresh(), { icon: 'refresh', hint: 'F5' }],
    ],
  });
  cat.items = items;
  cat.isCategory = true;
  cat.filterSettings = null;
  categories.add(cat);
  updateCount(cat);
  return cat;
}

els.filter.addEventListener('input', debounce(() => {
  filterTerms = els.filter.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  for (const cat of categories) {
    if (!cat.isConnected) { categories.delete(cat); continue; }
    updateCount(cat);
    if (cat.isOpen || (filterTerms.length && cat.matchCount && cat.offsetParent !== null)) cat.toggle(true);
  }
}, 200));

// ---------------------------------------------------------------- objects

const full = o => `${qn(o.sch)}.${qn(o.name)}`;

function objectNode(c, db, o, depth, parentRef, rowCount) {
  const expandable = !['SN', 'SO'].includes(o.type);
  const rows = rowCount == null ? null : Number(rowCount);
  const node = treeNode({
    label: `${o.sch}.${o.name}`, icon: TYPE_ICON[o.type], depth, expandable, drag: full(o), parentRef,
    sub: rows == null ? undefined : rows === 0 ? '(empty)' : `(${fmtInt(rows)} rows)`,
    tip: `${TYPE_NAME[o.type]}: ${o.sch}.${o.name}\nCreated ${o.created} · modified ${o.modified}\nRight-click for actions; drag into the editor to insert the name.`,
    row: { ...o, type_desc: TYPE_NAME[o.type] },
    load: async frag => {
      const D = depth + 1;
      if (o.type === 'U' || o.type === 'V') {
        const info = await getTableInfo(c.id, db, o.id);
        frag.append(columnsFolder(info, D));
        if (o.type === 'U') {
          frag.append(keysFolder(c, db, o, info, D));
          frag.append(constraintsFolder(c, db, o, info, D));
        }
        frag.append(triggersFolder(c, db, o, info, D));
        frag.append(indexesFolder(c, db, o, info, D));
      } else {
        const { params } = await api('params', { conn: c.id, db, id: o.id });
        frag.append(folder('Parameters', D, g => {
          for (const p of params) {
            const bits = [fmtType(p), p.name ? (p.is_output ? 'output' : 'input') : null, p.has_default_value ? 'default' : null, p.is_readonly ? 'readonly' : null].filter(Boolean);
            g.append(treeNode({
              label: p.name || 'Returns', sub: `(${bits.join(', ')})`, icon: 'param', depth: D + 1, drag: p.name || undefined,
              row: { name: p.name || 'Returns', data_type: fmtType(p), direction: p.name ? (p.is_output ? 'Output' : 'Input') : 'Return value', has_default: !!p.has_default_value },
            }));
          }
          if (!params.length) g.append(infoRow('(no parameters)', D + 1));
        }, { kind: 'params' }));
      }
    },
    refresh: () => { infoCache.delete(`${c.id}|${db}|${o.id}`); return node.reload(); },
    menu: () => objectMenu(c, db, o),
  });
  return node;
}

function columnsFolder(info, depth) {
  const pk = new Set(info.pk ? info.pk.cols.map(k => k.name) : []);
  const fk = new Set(info.foreignKeys.flatMap(f => f.cols));
  return folder('Columns', depth, g => {
    for (const col of info.columns) {
      const bits = [pk.has(col.name) ? 'PK' : null, fk.has(col.name) ? 'FK' : null, fmtType(col),
        col.is_identity ? 'identity' : null, col.computed ? 'computed' : null, col.is_nullable ? 'null' : 'not null'].filter(Boolean);
      g.append(treeNode({
        label: col.name, sub: `(${bits.join(', ')})`, icon: pk.has(col.name) ? 'key' : fk.has(col.name) ? 'fkey' : 'col', depth: depth + 1, drag: qn(col.name),
        row: {
          name: col.name, data_type: col.is_user_defined ? `${col.type} (${fmtType({ ...col, type: col.base_type })})` : fmtType(col),
          nullable: !!col.is_nullable, identity: !!col.is_identity, computed: !!col.computed, pk: pk.has(col.name), fk: fk.has(col.name),
          default: col.dflt || '', collation: col.collation || '',
        },
        menu: () => [['Copy name', () => copyText(col.name), { icon: 'copy' }]],
      }));
    }
    if (!info.columns.length) g.append(infoRow('(no columns)', depth + 1));
  }, { kind: 'columns' });
}

function keysFolder(c, db, o, info, depth) {
  return folder('Keys', depth, g => {
    for (const ix of info.indexes.filter(i => i.pk || i.uq)) {
      g.append(treeNode({
        label: ix.name, sub: ix.pk ? '(primary key)' : '(unique)', icon: 'key', depth: depth + 1,
        row: { name: ix.name, kind: ix.pk ? 'Primary Key' : 'Unique Key', cols: ix.cols.map(k => k.name).join(', '), ref: '' },
        menu: () => [
          ['Script Key as CREATE', () => openScript(c, db, ix.name, keyCreate(o, ix) + 'GO\n')],
          ['Script Key as DROP', () => openScript(c, db, ix.name, `ALTER TABLE ${full(o)} DROP CONSTRAINT ${qn(ix.name)};\nGO\n`)],
        ],
      }));
    }
    for (const fk of info.foreignKeys) {
      g.append(treeNode({
        label: fk.name, sub: `(→ ${fk.refSchema}.${fk.refTable}${fk.disabled ? ', disabled' : ''})`, icon: 'fkey', depth: depth + 1, dim: fk.disabled,
        row: { name: fk.name, kind: 'Foreign Key', cols: fk.cols.join(', '), ref: `${fk.refSchema}.${fk.refTable} (${fk.refCols.join(', ')})` },
        menu: () => [
          ['Script Key as CREATE', () => openScript(c, db, fk.name, fkCreate(o, fk) + 'GO\n')],
          ['Script Key as DROP', () => openScript(c, db, fk.name, `ALTER TABLE ${full(o)} DROP CONSTRAINT ${qn(fk.name)};\nGO\n`)],
          ['Open referenced table', () => selectTopByName(c, db, fk.refSchema, fk.refTable)],
        ],
      }));
    }
    if (!g.childNodes.length) g.append(infoRow('(none)', depth + 1));
  }, { kind: 'keys' });
}

function constraintsFolder(c, db, o, info, depth) {
  return folder('Constraints', depth, g => {
    for (const ck of info.checks) {
      g.append(treeNode({
        label: ck.name, sub: `CHECK ${ck.definition}`, icon: 'check', depth: depth + 1, dim: ck.is_disabled,
        row: { name: ck.name, kind: 'Check', definition: ck.definition, column: '' },
        menu: () => [
          ['Script as CREATE', () => openScript(c, db, ck.name, `ALTER TABLE ${full(o)} WITH CHECK ADD CONSTRAINT ${qn(ck.name)} CHECK ${ck.definition};\nGO\n`)],
          ['Script as DROP', () => openScript(c, db, ck.name, `ALTER TABLE ${full(o)} DROP CONSTRAINT ${qn(ck.name)};\nGO\n`)],
        ],
      }));
    }
    for (const col of info.columns.filter(x => x.dflt)) {
      g.append(treeNode({
        label: col.dflt_name, sub: `DEFAULT ${col.dflt} FOR ${col.name}`, icon: 'check', depth: depth + 1,
        row: { name: col.dflt_name, kind: 'Default', definition: col.dflt, column: col.name },
        menu: () => [
          ['Script as CREATE', () => openScript(c, db, col.dflt_name, `ALTER TABLE ${full(o)} ADD CONSTRAINT ${qn(col.dflt_name)} DEFAULT ${col.dflt} FOR ${qn(col.name)};\nGO\n`)],
          ['Script as DROP', () => openScript(c, db, col.dflt_name, `ALTER TABLE ${full(o)} DROP CONSTRAINT ${qn(col.dflt_name)};\nGO\n`)],
        ],
      }));
    }
    if (!g.childNodes.length) g.append(infoRow('(none)', depth + 1));
  }, { kind: 'constraints' });
}

function triggersFolder(c, db, o, info, depth) {
  return folder('Triggers', depth, g => {
    for (const t of info.triggers) {
      const tr = { id: t.id, sch: o.sch, name: t.name, type: 'TR' };
      g.append(treeNode({
        label: t.name, sub: `${t.instead_of ? '(instead of)' : ''}${t.is_disabled ? ' (disabled)' : ''}`, icon: 'trigger', depth: depth + 1, dim: t.is_disabled,
        row: { name: t.name, instead_of: !!t.instead_of, disabled: !!t.is_disabled },
        menu: () => [
          ['Modify', () => scriptModule(c, db, tr, 'alter')],
          ['Script as CREATE', () => scriptModule(c, db, tr, 'create')],
          ['Script as DROP', () => openScript(c, db, t.name, `DROP TRIGGER ${qn(o.sch)}.${qn(t.name)};\nGO\n`)],
          [t.is_disabled ? 'Enable (script)' : 'Disable (script)', () => openScript(c, db, t.name, `${t.is_disabled ? 'ENABLE' : 'DISABLE'} TRIGGER ${qn(o.sch)}.${qn(t.name)} ON ${full(o)};\nGO\n`)],
        ],
      }));
    }
    if (!info.triggers.length) g.append(infoRow('(none)', depth + 1));
  }, { kind: 'triggers' });
}

function indexesFolder(c, db, o, info, depth) {
  return folder('Indexes', depth, g => {
    for (const ix of info.indexes) {
      const kind = ix.kind.replace('NONCLUSTERED', 'Non-Clustered').replace('CLUSTERED', 'Clustered').replace(/_/g, ' ').toLowerCase().replace(/^\w/, ch => ch.toUpperCase());
      g.append(treeNode({
        label: ix.name, sub: `(${ix.unique ? 'Unique, ' : ''}${kind}${ix.disabled ? ', disabled' : ''})`, icon: ix.pk ? 'key' : 'index', depth: depth + 1, dim: ix.disabled,
        tip: `Keys: ${ix.cols.map(k => k.name + (k.desc ? ' DESC' : '')).join(', ')}${ix.include.length ? `\nIncluded: ${ix.include.join(', ')}` : ''}${ix.filter ? `\nFilter: ${ix.filter}` : ''}`,
        row: {
          name: ix.name, kind, unique: !!ix.unique, keys: ix.cols.map(k => k.name + (k.desc ? ' DESC' : '')).join(', '),
          include: ix.include.join(', '), filter: ix.filter || '', disabled: !!ix.disabled,
        },
        menu: () => [
          ['Script Index as CREATE', () => openScript(c, db, ix.name, (ix.pk || ix.uq ? keyCreate(o, ix) : indexCreate(o, ix)) + 'GO\n')],
          ['Script Index as DROP', () => openScript(c, db, ix.name, ix.pk || ix.uq
            ? `ALTER TABLE ${full(o)} DROP CONSTRAINT ${qn(ix.name)};\nGO\n`
            : `DROP INDEX ${qn(ix.name)} ON ${full(o)};\nGO\n`)],
          ['Rebuild (script)', () => openScript(c, db, ix.name, `ALTER INDEX ${qn(ix.name)} ON ${full(o)} REBUILD;\nGO\n`)],
          ['Reorganize (script)', () => openScript(c, db, ix.name, `ALTER INDEX ${qn(ix.name)} ON ${full(o)} REORGANIZE;\nGO\n`)],
          [ix.disabled ? 'Enable via rebuild (script)' : 'Disable (script)', () => openScript(c, db, ix.name, `ALTER INDEX ${qn(ix.name)} ON ${full(o)} ${ix.disabled ? 'REBUILD' : 'DISABLE'};\nGO\n`)],
        ],
      }));
    }
    if (!info.indexes.length) g.append(infoRow('(none)', depth + 1));
  }, { kind: 'indexes' });
}

// ---------------------------------------------------------------- object menus

function objectMenu(c, db, o) {
  const t = o.type;
  const kindName = { U: 'Table', V: 'View', P: 'Stored Procedure', PC: 'Stored Procedure', SN: 'Synonym', SO: 'Sequence' }[t] || 'Function';
  const script = [];
  const isModule = ['V', 'P', 'FN', 'IF', 'TF'].includes(t);
  script.push(['CREATE To New Query Window', () => (t === 'U' ? scriptTable(c, db, o) : isModule ? scriptModule(c, db, o, 'create') : scriptSimple(c, db, o, 'create'))]);
  if (isModule) script.push(['ALTER To New Query Window', () => scriptModule(c, db, o, 'alter')]);
  script.push(['DROP To New Query Window', () => openScript(c, db, o.name + ' (DROP)', dropSql(o) + 'GO\n')]);
  script.push(['DROP And CREATE To New Query Window', () => (t === 'U' ? scriptTable(c, db, o, true) : isModule ? scriptModule(c, db, o, 'dropcreate') : scriptSimple(c, db, o, 'dropcreate'))]);
  if (t === 'U' || t === 'V') {
    script.push(null,
      ['SELECT To New Query Window', () => scriptDml(c, db, o, 'select')],
      ['INSERT To New Query Window', () => scriptDml(c, db, o, 'insert')],
      ['UPDATE To New Query Window', () => scriptDml(c, db, o, 'update')],
      ['DELETE To New Query Window', () => scriptDml(c, db, o, 'delete')]);
  }
  if (t === 'P' || t === 'PC') script.push(null, ['EXECUTE To New Query Window', () => scriptExec(c, db, o)]);
  if (['IF', 'TF', 'FT', 'FN', 'FS'].includes(t)) script.push(null, ['SELECT To New Query Window', () => scriptFunctionCall(c, db, o)]);

  const items = [];
  if (t === 'U') items.push(['Design', () => app.openDesignTab({ conn: c.id, db, schema: o.sch, name: o.name }), { icon: 'details' }]);
  if (t === 'U' || t === 'V') {
    items.push(['Select Top 1000 Rows', () => selectTop(c, db, o), { icon: 'resultsGrid' }]);
    if (t === 'U') items.push(['Edit Top 200 Rows', () => app.openEditTab({ conn: c.id, db, schema: o.sch, name: o.name }), { icon: 'table' }]);
  }
  if (t === 'P' || t === 'PC') items.push(['Execute Stored Procedure…', () => scriptExec(c, db, o), { icon: 'execute' }]);
  if (isModule) items.push(['Modify', () => scriptModule(c, db, o, 'alter')]);
  items.push([`Script ${kindName} as`, script]);
  if (t !== 'SO') items.push(['View Dependencies', () => dependencies(c, db, o)]);
  items.push(null);
  items.push(['Insert name into editor', () => app.insertText(full(o))]);
  items.push(['Copy name', () => copyText(full(o)), { icon: 'copy' }]);
  items.push(['Refresh', () => (selected && selected.refresh ? selected.refresh() : null), { icon: 'refresh', hint: 'F5' }]);
  if (t === 'U') items.push(['Properties', () => report(c, db, o.name + ' properties', tablePropsSql(o))]);
  return items;
}

// ---------------------------------------------------------------- scripting

function openScript(c, db, title, sql, run) {
  app.newTab({ title, conn: c.id, db, sql, run });
}

function report(c, db, title, sql) {
  openScript(c, db, title, sql, true);
}

function dropSql(o) {
  const kind = DROP_KIND[o.type];
  return `IF OBJECT_ID(N'${full(o).replace(/'/g, "''")}', N'${o.type}') IS NOT NULL\n    DROP ${kind} ${full(o)};\n`;
}

const colList = (cols, indent = '      ,') => cols.map(c => qn(c.name)).join('\n' + indent);

function keyCreate(o, ix) {
  const cols = ix.cols.map(k => qn(k.name) + (k.desc ? ' DESC' : ' ASC')).join(', ');
  return `ALTER TABLE ${full(o)} ADD CONSTRAINT ${qn(ix.name)} ${ix.pk ? 'PRIMARY KEY' : 'UNIQUE'} ${ix.kind === 'CLUSTERED' ? 'CLUSTERED' : 'NONCLUSTERED'} (${cols});\n`;
}

function fkCreate(o, fk) {
  let s = `ALTER TABLE ${full(o)} WITH CHECK ADD CONSTRAINT ${qn(fk.name)} FOREIGN KEY (${fk.cols.map(qn).join(', ')})\n    REFERENCES ${qn(fk.refSchema)}.${qn(fk.refTable)} (${fk.refCols.map(qn).join(', ')})`;
  if (fk.onDelete && fk.onDelete !== 'NO_ACTION') s += ` ON DELETE ${fk.onDelete.replace(/_/g, ' ')}`;
  if (fk.onUpdate && fk.onUpdate !== 'NO_ACTION') s += ` ON UPDATE ${fk.onUpdate.replace(/_/g, ' ')}`;
  return s + ';\n';
}

function indexCreate(o, ix) {
  const kind = ix.kind === 'CLUSTERED' ? 'CLUSTERED' : ix.kind === 'NONCLUSTERED' ? 'NONCLUSTERED' : ix.kind.replace(/_/g, ' ');
  let s = `CREATE ${ix.unique ? 'UNIQUE ' : ''}${kind} INDEX ${qn(ix.name)} ON ${full(o)} (${ix.cols.map(k => qn(k.name) + (k.desc ? ' DESC' : ' ASC')).join(', ')})`;
  if (ix.include.length) s += `\n    INCLUDE (${ix.include.map(qn).join(', ')})`;
  if (ix.filter) s += `\n    WHERE ${ix.filter}`;
  return s + ';\n';
}

async function scriptTable(c, db, o, withDrop) {
  const info = await getTableInfo(c.id, db, o.id);
  const lines = info.columns.map(col => {
    let s = `    ${qn(col.name)} `;
    if (col.computed) return s + `AS ${col.computed}${col.is_persisted ? ' PERSISTED' : ''}`;
    s += col.is_user_defined ? qn(col.type) : fmtType(col);
    if (col.is_identity) s += ` IDENTITY(${col.seed},${col.incr})`;
    s += col.is_nullable ? ' NULL' : ' NOT NULL';
    if (col.dflt) s += ` CONSTRAINT ${qn(col.dflt_name)} DEFAULT ${col.dflt}`;
    return s;
  });
  for (const ix of info.indexes.filter(i => i.pk || i.uq)) {
    lines.push(`    CONSTRAINT ${qn(ix.name)} ${ix.pk ? 'PRIMARY KEY' : 'UNIQUE'} ${ix.kind === 'CLUSTERED' ? 'CLUSTERED' : 'NONCLUSTERED'} (${ix.cols.map(k => qn(k.name) + (k.desc ? ' DESC' : ' ASC')).join(', ')})`);
  }
  let sql = `USE ${qn(db)}\nGO\n`;
  if (withDrop) sql += dropSql(o) + 'GO\n';
  sql += `CREATE TABLE ${full(o)} (\n${lines.join(',\n')}\n);\nGO\n`;
  for (const fk of info.foreignKeys) sql += fkCreate(o, fk) + 'GO\n';
  for (const ck of info.checks) sql += `ALTER TABLE ${full(o)} WITH CHECK ADD CONSTRAINT ${qn(ck.name)} CHECK ${ck.definition};\nGO\n`;
  for (const ix of info.indexes.filter(i => !i.pk && !i.uq)) sql += indexCreate(o, ix) + 'GO\n';
  openScript(c, db, o.name + (withDrop ? ' (DROP+CREATE)' : ' (CREATE)'), sql);
}

async function scriptModule(c, db, o, mode) {
  const d = await api('definition', { conn: c.id, db, id: o.id });
  if (d.definition == null) throw new Error('The definition is not available (encrypted / CLR object, or no VIEW DEFINITION permission).');
  let def = d.definition.replace(/\r\n?/g, '\n').trim();
  if (mode === 'alter') def = def.replace(/^((?:\s|--[^\n]*|\/\*[\s\S]*?\*\/)*)CREATE(\s+OR\s+ALTER)?\b/i, '$1ALTER');
  let sql = `USE ${qn(db)}\nGO\n`;
  if (mode === 'dropcreate') sql += (o.parentDb ? `DROP TRIGGER IF EXISTS ${qn(o.name)} ON DATABASE;\n` : dropSql(o)) + 'GO\n';
  sql += `SET ANSI_NULLS ${d.ansiNulls ? 'ON' : 'OFF'}\nGO\nSET QUOTED_IDENTIFIER ${d.quotedIdentifier ? 'ON' : 'OFF'}\nGO\n${def}\nGO\n`;
  openScript(c, db, o.name + { alter: ' (ALTER)', create: ' (CREATE)', dropcreate: ' (DROP+CREATE)' }[mode], sql);
}

async function scriptSimple(c, db, o, mode) {
  const d = await api('definition', { conn: c.id, db, id: o.id });
  let create;
  if (d.synonymBase) create = `CREATE SYNONYM ${full(o)} FOR ${d.synonymBase};\n`;
  else if (d.sequence) {
    const s = d.sequence;
    create = `CREATE SEQUENCE ${full(o)}\n    AS ${s.type}\n    START WITH ${s.start_value}\n    INCREMENT BY ${s.increment}\n    MINVALUE ${s.min_value}\n    MAXVALUE ${s.max_value}\n    ${s.is_cycling ? 'CYCLE' : 'NO CYCLE'}\n    ${s.is_cached ? (s.cache_size ? `CACHE ${s.cache_size}` : 'CACHE') : 'NO CACHE'};\n`;
  } else throw new Error('No definition is available for this object.');
  openScript(c, db, o.name, `USE ${qn(db)}\nGO\n${mode === 'dropcreate' ? dropSql(o) + 'GO\n' : ''}${create}GO\n`);
}

async function scriptDml(c, db, o, kind) {
  const info = await getTableInfo(c.id, db, o.id);
  const cols = info.columns;
  const writable = cols.filter(x => !x.is_identity && !x.computed && !['timestamp', 'rowversion'].includes(String(x.base_type).toLowerCase()));
  let sql;
  if (kind === 'select') sql = `SELECT ${colList(cols)}\n  FROM ${full(o)};\n`;
  else if (kind === 'insert') {
    sql = `INSERT INTO ${full(o)}\n           (${colList(writable, '           ,')})\n     VALUES\n           (${writable.map(x => `NULL /* ${x.name}, ${fmtType(x)} */`).join('\n           ,')});\n`;
  } else if (kind === 'update') {
    sql = `UPDATE ${full(o)}\n   SET ${writable.map(x => `${qn(x.name)} = NULL /* ${fmtType(x)} */`).join('\n      ,')}\n WHERE 1 = 0 /* <search condition> */;\n`;
  } else {
    sql = `DELETE FROM ${full(o)}\n WHERE 1 = 0 /* <search condition> */;\n`;
  }
  openScript(c, db, `${o.name} (${kind.toUpperCase()})`, `USE ${qn(db)}\nGO\n${sql}GO\n`);
}

async function scriptExec(c, db, o) {
  const { params } = await api('params', { conn: c.id, db, id: o.id });
  const ps = params.filter(p => p.name);
  const outs = ps.filter(p => p.is_output);
  let sql = `USE ${qn(db)}\nGO\n` + outs.map(p => `DECLARE ${p.name} ${fmtType(p)};\n`).join('');
  sql += `EXEC ${full(o)}`;
  if (ps.length) sql += '\n' + ps.map((p, i) => `    ${i ? ',' : ' '}${p.name} = ${p.is_output ? p.name + ' OUTPUT' : 'NULL'}  /* ${fmtType(p)} */`).join('\n');
  sql += ';\n';
  if (outs.length) sql += `SELECT ${outs.map(p => `${p.name} AS ${qn(p.name)}`).join(', ')};\n`;
  openScript(c, db, o.name + ' (EXEC)', sql + 'GO\n');
}

async function scriptFunctionCall(c, db, o) {
  const { params } = await api('params', { conn: c.id, db, id: o.id });
  const args = params.filter(p => p.name).map(p => `NULL /* ${p.name} ${fmtType(p)} */`).join(', ');
  const call = `${full(o)}(${args})`;
  openScript(c, db, o.name, ['FN', 'FS'].includes(o.type) ? `SELECT ${call};\n` : `SELECT *\n  FROM ${call};\n`);
}

async function selectTop(c, db, o) {
  const info = await getTableInfo(c.id, db, o.id);
  const list = info.columns.length ? colList(info.columns) : '*';
  openScript(c, db, o.name, `/****** Script for SelectTopNRows command from SSMS  ******/\nSELECT TOP (1000) ${list}\n  FROM ${qn(db)}.${full(o)}\n`, true);
}

async function selectTopByName(c, db, sch, name) {
  const objs = await getObjects(c.id, db);
  const o = objs.find(x => x.sch === sch && x.name === name);
  if (o) return selectTop(c, db, o);
  openScript(c, db, name, `SELECT TOP (1000) *\n  FROM ${qn(db)}.${qn(sch)}.${qn(name)}\n`, true);
}

function dependencies(c, db, o) {
  const name = sqlStr(full(o));
  report(c, db, o.name + ' dependencies', `-- Objects that depend on ${o.sch}.${o.name}
SELECT OBJECT_SCHEMA_NAME(d.referencing_id) AS [schema], OBJECT_NAME(d.referencing_id) AS [object], ro.type_desc
  FROM sys.sql_expression_dependencies d
  JOIN sys.objects ro ON ro.object_id = d.referencing_id
 WHERE d.referenced_id = OBJECT_ID(${name})
UNION
SELECT OBJECT_SCHEMA_NAME(fk.parent_object_id), OBJECT_NAME(fk.parent_object_id), 'FOREIGN KEY ' + fk.name
  FROM sys.foreign_keys fk
 WHERE fk.referenced_object_id = OBJECT_ID(${name}) AND fk.parent_object_id <> fk.referenced_object_id
 ORDER BY 1, 2;

-- Objects that ${o.sch}.${o.name} depends on
SELECT COALESCE(d.referenced_schema_name, OBJECT_SCHEMA_NAME(d.referenced_id)) AS [schema], d.referenced_entity_name AS [object],
       o.type_desc, d.referenced_database_name AS [database]
  FROM sys.sql_expression_dependencies d
  LEFT JOIN sys.objects o ON o.object_id = d.referenced_id
 WHERE d.referencing_id = OBJECT_ID(${name})
UNION
SELECT OBJECT_SCHEMA_NAME(fk.referenced_object_id), OBJECT_NAME(fk.referenced_object_id), 'FOREIGN KEY ' + fk.name, NULL
  FROM sys.foreign_keys fk
 WHERE fk.parent_object_id = OBJECT_ID(${name}) AND fk.parent_object_id <> fk.referenced_object_id
 ORDER BY 1, 2;`);
}

async function searchInCode(c, db) {
  const text = await askText('Search in Code', 'Find stored procedures, views, functions and triggers whose code contains:', '', { placeholder: 'e.g. Acc_Document' });
  if (!text) return;
  const like = sqlStr('%' + text.replace(/[[%_]/g, ch => `[${ch}]`) + '%');
  report(c, db, 'Search: ' + text, `SELECT s.name AS [schema], o.name, o.type_desc, o.modify_date,
       CHARINDEX(${sqlStr(text)}, m.definition) AS first_position
  FROM sys.sql_modules m
  JOIN sys.objects o ON o.object_id = m.object_id
  JOIN sys.schemas s ON s.schema_id = o.schema_id
 WHERE m.definition LIKE ${like}
 ORDER BY o.type_desc, s.name, o.name;`);
}

function tablePropsSql(o) {
  const name = sqlStr(full(o));
  return `EXEC sp_spaceused ${name};
SELECT o.create_date, o.modify_date, t.lock_escalation_desc, t.is_replicated, t.temporal_type_desc,
       (SELECT COUNT(*) FROM sys.columns c WHERE c.object_id = o.object_id) AS columns,
       (SELECT COUNT(*) FROM sys.indexes i WHERE i.object_id = o.object_id AND i.type > 0) AS indexes
  FROM sys.objects o JOIN sys.tables t ON t.object_id = o.object_id
 WHERE o.object_id = OBJECT_ID(${name});
SELECT i.name AS index_name, i.type_desc, SUM(p.rows) AS rows, CAST(SUM(a.total_pages) * 8 / 1024.0 AS decimal(18,2)) AS size_mb
  FROM sys.indexes i
  JOIN sys.partitions p ON p.object_id = i.object_id AND p.index_id = i.index_id
  JOIN sys.allocation_units a ON a.container_id = p.partition_id
 WHERE i.object_id = OBJECT_ID(${name})
 GROUP BY i.name, i.type_desc, i.index_id
 ORDER BY i.index_id;`;
}

export function activityMonitor() {
  const s = selected && serverOf(selected);
  const c = (s && app.conns.get(s.dataset.conn)) || (app.active && app.conns.get(app.active.conn)) || app.conns.values().next().value;
  if (!c) { toast('Connect to a server first.', true); return; }
  if (c.spec.type && c.spec.type !== 'mssql') { toast('Activity Monitor is available for SQL Server connections.', true); return; }
  report(c, c.info.db, 'Activity Monitor', ACTIVITY_SQL);
}

// ---------------------------------------------------------------- report queries

const ACTIVITY_SQL = `-- Activity Monitor: user sessions and running requests (press F5 to refresh).
-- To end a session: KILL <session_id>;
SELECT s.session_id, r.blocking_session_id AS blocked_by, s.login_name, s.host_name, s.program_name,
       DB_NAME(COALESCE(r.database_id, s.database_id)) AS [database], s.status, r.command, r.wait_type, r.wait_time,
       r.cpu_time, r.total_elapsed_time AS elapsed_ms, r.logical_reads, s.open_transaction_count AS open_tran,
       SUBSTRING(t.text, (r.statement_start_offset / 2) + 1,
         ((CASE r.statement_end_offset WHEN -1 THEN DATALENGTH(t.text) ELSE r.statement_end_offset END - r.statement_start_offset) / 2) + 1) AS running_statement
  FROM sys.dm_exec_sessions s
  LEFT JOIN sys.dm_exec_requests r ON r.session_id = s.session_id
  OUTER APPLY sys.dm_exec_sql_text(r.sql_handle) t
 WHERE s.is_user_process = 1
 ORDER BY CASE WHEN r.session_id IS NULL THEN 1 ELSE 0 END, r.total_elapsed_time DESC, s.session_id;`;

const SERVER_PROPS_SQL = `SELECT SERVERPROPERTY('MachineName') AS machine, @@SERVERNAME AS server_name, SERVERPROPERTY('Edition') AS edition,
       SERVERPROPERTY('ProductVersion') AS version, SERVERPROPERTY('ProductLevel') AS level, SERVERPROPERTY('ProductUpdateLevel') AS cu,
       SERVERPROPERTY('Collation') AS collation, SERVERPROPERTY('IsClustered') AS is_clustered,
       SERVERPROPERTY('IsHadrEnabled') AS always_on, @@LANGUAGE AS language;
SELECT @@VERSION AS version_text;
SELECT cpu_count, hyperthread_ratio, CAST(physical_memory_kb / 1024.0 AS decimal(18,0)) AS memory_mb, sqlserver_start_time
  FROM sys.dm_os_sys_info;`;

const TOP_CPU_SQL = `SELECT TOP (50) qs.total_worker_time / 1000 AS total_cpu_ms, qs.execution_count,
       qs.total_worker_time / qs.execution_count / 1000 AS avg_cpu_ms, qs.total_logical_reads / qs.execution_count AS avg_reads,
       DB_NAME(t.dbid) AS [database], qs.last_execution_time,
       SUBSTRING(t.text, (qs.statement_start_offset / 2) + 1,
         ((CASE qs.statement_end_offset WHEN -1 THEN DATALENGTH(t.text) ELSE qs.statement_end_offset END - qs.statement_start_offset) / 2) + 1) AS statement
  FROM sys.dm_exec_query_stats qs
 CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) t
 ORDER BY qs.total_worker_time DESC;`;

const DB_SIZES_SQL = `SELECT DB_NAME(database_id) AS [database], type_desc, CAST(SUM(size) * 8 / 1024.0 AS decimal(18,2)) AS size_mb
  FROM sys.master_files
 GROUP BY database_id, type_desc
 ORDER BY size_mb DESC;`;

const DB_PROPS_SQL = `SELECT name, state_desc, recovery_model_desc, compatibility_level, collation_name, create_date, user_access_desc,
       is_read_only, snapshot_isolation_state_desc, is_read_committed_snapshot_on, page_verify_option_desc
  FROM sys.databases WHERE name = DB_NAME();
EXEC sp_spaceused;
SELECT name, type_desc, physical_name, CAST(size / 128.0 AS decimal(18,2)) AS size_mb,
       CASE max_size WHEN -1 THEN NULL ELSE CAST(max_size / 128.0 AS decimal(18,2)) END AS max_size_mb,
       CASE WHEN is_percent_growth = 1 THEN CAST(growth AS varchar(10)) + ' %' ELSE CAST(growth / 128 AS varchar(10)) + ' MB' END AS growth
  FROM sys.database_files;`;

const DISK_USAGE_SQL = `SELECT TOP (200) s.name AS [schema], t.name AS [table],
       (SELECT SUM(p2.rows) FROM sys.partitions p2 WHERE p2.object_id = t.object_id AND p2.index_id IN (0, 1)) AS [rows],
       CAST(SUM(a.total_pages) * 8 / 1024.0 AS decimal(18,2)) AS reserved_mb,
       CAST(SUM(a.used_pages) * 8 / 1024.0 AS decimal(18,2)) AS used_mb
  FROM sys.tables t
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.partitions p ON p.object_id = t.object_id
  JOIN sys.allocation_units a ON a.container_id = p.partition_id
 GROUP BY s.name, t.name, t.object_id
 ORDER BY reserved_mb DESC;`;

const MISSING_INDEX_SQL = `SELECT TOP (50)
       CAST(migs.avg_total_user_cost * migs.avg_user_impact * (migs.user_seeks + migs.user_scans) AS decimal(18,2)) AS improvement,
       mid.statement AS [table], mid.equality_columns, mid.inequality_columns, mid.included_columns,
       migs.user_seeks, migs.user_scans, migs.last_user_seek
  FROM sys.dm_db_missing_index_group_stats migs
  JOIN sys.dm_db_missing_index_groups mig ON mig.index_group_handle = migs.group_handle
  JOIN sys.dm_db_missing_index_details mid ON mid.index_handle = mig.index_handle
 WHERE mid.database_id = DB_ID()
 ORDER BY improvement DESC;`;

const INDEX_USAGE_SQL = `SELECT OBJECT_SCHEMA_NAME(i.object_id) AS [schema], OBJECT_NAME(i.object_id) AS [table], i.name AS index_name, i.type_desc,
       us.user_seeks, us.user_scans, us.user_lookups, us.user_updates, us.last_user_seek, us.last_user_scan
  FROM sys.indexes i
  LEFT JOIN sys.dm_db_index_usage_stats us ON us.object_id = i.object_id AND us.index_id = i.index_id AND us.database_id = DB_ID()
 WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1 AND i.type > 0
 ORDER BY ISNULL(us.user_seeks, 0) + ISNULL(us.user_scans, 0) + ISNULL(us.user_lookups, 0), us.user_updates DESC;`;
