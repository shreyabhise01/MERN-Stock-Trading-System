import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { inr } from '../utils/format';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = () => { logout(); close(); navigate('/login'); };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-trading sticky-top">
      <div className="container">
        <Link className="navbar-brand navbar-brand-custom" to="/" onClick={close}>📈 StockTrade<span style={{ color: '#6aa8ff' }}>Pro</span></Link>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className="nav-link" to="/" end onClick={close}>Home</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/market" onClick={close}>Market</NavLink></li>
            {user && <li className="nav-item"><NavLink className="nav-link" to="/portfolio" onClick={close}>Portfolio</NavLink></li>}
            {user && <li className="nav-item"><NavLink className="nav-link" to="/transactions" onClick={close}>Transactions</NavLink></li>}
            {user?.role === 'admin' && <li className="nav-item"><NavLink className="nav-link" to="/admin" onClick={close}>Admin</NavLink></li>}
          </ul>
          <div className="d-flex align-items-lg-center flex-column flex-lg-row gap-2">
            {user ? (
              <>
                <span className="badge bg-light text-dark fs-6 fw-semibold">💰 {inr(user.virtualBalance)}</span>
                <span className="text-light small">Hi, {user.name.split(' ')[0]}</span>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-light btn-sm" to="/login" onClick={close}>Login</Link>
                <Link className="btn btn-primary btn-sm" to="/register" onClick={close}>Sign up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
