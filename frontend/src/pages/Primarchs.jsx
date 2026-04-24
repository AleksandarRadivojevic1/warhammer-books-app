import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePrimarchs } from '../hooks/usePrimarchs';
import PrimarchCard from '../components/ui/PrimarchCard';
import Spinner from '../components/ui/Spinner';
import SEO from '../components/seo/SEO';

const ALIGNMENTS = ['', 'Loyalist', 'Traitor'];

const theme = {
  Loyalist: {
    border: 'border-imperial-gold/40',
    badge: 'border-imperial-gold/60 text-imperial-gold',
    accent: 'bg-imperial-gold',
    gradient: 'from-imperial-gold/20 to-transparent',
    label: 'text-imperial-gold/50',
  },
  Traitor: {
    border: 'border-red-800/40',
    badge: 'border-red-800/60 text-red-400',
    accent: 'bg-red-600',
    gradient: 'from-red-900/30 to-transparent',
    label: 'text-red-400/50',
  },
};

const fallbackTheme = {
  border: 'border-imperial-border',
  badge: 'border-imperial-border text-imperial-muted',
  accent: 'bg-imperial-muted',
  gradient: 'from-imperial-bg to-transparent',
  label: 'text-imperial-muted/50',
};

// Full-width hero — used when a single alignment is filtered
function HeroPrimarch({ primarch }) {
  const t = theme[primarch.alignment] ?? fallbackTheme;

  return (
    <Link
      to={`/primarchs/${primarch.slug}`}
      className={`group relative flex flex-col md:flex-row overflow-hidden rounded border ${t.border} bg-imperial-bg-mid mb-8 animate-fade-in`}
    >
      <div className="flex flex-col justify-center px-8 py-10 md:py-14 md:w-1/2 gap-4 z-10">
        <p className={`text-xs tracking-widest uppercase font-serif ${t.label}`}>Primarch</p>
        <h2 className="text-4xl md:text-5xl leading-none tracking-wide">{primarch.name}</h2>
        {primarch.legion && (
          <p className="font-serif text-imperial-gold/70 text-lg tracking-wide">{primarch.legion}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className={`${t.accent} w-6 h-px`} />
          <span className={`text-xs px-2.5 py-1 rounded-full border ${t.badge}`}>
            {primarch.alignment ?? 'Unknown'}
          </span>
          {primarch.status && (
            <span className="text-xs text-imperial-muted opacity-70">{primarch.status}</span>
          )}
        </div>
        <p className="text-sm text-imperial-muted/60 mt-2 group-hover:text-imperial-muted transition-colors">
          View details →
        </p>
      </div>

      <div className="md:w-1/2 aspect-[4/3] md:aspect-auto md:min-h-[340px] overflow-hidden relative">
        {primarch.image ? (
          <img
            src={primarch.image}
            alt={primarch.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
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
    </Link>
  );
}

// Half-width portrait hero — used in the face-off dual layout
function FaceoffHero({ primarch }) {
  const t = theme[primarch.alignment] ?? fallbackTheme;

  return (
    <Link
      to={`/primarchs/${primarch.slug}`}
      className={`group relative flex-1 overflow-hidden rounded border ${t.border} bg-imperial-bg-mid min-h-[360px] flex flex-col animate-fade-in`}
    >
      {/* Image fills card */}
      <div className="flex-1 overflow-hidden relative">
        {primarch.image ? (
          <img
            src={primarch.image}
            alt={primarch.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            style={{ minHeight: '260px' }}
          />
        ) : (
          <div className="w-full h-full min-h-[260px] flex items-center justify-center text-imperial-muted text-sm bg-imperial-bg">
            No image
          </div>
        )}
        {/* Bottom gradient overlay — strong dark fade for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-3/4" style={{ background: 'linear-gradient(to top, #0d0f14 0%, #0d0f14cc 40%, transparent 100%)' }} />
      </div>

      {/* Text overlaid at bottom */}
      <div className="relative px-6 pb-6 pt-2 -mt-20 z-10 flex flex-col gap-1.5">
        <p className={`text-xs tracking-widest uppercase font-serif ${t.label}`}>{primarch.alignment}</p>
        <h2 className="text-2xl leading-tight tracking-wide text-imperial-light drop-shadow-lg">{primarch.name}</h2>
        {primarch.legion && (
          <p className="text-sm font-serif text-imperial-light/70">{primarch.legion}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={`${t.accent} w-4 h-px`} />
          {primarch.status && (
            <span className="text-xs text-imperial-light/50">{primarch.status}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function Primarchs() {
  const [alignment, setAlignment] = useState('');
  const { data, isLoading } = usePrimarchs(alignment ? { alignment } : {});
  const primarchs = data?.results ?? [];

  if (isLoading) return <Spinner />;

  const isAll = alignment === '';
  const loyalistHero = isAll ? primarchs.find((p) => p.alignment === 'Loyalist') : null;
  const traitorHero  = isAll ? primarchs.find((p) => p.alignment === 'Traitor')  : null;
  const heroSlugs = new Set([loyalistHero?.slug, traitorHero?.slug].filter(Boolean));

  const [singleHero, ...rest] = isAll ? [] : primarchs;
  const gridPrimarchs = isAll
    ? primarchs.filter((p) => !heroSlugs.has(p.slug))
    : rest;

  return (
    <div>
      <SEO
        title="The Primarchs"
        description="The twenty Primarchs of the Emperor's legions — their legions, alignments, and fates across the Horus Heresy and the 41st Millennium."
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-3xl">Primarchs</h1>
        <div className="flex gap-2">
          {ALIGNMENTS.map((a) => (
            <button
              key={a || 'all'}
              onClick={() => setAlignment(a)}
              className={alignment === a ? 'btn-gold text-sm px-4 py-1.5' : 'btn-outline text-sm px-4 py-1.5'}
            >
              {a || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Dual face-off heroes — All view */}
      {isAll && (loyalistHero || traitorHero) && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {loyalistHero && <FaceoffHero primarch={loyalistHero} />}
          {traitorHero  && <FaceoffHero primarch={traitorHero}  />}
        </div>
      )}

      {/* Single full-width hero — filtered view */}
      {!isAll && singleHero && <HeroPrimarch primarch={singleHero} />}

      {gridPrimarchs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {gridPrimarchs.map((p, i) => (
            <div
              key={p.slug}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <PrimarchCard primarch={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
