const ERAS = [
  'Horus Heresy',
  '32nd Millennium',
  '41st Millennium',
  '42nd Millennium',
  'Age of Sigmar',
  'Old World',
];

export default function FilterSidebar({ filters, onChange }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value, page: 1 });

  return (
    <aside className="w-full md:w-56 shrink-0 flex flex-col gap-4">
      <div>
        <label className="label block mb-1">Search</label>
        <input
          className="input"
          placeholder="Title or keyword..."
          value={filters.search ?? ''}
          onChange={handle('search')}
        />
      </div>

      <div>
        <label className="label block mb-1">Era</label>
        <select className="input" value={filters.era ?? ''} onChange={handle('era')}>
          <option value="">All eras</option>
          {ERAS.map((era) => (
            <option key={era} value={era}>{era}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label block mb-1">Sort by</label>
        <select className="input" value={filters.sort ?? ''} onChange={handle('sort')}>
          <option value="">Order in series</option>
          <option value="title">Title</option>
          <option value="pages">Pages</option>
        </select>
      </div>

      <button className="btn-outline text-sm mt-2" onClick={() => onChange({ page: 1 })}>
        Clear filters
      </button>
    </aside>
  );
}
