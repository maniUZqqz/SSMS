// Graphical execution plan viewer for SQL Server showplan XML.

import { h, fmtInt, download, showText } from './util.js';

const num = (el, attr) => parseFloat(el.getAttribute(attr) || '0') || 0;
const pct = v => (v >= 10 ? Math.round(v) : v.toFixed(1)) + ' %';
const SKIP = new Set(['OutputList', 'Warnings', 'MemoryFractions', 'RunTimeInformation', 'RunTimePartitionSummary', 'InternalInfo']);

function childRelOps(el) {
  const out = [];
  for (const c of el.children) {
    if (c.localName === 'RelOp') out.push(c);
    else out.push(...childRelOps(c));
  }
  return out;
}

function operatorElement(relOp) {
  for (const c of relOp.children) if (!SKIP.has(c.localName)) return c;
  return null;
}

function objectName(op) {
  if (!op) return '';
  const o = [...op.children].find(c => c.localName === 'Object');
  if (!o) return '';
  const strip = s => (s || '').replace(/^\[|\]$/g, '');
  const table = strip(o.getAttribute('Table'));
  const index = strip(o.getAttribute('Index'));
  return index ? `${table}.${index}` : table;
}

function scalarStrings(el, name) {
  const parts = [];
  for (const p of el.getElementsByTagNameNS('*', name)) {
    const s = p.getElementsByTagNameNS('*', 'ScalarOperator')[0];
    if (s && s.getAttribute('ScalarString')) parts.push(s.getAttribute('ScalarString'));
  }
  return parts;
}

function runtime(relOp) {
  const info = [...relOp.children].find(c => c.localName === 'RunTimeInformation');
  if (!info) return null;
  let rows = 0, execs = 0;
  for (const t of info.children) { rows += num(t, 'ActualRows'); execs += num(t, 'ActualExecutions'); }
  return { rows, execs };
}

function details(relOp, op, cost) {
  const lines = [];
  const add = (k, v) => { if (v !== '' && v != null) lines.push(`${k}: ${v}`); };
  add('Physical operation', relOp.getAttribute('PhysicalOp'));
  add('Logical operation', relOp.getAttribute('LogicalOp'));
  const rt = runtime(relOp);
  if (rt) { add('Actual number of rows', fmtInt(rt.rows)); add('Actual executions', fmtInt(rt.execs)); }
  add('Estimated number of rows', fmtInt(Math.round(num(relOp, 'EstimateRows') * 100) / 100));
  add('Estimated row size', relOp.getAttribute('AvgRowSize') ? relOp.getAttribute('AvgRowSize') + ' B' : '');
  add('Estimated I/O cost', relOp.getAttribute('EstimateIO'));
  add('Estimated CPU cost', relOp.getAttribute('EstimateCPU'));
  add('Estimated operator cost', `${cost.op.toFixed(6)} (${pct(cost.pct)})`);
  add('Estimated subtree cost', relOp.getAttribute('EstimatedTotalSubtreeCost'));
  add('Estimated execution mode', relOp.getAttribute('EstimatedExecutionMode'));
  add('Parallel', relOp.getAttribute('Parallel') === '1' || relOp.getAttribute('Parallel') === 'true' ? 'True' : 'False');
  add('Object', objectName(op));
  if (op) {
    const seek = scalarStrings(op, 'SeekPredicates');
    if (seek.length) add('Seek predicates', seek.join(' AND '));
    const pred = [...op.children].find(c => c.localName === 'Predicate');
    if (pred) add('Predicate', scalarStrings(op, 'Predicate')[0]);
  }
  const out = [...relOp.children].find(c => c.localName === 'OutputList');
  if (out) {
    const cols = [...out.children].map(c => [c.getAttribute('Table'), c.getAttribute('Column')].filter(Boolean).join('.'));
    if (cols.length) add('Output list', cols.join(', '));
  }
  const warn = [...relOp.children].find(c => c.localName === 'Warnings');
  if (warn) add('Warnings', [...warn.children].map(w => w.localName + (w.getAttribute('ConvertIssue') ? ` (${w.getAttribute('ConvertIssue')})` : '')).join(', ') || 'yes');
  return lines.join('\n');
}

function nodeBox({ title, sub, obj, costPct, rows, warn, tip, hot }) {
  const box = h('div', 'pbox' + (hot ? ' hot' : ''));
  box.append(h('div', 'pop', title));
  if (sub) box.append(h('div', 'psub', sub));
  if (obj) box.append(h('div', 'pobj', obj));
  if (costPct != null) box.append(h('div', 'pcost', 'Cost: ' + pct(costPct)));
  if (rows) box.append(h('div', 'prows', rows));
  if (warn) box.append(h('span', 'pwarn', '⚠'));
  if (tip) {
    box.title = tip + '\n\n(click for details)';
    box.onclick = () => showText(title, tip);
  }
  return box;
}

function buildTree(relOp, total) {
  const op = operatorElement(relOp);
  const kids = childRelOps(op || relOp);
  const sub = num(relOp, 'EstimatedTotalSubtreeCost');
  const opCost = Math.max(0, sub - kids.reduce((s, k) => s + num(k, 'EstimatedTotalSubtreeCost'), 0));
  const costPct = total > 0 ? (opCost / total) * 100 : 0;
  const physical = relOp.getAttribute('PhysicalOp');
  const logical = relOp.getAttribute('LogicalOp');
  const rt = runtime(relOp);
  const est = num(relOp, 'EstimateRows') * (1 + num(relOp, 'EstimateRebinds') + num(relOp, 'EstimateRewinds'));
  let rows = '';
  if (rt) rows = `${fmtInt(rt.rows)} of ${fmtInt(Math.round(est))}${est > 0 ? ` (${Math.round((rt.rows / est) * 100)}%)` : ''}`;
  const li = h('li');
  const flowRows = rt ? rt.rows : est;
  li.style.setProperty('--lw', Math.min(8, Math.max(1, Math.round(1 + Math.log10(flowRows + 1)))) + 'px');
  li.append(nodeBox({
    title: physical,
    sub: logical && logical !== physical ? `(${logical})` : '',
    obj: objectName(op),
    costPct,
    rows,
    warn: [...relOp.children].some(c => c.localName === 'Warnings'),
    tip: details(relOp, op, { op: opCost, pct: costPct }),
    hot: costPct >= 25,
  }));
  if (kids.length) {
    const ul = h('ul');
    for (const k of kids) ul.append(buildTree(k, total));
    li.append(ul);
  }
  return li;
}

export function renderPlan(xmlText, index) {
  const wrap = h('div', 'plan');
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length) {
    wrap.append(h('div', 'pstmt', 'Could not parse the execution plan XML.'));
    return wrap;
  }
  const bar = h('div', 'pbar');
  bar.append(h('span', 'pbar-t', `Plan ${index + 1}`));
  const save = h('button', null, 'Save .sqlplan');
  save.onclick = () => download(xmlText, `plan-${index + 1}.sqlplan`, 'application/xml');
  const xml = h('button', null, 'Show XML');
  xml.onclick = () => showText(`Plan ${index + 1} XML`, xmlText);
  bar.append(save, xml);
  wrap.append(bar);

  const stmts = [...doc.getElementsByTagNameNS('*', 'StmtSimple')].filter(s => [...s.children].some(c => c.localName === 'QueryPlan'));
  const batchCost = stmts.reduce((s, st) => s + num(st, 'StatementSubTreeCost'), 0);
  stmts.forEach((st, i) => {
    const qp = [...st.children].find(c => c.localName === 'QueryPlan');
    const total = num(st, 'StatementSubTreeCost');
    const sec = h('div', 'pstmt');
    const head = h('div', 'phead');
    head.append(h('div', null, `Query ${i + 1}: Query cost (relative to the batch): ${batchCost > 0 ? pct((total / batchCost) * 100) : '—'}`));
    head.append(h('code', null, (st.getAttribute('StatementText') || '').trim().slice(0, 600)));
    sec.append(head);
    for (const g of qp.getElementsByTagNameNS('*', 'MissingIndexGroup')) {
      const mi = g.getElementsByTagNameNS('*', 'MissingIndex')[0];
      if (!mi) continue;
      const cols = usage => [...mi.getElementsByTagNameNS('*', 'ColumnGroup')]
        .filter(cg => cg.getAttribute('Usage') === usage)
        .flatMap(cg => [...cg.getElementsByTagNameNS('*', 'Column')].map(c => c.getAttribute('Name')));
      const keys = [...cols('EQUALITY'), ...cols('INEQUALITY')];
      const inc = cols('INCLUDE');
      const sqlText = `CREATE NONCLUSTERED INDEX [<Name of Missing Index>] ON ${mi.getAttribute('Schema')}.${mi.getAttribute('Table')} (${keys.join(', ')})${inc.length ? ` INCLUDE (${inc.join(', ')})` : ''};`;
      const m = h('div', 'pmissing', `Missing Index (Impact ${num(g, 'Impact').toFixed(1)}): ${sqlText}`);
      m.title = 'Click to copy';
      m.onclick = () => navigator.clipboard.writeText(sqlText);
      sec.append(m);
    }
    const root = [...qp.children].find(c => c.localName === 'RelOp');
    const tree = h('div', 'ptree');
    const ul = h('ul', 'proot');
    const li = h('li');
    li.append(nodeBox({ title: st.getAttribute('StatementType') || 'Statement', costPct: 0, tip: `Statement cost: ${total}\nCompile time: ${qp.getAttribute('CompileTime') || '?'} ms\nCached plan size: ${qp.getAttribute('CachedPlanSize') || '?'} KB\nDegree of parallelism: ${qp.getAttribute('DegreeOfParallelism') || '1'}` }));
    if (root) {
      const kids = h('ul');
      kids.append(buildTree(root, total));
      li.append(kids);
    }
    ul.append(li);
    tree.append(ul);
    sec.append(tree);
    wrap.append(sec);
  });
  if (!stmts.length) wrap.append(h('div', 'pstmt', 'This batch has no statements with an execution plan.'));
  return wrap;
}
