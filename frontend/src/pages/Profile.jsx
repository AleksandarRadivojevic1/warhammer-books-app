import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useFavorites, useRemoveFavorite,
  useReadingList, useUpdateReadingStatus, useRemoveFromReadingList,
} from '../hooks/useUser';
import { useBook } from '../hooks/useBooks';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';

const STATUSES = [
  { value: 'want-to-read', label: 'Want to Read' },
  { value: 'reading',      label: 'Reading' },
  { value: 'completed',    label: 'Completed' },
];

// Fetches the book title for a given slug. Falls back to the slug if not yet loaded.
function BookTitle({ slug }) {
  const { data: book } = useBook(slug);
  return <>{book?.title ?? slug}</>;
}

function FavoritesSection() {
  const { data: favorites = [], isLoading } = useFavorites();
  const remove = useRemoveFavorite();

  if (isLoading) return <Spinner />;

  return (
    <section className="mb-10">
      <h2 className="text-2xl mb-4">Favorites</h2>
      {favorites.length === 0 ? (
        <EmptyState
          icon="♡"
          title="No favorites yet"
          message="Browse the library and mark books you love."
          action={<Link to="/books" className="text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline">Browse Books</Link>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {favorites.map((fav) => (
            <li key={fav.bookSlug} className="card px-4 py-3 flex items-center justify-between">
              <Link to={`/books/${fav.bookSlug}`} className="text-imperial-gold hover:underline">
                <BookTitle slug={fav.bookSlug} />
              </Link>
              <button
                onClick={() => remove.mutate(fav.bookSlug)}
                className="text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0 ml-4"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ReadingListSection() {
  const { data: list = [], isLoading } = useReadingList();
  const updateStatus = useUpdateReadingStatus();
  const remove = useRemoveFromReadingList();

  if (isLoading) return <Spinner />;

  return (
    <section>
      <h2 className="text-2xl mb-4">Reading List</h2>
      {list.length === 0 ? (
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          }
          title="Reading list is empty"
          message="Add books to track what you're reading or want to read."
          action={<Link to="/books" className="text-xs font-serif tracking-widest uppercase text-imperial-gold hover:underline">Browse Books</Link>}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {list.map((item) => (
            <li key={item.bookSlug} className="card px-4 py-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Link to={`/books/${item.bookSlug}`} className="text-imperial-gold hover:underline">
                  <BookTitle slug={item.bookSlug} />
                </Link>
                <button
                  onClick={() => remove.mutate(item.bookSlug)}
                  className="text-imperial-muted hover:text-red-400 text-sm transition-colors shrink-0 ml-4"
                >
                  Remove
                </button>
              </div>
              <div className="flex items-center gap-1">
                {STATUSES.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateStatus.mutate({ slug: item.bookSlug, status: value })}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      item.status === value
                        ? 'border-imperial-gold text-imperial-gold bg-imperial-gold/10'
                        : 'border-imperial-border text-imperial-muted hover:border-imperial-gold/50 hover:text-imperial-light'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <p className="label mb-2">Soldier of the Imperium</p>
      <h1 className="text-3xl mb-2">Profile</h1>
      <div className="flex items-center gap-2 mb-10 pb-6 border-b border-imperial-border">
        <span className="text-imperial-gold/40 text-xs">✦</span>
        <p className="text-imperial-gold/70 text-sm font-serif tracking-wide">{user?.email}</p>
      </div>
      <FavoritesSection />
      <ReadingListSection />
    </div>
  );
}
