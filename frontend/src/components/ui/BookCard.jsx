import { Link } from 'react-router-dom';

// The API returns author/series as { name, url } where url is like /api/v1/authors/dan-abnett.
// We extract the slug from the end of the URL to build our internal links.
const slugFrom = (url) => url?.split('/').at(-1);

export default function BookCard({ book, compact = false }) {
  return (
    <Link to={`/books/${book.slug}`} className="card flex flex-col group">
      <div className="aspect-[2/3] bg-imperial-bg-mid overflow-hidden">
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            width="200"
            height="300"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-imperial-muted text-sm">
            No cover
          </div>
        )}
      </div>
      <div className={`flex flex-col gap-1 ${compact ? 'p-2' : 'p-3'}`}>
        <h3 className={`font-serif text-imperial-gold leading-tight line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
          {book.title}
        </h3>
        {!compact && book.author && (
          <p className="text-xs text-imperial-muted">{book.author.name}</p>
        )}
        {!compact && book.series && (
          <span className="text-xs border border-imperial-gold/30 text-imperial-gold/70 px-2 py-0.5 rounded-full self-start">
            {book.series.name}
          </span>
        )}
      </div>
    </Link>
  );
}
