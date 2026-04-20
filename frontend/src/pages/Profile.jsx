import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useFavorites, useRemoveFavorite,
  useReadingList, useUpdateReadingStatus, useRemoveFromReadingList,
} from '../hooks/useUser';
import { useBook } from '../hooks/useBooks';
import Spinner from '../components/ui/Spinner';

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
        <p className="text-imperial-muted">
          No favorites yet.{' '}
          <Link to="/books" className="text-imperial-gold hover:underline">Browse books</Link>{' '}
          to add some.
        </p>
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
        <p className="text-imperial-muted">Reading list is empty.</p>
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl mb-1">Profile</h1>
      <p className="text-imperial-muted mb-10">{user?.email}</p>
      <FavoritesSection />
      <ReadingListSection />
    </div>
  );
}
