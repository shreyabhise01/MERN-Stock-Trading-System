import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/market', { replace: true });
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card"><div className="card-body p-4 p-md-5">
        <h3 className="fw-bold mb-1">Create your account</h3>
        <p className="text-muted">Get <strong>₹1,00,000</strong> in virtual money to start trading.</p>
        {error && <div className="alert alert-danger py-2">{error}</div>}
        <form onSubmit={submit}>
          <div className="mb-3"><label className="form-label">Full name</label>
            <input className="form-control" required minLength={2} value={form.name} onChange={set('name')} /></div>
          <div className="mb-3"><label className="form-label">Email</label>
            <input type="email" className="form-control" required value={form.email} onChange={set('email')} /></div>
          <div className="mb-3"><label className="form-label">Password (min 6 characters)</label>
            <input type="password" className="form-control" required minLength={6} value={form.password} onChange={set('password')} /></div>
          <div className="mb-4"><label className="form-label">Confirm password</label>
            <input type="password" className="form-control" required value={form.confirm} onChange={set('confirm')} /></div>
          <button className="btn btn-primary w-100 py-2" disabled={busy}>{busy ? 'Creating...' : 'Sign up'}</button>
        </form>
        <p className="text-center text-muted mt-4 mb-0">Already registered? <Link to="/login">Login</Link></p>
      </div></div>
    </div>
  );
}
