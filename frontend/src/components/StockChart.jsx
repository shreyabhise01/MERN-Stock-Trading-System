import { useMemo, useState } from 'react';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const RANGES = { '7D': 7, '1M': 30, '3M': 90, ALL: Infinity };

export default function StockChart({ history = [] }) {
  const [range, setRange] = useState('1M');

  const points = useMemo(() => {
    const sorted = [...history].sort((a, b) => new Date(a.date) - new Date(b.date));
    return sorted.slice(-Math.min(sorted.length, RANGES[range]));
  }, [history, range]);

  if (!points.length) return <div className="text-muted py-5 text-center">No price history available.</div>;

  const up = points[points.length - 1].price >= points[0].price;
  const color = up ? '#0a9f5b' : '#d93025';
  const data = {
    labels: points.map((p) => new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
    datasets: [{
      label: 'Price (₹)', data: points.map((p) => p.price), borderColor: color, borderWidth: 2, tension: 0.3,
      pointRadius: points.length > 40 ? 0 : 3, fill: true, backgroundColor: up ? 'rgba(10,159,91,.1)' : 'rgba(217,48,37,.1)',
    }],
  };
  const options = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ₹${c.parsed.y.toLocaleString('en-IN')}` } } },
    scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } }, y: { ticks: { callback: (v) => '₹' + v } } },
  };

  return (
    <>
      <div className="btn-group btn-group-sm mb-3">
        {Object.keys(RANGES).map((r) => (
          <button key={r} className={`btn ${range === r ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setRange(r)}>{r}</button>
        ))}
      </div>
      <div className="chart-box"><Line data={data} options={options} /></div>
    </>
  );
}
