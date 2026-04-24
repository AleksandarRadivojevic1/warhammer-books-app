import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/ui/PasswordInput';
import SEO from '../components/seo/SEO';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
    <AuthLayout title="Login" eyebrow="Welcome back">
      <SEO title="Sign In" noindex />
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label block mb-1">Email</label>
          <input className="input" type="email" required value={form.email} onChange={handle('email')} />
        </div>
        <div>
          <label className="label block mb-1">Password</label>
          <PasswordInput required value={form.password} onChange={handle('password')} />
          <div className="text-right mt-1">
            <Link to="/forgot-password" className="text-xs text-imperial-muted hover:text-imperial-gold transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
        {location.state?.message && (
          <p className="text-imperial-gold/80 text-sm">{location.state.message}</p>
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-gold mt-2" type="submit" disabled={loading}>
          {loading ? 'Entering...' : 'Enter the Librarium'}
        </button>
      </form>
      <p className="text-center text-imperial-muted text-sm mt-6">
        No account?{' '}
        <Link to="/register" className="text-imperial-gold hover:underline">Register</Link>
      </p>
    </AuthLayout>
  );
}
