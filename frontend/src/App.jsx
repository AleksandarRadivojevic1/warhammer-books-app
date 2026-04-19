export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <span className="label">Warhammer 40,000</span>
      <h1 className="text-4xl font-bold">Warhammer Library</h1>
      <p className="text-imperial-muted text-sm">Dan Abnett · Horus Heresy</p>
      <div className="flex gap-3">
        <button className="btn-gold">View Series</button>
        <button className="btn-outline">Filter ▾</button>
      </div>
      <div className="card p-4 w-64">
        <div className="label mb-2">Books</div>
        <p className="text-imperial-light font-bold">Prospero Burns</p>
        <p className="text-imperial-muted text-xs mt-1">Dan Abnett · Horus Heresy</p>
      </div>
    </div>
  );
}
