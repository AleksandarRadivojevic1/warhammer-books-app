import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }) =>
  isActive ? 'text-imperial-gold' : 'text-imperial-muted hover:text-imperial-gold transition-colors';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close overlay on route change.
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const close = () => setOpen(false);

  const navLinks = [
    { to: '/books',     label: 'Books' },
    { to: '/series',    label: 'Series' },
    { to: '/authors',   label: 'Authors' },
    { to: '/primarchs', label: 'Primarchs' },
  ];

  return (
    <header className="bg-imperial-bg-mid border-b border-imperial-border relative z-40">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl text-imperial-gold tracking-wide">
          Librarium
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {navLinks.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>{label}</NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              {user.role === 'admin' && (
                <NavLink to="/admin" className={linkClass}>Admin</NavLink>
              )}
              <button
                onClick={logout}
                className="text-imperial-muted hover:text-imperial-gold transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <NavLink to="/register" className="btn-gold text-sm px-4 py-1.5">Register</NavLink>
            </>
          )}
        </div>

        {/* Hamburger — mobile only */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <span className="w-5 h-px bg-imperial-muted block" />
          <span className="w-5 h-px bg-imperial-muted block" />
          <span className="w-5 h-px bg-imperial-muted block" />
        </button>
      </nav>

      {/* Full-screen overlay — mobile */}
      {open && (
        <div className="fixed inset-0 z-50 bg-imperial-bg flex flex-col px-8 py-6">
          <div className="flex items-center justify-between mb-12">
            <Link to="/" onClick={close} className="font-serif text-2xl text-imperial-gold tracking-wide">
              Librarium
            </Link>
            <button
              onClick={close}
              className="text-imperial-muted hover:text-imperial-gold text-2xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={close}
                className={({ isActive }) =>
                  `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${
                    isActive ? 'text-imperial-gold' : 'text-imperial-light/40 hover:text-imperial-light'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/profile"
                onClick={close}
                className={({ isActive }) =>
                  `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${
                    isActive ? 'text-imperial-gold' : 'text-imperial-light/40 hover:text-imperial-light'
                  }`
                }
              >
                Profile
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink
                to="/admin"
                onClick={close}
                className={({ isActive }) =>
                  `font-serif text-3xl py-4 border-b border-imperial-border transition-colors ${
                    isActive ? 'text-imperial-gold' : 'text-imperial-light/40 hover:text-imperial-light'
                  }`
                }
              >
                Admin
              </NavLink>
            )}
          </nav>

          <div className="mt-auto flex gap-6 text-sm">
            {user ? (
              <button
                onClick={() => { logout(); close(); }}
                className="text-imperial-muted hover:text-imperial-gold transition-colors"
              >
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" onClick={close} className="text-imperial-muted hover:text-imperial-gold transition-colors">
                  Login
                </Link>
                <Link to="/register" onClick={close} className="btn-gold px-4 py-1.5">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
