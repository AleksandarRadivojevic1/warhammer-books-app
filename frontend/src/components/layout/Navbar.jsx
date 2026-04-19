import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navLink = ({ isActive }) =>
  isActive
    ? 'text-imperial-gold'
    : 'text-imperial-muted hover:text-imperial-gold-lt transition-colors';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-imperial-bg-mid border-b border-imperial-border">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-imperial-gold tracking-wide">
          Warhammer Library
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <NavLink to="/books" className={navLink}>Books</NavLink>
          <NavLink to="/series" className={navLink}>Series</NavLink>
          <NavLink to="/authors" className={navLink}>Authors</NavLink>
          <NavLink to="/primarchs" className={navLink}>Primarchs</NavLink>

          {user ? (
            <>
              <NavLink to="/profile" className={navLink}>Profile</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={navLink}>Admin</NavLink>
              )}
              <button
                onClick={logout}
                className="text-imperial-muted hover:text-imperial-gold-lt transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLink}>Login</NavLink>
              <NavLink to="/register" className="btn-gold text-sm px-4 py-1.5">
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
