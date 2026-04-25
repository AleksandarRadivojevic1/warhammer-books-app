import { Link } from 'react-router-dom';
import { useSeriesList } from '../hooks/useSeries';
import Spinner from '../components/ui/Spinner';
import SEO from '../components/seo/SEO';

export default function Series() {
  const { data, isLoading } = useSeriesList();
  const series = data?.results ?? [];

  if (isLoading) return <Spinner />;

  const jsonLd = series.length ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Warhammer Book Series — Librarium',
    url: 'https://librarium40k.com/series',
    description: 'Warhammer book series and recommended reading orders.',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: series.slice(0, 50).map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.name,
        url: `https://librarium40k.com/series/${s.slug}`,
      })),
    },
  } : undefined;

  return (
    <div>
      <SEO
        title="Series"
        description="Warhammer book series and recommended reading orders — the Horus Heresy, Gaunt's Ghosts, Ultramarines, Eisenhorn, and more."
        jsonLd={jsonLd}
      />
      <h1 className="text-3xl mb-8 animate-fade-in">Series</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {series.map((s, i) => (
          <Link
            key={s.slug}
            to={`/series/${s.slug}`}
            className="card p-5 flex flex-col gap-3 group hover:border-imperial-gold/40 transition-colors animate-fade-in-up"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif text-lg text-imperial-gold leading-tight">{s.name}</h3>
              {s.era && (
                <span className="text-xs shrink-0 px-2 py-0.5 rounded-full border border-imperial-border text-imperial-muted">
                  {s.era}
                </span>
              )}
            </div>
            <span className="text-imperial-muted/40 text-xs tracking-widest group-hover:text-imperial-gold/50 transition-colors">
              View series →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
