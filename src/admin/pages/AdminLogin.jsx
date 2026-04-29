import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../AdminAuth';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await login(form.email, form.password);
    setSubmitting(false);
    if (ok) navigate('/admin', { replace: true });
    else setError('Invalid email or password.');
  };

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/logoname.svg"
            alt="GhorerBazar"
            className="h-10 w-auto mx-auto brightness-0 invert"
          />
          <p className="mt-3 text-sm text-gray-400">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl space-y-5">
          <h1 className="text-xl font-bold text-brand-dark">Sign in</h1>

          {error && (
            <p className="rounded-lg bg-red-50 px-4 py-2 text-xs text-red-600">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email address"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-orange-500 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
