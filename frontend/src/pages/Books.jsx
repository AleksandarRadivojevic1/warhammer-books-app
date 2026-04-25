import { useState } from 'react';
import { useBooks } from '../hooks/useBooks';
import BookCard from '../components/ui/BookCard';
import FilterSidebar from '../components/ui/FilterSidebar';
import Spinner from '../components/ui/Spinner';
import EmptyState from '../components/ui/EmptyState';
import SEO from '../components/seo/SEO';

export default function Books() {
  const [filters, setFilters] = useState({ page: 1 });
  const { data, isLoading, isFetching, isPreviousData } = useBooks(filters);

  const books = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 48) : 1;
  const page = filters.page ?? 1;

  const jsonLd = books.length ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Warhammer 40K Books — Librarium',
    url: 'https://librarium40k.com/books',
    description: 'Complete catalog of Warhammer 40,000 and Horus Heresy novels.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: books.slice(0, 50).map((b, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: b.title,
        url: `https://librarium40k.com/books/${b.slug}`,
      })),
    },
  } : undefined;

  return (
    <div>
      <SEO
        title="Books"
        description="Complete catalog of Warhammer 40,000 and Horus Heresy novels — browse hundreds of books by author, series, faction, and setting."
        jsonLd={jsonLd}
      />
      <h1 className="text-3xl mb-8">Books</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div className="flex-1">
          {isLoading || isFetching ? (
            <Spinner />
          ) : books.length === 0 ? (
            <EmptyState
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              }
              title="No books found"
              message="Try adjusting your filters or search term."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book, i) => (
                  <div
                    key={book.slug}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <BookCard book={book} />
                  </div>
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
