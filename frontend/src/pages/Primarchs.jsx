import { useState } from 'react';
import { usePrimarchs } from '../hooks/usePrimarchs';
import PrimarchCard from '../components/ui/PrimarchCard';
import Spinner from '../components/ui/Spinner';

const ALIGNMENTS = ['', 'Loyalist', 'Traitor'];

export default function Primarchs() {
  const [alignment, setAlignment] = useState('');
  const { data, isLoading } = usePrimarchs(alignment ? { alignment } : {});
  const primarchs = data?.results ?? [];

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {primarchs.map((p) => (
          <PrimarchCard key={p.slug} primarch={p} />
        ))}
      </div>
    </div>
  );
}
