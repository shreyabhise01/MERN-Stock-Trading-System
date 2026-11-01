import { Link } from 'react-router-dom';
import { inr, Change } from '../utils/format';

export default function StockCard({ stock }) {
  return (
    <Link to={`/stocks/${stock._id}`} className="card stock-card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="symbol-chip">{stock.symbol}</span>
          <Change value={stock.dailyChange} badge />
        </div>
        <div className="text-muted small text-truncate">{stock.companyName}</div>
        <div className="fs-4 fw-bold mt-1">{inr(stock.currentPrice)}</div>
        <div className="text-muted small">{stock.sector}</div>
      </div>
    </Link>
  );
}
