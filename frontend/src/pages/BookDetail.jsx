import { useParams, Link } from 'react-router-dom';
import { useBook, useRelatedBooks } from '../hooks/useBooks';
import {
  useFavorites, useAddFavorite, useRemoveFavorite,
  useReadingList, useAddToReadingList, useUpdateReadingStatus, useRemoveFromReadingList,
} from '../hooks/useUser';
import { useAuth } from '../hooks/useAuth';
import RelatedBooks from '../components/ui/RelatedBooks';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';

const slugFrom = (url) => url?.split('/').at(-1);

const STATUSES = [
  { value: 'want-to-read', label: 'Want to Read' },
  { value: 'reading',      label: 'Reading' },
  { value: 'completed',    label: 'Completed' },
];

function BookActions({ slug }) {
  const { data: favorites = [] } = useFavorites();
  const { data: readingList = [] } = useReadingList();
  const addFav = useAddFavorite();
  const removeFav = useRemoveFavorite();
  const addToList = useAddToReadingList();
  const updateStatus = useUpdateReadingStatus();
  const removeFromList = useRemoveFromReadingList();

  const isFav = favorites.some((f) => f.bookSlug === slug);
  const listEntry = readingList.find((item) => item.bookSlug === slug);

  return (
    <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-imperial-border">
      <button
        onClick={() => isFav ? removeFav.mutate(slug) : addFav.mutate(slug)}
        disabled={addFav.isPending || removeFav.isPending}
        className={`flex items-center gap-2 text-sm transition-colors ${
          isFav ? 'text-imperial-gold' : 'text-imperial-muted hover:text-imperial-gold'
        }`}
      >
        <span className="text-lg leading-none">{isFav ? '♥' : '♡'}</span>
        {isFav ? 'Favorited' : 'Add to Favorites'}
      </button>

      <div className="w-px h-5 bg-imperial-border" />

      {listEntry ? (
        <div className="flex items-center gap-1">
          {STATUSES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                value === listEntry.status
                  ? removeFromList.mutate(slug)
                  : updateStatus.mutate({ slug, status: value })
              }
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                listEntry.status === value
                  ? 'border-imperial-gold text-imperial-gold bg-imperial-gold/10'
                  : 'border-imperial-border text-imperial-muted hover:border-imperial-gold/50 hover:text-imperial-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => addToList.mutate({ slug, status: 'want-to-read' })}
          disabled={addToList.isPending}
          className="text-xs px-4 py-1.5 rounded-full border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors tracking-wide uppercase"
        >
          + Add to Reading List
        </button>
      )}
    </div>
  );
}

export default function BookDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: book, isLoading, isError } = useBook(slug);
  const { data: related } = useRelatedBooks(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-imperial-muted">Book not found.</p>;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <BackButton />

      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Cover */}
        <div className="w-40 md:w-56 shrink-0">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full rounded border border-imperial-border shadow-lg"
            />
          ) : (
            <div className="aspect-[2/3] bg-imperial-bg-light rounded border border-imperial-border flex items-center justify-center text-imperial-muted text-sm">
              No cover
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <p className="label text-xs mb-2">Book</p>
          <h1 className="text-3xl mb-3 leading-tight">{book.title}</h1>

          {/* Metadata row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm">
            {book.author && (
              <span className="text-imperial-muted">
                by{' '}
                <Link to={`/authors/${slugFrom(book.author.url)}`} className="text-imperial-gold hover:underline">
                  {book.author.name}
                </Link>
              </span>
            )}
            {book.series && (
              <span className="text-imperial-muted">
                <Link to={`/series/${slugFrom(book.series.url)}`} className="text-imperial-gold hover:underline">
                  {book.series.name}
                </Link>
              </span>
            )}
          </div>

          {/* Chips */}
          {(book.setting?.era || book.pages) && (
            <div className="flex flex-wrap gap-2 mb-5">
              {book.setting?.era && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted">
                  {book.setting.era}
                  {book.setting.millennium && ` · ${book.setting.millennium}`}
                </span>
              )}
              {book.pages && (
                <span className="text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted">
                  {book.pages} pages
                </span>
              )}
            </div>
          )}

          {book.description && (
            <p className="text-imperial-light/80 leading-relaxed mb-6 text-sm border-l-2 border-imperial-gold/30 pl-4">
              {book.description}
            </p>
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

          {user && <BookActions slug={slug} />}
        </div>
      </div>

      <RelatedBooks data={related} />
    </div>
  );
}
