import { useMemo, useState } from 'react';
import { HeartHandshake, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { getTomorrowString, getDaysBetween, getTodayString, isPastDate, formatDateForDisplay } from '../utils/dateUtils';
import { topLevelActive } from '../utils/taskFilters';

type ActionKind = 'complete' | 'reschedule' | 'abandon' | 'blocked' | 'breakdown';

interface Reason {
  label: string;
  emoji: string;
  action: ActionKind;
}

// Reasons are framed as data for better planning — never as failure.
const REASONS: Reason[] = [
  { label: 'I actually did it', emoji: '✅', action: 'complete' },
  { label: 'I forgot', emoji: '🧠', action: 'reschedule' },
  { label: 'Ran out of time', emoji: '⏰', action: 'reschedule' },
  { label: 'Felt overwhelming', emoji: '😮‍💨', action: 'breakdown' },
  { label: 'Too vague / complex', emoji: '🌫️', action: 'breakdown' },
  { label: 'Waiting on someone', emoji: '⏳', action: 'blocked' },
  { label: 'No longer relevant', emoji: '🗑️', action: 'abandon' },
];

export default function AccountabilityPage() {
  const tasks = useStore((s) => s.tasks);
  const toggleComplete = useStore((s) => s.toggleComplete);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const addAccountabilityResponse = useStore((s) => s.addAccountabilityResponse);

  const [handled, setHandled] = useState<Set<string>>(new Set());

  // Overdue (within the last week) + all incomplete undated tasks — so things
  // don't silently vanish just because they lacked a date.
  const needsReview = useMemo(() => {
    const today = getTodayString();
    return topLevelActive(tasks).filter((t) => {
      if (handled.has(t.id)) return false;
      if (!t.dueDate) return true; // undated, still open
      if (!isPastDate(t.dueDate)) return false;
      const daysAgo = getDaysBetween(t.dueDate, today);
      return daysAgo !== null && daysAgo >= 0 && daysAgo <= 7;
    });
  }, [tasks, handled]);

  const respond = (task: Task, reason: Reason) => {
    switch (reason.action) {
      case 'complete':
        toggleComplete(task.id);
        break;
      case 'reschedule':
        updateTask(task.id, { dueDate: getTomorrowString() });
        break;
      case 'abandon':
        deleteTask(task.id);
        break;
      case 'blocked':
        updateTask(task.id, { urgency: 'someday' });
        break;
      case 'breakdown':
        // Keep it visible but ease the pressure; the Break-it-down tool is one tap away.
        updateTask(task.id, { dueDate: getTomorrowString(), emotionalWeight: 'stressful' });
        break;
    }
    addAccountabilityResponse({ taskId: task.id, reason: reason.label, action: reason.action });
    setHandled((h) => new Set(h).add(task.id));
  };

  return (
    <div className="space-y-5">
      <header className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <HeartHandshake size={24} />
        </div>
        <h1 className="text-xl font-bold">Gentle check-in</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          These slipped past or never had a date. No guilt — just tell the truth about what happened, and we'll
          handle it. Missed tasks are data, not failure.
        </p>
      </header>

      {needsReview.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <CheckCircle2 className="text-green-500" size={36} />
          <p className="text-sm font-medium">All clear — nothing needs a check-in.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Come back anytime overdue or undated tasks pile up.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {needsReview.map((task) => (
            <div key={task.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{task.title}</p>
                {task.dueDate && (
                  <span className="shrink-0 text-xs text-red-600">due {formatDateForDisplay(task.dueDate)}</span>
                )}
              </div>
              <p className="mt-2 mb-1.5 text-xs text-gray-500 dark:text-gray-400">What happened?</p>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => respond(task, r)}
                    className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-brand-500/10"
                  >
                    {r.emoji} {r.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
