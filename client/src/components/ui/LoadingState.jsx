import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...', fullPage = false }) {
  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 size={28} className="text-brand-500 animate-spin" />
        <p className="text-surface-500 text-sm">{message}</p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-12 gap-2 text-surface-400">
      <Loader2 size={20} className="animate-spin" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
