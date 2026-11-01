export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const num = (n) => Number(n || 0).toLocaleString('en-IN');

export const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Green for positive, red for negative
export function Change({ value, badge = false }) {
  const v = Number(value || 0);
  const cls = v >= 0 ? 'gain' : 'loss';
  const text = `${v >= 0 ? '▲' : '▼'} ${Math.abs(v).toFixed(2)}%`;
  return badge ? <span className={`badge ${v >= 0 ? 'badge-gain' : 'badge-loss'}`}>{text}</span> : <span className={cls}>{text}</span>;
}
