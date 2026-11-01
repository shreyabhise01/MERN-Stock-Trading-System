import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { inr, num, Change } from '../utils/format';

export default function Market() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [sector, setSector] = useState('All');
  const [sort, setSort] = useState('name');
  const [sectors, setSectors] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/stocks/sectors').then((r) => setSectors(r.data)).catch(() => {}); }, []);

  // debounce so we don't call the API on every keystroke
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/stocks', { params: { search, sector, sort } });
        setStocks(res.data); setError('');
      } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [search, sector, sort]);

  return (
    <>
      <h3 className="fw-bold mb-3">Stock market</h3>
      <div className="card mb-3"><div className="card-body"><div className="row g-2">
        <div className="col-md-5"><input className="form-control" placeholder="Search by symbol or company..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="col-6 col-md-3">
          <select className="form-select" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option>All</option>{sectors.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-4">
          <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="name">Sort: Symbol A-Z</option><option value="price_desc">Price: High to Low</option><option value="price_asc">Price: Low to High</option>
            <option value="gainers">Top gainers</option><option value="losers">Top losers</option><option value="volume">Highest volume</option>
          </select>
        </div>
      </div></div></div>

      {error && <div className="alert alert-danger">{error}</div>}
      <div className="card"><div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light"><tr><th>Symbol</th><th>Company</th><th className="d-none d-md-table-cell">Sector</th><th className="text-end">Price</th><th className="text-end">Change</th><th className="text-end d-none d-lg-table-cell">Volume</th><th /></tr></thead>
          <tbody>
            {loading && <tr><td colSpan="7" className="text-center py-4"><div className="spinner-border spinner-border-sm text-primary" /></td></tr>}
            {!loading && !stocks.length && <tr><td colSpan="7" className="text-center text-muted py-4">No stocks match your search.</td></tr>}
            {!loading && stocks.map((s) => (
              <tr key={s._id}>
                <td><Link to={`/stocks/${s._id}`} className="symbol-chip text-decoration-none">{s.symbol}</Link></td>
                <td>{s.companyName}</td><td className="d-none d-md-table-cell text-muted">{s.sector}</td>
                <td className="text-end fw-semibold">{inr(s.currentPrice)}</td>
                <td className="text-end"><Change value={s.dailyChange} /></td>
                <td className="text-end d-none d-lg-table-cell text-muted">{num(s.volume)}</td>
                <td className="text-end"><Link to={`/stocks/${s._id}`} className="btn btn-sm btn-primary">Trade</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
