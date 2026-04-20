import { useParams, Link } from 'react-router-dom';
import { useBook, useRelatedBooks } from '../hooks/useBooks';
import BookCard from '../components/ui/BookCard';
import RelatedBooks from '../components/ui/RelatedBooks';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';

// The API returns author/series/primarchs as { name, url } — extract the slug from the URL end.
const slugFrom = (url) => url?.split('/').at(-1);

export default function BookDetail() {
  const { slug } = useParams();
  const { data: book, isLoading, isError } = useBook(slug);
  const { data: related } = useRelatedBooks(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-imperial-muted">Book not found.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton />
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-40 md:w-56 shrink-0">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full rounded border border-imperial-border"
            />
          ) : (
            <div className="aspect-[2/3] bg-imperial-bg-light rounded border border-imperial-border flex items-center justify-center text-imperial-muted text-sm">
              No cover
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl mb-2">{book.title}</h1>

          {book.author && (
            <p className="text-imperial-muted mb-1">
              by{' '}
              <Link to={`/authors/${slugFrom(book.author.url)}`} className="text-imperial-gold hover:underline">
                {book.author.name}
              </Link>
            </p>
          )}

          {book.series && (
            <p className="text-imperial-muted mb-1">
              Series:{' '}
              <Link to={`/series/${slugFrom(book.series.url)}`} className="text-imperial-gold hover:underline">
                {book.series.name}
              </Link>
            </p>
          )}

          {book.setting?.era && (
            <p className="text-imperial-muted mb-4">
              Era: <span className="text-imperial-light">{book.setting.era}</span>
              {book.setting.millennium && (
                <span className="text-imperial-muted"> · {book.setting.millennium}</span>
              )}
            </p>
          )}

          {book.description && (
            <p className="text-imperial-light/80 leading-relaxed mb-6">{book.description}</p>
          )}

          {book.pages && (
            <p className="text-imperial-muted text-sm mb-4">{book.pages} pages</p>
          )}

          {book.primarchs?.length > 0 && (
            <div>
              <h3 className="label mb-2">Primarchs</h3>
              <div className="flex flex-wrap gap-2">
                {book.primarchs.map((p) => (
                  <Link
                    key={p.url}
                    to={`/primarchs/${slugFrom(p.url)}`}
                    className="border border-imperial-gold/30 text-imperial-gold/70 text-xs px-3 py-1 rounded-full hover:border-imperial-gold transition-colors"
                  >
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <RelatedBooks data={related} />
    </div>
  );
}
