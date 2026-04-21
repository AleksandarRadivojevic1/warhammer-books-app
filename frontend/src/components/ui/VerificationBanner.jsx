import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';

export default function VerificationBanner() {
  const { user } = useAuth();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.isVerified) return null;

  const resend = async () => {
    setLoading(true);
    try {
      await client.post('/api/auth/resend-verification', { email: user.email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-imperial-gold/10 border-b border-imperial-gold/30 px-4 py-2.5 animate-slide-down">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-imperial-light/80">
          <span className="text-imperial-gold font-serif">Verify your email</span>
          {' '}— check your inbox to activate your account.
        </p>
        {sent ? (
          <span className="text-xs text-imperial-gold/70 font-serif">Sent — check your inbox.</span>
        ) : (
          <button
            onClick={resend}
            disabled={loading}
            className="text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline disabled:opacity-50 shrink-0"
          >
            {loading ? 'Sending...' : 'Resend Email'}
          </button>
        )}
      </div>
    </div>
  );
}
