import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api, { errMsg } from '../api';
import { inr, num, Change } from '../utils/format';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
const PALETTE = ['#0b5ed7', '#3d8bfd', '#6ea8fe', '#0a2540', '#20c997', '#ffc107', '#fd7e14', '#6f42c1', '#d63384', '#6c757d'];

export default function Portfolio() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/portfolio').then((r) => setData(r.data)).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!data) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;
  const { holdings, summary } = data;
  const pl = summary.totalPnL >= 0 ? 'gain' : 'loss';

  const doughnut = {
    labels: holdings.map((h) => h.stock.symbol),
    datasets: [{ data: holdings.map((h) => h.currentValue), backgroundColor: holdings.map((_, i) => PALETTE[i % PALETTE.length]) }],
  };
  const bar = {
    labels: holdings.map((h) => h.stock.symbol),
    datasets: [{ label: 'Profit / Loss (₹)', data: holdings.map((h) => h.pnl), backgroundColor: holdings.map((h) => (h.pnl >= 0 ? '#0a9f5b' : '#d93025')) }],
  };
  const opts = { responsive: true, maintainAspectRatio: false };

  return (
    <>
      <h3 className="fw-bold mb-3">My portfolio</h3>
      <div className="row g-3 mb-4">
        {[['Cash balance', inr(summary.virtualBalance), ''], ['Total invested', inr(summary.totalInvested), ''], ['Current value', inr(summary.currentValue), ''],
          ['Total P&L', `${summary.totalPnL >= 0 ? '+' : ''}${inr(summary.totalPnL)}`, pl], ['Net worth', inr(summary.netWorth), '']].map(([l, v, c]) => (
          <div key={l} className="col-6 col-lg"><div className="card h-100"><div className="card-body"><div className="stat-label">{l}</div><div className={`stat-value fs-5 ${c}`}>{v}</div>
            {l === 'Total P&L' && <Change value={summary.pnlPercent} />}</div></div></div>
        ))}
      </div>

      {!holdings.length ? (
        <div className="card"><div className="card-body text-center py-5"><h5>You don't own any stocks yet</h5><p className="text-muted">Head to the market and make your first trade.</p><Link to="/market" className="btn btn-primary">Browse market</Link></div></div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <div className="col-md-5"><div className="card h-100"><div className="card-body"><h6 className="fw-bold">Allocation by value</h6><div className="chart-box-sm"><Doughnut data={doughnut} options={opts} /></div></div></div></div>
            <div className="col-md-7"><div className="card h-100"><div className="card-body"><h6 className="fw-bold">Profit / loss by stock</h6><div className="chart-box-sm"><Bar data={bar} options={{ ...opts, plugins: { legend: { display: false } } }} /></div></div></div></div>
          </div>
          <div className="card"><div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light"><tr><th>Stock</th><th className="text-end">Qty</th><th className="text-end">Avg price</th><th className="text-end">Current</th><th className="text-end d-none d-md-table-cell">Invested</th><th className="text-end d-none d-md-table-cell">Value</th><th className="text-end">P&amp;L</th><th /></tr></thead>
              <tbody>
                {holdings.map((h) => (
                  <tr key={h._id}>
                    <td><Link to={`/stocks/${h.stock._id}`} className="symbol-chip text-decoration-none">{h.stock.symbol}</Link><div className="small text-muted d-none d-md-block">{h.stock.companyName}</div></td>
                    <td className="text-end">{num(h.quantity)}</td><td className="text-end">{inr(h.averagePrice)}</td><td className="text-end">{inr(h.currentPrice)}</td>
                    <td className="text-end d-none d-md-table-cell">{inr(h.invested)}</td><td className="text-end d-none d-md-table-cell">{inr(h.currentValue)}</td>
                    <td className={`text-end fw-semibold ${h.pnl >= 0 ? 'gain' : 'loss'}`}>{h.pnl >= 0 ? '+' : ''}{inr(h.pnl)}<div className="small"><Change value={h.pnlPercent} /></div></td>
                    <td className="text-end"><Link to={`/stocks/${h.stock._id}`} className="btn btn-sm btn-outline-danger">Sell</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div></div>
        </>
      )}
    </>
  );
}
