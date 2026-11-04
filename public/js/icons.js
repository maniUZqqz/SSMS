// 16x16 SVG icons in the style of SQL Server Management Studio.

const svg = body => `<svg viewBox="0 0 16 16" width="16" height="16" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const ICONS = {
  // ---- toolbar
  back: svg('<path d="M10 3 5 8l5 5" fill="none" stroke="#1E7BD6" stroke-width="2"/>'),
  forward: svg('<path d="m6 3 5 5-5 5" fill="none" stroke="#1E7BD6" stroke-width="2"/>'),
  newQuery: svg('<path d="M3 1.5h6.5L13 5v9.5H3z" fill="#fff" stroke="#6D6D6D"/><path d="M9.5 1.5V5H13" fill="none" stroke="#6D6D6D"/><path d="M5 8h6M5 10h6M5 12h4" stroke="#1E7BD6"/><circle cx="12.5" cy="12.5" r="3" fill="#F2C94C" stroke="#B8860B" stroke-width=".8"/><path d="M12.5 10.8v3.4M10.8 12.5h3.4" stroke="#7A5200" stroke-width="1"/>'),
  open: svg('<path d="M1.5 4h4l1.5 1.5h6.5v8h-12z" fill="#DCB67A" stroke="#A97D2B"/><path d="M3 7.5h12l-2 6H1.5z" fill="#F5D58A" stroke="#A97D2B"/>'),
  save: svg('<rect x="2" y="2" width="12" height="12" rx="1" fill="#2F6FBF"/><rect x="4.5" y="2" width="7" height="4.5" fill="#E8EEF7"/><rect x="4" y="9" width="8" height="5" fill="#fff"/><rect x="9" y="3" width="1.5" height="2.5" fill="#2F6FBF"/>'),
  saveAll: svg('<rect x="4" y="1" width="11" height="11" rx="1" fill="#6D9AD6"/><rect x="1" y="4" width="11" height="11" rx="1" fill="#2F6FBF"/><rect x="3.3" y="4" width="6.4" height="4" fill="#E8EEF7"/><rect x="3" y="10.5" width="7" height="4.5" fill="#fff"/>'),
  undo: svg('<path d="M5 4 2 7l3 3" fill="none" stroke="#1E7BD6" stroke-width="1.6"/><path d="M2.5 7H10a3.5 3.5 0 0 1 0 7H7" fill="none" stroke="#1E7BD6" stroke-width="1.6"/>'),
  redo: svg('<path d="m11 4 3 3-3 3" fill="none" stroke="#1E7BD6" stroke-width="1.6"/><path d="M13.5 7H6a3.5 3.5 0 0 0 0 7h3" fill="none" stroke="#1E7BD6" stroke-width="1.6"/>'),
  cut: svg('<circle cx="4.5" cy="12" r="2.2" fill="none" stroke="#555" stroke-width="1.3"/><circle cx="11.5" cy="12" r="2.2" fill="none" stroke="#555" stroke-width="1.3"/><path d="M6 10.5 11.5 2M10 10.5 4.5 2" stroke="#555" stroke-width="1.3"/>'),
  copy: svg('<rect x="5" y="1.5" width="8.5" height="10" fill="#fff" stroke="#6D6D6D"/><rect x="2.5" y="4.5" width="8.5" height="10" fill="#fff" stroke="#6D6D6D"/><path d="M4.5 8h4.5M4.5 10h4.5M4.5 12h3" stroke="#1E7BD6"/>'),
  paste: svg('<rect x="2" y="2.5" width="10" height="12" rx="1" fill="#C9A35A" stroke="#8C6A2A"/><rect x="4.5" y="1" width="5" height="3" rx=".5" fill="#666"/><rect x="6.5" y="6" width="8" height="9" fill="#fff" stroke="#6D6D6D"/>'),
  find: svg('<circle cx="6.5" cy="6.5" r="4.2" fill="#E8F2FC" stroke="#1E7BD6" stroke-width="1.5"/><path d="m9.6 9.6 4.6 4.6" stroke="#555" stroke-width="2"/>'),
  connect: svg('<path d="M9.5 2.5 13.5 6.5" stroke="#555" stroke-width="1.6"/><path d="M6 6.2 9.8 10l-2.3 2.3a2.7 2.7 0 0 1-3.8-3.8z" fill="#E1A93B" stroke="#8C6A2A"/><path d="m8.8 4.8 2.4 2.4M11.2 2.4 13.6 4.8" stroke="#555" stroke-width="1.4"/><path d="M4.5 11.5 1.5 14.5" stroke="#555" stroke-width="1.6"/>'),
  changeConn: svg('<rect x="1.5" y="2" width="8" height="6" rx="1" fill="#E8F2FC" stroke="#1E7BD6"/><path d="M3.5 10.5h7v-3" fill="none" stroke="#388A34" stroke-width="1.4"/><path d="m8.5 9 2-2 2 2" fill="none" stroke="#388A34" stroke-width="1.4"/><rect x="7" y="10" width="7.5" height="4.5" rx="1" fill="#E8F2FC" stroke="#1E7BD6"/>'),
  disconnect: svg('<path d="M6 6.2 9.8 10l-2.3 2.3a2.7 2.7 0 0 1-3.8-3.8z" fill="#E1A93B" stroke="#8C6A2A"/><path d="M4.5 11.5 1.5 14.5" stroke="#555" stroke-width="1.6"/><path d="m9.5 2 5 5M14.5 2l-5 5" stroke="#D02E2E" stroke-width="1.8"/>'),
  execute: svg('<path d="M4 2.5v11l9-5.5z" fill="#388A34" stroke="#2A6A27" stroke-linejoin="round"/>'),
  debug: svg('<path d="M4 2.5v11l9-5.5z" fill="none" stroke="#388A34" stroke-width="1.5" stroke-linejoin="round"/>'),
  cancel: svg('<rect x="3" y="3" width="10" height="10" fill="#D02E2E" stroke="#9E1F1F"/>'),
  stop: svg('<rect x="3" y="3" width="10" height="10" fill="#D02E2E" stroke="#9E1F1F"/>'),
  parse: svg('<path d="m2.5 8.5 3.5 3.5 7.5-8" fill="none" stroke="#1E7BD6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  estPlan: svg('<rect x="1" y="6" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><rect x="11" y="2" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><rect x="11" y="10" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><path d="M5 8h3m0-4v8m0-8h3m-3 8h3" fill="none" stroke="#555"/><path d="M12.6 3.2v1.6" stroke="#388A34" stroke-width="2"/>'),
  actualPlan: svg('<rect x="1" y="6" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><rect x="11" y="2" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><rect x="11" y="10" width="4" height="4" fill="#E8F2FC" stroke="#1E7BD6"/><path d="M5 8h3m0-4v8m0-8h3m-3 8h3" fill="none" stroke="#555"/><path d="M11.8 11.2v1.6l1.6-.8z" fill="#388A34"/>'),
  queryOptions: svg('<rect x="2" y="2" width="12" height="12" rx="1" fill="#fff" stroke="#6D6D6D"/><path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h7" stroke="#6D6D6D"/><circle cx="7" cy="5.5" r="1.3" fill="#1E7BD6"/><circle cx="10" cy="8" r="1.3" fill="#1E7BD6"/><circle cx="6" cy="10.5" r="1.3" fill="#1E7BD6"/>'),
  intellisense: svg('<rect x="1.5" y="3" width="13" height="10" rx="1" fill="#fff" stroke="#6D6D6D"/><path d="M3.5 6h6M3.5 8.5h8M3.5 11h5" stroke="#1E7BD6" stroke-width="1.3"/><rect x="9.5" y="9.5" width="5" height="5" fill="#F2C94C" stroke="#B8860B" stroke-width=".8"/>'),
  resultsText: svg('<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#6D6D6D"/><path d="M4 5h8M4 7.5h8M4 10h5" stroke="#333"/>'),
  resultsGrid: svg('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#6D6D6D"/><path d="M1.5 6h13M1.5 9.5h13M6 2.5v11M10.3 2.5v11" stroke="#6D6D6D"/><rect x="1.5" y="2.5" width="13" height="3.5" fill="#1E7BD6" opacity=".35"/>'),
  resultsFile: svg('<rect x="2" y="2" width="12" height="12" rx="1" fill="#2F6FBF"/><rect x="4.5" y="2" width="7" height="4.5" fill="#E8EEF7"/><rect x="4" y="9" width="8" height="5" fill="#fff"/>'),
  comment: svg('<path d="M2 4h8M2 7h12M2 10h9M2 13h12" stroke="#6D6D6D"/><path d="M11 2.5 15 6" stroke="#388A34" stroke-width="1.5"/>'),
  uncomment: svg('<path d="M2 4h8M2 7h12M2 10h9M2 13h12" stroke="#6D6D6D"/><path d="m11.5 2 3.5 3.5M15 2l-3.5 3.5" stroke="#D02E2E" stroke-width="1.4"/>'),
  outdent: svg('<path d="M7 4h7M7 7h7M7 10h7M2 13h12" stroke="#6D6D6D"/><path d="M5 5 2 7.5 5 10z" fill="#1E7BD6"/>'),
  indent: svg('<path d="M7 4h7M7 7h7M7 10h7M2 13h12" stroke="#6D6D6D"/><path d="M2 5l3 2.5L2 10z" fill="#1E7BD6"/>'),
  activity: svg('<rect x="1.5" y="2" width="13" height="12" fill="#fff" stroke="#6D6D6D"/><path d="M3 11l3-4 2.5 2.5L13 4" fill="none" stroke="#388A34" stroke-width="1.6"/>'),
  filter: svg('<path d="M1.5 2.5h13L9.5 8.5v5l-3 1.5V8.5z" fill="#F5D58A" stroke="#A97D2B" stroke-linejoin="round"/>'),
  refresh: svg('<path d="M13 8a5 5 0 1 1-1.5-3.6" fill="none" stroke="#388A34" stroke-width="1.8"/><path d="M12.8 1.5v3.6H9.2" fill="none" stroke="#388A34" stroke-width="1.8"/>'),
  details: svg('<rect x="1.5" y="2" width="13" height="12" fill="#fff" stroke="#6D6D6D"/><path d="M1.5 5h13" stroke="#6D6D6D"/><path d="M3.5 7.5h3M8 7.5h4.5M3.5 9.5h3M8 9.5h4.5M3.5 11.5h3M8 11.5h4.5" stroke="#1E7BD6"/>'),
  pin: svg('<path d="M6 2h4v5l2 2H4l2-2zM8 9v5" fill="none" stroke="currentColor" stroke-width="1.2"/>'),
  close: svg('<path d="m4 4 8 8m0-8-8 8" stroke="currentColor" stroke-width="1.4"/>'),
  history: svg('<circle cx="8" cy="8" r="6" fill="#fff" stroke="#6D6D6D"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="#1E7BD6" stroke-width="1.5"/>'),
  messages: svg('<rect x="1.5" y="3" width="13" height="10" fill="#fff" stroke="#6D6D6D"/><path d="m1.5 3 6.5 5.5L14.5 3" fill="none" stroke="#6D6D6D"/>'),

  // ---- object explorer tree
  server: svg('<rect x="1.5" y="2" width="10" height="8" rx="1" fill="#E8F2FC" stroke="#4A6C9B"/><rect x="3" y="3.5" width="7" height="5" fill="#9CC3EA"/><path d="M4 12.5h5M6.5 10v2.5" stroke="#4A6C9B"/><circle cx="12.5" cy="12" r="3.2" fill="#fff"/><path d="M11.3 10.2v3.6l3-1.8z" fill="#388A34"/>'),
  serverOff: svg('<rect x="1.5" y="2" width="10" height="8" rx="1" fill="#EEE" stroke="#888"/><rect x="3" y="3.5" width="7" height="5" fill="#CCC"/><path d="M4 12.5h5M6.5 10v2.5" stroke="#888"/>'),
  folder: svg('<path d="M1.5 3.5h4.5l1.3 1.5h7.2v8.5h-13z" fill="#DCB67A" stroke="#B58B3F"/><path d="M1.5 6.5h13" stroke="#C9A35A"/>'),
  db: svg('<ellipse cx="8" cy="3.8" rx="5.5" ry="2" fill="#F4E3B4" stroke="#8C7A46"/><path d="M2.5 3.8v8.4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.8" fill="#E9CF86" stroke="#8C7A46"/><path d="M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" fill="none" stroke="#8C7A46"/>'),
  dbOff: svg('<ellipse cx="8" cy="3.8" rx="5.5" ry="2" fill="#EEE" stroke="#999"/><path d="M2.5 3.8v8.4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.8" fill="#DDD" stroke="#999"/>'),
  table: svg('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#5A6E8C"/><rect x="1.5" y="2.5" width="13" height="3" fill="#7EA6D8" stroke="#5A6E8C"/><path d="M1.5 8.5h13M1.5 11h13M6 5.5v8M10.3 5.5v8" stroke="#9AA8BC"/>'),
  view: svg('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#3E8E86"/><rect x="1.5" y="2.5" width="13" height="3" fill="#7CC5BC" stroke="#3E8E86"/><circle cx="5.5" cy="10" r="2" fill="none" stroke="#333"/><circle cx="10.5" cy="10" r="2" fill="none" stroke="#333"/><path d="M7.5 10h1" stroke="#333"/>'),
  proc: svg('<path d="M3.5 2h7.5a1.5 1.5 0 0 1 0 3H5v8.5a1.5 1.5 0 0 1-3 0V3.5A1.5 1.5 0 0 1 3.5 2z" fill="#F3E9D0" stroke="#8C6A2A"/><path d="M5 5h7v8.5a1.5 1.5 0 0 1-1.5 1.5h-7" fill="#F3E9D0" stroke="#8C6A2A"/><path d="M7 7.5h4M7 9.5h4M7 11.5h3" stroke="#8C6A2A" stroke-width=".9"/>'),
  func: svg('<rect x="1.5" y="1.5" width="13" height="13" rx="1.5" fill="#E9F3E1" stroke="#4E8A3B"/><text x="8" y="12" text-anchor="middle" font-size="10" font-style="italic" font-weight="bold" font-family="Georgia,serif" fill="#2F6A1F">fx</text>'),
  col: svg('<rect x="4" y="1.5" width="8" height="13" fill="#fff" stroke="#5A6E8C"/><rect x="4" y="1.5" width="8" height="3" fill="#7EA6D8" stroke="#5A6E8C"/><path d="M4 8h8M4 11h8" stroke="#9AA8BC"/>'),
  key: svg('<circle cx="5" cy="8" r="3.2" fill="#F2C94C" stroke="#9C7A12"/><circle cx="4.3" cy="8" r="1" fill="#fff"/><path d="M8 8h6.5M12.5 8v2.6M10.5 8v2" stroke="#9C7A12" stroke-width="1.6"/>'),
  fkey: svg('<circle cx="5" cy="8" r="3.2" fill="#C9CED6" stroke="#6D747E"/><circle cx="4.3" cy="8" r="1" fill="#fff"/><path d="M8 8h6.5M12.5 8v2.6M10.5 8v2" stroke="#6D747E" stroke-width="1.6"/>'),
  index: svg('<rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#5A6E8C"/><path d="M4 5h8M4 8h5M4 11h7" stroke="#1E7BD6" stroke-width="1.4"/>'),
  trigger: svg('<path d="M9.5 1.5 3.5 9h4l-1.2 5.5L12.5 7h-4z" fill="#F2C94C" stroke="#9C7A12" stroke-linejoin="round"/>'),
  check: svg('<rect x="2" y="2" width="12" height="12" rx="1" fill="#fff" stroke="#5A6E8C"/><path d="m4.5 8.5 2.5 2.5 4.5-5.5" fill="none" stroke="#388A34" stroke-width="1.6"/>'),
  user: svg('<circle cx="8" cy="5" r="3" fill="#F5CFA0" stroke="#9A6B3C"/><path d="M2.5 14.5c.4-3 2.6-5 5.5-5s5.1 2 5.5 5z" fill="#4A7FC1" stroke="#2F5A8F"/>'),
  role: svg('<circle cx="5.5" cy="5.5" r="2.4" fill="#F5CFA0" stroke="#9A6B3C"/><circle cx="11" cy="6" r="2.1" fill="#F5CFA0" stroke="#9A6B3C"/><path d="M1 14c.3-2.6 2-4.2 4.5-4.2S9.7 11.4 10 14z" fill="#4A7FC1" stroke="#2F5A8F"/><path d="M8.5 10.2c.7-.6 1.5-.9 2.5-.9 2.2 0 3.6 1.4 3.9 3.7H10" fill="#7FA8D8" stroke="#2F5A8F"/>'),
  login: svg('<circle cx="7" cy="5" r="3" fill="#F5CFA0" stroke="#9A6B3C"/><path d="M1.5 14.5c.4-3 2.6-5 5.5-5s5.1 2 5.5 5z" fill="#4A7FC1" stroke="#2F5A8F"/><circle cx="12.5" cy="4" r="2.5" fill="#F2C94C" stroke="#9C7A12"/>'),
  schema: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1" fill="#fff" stroke="#6D6D6D"/><text x="8" y="11.3" text-anchor="middle" font-size="8.5" font-weight="bold" font-family="Consolas,monospace" fill="#8C6A2A">{}</text>'),
  syn: svg('<rect x="1.5" y="2.5" width="9" height="8" fill="#fff" stroke="#5A6E8C"/><rect x="1.5" y="2.5" width="9" height="2.5" fill="#7EA6D8"/><path d="M8 12.5h5.5M11.5 10.5l2 2-2 2" fill="none" stroke="#388A34" stroke-width="1.4"/>'),
  seq: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1" fill="#fff" stroke="#6D6D6D"/><text x="8" y="11" text-anchor="middle" font-size="7" font-weight="bold" font-family="Consolas,monospace" fill="#1E7BD6">123</text>'),
  type: svg('<rect x="1.5" y="2.5" width="13" height="11" rx="1" fill="#fff" stroke="#6D6D6D"/><text x="8" y="11.5" text-anchor="middle" font-size="9" font-weight="bold" font-family="Georgia,serif" fill="#8C6A2A">T</text>'),
  job: svg('<circle cx="8" cy="8" r="6" fill="#fff" stroke="#6D6D6D"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="#1E7BD6" stroke-width="1.5"/>'),
  param: svg('<rect x="1.5" y="3.5" width="13" height="9" rx="1" fill="#fff" stroke="#6D6D6D"/><text x="8" y="11" text-anchor="middle" font-size="8" font-weight="bold" font-family="Consolas,monospace" fill="#8C6A2A">@</text>'),
};

// Replaces <i data-icon="name"></i> placeholders with the SVG.
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('i[data-icon]')) {
    el.innerHTML = ICONS[el.dataset.icon] || '';
    el.classList.add('ico');
  }
}
