import { Link } from 'react-router-dom';
import SEO from '../components/seo/SEO';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto text-center py-24 animate-fade-in">
      <SEO title="Page Not Found" noindex />
      <p className="label text-xs mb-4">404</p>
      <h1 className="text-4xl mb-4 leading-none tracking-wide">Lost to the Warp</h1>
      <p className="text-imperial-muted mb-8 text-sm leading-relaxed">
        The Codex holds no record of this page. It may have been purged, renamed, or never existed.
      </p>
      <Link to="/" className="btn-gold text-sm px-8 py-3">
        Return to the Librarium
      </Link>
    </div>
  );
}
