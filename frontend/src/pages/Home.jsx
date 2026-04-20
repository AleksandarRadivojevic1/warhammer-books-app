import { Link } from 'react-router-dom';
import { useFeatured } from '../hooks/useFeatured';
import BookCard from '../components/ui/BookCard';
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

function FeaturedStrip({ books }) {
  if (!books.length) return null;

  return (
    <section>
      <h2 className="text-2xl mb-6">Featured</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {books.map((book) => (
          <BookCard key={book.slug} book={book} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: featured = [], isLoading } = useFeatured();

  return (
    <div>
      <HeroBanner />
      {isLoading ? <Spinner /> : <FeaturedStrip books={featured} />}
    </div>
  );
}
