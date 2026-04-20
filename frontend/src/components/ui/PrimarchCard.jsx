import { Link } from 'react-router-dom';

const alignmentStyle = {
  Loyalist: 'border-imperial-gold/60 text-imperial-gold',
  Traitor:  'border-red-800/60 text-red-400',
};

export default function PrimarchCard({ primarch }) {
  const style = alignmentStyle[primarch.alignment] ?? 'border-imperial-border text-imperial-muted';

  return (
    <Link to={`/primarchs/${primarch.slug}`} className={`card flex flex-col border ${style} group overflow-hidden`}>
      <div className="aspect-[3/2] bg-imperial-bg-mid overflow-hidden">
        {primarch.image ? (
          <img
            src={primarch.image}
            alt={primarch.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-imperial-muted text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight">{primarch.name}</h3>
          <span className={`text-xs shrink-0 px-2 py-0.5 rounded-full border ${style}`}>
            {primarch.alignment ?? 'Unknown'}
          </span>
        </div>
        {primarch.legion && (
          <p className="text-sm text-imperial-muted">{primarch.legion}</p>
        )}
        {primarch.status && (
          <p className="text-xs text-imperial-muted opacity-70">{primarch.status}</p>
        )}
      </div>
    </Link>
  );
}
