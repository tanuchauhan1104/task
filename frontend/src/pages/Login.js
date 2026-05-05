import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, background: 'var(--accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>⚡</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Sign in to your TaskFlow account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Your password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
        </p>

        {/* Demo hint */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent)' }}>Demo:</strong> Create a new account to get started. Choose Admin role to manage projects.
        </div>
      </div>
    </div>
  );
}
