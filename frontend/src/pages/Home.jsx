import { Link } from 'react-router-dom';
import { useFeatured } from '../hooks/useFeatured';
import FeaturedCarousel from '../components/ui/FeaturedCarousel';
import Spinner from '../components/ui/Spinner';

function HeroBanner() {
  return (
    <section className="text-center py-24 mb-12 border-b border-imperial-border">
      <p className="text-imperial-muted text-sm tracking-widest uppercase mb-4">
        In the grim darkness of the far future
      </p>
      <h1 className="text-5xl md:text-6xl mb-6 leading-tight">
        Librarium
      </h1>
      <p className="text-imperial-light/70 max-w-xl mx-auto mb-8 text-lg">
        Browse the chronicles of the Warhammer Universe - books, series, primarchs, and the authors who shaped the lore.
      </p>
      <Link to="/books" className="btn-gold text-base px-8 py-3">
        Browse the Library
      </Link>
    </section>
  );
}

export default function Home() {
  const { data: featured = [], isLoading } = useFeatured();

  return (
    <div>
      <HeroBanner />
      {isLoading ? <Spinner /> : <FeaturedCarousel books={featured} />}
    </div>
  );
}
