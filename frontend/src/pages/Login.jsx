import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Redirect back to the page the user tried to visit before being sent to /login.
  const from = location.state?.from?.pathname ?? '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-3xl mb-8 text-center">Login</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label block mb-1">Email</label>
          <input className="input" type="email" required value={form.email} onChange={handle('email')} />
        </div>
        <div>
          <label className="label block mb-1">Password</label>
          <input className="input" type="password" required value={form.password} onChange={handle('password')} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-gold mt-2" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p className="text-center text-imperial-muted text-sm mt-6">
        No account?{' '}
        <Link to="/register" className="text-imperial-gold hover:underline">Register</Link>
      </p>
    </div>
  );
}
