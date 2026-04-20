export default function Spinner() {
  return (
    <div className="flex flex-col justify-center items-center py-20 gap-4">
      <div className="relative w-12 h-12">
        {/* Outer ring — slow pulse */}
        <div className="absolute inset-0 rounded-full border border-imperial-gold/20 animate-ping" />
        {/* Spinning arc */}
        <div className="absolute inset-0 rounded-full border-2 border-imperial-gold/10 border-t-imperial-gold animate-spin" />
        {/* Inner dot */}
        <div className="absolute inset-[18px] rounded-full bg-imperial-gold/60" />
      </div>
      <p className="font-serif text-xs text-imperial-gold/50 tracking-[0.3em] uppercase animate-pulse">
        Loading
      </p>
    </div>
  );
}
