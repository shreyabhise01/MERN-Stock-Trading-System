import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import TransactionTable from '../components/TransactionTable';
import TransactionFilters from '../components/TransactionFilters';

export default function Transactions() {
  const [filters, setFilters] = useState({ type: '', symbol: '', from: '', to: '' });
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/transactions', { params: filters }).then((r) => { setRows(r.data); setError(''); }).catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  return (
    <>
      <h3 className="fw-bold mb-3">Transaction history</h3>
      <TransactionFilters filters={filters} setFilters={setFilters} />
      {error && <div className="alert alert-danger">{error}</div>}
      <TransactionTable rows={rows} />
    </>
  );
}
