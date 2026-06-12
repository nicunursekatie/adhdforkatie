import { Timer, X, Coffee } from 'lucide-react';
import { useFocus } from '../../lib/focus';

function fmt(min: number): string {
  const m = Math.floor(min);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

// Floating bar shown while a focus session is running.
export function FocusBar() {
  const { session, elapsedMinutes, shouldSuggestBreak, stopFocus } = useFocus();
  if (!session) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-4 md:bottom-4">
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-white shadow-lg ${
          shouldSuggestBreak ? 'bg-amber-600' : 'bg-brand-600'
        }`}
      >
        {shouldSuggestBreak ? <Coffee size={18} /> : <Timer size={18} />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{session.taskTitle}</p>
          <p className="text-xs opacity-90">
            {shouldSuggestBreak
              ? `Focused ${fmt(elapsedMinutes)} — time for a break?`
              : `Focusing · ${fmt(elapsedMinutes)}`}
          </p>
        </div>
        <button
          onClick={stopFocus}
          className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold hover:bg-white/30"
        >
          Done
        </button>
        <button onClick={stopFocus} aria-label="Stop focus" className="text-white/80 hover:text-white">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
