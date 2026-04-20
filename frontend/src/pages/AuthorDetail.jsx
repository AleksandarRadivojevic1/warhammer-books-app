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
    <div className="max-w-3xl mx-auto">
      <BackButton />
      <div className="flex gap-6 items-start mb-8">
        <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-imperial-bg-mid border border-imperial-border">
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
        <div>
          <h1 className="text-3xl mb-2">{author.name}</h1>
          {author.bio && (
            <p className="text-imperial-light/80 leading-relaxed">{author.bio}</p>
          )}
        </div>
      </div>

      {books.length > 0 && (
        <section>
          <h2 className="text-xl mb-4">Books</h2>
          <ul className="flex flex-col gap-2">
            {books.map((book) => (
              <li key={book.url}>
                <Link
                  to={`/books/${slugFrom(book.url)}`}
                  className="card px-4 py-3 flex items-center justify-between hover:border-imperial-gold/50 transition-colors"
                >
                  <span className="text-imperial-light">{book.title}</span>
                  <span className="text-imperial-muted text-sm">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
