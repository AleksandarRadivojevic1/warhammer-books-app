import { useNavigate } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      className="text-imperial-muted hover:text-imperial-gold text-sm transition-colors mb-6 flex items-center gap-2"
    >
      ← Back
    </button>
  );
}
