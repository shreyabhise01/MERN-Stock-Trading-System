import { inr, num, fmtDate } from '../utils/format';

// Shared by the user Transactions page and the Admin dashboard
export default function TransactionTable({ rows, showUser = false }) {
  return (
    <div className="card"><div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light"><tr><th>Date</th>{showUser && <th>User</th>}<th>Stock</th><th>Type</th><th className="text-end">Qty</th><th className="text-end">Price</th><th className="text-end">Total</th></tr></thead>
        <tbody>
          {!rows.length && <tr><td colSpan={showUser ? 7 : 6} className="text-center text-muted py-4">No transactions found.</td></tr>}
          {rows.map((t) => (
            <tr key={t._id}>
              <td className="small">{fmtDate(t.timestamp)}</td>
              {showUser && <td className="small">{t.userId?.name || 'Deleted user'}<div className="text-muted">{t.userId?.email}</div></td>}
              <td><strong>{t.symbol}</strong><div className="small text-muted d-none d-md-block">{t.companyName}</div></td>
              <td><span className={`badge ${t.transactionType === 'BUY' ? 'badge-gain' : 'badge-loss'}`}>{t.transactionType}</span></td>
              <td className="text-end">{num(t.quantity)}</td><td className="text-end">{inr(t.price)}</td><td className="text-end fw-semibold">{inr(t.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div></div>
  );
}
