import { Link } from 'react-router-dom';
import { useFeatured } from '../hooks/useFeatured';
import FeaturedCarousel from '../components/ui/FeaturedCarousel';
import Spinner from '../components/ui/Spinner';
import SEO from '../components/seo/SEO';

function HeroBanner() {
  return (
    <section className="relative text-center py-28 mb-12 overflow-hidden">
      {/* Geometric gold diamond grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, rgba(201,168,76,0.05) 0px, rgba(201,168,76,0.05) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(-45deg, rgba(201,168,76,0.05) 0px, rgba(201,168,76,0.05) 1px, transparent 1px, transparent 40px)
          `,
        }}
      />
      {/* Vignette — fades grid to background at edges */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #111318 100%)' }}
      />
      {/* Bottom fade into page */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24"
        style={{ background: 'linear-gradient(to bottom, transparent, #111318)' }}
      />

      <div className="relative z-10 animate-fade-in-up">
        <p className="text-imperial-muted text-xs tracking-widest uppercase mb-5">
          In the grim darkness of the far future
        </p>
        <h1 className="text-5xl md:text-7xl mb-6 leading-none tracking-widest font-black">
          Librarium
        </h1>
        <p className="text-imperial-light/60 max-w-lg mx-auto mb-8 text-base leading-relaxed">
          Browse the chronicles of the Warhammer Universe - books, series, primarchs, and the authors who shaped the lore.
        </p>
        <Link to="/books" className="btn-gold text-sm px-10 py-3">
          Browse the Library
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const { data: featured = [], isLoading } = useFeatured();

  return (
    <div>
      <SEO />
      <HeroBanner />
      {isLoading ? <Spinner /> : <FeaturedCarousel books={featured} />}
    </div>
  );
}
