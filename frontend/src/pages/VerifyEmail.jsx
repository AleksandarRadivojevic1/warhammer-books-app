import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';
import Spinner from '../components/ui/Spinner';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    client.get(`/api/auth/verify/${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-imperial-bg px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl mb-4">Librarium</h1>
        {status === 'loading' && <Spinner />}
        {status === 'success' && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <p className="label">Email Verified</p>
            <p className="text-imperial-light/70 text-sm">Your account is now active. You may enter the Librarium.</p>
            <Link to="/login" className="btn-gold px-8 py-3 mt-2">Enter the Librarium</Link>
          </div>
        )}
        {status === 'error' && (
          <div className="animate-fade-in flex flex-col items-center gap-4">
            <p className="label text-red-400">Link Invalid or Expired</p>
            <p className="text-imperial-light/70 text-sm">This verification link has expired or already been used.</p>
            <Link to="/login" className="text-imperial-gold hover:underline text-sm">Back to Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
