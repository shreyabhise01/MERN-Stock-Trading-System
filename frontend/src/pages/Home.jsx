import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import StockCard from '../components/StockCard';
import { inr, Change } from '../utils/format';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => { api.get('/stocks').then((r) => setStocks(r.data)).catch((e) => setError(errMsg(e))); }, []);

  const advancing = stocks.filter((s) => s.dailyChange > 0).length;
  const declining = stocks.filter((s) => s.dailyChange < 0).length;
  const byChange = [...stocks].sort((a, b) => b.dailyChange - a.dailyChange);
  const gainers = byChange.slice(0, 3);
  const losers = byChange.slice(-3).reverse();
  const featured = [...stocks].sort((a, b) => b.volume - a.volume).slice(0, 4);

  const search = (e) => { e.preventDefault(); navigate(`/market?search=${encodeURIComponent(q.trim())}`); };

  const MoverList = ({ title, list }) => (
    <div className="card h-100"><div className="card-body">
      <h6 className="fw-bold mb-3">{title}</h6>
      {list.map((s) => (
        <Link key={s._id} to={`/stocks/${s._id}`} className="d-flex justify-content-between text-decoration-none text-dark py-2 border-bottom">
          <span><strong>{s.symbol}</strong> <span className="text-muted small">{inr(s.currentPrice)}</span></span><Change value={s.dailyChange} />
        </Link>
      ))}
      {!list.length && <div className="text-muted small">No data yet</div>}
    </div></div>
  );

  return (
    <>
      <section className="hero p-4 p-md-5 mb-4">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <h1 className="fw-bold display-6">Learn to trade with ₹1,00,000 of virtual money</h1>
            <p className="lead opacity-75">Practice buying and selling stocks, track your portfolio and see your profit &amp; loss, with zero real-world risk.</p>
            <form className="input-group mb-3" onSubmit={search} style={{ maxWidth: 480 }}>
              <input className="form-control form-control-lg" placeholder="Search stocks, e.g. TCS or Infosys" value={q} onChange={(e) => setQ(e.target.value)} />
              <button className="btn btn-light btn-lg">Search</button>
            </form>
            {user ? <Link to="/portfolio" className="btn btn-outline-light">View my portfolio</Link>
              : <><Link to="/register" className="btn btn-light me-2">Get started free</Link><Link to="/login" className="btn btn-outline-light">Login</Link></>}
          </div>
        </div>
      </section>

      {error && <div className="alert alert-danger">{error}</div>}

      <h5 className="fw-bold mb-3">Market overview</h5>
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="stat-label">Listed stocks</div><div className="stat-value">{stocks.length}</div></div></div></div>
        <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="stat-label">Advancing</div><div className="stat-value gain">▲ {advancing}</div></div></div></div>
        <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="stat-label">Declining</div><div className="stat-value loss">▼ {declining}</div></div></div></div>
        <div className="col-6 col-md-3"><div className="card"><div className="card-body"><div className="stat-label">Top gainer</div><div className="stat-value fs-5">{gainers[0]?.symbol || '-'}</div></div></div></div>
      </div>
      <div className="row g-3 mb-4">
        <div className="col-md-6"><MoverList title="🚀 Top gainers" list={gainers} /></div>
        <div className="col-md-6"><MoverList title="📉 Top losers" list={losers} /></div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Featured stocks</h5><Link to="/market">View all →</Link>
      </div>
      <div className="row g-3">
        {featured.map((s) => <div key={s._id} className="col-12 col-sm-6 col-lg-3"><StockCard stock={s} /></div>)}
      </div>
    </>
  );
}
