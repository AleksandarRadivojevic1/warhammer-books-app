import { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import AuthLayout from '../components/layout/AuthLayout';
import SEO from '../components/seo/SEO';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/api/auth/forgot-password', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" eyebrow="Reset your access">
      <SEO title="Forgot Password" noindex />
      {sent ? (
        <div className="flex flex-col gap-4 animate-fade-in">
          <p className="text-imperial-light/80 text-sm leading-relaxed">
            If an account exists for <span className="text-imperial-gold">{email}</span>, a reset link has been dispatched. Check your inbox.
          </p>
          <Link to="/login" className="text-imperial-gold hover:underline text-sm">Back to Login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-imperial-muted text-sm">Enter your email and we'll send you a link to reset your password.</p>
          <div>
            <label className="label block mb-1">Email</label>
            <input
              className="input font-serif text-imperial-gold placeholder:text-imperial-gold/30"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn-gold mt-2" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="text-center text-imperial-muted text-sm">
            <Link to="/login" className="text-imperial-gold hover:underline">Back to Login</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
