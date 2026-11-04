// "Connect to Server" dialog: server type, saved connections and type-specific fields.

import { h, api, formDialog, confirmBox, fmtInt } from './util.js';
import { ICONS } from './icons.js';

const DB_EXT = /\.(db|sqlite|sqlite3|db3|s3db|sl3|cdb)$/i;
const FILE_TYPES = new Set(['sqlite', 'cdb']);   // connections that open a local file

// Small file picker backed by the local server (browsers cannot reveal full file paths).
export function pickFile(start, title = 'Select a SQLite database file',
  intro = 'Double-click a folder to open it. Pick a .db / .sqlite file — or a .sql script to create a new database from it.') {
  return formDialog({
    title,
    width: '680px',
    ok: 'Select',
    intro,
    fields: [{ name: 'path', label: 'File', value: start || '', placeholder: 'C:\\Users\\you\\Desktop\\data.db' }],
    build(d) {
      const where = h('div', 'fp-dir');
      const list = h('div', 'fp-list');
      d.body.insertBefore(where, d.body.lastChild);
      d.body.insertBefore(list, d.body.lastChild);
      const row = (label, icon, onPick, onOpen, extra) => {
        const r = h('div', 'fp-row');
        const ic = h('span', 'fp-ic');
        ic.innerHTML = ICONS[icon] || '';
        r.append(ic, h('span', 'fp-name', label), h('span', 'fp-size', extra || ''));
        r.onclick = () => { list.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); r.classList.add('sel'); onPick && onPick(); };
        r.ondblclick = onOpen;
        list.append(r);
      };
      const go = async dir => {
        list.replaceChildren(h('div', 'fp-empty', 'Loading…'));
        try {
          const res = await api('browse', { dir });
          where.textContent = res.dir || 'This PC';
          list.replaceChildren();
          if (res.parent !== null) row('..', 'folder', null, () => go(res.parent));
          for (const e of res.entries) {
            if (e.isDir) row(e.name, 'folder', null, () => go(e.path));
            else {
              const icon = DB_EXT.test(e.name) ? 'db' : /\.sql$/i.test(e.name) ? 'newQuery' : 'resultsText';
              const pick = () => { d.inputs.path.value = e.path; };
              row(e.name, icon, pick, () => { pick(); d.form.requestSubmit(); }, e.size != null ? `${fmtInt(Math.ceil(e.size / 1024))} KB` : '');
            }
          }
          if (!res.entries.length) list.append(h('div', 'fp-empty', '(empty folder)'));
        } catch (err) {
          list.replaceChildren(h('div', 'fp-empty err', err.message));
        }
      };
      const startDir = start && /[\\/]/.test(start) ? start.replace(/[\\/][^\\/]*$/, '') || start : '';
      go(startDir);
    },
    onSubmit: v => (v.path.trim() ? v : undefined),
  });
}

export const SERVER_TYPES = [
  ['mssql', 'SQL Server'], ['mysql', 'MySQL'], ['mariadb', 'MariaDB'], ['postgres', 'PostgreSQL'], ['oracle', 'Oracle'],
  ['sqlite', 'SQLite'], ['mongodb', 'MongoDB'], ['redis', 'Redis'], ['cassandra', 'Cassandra'], ['cdb', 'Mold Data (.cdb)'],
];
const DEFAULT_PORT = { mysql: 3306, mariadb: 3306, postgres: 5432, oracle: 1521, mongodb: 27017, redis: 6379, cassandra: 9042 };

// Which fields each server type shows, and type-specific labels.
const FIELDS = {
  mssql: ['server', 'auth', 'domain', 'user', 'password', 'savePassword', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout', 'appName'],
  mysql: ['server', 'port', 'user', 'password', 'savePassword', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
  mariadb: ['server', 'port', 'user', 'password', 'savePassword', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
  postgres: ['server', 'port', 'user', 'password', 'savePassword', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
  oracle: ['server', 'port', 'database', 'user', 'password', 'savePassword', 'connectTimeout'],
  sqlite: ['file', 'readOnly', 'create'],
  cdb: ['file'],
  mongodb: ['connectionString', 'server', 'port', 'user', 'password', 'savePassword', 'authSource', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
  redis: ['server', 'port', 'user', 'password', 'savePassword', 'database', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
  cassandra: ['server', 'port', 'user', 'password', 'savePassword', 'database', 'dataCenter', 'encrypt', 'trustServerCertificate', 'connectTimeout'],
};
const DB_LABEL = { oracle: 'Service name', redis: 'Database number', cassandra: 'Keyspace', mongodb: 'Default database' };
const DB_PLACEHOLDER = { oracle: 'e.g. ORCLPDB1 or XEPDB1', redis: '0', cassandra: '<none>', postgres: 'postgres' };
const USER_LABEL = { mssql: 'Login', redis: 'Username (optional)', mongodb: 'Username', cassandra: 'Username (optional)' };

export async function connectDialog(prefill = {}) {
  let saved = [];
  try { saved = (await api('savedConnections')).saved; } catch { /* server unreachable: dialog still opens */ }
  const pick = id => saved.find(s => s.id === id) || null;
  const selected = pick(prefill.id) || (!prefill.server && saved.length && !prefill.blank ? saved[0] : null);
  const d0 = selected || prefill;
  const type0 = d0.type || prefill.type || 'mssql';

  return formDialog({
    title: 'Connect to Server',
    width: '540px',
    ok: 'Connect',
    fields: [
      { name: 'saved', label: 'Saved connections', type: 'select', noFocus: true, value: selected ? selected.id : '',
        options: [['', '— New connection —'], ...saved.map(s => [s.id, s.name])] },
      { name: 'type', label: 'Server type', type: 'select', noFocus: true, value: type0, options: SERVER_TYPES },
      { name: 'connectionString', label: 'Connection string', value: d0.connectionString || '', placeholder: 'mongodb://user:pass@host:27017/db  (optional — or fill the fields below)' },
      { name: 'file', label: 'Database file', value: d0.file || '', placeholder: 'C:\\data\\app.db' },
      { name: 'readOnly', label: 'Open read-only', type: 'checkbox', value: !!d0.readOnly },
      { name: 'create', label: 'Create the file if it does not exist', type: 'checkbox', value: false },
      { name: 'server', label: 'Server name', value: d0.server || '', placeholder: 'host  ·  host\\instance  ·  host,port' },
      { name: 'port', label: 'Port', value: d0.port || '', placeholder: '' },
      { name: 'auth', label: 'Authentication', type: 'select', value: d0.auth || 'sql',
        options: [['sql', 'SQL Server Authentication'], ['ntlm', 'Windows Authentication (domain account)']] },
      { name: 'domain', label: 'Domain', value: d0.domain || '' },
      { name: 'user', label: 'Login', value: d0.user || '' },
      { name: 'password', label: 'Password', type: 'password', value: '' },
      { name: 'savePassword', label: 'Remember password', type: 'checkbox', value: selected ? selected.rememberPassword !== false && (selected.hasPassword || selected.type !== 'mssql') : true },
      { name: 'authSource', label: 'Authentication database', value: d0.authSource || '', placeholder: 'admin' },
      { name: 'database', label: 'Default database', value: d0.database || '', placeholder: '<default>' },
      { name: 'dataCenter', label: 'Local data center', value: d0.dataCenter || '', placeholder: 'datacenter1' },
      { name: 'encrypt', label: 'Encrypt connection (TLS)', type: 'checkbox', value: d0.encrypt !== undefined ? d0.encrypt !== false : type0 === 'mssql' },
      { name: 'trustServerCertificate', label: 'Trust server certificate', type: 'checkbox', value: d0.trustServerCertificate ?? true },
      { name: 'connectTimeout', label: 'Connection timeout (seconds)', type: 'number', value: d0.connectTimeout || 15 },
      { name: 'appName', label: 'Application name', value: d0.appName || 'WebSqlStudio' },
    ],
    build(d) {
      const { inputs, rows } = d;
      const forget = h('button', 'danger', 'Delete saved');
      forget.type = 'button';
      d.foot.prepend(forget);
      const browse = h('button', null, 'Browse…');
      browse.type = 'button';
      const inline = h('span', 'dlg-inline');
      inputs.file.replaceWith(inline);
      inline.append(inputs.file, browse);
      browse.onclick = async () => {
        const r = inputs.type.value === 'cdb'
          ? await pickFile(inputs.file.value.trim(), 'Select a mold data file', 'Double-click a folder to open it. Pick the .cdb file saved by the machine (for example moldset.cdb).')
          : await pickFile(inputs.file.value.trim());
        if (r && r.path) inputs.file.value = r.path.trim();
      };
      const setLabel = (name, text) => { const l = rows[name].querySelector('.dlg-label') || rows[name].querySelector('span'); if (l) l.textContent = text; };
      const sync = () => {
        const type = inputs.type.value;
        const show = new Set(FIELDS[type] || FIELDS.mssql);
        for (const [name, row] of Object.entries(rows)) {
          if (name === 'saved' || name === 'type') continue;
          row.hidden = !show.has(name) || (name === 'domain' && inputs.auth.value !== 'ntlm');
        }
        setLabel('database', DB_LABEL[type] || 'Default database');
        setLabel('file', type === 'cdb' ? 'Mold data file' : 'Database file');
        inputs.file.placeholder = type === 'cdb' ? 'C:\\Users\\you\\Desktop\\moldset.cdb' : 'C:\\data\\app.db';
        setLabel('user', USER_LABEL[type] || 'Username');
        inputs.database.placeholder = DB_PLACEHOLDER[type] || '<default>';
        inputs.port.placeholder = DEFAULT_PORT[type] ? String(DEFAULT_PORT[type]) : '';
        const s = pick(inputs.saved.value);
        forget.hidden = !s;
        inputs.password.placeholder = s && s.hasPassword ? '(saved — leave empty to use it)' : '';
      };
      inputs.auth.onchange = sync;
      inputs.type.onchange = () => {
        inputs.encrypt.checked = inputs.type.value === 'mssql';
        sync();
        (FILE_TYPES.has(inputs.type.value) ? inputs.file : inputs.type.value === 'mongodb' ? inputs.connectionString : inputs.server).focus();
      };
      inputs.saved.onchange = () => {
        const s = pick(inputs.saved.value) || { type: inputs.type.value, encrypt: inputs.type.value === 'mssql', trustServerCertificate: true, connectTimeout: 15, appName: 'WebSqlStudio' };
        inputs.type.value = s.type || 'mssql';
        for (const k of ['server', 'port', 'auth', 'domain', 'user', 'database', 'connectTimeout', 'appName', 'file', 'connectionString', 'authSource', 'dataCenter']) {
          inputs[k].value = s[k] ?? (k === 'auth' ? 'sql' : '');
        }
        inputs.encrypt.checked = s.encrypt !== false && s.encrypt !== undefined ? true : s.encrypt === undefined && s.type === 'mssql';
        inputs.trustServerCertificate.checked = !!s.trustServerCertificate;
        inputs.readOnly.checked = !!s.readOnly;
        inputs.create.checked = false;
        inputs.savePassword.checked = s.id ? s.rememberPassword !== false : true;
        inputs.password.value = '';
        sync();
        (s.id && !FILE_TYPES.has(s.type) ? inputs.password : FILE_TYPES.has(s.type) ? inputs.file : inputs.server).focus();
      };
      forget.onclick = async () => {
        const s = pick(inputs.saved.value);
        if (!s || !(await confirmBox('Delete saved connection', `Remove "${s.name}" from the saved connections?`, 'Delete'))) return;
        await api('forget', { id: s.id });
        saved = saved.filter(x => x !== s);
        inputs.saved.querySelector(`option[value="${CSS.escape(s.id)}"]`)?.remove();
        inputs.saved.value = '';
        inputs.saved.onchange();
      };
      sync();
      setTimeout(() => {
        const t = inputs.type.value;
        const el = FILE_TYPES.has(t) ? inputs.file : selected ? inputs.password : t === 'mongodb' ? inputs.connectionString : inputs.server;
        el.focus();
      }, 30);
    },
    async onSubmit(v) {
      // A .sql script picked as "database file": offer to create a database next to it and open the script.
      let openScript = null;
      if (v.type === 'sqlite' && /\.sql$/i.test(v.file.trim()) && /^([a-z]:[\\/]|[\\/])/i.test(v.file.trim())) {
        const script = v.file.trim();
        const dbFile = script.replace(/\.sql$/i, '.db');
        const name = script.split(/[\\/]/).pop();
        const ok = await confirmBox('Create a database from this script?',
          `"${name}" is a SQL script, not a database file.\n\nCreate a new SQLite database:\n${dbFile}\n\nand open the script in a query window so you can run it (F5)?`, 'Create database');
        if (!ok) return undefined;
        openScript = script;
        v = { ...v, file: dbFile, create: true };
      }
      const spec = {
        type: v.type, server: v.server, port: v.port, auth: v.auth, domain: v.domain, user: v.user, password: v.password,
        database: v.database, encrypt: v.encrypt, trustServerCertificate: v.trustServerCertificate, connectTimeout: v.connectTimeout,
        appName: v.appName, file: v.file, readOnly: v.readOnly, create: v.create, connectionString: v.connectionString,
        authSource: v.authSource, dataCenter: v.dataCenter,
      };
      const res = await api('connect', { id: openScript ? undefined : v.saved || undefined, spec, save: true, savePassword: v.savePassword });
      return openScript ? { ...res, openScript } : res;
    },
  });
}
