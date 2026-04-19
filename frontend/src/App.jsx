import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import RequireAuth from './components/guards/RequireAuth';
import RequireAdmin from './components/guards/RequireAdmin';

import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import Authors from './pages/Authors';
import AuthorDetail from './pages/AuthorDetail';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Primarchs from './pages/Primarchs';
import PrimarchDetail from './pages/PrimarchDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:slug" element={<BookDetail />} />
          <Route path="/authors" element={<Authors />} />
          <Route path="/authors/:slug" element={<AuthorDetail />} />
          <Route path="/series" element={<Series />} />
          <Route path="/series/:slug" element={<SeriesDetail />} />
          <Route path="/primarchs" element={<Primarchs />} />
          <Route path="/primarchs/:slug" element={<PrimarchDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
