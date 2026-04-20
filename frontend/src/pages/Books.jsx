import { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import BookCard from '../components/ui/BookCard';
import FilterSidebar from '../components/ui/FilterSidebar';
import Spinner from '../components/ui/Spinner';

export default function Books() {
  const [filters, setFilters] = useState({ page: 1 });
  const { data, isLoading, isFetching, isPreviousData } = useBooks(filters);

  const books = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 48) : 1;
  const page = filters.page ?? 1;

  return (
    <div>
      <h1 className="text-3xl mb-8">Books</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1">
          {isLoading || isFetching ? (
            <Spinner />
          ) : books.length === 0 ? (
            <p className="text-imperial-muted">No books found.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book) => (
                  <BookCard key={book.slug} book={book} />
                ))}
                {Array.from({ length: (4 - (books.length % 4)) % 4 }).map((_, i) => (
                  <div key={`filler-${i}`} className="hidden lg:block" />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-3 mt-8">
                  <button
                    className="btn-outline px-4 py-1.5 text-sm disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                  >
                    Previous
                  </button>
                  <span className="text-imperial-muted self-center text-sm">
                    {page} / {totalPages}
                  </span>
                  <button
                    className="btn-outline px-4 py-1.5 text-sm disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
