export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      {icon && (
        <span className="text-imperial-gold/30">{icon}</span>
      )}
      <div>
        <p className="font-serif text-lg text-imperial-muted mb-1">{title}</p>
        {message && <p className="text-sm text-imperial-muted/60 max-w-xs mx-auto">{message}</p>}
      </div>
      {action}
    </div>
  );
}
