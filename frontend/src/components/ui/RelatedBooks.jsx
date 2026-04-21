import { useRef } from 'react';
import BookCard from './BookCard';

function RelatedGroup({ title, books }) {
  if (!books?.length) return null;

  const ref = useRef(null);

  const scroll = (dir) => {
    ref.current?.scrollBy({ left: dir * 176, behavior: 'smooth' });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <p className="label">{title}</p>
        {books.length > 3 && (
          <div className="flex gap-1">
            <button
              onClick={() => scroll(-1)}
              className="w-7 h-7 flex items-center justify-center border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-7 h-7 flex items-center justify-center border border-imperial-border text-imperial-muted hover:border-imperial-gold hover:text-imperial-gold transition-colors"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {books.slice(0, 6).map((book) => (
          <div
            key={book.slug}
            className="w-36 shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <BookCard book={book} compact />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RelatedBooks({ data }) {
  if (!data?.sameSeries?.length && !data?.relatedByPrimarch?.length) return null;

  return (
    <section className="mt-12 pt-8 border-t border-imperial-border">
      <RelatedGroup title="More from this series" books={data.sameSeries} />
      <RelatedGroup title="Related by primarch" books={data.relatedByPrimarch} />
    </section>
  );
}
