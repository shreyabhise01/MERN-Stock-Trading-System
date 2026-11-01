import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import StockChart from '../components/StockChart';
import { inr, num, Change } from '../utils/format';

export default function StockDetails() {
  const { id } = useParams();
  const { user, refreshUser } = useAuth();
  const [stock, setStock] = useState(null);
  const [owned, setOwned] = useState(null);
  const [side, setSide] = useState('BUY');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState(null); // { type, text }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStock((await api.get(`/stocks/${id}`)).data);
      if (user) {
        const p = (await api.get('/portfolio')).data.holdings.find((h) => h.stock._id === id);
        setOwned(p || null);
      }
    } catch (e) { setError(errMsg(e)); }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!stock) return <div className="text-center py-5"><div className="spinner-border text-primary" /></div>;

  const quantity = Number(qty);
  const valid = Number.isInteger(quantity) && quantity > 0;
  const total = valid ? Math.round(stock.currentPrice * quantity * 100) / 100 : 0;
  const first = stock.historicalPrices[0]?.price;
  const high = Math.max(...stock.historicalPrices.map((p) => p.price), stock.currentPrice);
  const low = Math.min(...stock.historicalPrices.map((p) => p.price), stock.currentPrice);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null); setBusy(true);
    try {
      const res = await api.post(`/trade/${side.toLowerCase()}`, { stockId: stock._id, quantity });
      setMsg({ type: 'success', text: res.data.message });
      await Promise.all([refreshUser(), load()]);
    } catch (err) { setMsg({ type: 'danger', text: errMsg(err) }); } finally { setBusy(false); }
  };

  return (
    <>
      <Link to="/market" className="text-decoration-none">← Back to market</Link>
      <div className="d-flex flex-wrap justify-content-between align-items-end my-3">
        <div>
          <span className="symbol-chip">{stock.symbol}</span> <span className="text-muted ms-2">{stock.sector}</span>
          <h3 className="fw-bold mb-0 mt-1">{stock.companyName}</h3>
        </div>
        <div className="text-end"><div className="fs-2 fw-bold">{inr(stock.currentPrice)}</div><Change value={stock.dailyChange} badge /></div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card mb-3"><div className="card-body"><StockChart history={stock.historicalPrices} /></div></div>
          <div className="row g-3">
            {[['Period high', inr(high)], ['Period low', inr(low)], ['Volume', num(stock.volume)], ['Since first record', first ? `${(((stock.currentPrice - first) / first) * 100).toFixed(2)}%` : '-']].map(([l, v]) => (
              <div key={l} className="col-6 col-md-3"><div className="card"><div className="card-body py-3"><div className="stat-label">{l}</div><div className="fw-bold">{v}</div></div></div></div>
            ))}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card"><div className="card-body">
            <h5 className="fw-bold mb-3">Trade {stock.symbol}</h5>
            {!user ? (
              <div className="text-center py-3"><p className="text-muted">Log in to buy or sell this stock.</p><Link className="btn btn-primary" to="/login" state={{ from: `/stocks/${id}` }}>Login to trade</Link></div>
            ) : (
              <form onSubmit={submit}>
                <div className="btn-group w-100 mb-3">
                  <button type="button" className={`btn ${side === 'BUY' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setSide('BUY')}>Buy</button>
                  <button type="button" className={`btn ${side === 'SELL' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setSide('SELL')}>Sell</button>
                </div>
                <div className="d-flex justify-content-between small text-muted mb-1"><span>Available balance</span><strong>{inr(user.virtualBalance)}</strong></div>
                <div className="d-flex justify-content-between small text-muted mb-3"><span>Shares owned</span><strong>{owned ? num(owned.quantity) : 0}</strong></div>
                <label className="form-label">Quantity</label>
                <input type="number" min="1" step="1" className="form-control mb-3" value={qty} onChange={(e) => setQty(e.target.value)} />
                <div className="d-flex justify-content-between mb-3"><span>Estimated total</span><strong>{inr(total)}</strong></div>
                {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}
                <button className={`btn w-100 ${side === 'BUY' ? 'btn-success' : 'btn-danger'}`} disabled={busy || !valid}>
                  {busy ? 'Processing...' : `${side === 'BUY' ? 'Buy' : 'Sell'} ${valid ? quantity : ''} share${quantity === 1 ? '' : 's'}`}
                </button>
                <div className="text-muted small mt-2">Virtual money only. Orders execute at the current price.</div>
              </form>
            )}
          </div></div>
        </div>
      </div>
    </>
  );
}
