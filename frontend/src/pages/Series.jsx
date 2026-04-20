import { Link } from 'react-router-dom';
import { useSeriesList } from '../hooks/useSeries';
import Spinner from '../components/ui/Spinner';

export default function Series() {
  const { data, isLoading } = useSeriesList();
  const series = data?.results ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-3xl mb-8">Series</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {series.map((s) => (
          <Link key={s.slug} to={`/series/${s.slug}`} className="card p-4">
            <h3 className="font-serif text-lg text-imperial-gold mb-1">{s.name}</h3>
            {s.era && (
              <span className="text-xs text-imperial-muted uppercase tracking-wide">{s.era}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
