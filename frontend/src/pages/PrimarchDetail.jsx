import { useParams, Link } from 'react-router-dom';
import { usePrimarch } from '../hooks/usePrimarchs';
import Spinner from '../components/ui/Spinner';
import BackButton from '../components/ui/BackButton';
import SEO from '../components/seo/SEO';

const slugFrom = (url) => url?.split('/').at(-1);
const truncate = (s, n = 155) =>
  !s ? null : s.length > n ? s.slice(0, n).trim() + '…' : s;

const alignmentTheme = {
  Loyalist: {
    border: 'border-imperial-gold/40',
    badge: 'border-imperial-gold/60 text-imperial-gold',
    accent: 'bg-imperial-gold',
    label: 'text-imperial-gold/50',
  },
  Traitor: {
    border: 'border-red-800/40',
    badge: 'border-red-800/60 text-red-400',
    accent: 'bg-red-600',
    label: 'text-red-400/50',
  },
};

const fallback = {
  border: 'border-imperial-border',
  badge: 'border-imperial-border text-imperial-muted',
  accent: 'bg-imperial-muted',
  label: 'text-imperial-muted/50',
};

export default function PrimarchDetail() {
  const { slug } = useParams();
  const { data: primarch, isLoading, isError } = usePrimarch(slug);

  if (isLoading) return <><SEO /><Spinner /></>;
  if (isError) return <><SEO title="Primarch not found" noindex /><p className="text-imperial-muted">Primarch not found.</p></>;

  const books = primarch?.books ?? [];
  const t = alignmentTheme[primarch.alignment] ?? fallback;
  const seoTitle = primarch.legion ? `${primarch.name} — ${primarch.legion}` : primarch.name;
  const seoDescription =
    truncate(primarch.fate) ??
    `${primarch.name}${primarch.legion ? `, Primarch of the ${primarch.legion}` : ''}${
      primarch.alignment ? ` (${primarch.alignment})` : ''
    } — Warhammer 40k and Horus Heresy lore.`;

  const primarchUrl = `https://librarium40k.com/primarchs/${slug}`;
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: primarch.name,
      url: primarchUrl,
      ...(primarch.fate && { description: primarch.fate }),
      ...(primarch.image && { image: primarch.image }),
      ...(primarch.legion && {
        affiliation: { '@type': 'Organization', name: primarch.legion },
      }),
      additionalProperty: [
        ...(primarch.alignment ? [{ '@type': 'PropertyValue', name: 'alignment', value: primarch.alignment }] : []),
        ...(primarch.status ? [{ '@type': 'PropertyValue', name: 'status', value: primarch.status }] : []),
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Primarchs', item: 'https://librarium40k.com/primarchs' },
        { '@type': 'ListItem', position: 2, name: primarch.name, item: primarchUrl },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <SEO title={seoTitle} description={seoDescription} type="profile" image={primarch.image} jsonLd={jsonLd} />
      <BackButton />

      {/* Cinematic header */}
      <div className={`relative flex flex-col md:flex-row overflow-hidden rounded border ${t.border} bg-imperial-bg-mid mb-10`}>
        {/* Content — left */}
        <div className="flex flex-col justify-center px-8 py-10 md:py-16 md:w-1/2 gap-4 z-10">
          <p className={`text-xs tracking-widest uppercase font-serif ${t.label}`}>Primarch</p>
          <h1 className="text-4xl md:text-5xl leading-none tracking-wide">{primarch.name}</h1>
          {primarch.legion && (
            <p className="font-serif text-imperial-gold/70 text-xl tracking-wide">{primarch.legion}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className={`${t.accent} w-6 h-px`} />
            {primarch.alignment && (
              <span className={`text-xs px-2.5 py-1 rounded-full border ${t.badge}`}>
                {primarch.alignment}
              </span>
            )}
            {primarch.status && (
              <span className="text-xs px-2.5 py-1 rounded-full border border-imperial-border text-imperial-muted">
                {primarch.status}
              </span>
            )}
          </div>
          {primarch.fate && (
            <p className="text-sm text-imperial-muted/70 italic mt-2 leading-relaxed border-l-2 border-imperial-gold/20 pl-4">
              {primarch.fate}
            </p>
          )}
        </div>

        {/* Image — right */}
        <div className="md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[380px] overflow-hidden relative">
          {primarch.image ? (
            <img
              src={primarch.image}
              alt={primarch.name}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-imperial-muted text-sm bg-imperial-bg">
              No image
            </div>
          )}
          <div
            className="absolute inset-y-0 left-0 w-24 hidden md:block"
            style={{ background: 'linear-gradient(to right, #1a1c23, transparent)' }}
          />
        </div>
      </div>

      {books.length > 0 && (
        <section>
          <h2 className="text-2xl mb-4">Featured In</h2>
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
