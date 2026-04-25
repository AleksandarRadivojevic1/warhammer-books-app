import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import VerificationBanner from './components/ui/VerificationBanner';
import RequireAuth from './components/guards/RequireAuth';
import RequireAdmin from './components/guards/RequireAdmin';
import Spinner from './components/ui/Spinner';

import Home from './pages/Home';
const Books          = lazy(() => import('./pages/Books'));
const BookDetail     = lazy(() => import('./pages/BookDetail'));
const Authors        = lazy(() => import('./pages/Authors'));
const AuthorDetail   = lazy(() => import('./pages/AuthorDetail'));
const Series         = lazy(() => import('./pages/Series'));
const SeriesDetail   = lazy(() => import('./pages/SeriesDetail'));
const Primarchs      = lazy(() => import('./pages/Primarchs'));
const PrimarchDetail = lazy(() => import('./pages/PrimarchDetail'));
const Login          = lazy(() => import('./pages/Login'));
const Register       = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword  = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail    = lazy(() => import('./pages/VerifyEmail'));
const Profile        = lazy(() => import('./pages/Profile'));
const Admin          = lazy(() => import('./pages/Admin'));
const NotFound       = lazy(() => import('./pages/NotFound'));

function AuthWrapper() {
  return <main className="flex-1 flex flex-col"><Outlet /></main>;
}

function ContentWrapper() {
  return (
    <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
      <Outlet />
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <VerificationBanner />
      <Suspense fallback={<main className="flex-1 flex items-center justify-center"><Spinner /></main>}>
      <Routes>
        <Route element={<AuthWrapper />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify/:token" element={<VerifyEmail />} />
        </Route>
        <Route element={<ContentWrapper />}>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:slug" element={<BookDetail />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/authors/:slug" element={<AuthorDetail />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:slug" element={<SeriesDetail />} />
          <Route path="/primarchs" element={<Primarchs />} />
          <Route path="/primarchs/:slug" element={<PrimarchDetail />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
      <Footer />
    </div>
  );
}
