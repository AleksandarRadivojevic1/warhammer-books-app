import { useParams, Link } from 'react-router-dom';
import { useSeries } from '../hooks/useSeries';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';

const slugFrom = (url) => url?.split('/').at(-1);

export default function SeriesDetail() {
  const { slug } = useParams();
  const { data: series, isLoading, isError } = useSeries(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-imperial-muted">Series not found.</p>;

  const books = series?.books ?? [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <BackButton />

      <div className="mb-10 pb-8 border-b border-imperial-border">
        <p className="label text-xs mb-2">Series</p>
        <h1 className="text-3xl mb-3">{series.name}</h1>
        {series.era && (
          <span className="inline-block text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted uppercase tracking-widest mb-4">
            {series.era}
          </span>
        )}
        {series.description && (
          <p className="text-imperial-light/70 leading-relaxed text-sm border-l-2 border-imperial-gold/30 pl-4">
            {series.description}
          </p>
        )}
      </div>

      {books.length > 0 && (
        <section>
          <h2 className="text-2xl mb-4">Books in this Series</h2>
          <ul className="flex flex-col gap-2">
            {books.map((book, i) => (
              <li
                key={book.url}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link
                  to={`/books/${slugFrom(book.url)}`}
                  className="card px-4 py-3 flex items-center gap-4 hover:border-imperial-gold/50 transition-colors group"
                >
                  {book.order != null && (
                    <span className="text-imperial-muted text-sm w-6 shrink-0 font-serif">{book.order}.</span>
                  )}
                  <span className="text-imperial-light flex-1 group-hover:text-imperial-gold transition-colors">{book.title}</span>
                  <span className="text-imperial-muted text-sm group-hover:text-imperial-gold transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
