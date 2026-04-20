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
    <div className="max-w-3xl mx-auto">
      <BackButton />
      <div className="mb-8">
        <h1 className="text-3xl mb-1">{series.name}</h1>
        {series.era && (
          <span className="text-xs text-imperial-muted uppercase tracking-wide">{series.era}</span>
        )}
      </div>

      {series.description && (
        <p className="text-imperial-light/80 leading-relaxed mb-10">{series.description}</p>
      )}

      {books.length > 0 && (
        <section>
          <h2 className="text-xl mb-4">Books in this Series</h2>
          <ul className="flex flex-col gap-2">
            {books.map((book) => (
              <li key={book.url}>
                <Link
                  to={`/books/${slugFrom(book.url)}`}
                  className="card px-4 py-3 flex items-center gap-4 hover:border-imperial-gold/50 transition-colors"
                >
                  {book.order != null && (
                    <span className="text-imperial-muted text-sm w-6 shrink-0">{book.order}.</span>
                  )}
                  <span className="text-imperial-light flex-1">{book.title}</span>
                  <span className="text-imperial-muted text-sm">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
