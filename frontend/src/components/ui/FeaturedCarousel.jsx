import { useRef, useState, useEffect } from 'react';
import BookCard from './BookCard';

const CARD_GAP = 16; // px — matches gap-4

export default function FeaturedCarousel({ books }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [books]);

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    // Scroll by one card width + gap, derived from the first child's width
    const cardWidth = el.firstElementChild?.offsetWidth ?? 200;
    el.scrollBy({ left: dir * (cardWidth + CARD_GAP), behavior: 'smooth' });
  };

  if (!books.length) return null;

  const showArrows = books.length > 5;

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">Featured</h2>
        {showArrows && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll(-1)}
              disabled={!canScrollLeft}
              className="w-8 h-8 flex items-center justify-center border border-imperial-border text-imperial-muted hover:text-imperial-gold hover:border-imperial-gold disabled:opacity-30 transition-colors"
              aria-label="Scroll left"
            >
              ←
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={!canScrollRight}
              className="w-8 h-8 flex items-center justify-center border border-imperial-border text-imperial-muted hover:text-imperial-gold hover:border-imperial-gold disabled:opacity-30 transition-colors"
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className={`flex gap-4 overflow-x-auto scrollbar-hide pb-1 ${showArrows ? 'snap-x snap-mandatory' : 'flex-wrap'}`}
      >
        {books.map((book, i) => (
          <div
            key={book.slug}
            className="snap-start shrink-0 w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(20%-13px)]"
          >
            <BookCard book={book} priority={i === 0} />
          </div>
        ))}
      </div>
    </section>
  );
}
