export default function TransactionFilters({ filters, setFilters }) {
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  return (
    <div className="card mb-3"><div className="card-body"><div className="row g-2">
      <div className="col-6 col-md-3"><select className="form-select" value={filters.type} onChange={set('type')}><option value="">All types</option><option value="BUY">Buy</option><option value="SELL">Sell</option></select></div>
      <div className="col-6 col-md-3"><input className="form-control" placeholder="Symbol (e.g. TCS)" value={filters.symbol} onChange={set('symbol')} /></div>
      <div className="col-6 col-md-2"><input type="date" className="form-control" value={filters.from} onChange={set('from')} title="From date" /></div>
      <div className="col-6 col-md-2"><input type="date" className="form-control" value={filters.to} onChange={set('to')} title="To date" /></div>
      <div className="col-12 col-md-2"><button className="btn btn-outline-secondary w-100" onClick={() => setFilters({ type: '', symbol: '', from: '', to: '' })}>Clear</button></div>
    </div></div></div>
  );
}
