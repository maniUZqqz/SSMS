// Code editor: a transparent <textarea> over a syntax-highlighted <pre>,
// plus a third layer for search-match highlights.

import { h, countNl } from './util.js';
import { highlight, escHtml } from './sql.js';

export let LINE_H = 19;
const PAD_TOP = 4, PAD_LEFT = 6;

let charW = 0;
if (document.fonts) document.fonts.ready.then(() => { charW = 0; });

const PLACEHOLDER = {
  sql: '-- Write your query here.   F5 / Ctrl+Enter executes (only the selection, if any).   Ctrl+Space = IntelliSense',
  js: '// MongoDB shell syntax, e.g.\n//   db.users.find({ age: { $gt: 30 } }).sort({ age: -1 }).limit(20)\n//   db.orders.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }])\n//   db.getCollectionNames()\n// F5 runs everything (or the selection).',
  redis: '# One Redis command per line, e.g.\n#   KEYS user:*\n#   GET user:1\n#   HGETALL session:42\n# F5 runs everything (or the selection).',
};

// Editor font size in px; line height follows it.
export function setEditorFont(px) {
  LINE_H = Math.round(px * 1.45);
  charW = 0;
  document.documentElement.style.setProperty('--ed-font-size', px + 'px');
  document.documentElement.style.setProperty('--ed-line', LINE_H + 'px');
}

export class Editor extends EventTarget {
  constructor(host, text) {
    super();
    this.wrap = h('div', 'editor');
    this.gutter = h('div', 'gutter');
    this.code = h('div', 'code');
    this.marksEl = h('pre', 'marks');
    this.pre = h('pre', 'hl');
    const ta = this.ta = h('textarea');
    ta.spellcheck = false;
    ta.wrap = 'off';
    ta.setAttribute('autocomplete', 'off');
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('autocapitalize', 'off');
    ta.placeholder = '-- Write T-SQL here.   F5 / Ctrl+Enter executes (only the selection, if any).   Ctrl+Space = IntelliSense';
    ta.value = text;
    ta.setSelectionRange(0, 0);
    this.code.append(this.marksEl, this.pre, ta);
    this.wrap.append(this.gutter, this.code);
    host.append(this.wrap);
    this.lineCount = 0;
    this.hlPending = false;
    this.marks = null;
    this.keyHooks = [];
    this.chordAt = 0;

    ta.addEventListener('input', () => {
      this.scheduleHighlight();
      this.dispatchEvent(new Event('change'));
    });
    ta.addEventListener('scroll', () => {
      this.syncScroll();
      this.dispatchEvent(new Event('scroll'));
    });
    ta.addEventListener('keydown', e => this.keydown(e));
    for (const ev of ['keyup', 'mouseup', 'focus']) ta.addEventListener(ev, () => this.dispatchEvent(new Event('cursor')));
    ta.addEventListener('blur', () => this.dispatchEvent(new Event('blur')));
    this.refresh();
  }

  get value() { return this.ta.value; }
  get hidden() { return this.wrap.hidden; }
  set hidden(v) { this.wrap.hidden = v; }

  focus() { this.ta.focus(); }

  selection() {
    const { selectionStart: start, selectionEnd: end, value } = this.ta;
    return { start, end, text: value.slice(start, end) };
  }

  scheduleHighlight() {
    if (this.hlPending) return;
    this.hlPending = true;
    requestAnimationFrame(() => { this.hlPending = false; this.refresh(); });
  }

  // 'sql' | 'js' (MongoDB shell) | 'redis'
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.ta.placeholder = PLACEHOLDER[mode] || PLACEHOLDER.sql;
    this.refresh();
  }

  refresh() {
    const v = this.ta.value;
    this.pre.innerHTML = highlight(v, this.mode) + '\n\n\n';
    const n = countNl(v, Infinity) + 1;
    if (n !== this.lineCount) {
      this.lineCount = n;
      let s = '';
      for (let i = 1; i <= n; i++) s += i + '\n';
      this.gutter.textContent = s + '\n\n';
    }
    this.renderMarks();
    this.syncScroll();
  }

  syncScroll() {
    const { scrollTop, scrollLeft } = this.ta;
    this.pre.scrollTop = this.marksEl.scrollTop = this.gutter.scrollTop = scrollTop;
    this.pre.scrollLeft = this.marksEl.scrollLeft = scrollLeft;
  }

  // Highlights ranges ([start, end] pairs); `current` is the index drawn stronger.
  setMarks(ranges, current = -1) {
    this.marks = ranges && ranges.length ? { ranges, current } : null;
    this.renderMarks();
  }

  renderMarks() {
    if (!this.marks) { if (this.marksEl.firstChild) this.marksEl.textContent = ''; return; }
    const v = this.ta.value;
    let out = '', last = 0;
    this.marks.ranges.forEach(([s, e], i) => {
      if (s < last || e > v.length) return;
      out += escHtml(v.slice(last, s)) + `<mark${i === this.marks.current ? ' class="cur"' : ''}>${escHtml(v.slice(s, e))}</mark>`;
      last = e;
    });
    this.marksEl.innerHTML = out + escHtml(v.slice(last)) + '\n\n\n';
    this.syncScroll();
  }

  // Inserts text through the browser's editing pipeline so Ctrl+Z keeps working.
  insert(text) {
    const ta = this.ta;
    ta.focus();
    if (!document.execCommand('insertText', false, text)) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input'));
    }
  }

  replaceRange(start, end, text) {
    this.ta.focus();
    this.ta.setSelectionRange(start, end);
    this.insert(text);
  }

  setValue(text) {
    this.replaceRange(0, this.ta.value.length, text);
    this.ta.setSelectionRange(0, 0);
    this.ta.scrollTop = 0;
  }

  // Selects whole lines touched by the selection and replaces them via fn(lines).
  editLines(fn) {
    const ta = this.ta, v = ta.value, s = ta.selectionStart;
    let e = ta.selectionEnd;
    if (e > s && v[e - 1] === '\n') e--;
    const ls = v.lastIndexOf('\n', s - 1) + 1;
    let le = v.indexOf('\n', e);
    if (le < 0) le = v.length;
    const next = fn(v.slice(ls, le).split('\n')).join('\n');
    this.replaceRange(ls, le, next);
    ta.setSelectionRange(ls, ls + next.length);
  }

  commentLines(mode) {
    const mark = this.mode === 'js' ? '//' : this.mode === 'redis' ? '#' : '--';
    const re = new RegExp('^(\\s*)' + mark.replace(/\//g, '\\/') + ' ?');
    this.editLines(lines => {
      const filled = lines.filter(l => l.trim());
      const remove = mode === 'remove' || (mode === 'toggle' && filled.length && filled.every(l => re.test(l)));
      return lines.map(l => (remove ? l.replace(re, '$1') : l.trim() ? mark + l : l));
    });
  }

  changeCase(upper) {
    const { start, end, text } = this.selection();
    if (start === end) return;
    this.insert(upper ? text.toUpperCase() : text.toLowerCase());
    this.ta.setSelectionRange(start, end);
  }

  lineStart(line) {
    const v = this.ta.value;
    let start = 0;
    for (let i = 1; i < line; i++) {
      const nl = v.indexOf('\n', start);
      if (nl < 0) break;
      start = nl + 1;
    }
    return start;
  }

  gotoLine(line) {
    const v = this.ta.value, start = this.lineStart(line);
    let end = v.indexOf('\n', start);
    if (end < 0) end = v.length;
    this.ta.focus();
    this.ta.setSelectionRange(start, end);
    this.ta.scrollTop = Math.max(0, (line - 1) * LINE_H - this.ta.clientHeight / 2);
    this.dispatchEvent(new Event('cursor'));
  }

  charWidth() {
    if (!charW) {
      const s = h('span', null, 'M'.repeat(200));
      s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:var(--ed-font-size)/var(--ed-line) var(--mono)';
      this.code.append(s);
      charW = s.getBoundingClientRect().width / 200 || 7.2;
      s.remove();
    }
    return charW;
  }

  // Position of a character relative to the text content (not scrolled).
  posXY(pos) {
    const v = this.ta.value;
    const line = countNl(v, pos);
    const ls = v.lastIndexOf('\n', pos - 1) + 1;
    let col = 0;
    for (let i = ls; i < pos; i++) col = v[i] === '\t' ? (Math.floor(col / 4) + 1) * 4 : col + 1;
    return { x: PAD_LEFT + col * this.charWidth(), y: PAD_TOP + line * LINE_H, line };
  }

  // Viewport coordinates of the bottom-left corner of the character at pos.
  caretPoint(pos) {
    const p = this.posXY(pos), r = this.ta.getBoundingClientRect();
    return { x: r.left + p.x - this.ta.scrollLeft, y: r.top + p.y + LINE_H - this.ta.scrollTop };
  }

  reveal(pos) {
    const ta = this.ta, p = this.posXY(pos);
    if (p.y < ta.scrollTop || p.y + LINE_H > ta.scrollTop + ta.clientHeight) ta.scrollTop = p.y - ta.clientHeight / 2;
    if (p.x < ta.scrollLeft || p.x > ta.scrollLeft + ta.clientWidth - 40) ta.scrollLeft = Math.max(0, p.x - ta.clientWidth / 2);
  }

  keydown(e) {
    for (const hook of this.keyHooks) if (hook(e)) return;
    const ta = this.ta, ctrl = e.ctrlKey || e.metaKey;
    if (e.key === 'Tab' && !ctrl && !e.altKey) {
      e.preventDefault();
      const multi = ta.value.slice(ta.selectionStart, ta.selectionEnd).includes('\n');
      if (!e.shiftKey && !multi) this.insert('    ');
      else this.editLines(lines => lines.map(l => (e.shiftKey ? l.replace(/^( {1,4}|\t)/, '') : '    ' + l)));
      return;
    }
    if (e.key === 'Enter' && !ctrl && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      const s = ta.selectionStart;
      const ls = ta.value.lastIndexOf('\n', s - 1) + 1;
      this.insert('\n' + /^[ \t]*/.exec(ta.value.slice(ls, s))[0]);
      return;
    }
    if (!ctrl) return;
    if (Date.now() - this.chordAt < 1500 && (e.code === 'KeyC' || e.code === 'KeyU')) {
      e.preventDefault();
      this.chordAt = 0;
      this.commentLines(e.code === 'KeyC' ? 'add' : 'remove');
    } else if (e.code === 'KeyK' && !e.shiftKey) {
      e.preventDefault();
      this.chordAt = Date.now();
    } else if (e.code === 'Slash') {
      e.preventDefault();
      this.commentLines('toggle');
    } else if (e.shiftKey && (e.code === 'KeyU' || e.code === 'KeyL')) {
      e.preventDefault();
      this.changeCase(e.code === 'KeyU');
    }
  }
}
