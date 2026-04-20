import { useParams, Link } from 'react-router-dom';
import { usePrimarch } from '../hooks/usePrimarchs';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';

const slugFrom = (url) => url?.split('/').at(-1);

const alignmentStyle = {
  Loyalist: 'border-imperial-gold/60 text-imperial-gold',
  Traitor:  'border-red-800/60 text-red-400',
};

export default function PrimarchDetail() {
  const { slug } = useParams();
  const { data: primarch, isLoading, isError } = usePrimarch(slug);

  if (isLoading) return <Spinner />;
  if (isError) return <p className="text-imperial-muted">Primarch not found.</p>;

  const books = primarch?.books ?? [];
  const style = alignmentStyle[primarch.alignment] ?? 'border-imperial-border text-imperial-muted';

  return (
    <div className="max-w-4xl mx-auto">
      <BackButton />
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        <div className="w-full md:w-72 shrink-0">
          {primarch.image ? (
            <img
              src={primarch.image}
              alt={primarch.name}
              className="w-full rounded border border-imperial-border object-cover"
            />
          ) : (
            <div className="aspect-[3/4] bg-imperial-bg-light rounded border border-imperial-border flex items-center justify-center text-imperial-muted text-sm">
              No image
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl mb-1">{primarch.name}</h1>
          {primarch.legion && (
            <p className="text-imperial-muted text-lg mb-4">{primarch.legion}</p>
          )}
          <div className="flex flex-wrap gap-3 mb-4">
            {primarch.alignment && (
              <span className={`text-sm px-3 py-1 rounded-full border ${style}`}>
                {primarch.alignment}
              </span>
            )}
            {primarch.status && (
              <span className="text-sm px-3 py-1 rounded-full border border-imperial-border text-imperial-muted">
                {primarch.status}
              </span>
            )}
          </div>
          {primarch.fate && (
            <p className="text-imperial-muted text-sm italic">{primarch.fate}</p>
          )}
        </div>
      </div>

      {books.length > 0 && (
        <section>
          <h2 className="text-xl mb-4">Featured In</h2>
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
