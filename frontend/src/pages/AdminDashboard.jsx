import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import TransactionTable from '../components/TransactionTable';
import TransactionFilters from '../components/TransactionFilters';
import { inr, num, fmtDate, Change } from '../utils/format';

const EMPTY = { symbol: '', companyName: '', sector: '', currentPrice: '', volume: '' };

function StocksTab() {
  const [stocks, setStocks] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => api.get('/stocks').then((r) => setStocks(r.data)).catch((e) => setMsg({ type: 'danger', text: errMsg(e) })), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    const body = { ...form, currentPrice: Number(form.currentPrice), volume: Number(form.volume || 0), sector: form.sector || 'General' };
    try {
      if (editId) await api.put(`/stocks/${editId}`, body); else await api.post('/stocks', body);
      setMsg({ type: 'success', text: editId ? 'Stock updated' : 'Stock added' });
      setForm(EMPTY); setEditId(null); load();
    } catch (err) { setMsg({ type: 'danger', text: errMsg(err) }); }
  };

  const edit = (s) => { setEditId(s._id); setForm({ symbol: s.symbol, companyName: s.companyName, sector: s.sector, currentPrice: s.currentPrice, volume: s.volume }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.symbol}?`)) return;
    try { await api.delete(`/stocks/${s._id}`); setMsg({ type: 'success', text: `${s.symbol} deleted` }); load(); }
    catch (err) { setMsg({ type: 'danger', text: errMsg(err) }); }
  };

  return (
    <>
      <div className="card mb-3"><div className="card-body">
        <h6 className="fw-bold mb-3">{editId ? 'Update stock' : 'Add new stock'}</h6>
        {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}
        <form onSubmit={submit} className="row g-2">
          <div className="col-6 col-md-2"><input className="form-control" placeholder="Symbol" required value={form.symbol} onChange={set('symbol')} /></div>
          <div className="col-6 col-md-3"><input className="form-control" placeholder="Company name" required value={form.companyName} onChange={set('companyName')} /></div>
          <div className="col-6 col-md-2"><input className="form-control" placeholder="Sector" value={form.sector} onChange={set('sector')} /></div>
          <div className="col-6 col-md-2"><input type="number" step="0.01" min="0.01" className="form-control" placeholder="Price ₹" required value={form.currentPrice} onChange={set('currentPrice')} /></div>
          <div className="col-6 col-md-2"><input type="number" min="0" className="form-control" placeholder="Volume" value={form.volume} onChange={set('volume')} /></div>
          <div className="col-6 col-md-1 d-grid"><button className="btn btn-primary">{editId ? 'Save' : 'Add'}</button></div>
          {editId && <div className="col-12"><button type="button" className="btn btn-link p-0" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel editing</button></div>}
        </form>
        <div className="text-muted small mt-2">Changing the price automatically recalculates the daily change and adds a point to the price chart.</div>
      </div></div>
      <div className="card"><div className="table-responsive"><table className="table align-middle mb-0">
        <thead className="table-light"><tr><th>Symbol</th><th>Company</th><th>Sector</th><th className="text-end">Price</th><th className="text-end">Change</th><th className="text-end">Volume</th><th /></tr></thead>
        <tbody>{stocks.map((s) => (
          <tr key={s._id}><td><strong>{s.symbol}</strong></td><td>{s.companyName}</td><td>{s.sector}</td><td className="text-end">{inr(s.currentPrice)}</td>
            <td className="text-end"><Change value={s.dailyChange} /></td><td className="text-end">{num(s.volume)}</td>
            <td className="text-end text-nowrap"><button className="btn btn-sm btn-outline-primary me-1" onClick={() => edit(s)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => remove(s)}>Delete</button></td></tr>
        ))}</tbody></table></div></div>
    </>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [filters, setFilters] = useState({ type: '', symbol: '', from: '', to: '' });
  const [error, setError] = useState('');

  useEffect(() => { api.get('/admin/stats').then((r) => setStats(r.data)).catch((e) => setError(errMsg(e))); }, []);
  useEffect(() => { if (tab === 'users') api.get('/admin/users').then((r) => setUsers(r.data)).catch((e) => setError(errMsg(e))); }, [tab]);
  useEffect(() => {
    if (tab !== 'transactions') return undefined;
    const t = setTimeout(() => api.get('/admin/transactions', { params: filters }).then((r) => setTxns(r.data)).catch((e) => setError(errMsg(e))), 250);
    return () => clearTimeout(t);
  }, [tab, filters]);

  return (
    <>
      <h3 className="fw-bold mb-3">Admin dashboard</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <ul className="nav nav-pills mb-3 gap-1">
        {[['overview', 'Overview'], ['stocks', 'Manage stocks'], ['users', 'Users'], ['transactions', 'All transactions']].map(([k, l]) => (
          <li key={k} className="nav-item"><button className={`nav-link ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button></li>
        ))}
      </ul>

      {tab === 'overview' && stats && (
        <>
          <div className="row g-3 mb-4">
            {[['Registered users', num(stats.users)], ['Listed stocks', num(stats.stocks)], ['Total transactions', num(stats.transactions)], ['Total traded value', inr(stats.totalTradedValue)]].map(([l, v]) => (
              <div key={l} className="col-6 col-lg-3"><div className="card"><div className="card-body"><div className="stat-label">{l}</div><div className="stat-value fs-4">{v}</div></div></div></div>
            ))}
          </div>
          <h6 className="fw-bold">Recent activity</h6>
          <TransactionTable rows={stats.recentTransactions} showUser />
        </>
      )}
      {tab === 'stocks' && <StocksTab />}
      {tab === 'users' && (
        <div className="card"><div className="table-responsive"><table className="table align-middle mb-0">
          <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Role</th><th className="text-end">Balance</th><th>Joined</th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u._id}><td>{u.name}</td><td>{u.email}</td><td><span className={`badge ${u.role === 'admin' ? 'bg-primary' : 'bg-secondary'}`}>{u.role}</span></td><td className="text-end">{inr(u.virtualBalance)}</td><td className="small">{fmtDate(u.createdAt)}</td></tr>
          ))}</tbody></table></div></div>
      )}
      {tab === 'transactions' && (<><TransactionFilters filters={filters} setFilters={setFilters} /><TransactionTable rows={txns} showUser /></>)}
    </>
  );
}
