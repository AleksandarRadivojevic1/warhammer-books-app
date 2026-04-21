import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import AuthLayout from '../components/layout/AuthLayout';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await client.post('/api/auth/reset-password', { token, password: form.password });
      navigate('/login', { state: { message: 'Password reset successfully. You can now log in.' } });
    } catch (err) {
      setError(err.response?.data?.error ?? 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset Password" eyebrow="Set new access codes">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label className="label block mb-1">New Password</label>
          <input className="input" type="password" required value={form.password} onChange={handle('password')} />
        </div>
        <div>
          <label className="label block mb-1">Confirm Password</label>
          <input className="input" type="password" required value={form.confirm} onChange={handle('confirm')} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button className="btn-gold mt-2" type="submit" disabled={loading}>
          {loading ? 'Resetting...' : 'Set New Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
