import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthors } from '../hooks/useAuthors';
import Spinner from '../components/ui/Spinner';

export default function Authors() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useAuthors({ page });
  const authors = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 50) : 1;

  if (isLoading || isFetching) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl mb-8">Authors</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {authors.map((author) => (
          <Link key={author.slug} to={`/authors/${author.slug}`} className="card p-4 flex gap-4 items-start">
            <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-imperial-bg-mid border border-imperial-border">
              {author.image ? (
                <img
                  src={author.image}
                  alt={author.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-imperial-muted text-xs">?</div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-lg text-imperial-gold mb-1">{author.name}</h3>
              {author.bio && (
                <p className="text-sm text-imperial-muted line-clamp-2">{author.bio}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            className="btn-outline px-4 py-1.5 text-sm disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>
          <span className="text-imperial-muted self-center text-sm">{page} / {totalPages}</span>
          <button
            className="btn-outline px-4 py-1.5 text-sm disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
