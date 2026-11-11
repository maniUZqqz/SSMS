export const $ = s => document.querySelector(s);
export const fa = n => Number(n).toLocaleString('fa-IR');
export const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
export const faDate = iso => {
  try { return new Date(iso).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; }
};
// "۳ دقیقه پیش" style distance from now
export function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 50) return 'چند لحظه پیش';
  if (s < 3600) return `${fa(Math.round(s / 60))} دقیقه پیش`;
  if (s < 86400) return `${fa(Math.round(s / 3600))} ساعت پیش`;
  return `${fa(Math.round(s / 86400))} روز پیش`;
}
