export function escapeHTML(s=""){
  return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

//날짜 포맷: YYYY. MM. DD
export function formatDate(v) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}. ${mm}. ${dd}`;
}

//날짜 범위 포맷: start ~ end
export function formatDateRange(startVal, endVal) {
  const s = formatDate(startVal);
  const e = formatDate(endVal);
  if (!s && !e) return "";
  if (!e || s === e) return s;
  if (new Date(endVal) < new Date(startVal)) return s;
  return `${s} ~ ${e}`;
}
//HEX => RGBA 변환
export function hexToRgba(hex, alpha = 0.14) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}