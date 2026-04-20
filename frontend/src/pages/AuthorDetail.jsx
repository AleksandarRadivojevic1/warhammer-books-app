import { useParams, Link } from 'react-router-dom';
import { useAuthor } from '../hooks/useAuthors';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';

const slugFrom = (url) => url?.split('/').at(-1);

export default function AuthorDetail() {
  const { slug } = useParams();
  const { data: author, isLoading, isError } = useAuthor(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-imperial-muted">Author not found.</p>;

  const books = author?.books ?? [];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <BackButton />

      <div className="flex flex-col sm:flex-row gap-6 items-start mb-10 pb-8 border-b border-imperial-border">
        <div className="w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-full overflow-hidden bg-imperial-bg-mid border border-imperial-border">
          {author.image ? (
            <img
              src={author.image}
              alt={author.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-imperial-muted text-sm">?</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="label text-xs">Author</p>
          <h1 className="text-3xl leading-tight">{author.name}</h1>
          {author.bio && (
            <p className="text-imperial-light/70 leading-relaxed mt-1 text-sm">{author.bio}</p>
          )}
        </div>
      </div>

      {books.length > 0 && (
        <section>
          <h2 className="text-2xl mb-4">Books</h2>
          <ul className="flex flex-col gap-2">
            {books.map((book, i) => (
              <li
                key={book.url}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <Link
                  to={`/books/${slugFrom(book.url)}`}
                  className="card px-4 py-3 flex items-center justify-between hover:border-imperial-gold/50 transition-colors group"
                >
                  <span className="text-imperial-light group-hover:text-imperial-gold transition-colors">{book.title}</span>
                  <span className="text-imperial-muted text-sm group-hover:text-imperial-gold transition-colors">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
