// Find / Replace bar for the active editor (Ctrl+F, Ctrl+H, F3).

import { h, fmtInt, debounce } from './util.js';

let ed = null;
let bar = null;
const flags = { case: false, word: false, re: false };
let ranges = [];

function build(host) {
  bar = h('div', 'findbar');
  bar.hidden = true;
  bar.innerHTML = `
    <div class="frow">
      <input class="fq" placeholder="Find" spellcheck="false">
      <button class="tog" data-a="case" title="Match case">Aa</button>
      <button class="tog" data-a="word" title="Match whole word">ab|</button>
      <button class="tog" data-a="re" title="Use regular expression">.*</button>
      <span class="fcount"></span>
      <button data-a="prev" title="Previous match (Shift+F3)">&#8593;</button>
      <button data-a="next" title="Next match (F3)">&#8595;</button>
      <button data-a="close" title="Close (Esc)">&times;</button>
    </div>
    <div class="frow rrow">
      <input class="fr" placeholder="Replace" spellcheck="false">
      <button data-a="rep" title="Replace current match">Replace</button>
      <button data-a="all" title="Replace all matches">Replace all</button>
    </div>`;
  host.append(bar);
  const q = bar.querySelector('.fq'), r = bar.querySelector('.fr');
  bar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.a;
    if (a in flags) { flags[a] = !flags[a]; b.classList.toggle('on', flags[a]); update(); }
    else if (a === 'next') findNext(1);
    else if (a === 'prev') findNext(-1);
    else if (a === 'close') closeFind();
    else if (a === 'rep') replaceOne();
    else if (a === 'all') replaceAll();
  });
  q.addEventListener('input', debounce(() => { update(); selectNearest(); }, 120));
  const keys = e => {
    if (e.key === 'Escape') { e.preventDefault(); closeFind(true); }
    else if (e.key === 'Enter') { e.preventDefault(); if (e.target === r && !e.shiftKey) replaceOne(); else findNext(e.shiftKey ? -1 : 1); }
    else if (e.key === 'F3') { e.preventDefault(); findNext(e.shiftKey ? -1 : 1); }
  };
  q.addEventListener('keydown', keys);
  r.addEventListener('keydown', keys);
}

function regex() {
  const q = bar.querySelector('.fq').value;
  if (!q) return null;
  let src = flags.re ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (flags.word) src = `\\b(?:${src})\\b`;
  try { return new RegExp(src, 'g' + (flags.case ? '' : 'i')); } catch { return null; }
}

function update() {
  if (!ed || bar.hidden) return;
  const re = regex();
  ranges = [];
  if (re) {
    const v = ed.value;
    let m;
    while ((m = re.exec(v)) && ranges.length < 20000) {
      if (!m[0].length) { re.lastIndex++; continue; }
      ranges.push([m.index, m.index + m[0].length]);
    }
  }
  const { start, end } = ed.selection();
  const cur = ranges.findIndex(([s, e]) => s === start && e === end);
  ed.setMarks(ranges, cur);
  const count = bar.querySelector('.fcount');
  count.textContent = !bar.querySelector('.fq').value ? '' : ranges.length ? `${cur >= 0 ? fmtInt(cur + 1) + ' of ' : ''}${fmtInt(ranges.length)}` : 'No results';
  count.classList.toggle('none', !!bar.querySelector('.fq').value && !ranges.length);
}

function select(i) {
  const [s, e] = ranges[i];
  ed.ta.setSelectionRange(s, e);
  ed.reveal(s);
  update();
}

function selectNearest() {
  if (!ranges.length) return;
  const from = ed.selection().start;
  const i = ranges.findIndex(([s]) => s >= from);
  select(i < 0 ? 0 : i);
}

export function findNext(dir = 1) {
  if (!ed) return;
  if (bar.hidden) { openFind(ed, false); return; }
  update();
  if (!ranges.length) return;
  const { start, end } = ed.selection();
  let i;
  if (dir > 0) { i = ranges.findIndex(([s]) => s >= end); if (i < 0) i = 0; if (ranges[i][0] === start && ranges[i][1] === end) i = (i + 1) % ranges.length; }
  else { i = -1; for (let k = ranges.length - 1; k >= 0; k--) if (ranges[k][0] < start) { i = k; break; } if (i < 0) i = ranges.length - 1; }
  select(i);
}

function replacement(matchText) {
  const r = bar.querySelector('.fr').value;
  if (!flags.re) return r;
  const re = regex();
  return re ? matchText.replace(new RegExp(re.source, re.flags.replace('g', '')), r) : r;
}

function replaceOne() {
  update();
  const { start, end, text } = ed.selection();
  const hit = ranges.findIndex(([s, e]) => s === start && e === end);
  if (hit < 0) { findNext(1); return; }
  ed.replaceRange(start, end, replacement(text));
  bar.querySelector('.fr').focus();
  update();
  findNext(1);
}

function replaceAll() {
  const re = regex();
  if (!re) return;
  const v = ed.value;
  const next = v.replace(re, flags.re ? bar.querySelector('.fr').value : () => bar.querySelector('.fr').value);
  if (next === v) return;
  const n = ranges.length;
  ed.setValue(next);
  bar.querySelector('.fr').focus();
  update();
  bar.querySelector('.fcount').textContent = `Replaced ${fmtInt(n)}`;
}

export function openFind(editor, withReplace) {
  if (!bar) build(editor.wrap.parentElement);
  if (ed && ed !== editor) ed.setMarks(null);
  ed = editor;
  bar.hidden = false;
  bar.classList.toggle('with-replace', !!withReplace);
  const q = bar.querySelector('.fq');
  const sel = editor.selection().text;
  if (sel && !sel.includes('\n')) q.value = sel;
  q.focus();
  q.select();
  update();
}

export function closeFind(focusEditor) {
  if (!bar || bar.hidden) return;
  bar.hidden = true;
  if (ed) { ed.setMarks(null); if (focusEditor) ed.focus(); }
}

// Keeps highlights in sync when the editor text changes or tabs switch.
export function findAttach(editor) {
  editor.addEventListener('change', () => { if (ed === editor && bar && !bar.hidden) update(); });
}

export function findSwitch(editor) {
  if (!bar || bar.hidden) return;
  if (ed && ed !== editor) ed.setMarks(null);
  ed = editor;
  if (editor) update(); else bar.hidden = true;
}
