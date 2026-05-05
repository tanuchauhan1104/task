import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>⚡</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Join TaskFlow and start collaborating</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="John Doe" value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="member">Member – Join & work on projects</option>
                <option value="admin">Admin – Create & manage projects</option>
              </select>
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
