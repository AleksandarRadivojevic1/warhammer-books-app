const ERAS = [
  'Horus Heresy',
  '32nd Millennium',
  '41st Millennium',
  '42nd Millennium',
  'Age of Sigmar',
  'Old World',
];

function Select({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        className="input appearance-none pr-8 cursor-pointer font-serif text-imperial-gold"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-imperial-muted text-xs">
        ▾
      </span>
    </div>
  );
}

export default function FilterSidebar({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });

  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col gap-4">
      <div>
        <label className="label block mb-1">Search</label>
        <input
          className="input font-serif text-imperial-gold placeholder:text-imperial-gold/30"
          placeholder="Title or keyword..."
          value={filters.search ?? ''}
          onChange={handle('search')}
        />
      </div>

      <div>
        <label className="label block mb-1">Era</label>
        <Select value={filters.era ?? ''} onChange={handle('era')}>
          <option value="">All eras</option>
          {ERAS.map((era) => (
            <option key={era} value={era}>{era}</option>
          ))}
        </Select>
      </div>

      <div>
        <label className="label block mb-1">Sort by</label>
        <Select value={filters.sort ?? ''} onChange={handle('sort')}>
          <option value="">Default</option>
          <option value="title">Title</option>
          <option value="pages">Pages</option>
        </Select>
      </div>

      <button className="btn-outline text-sm mt-2" onClick={() => onChange({ page: 1 })}>
        Clear filters
      </button>
    </aside>
  );
}
