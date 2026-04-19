import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../ui/Spinner';

export default function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
