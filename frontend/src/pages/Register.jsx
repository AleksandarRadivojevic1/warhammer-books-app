import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../components/layout/AuthLayout';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthLayout title="Check your inbox" eyebrow="Almost there" flip>
        <div className="flex flex-col gap-4 animate-fade-in">
          <p className="text-imperial-light/80 text-sm leading-relaxed">
            A verification link has been sent to{' '}
            <span className="text-imperial-gold font-serif">{form.email}</span>.
            Click it to activate your account and enter the Librarium.
          </p>
          <p className="text-imperial-muted text-xs">Didn't receive it? Check your spam folder.</p>
          <Link to="/login" className="text-imperial-gold hover:underline text-sm mt-2">Back to Login</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create Account" eyebrow="Join the Librarium" flip>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label block mb-1">Email</label>
          <input className="input" type="email" required value={form.email} onChange={handle('email')} />
        </div>
        <div>
          <label className="label block mb-1">Password</label>
          <input className="input" type="password" required value={form.password} onChange={handle('password')} />
        </div>
        <div>
          <label className="label block mb-1">Confirm Password</label>
          <input className="input" type="password" required value={form.confirm} onChange={handle('confirm')} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-gold mt-2" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Join the Librarium'}
        </button>
      </form>
      <p className="text-center text-imperial-muted text-sm mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-imperial-gold hover:underline">Login</Link>
      </p>
    </AuthLayout>
  );
}
