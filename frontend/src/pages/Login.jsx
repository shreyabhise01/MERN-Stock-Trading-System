import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(location.state?.from || (user.role === 'admin' ? '/admin' : '/market'), { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card"><div className="card-body p-4 p-md-5">
        <h3 className="fw-bold mb-1">Welcome back</h3>
        <p className="text-muted">Log in to continue trading.</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Email</label>
            <input type="email" className="form-control" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="mb-4"><label className="form-label">Password</label>
            <input type="password" className="form-control" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? 'Logging in...' : 'Login'}</button>
        </form>
        <p className="text-center text-muted mt-4 mb-0">New here? <Link to="/register">Create an account</Link></p>
      </div></div>
    </div>
  );
}
