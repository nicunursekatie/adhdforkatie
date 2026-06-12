import { useMemo } from 'react';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatDateForDisplay } from '../utils/dateUtils';

export default function DeletedTasksPage() {
  const tasks = useStore((s) => s.tasks);
  const restoreTask = useStore((s) => s.restoreTask);
  const purgeTask = useStore((s) => s.purgeTask);

  const deleted = useMemo(
    () => tasks.filter((t) => t.deletedAt).sort((a, b) => (b.deletedAt! > a.deletedAt! ? 1 : -1)),
    [tasks]
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">Deleted tasks</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nothing's gone for good until you say so. Restore anything you deleted by accident.
        </p>
      </header>

      {deleted.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <Trash2 className="text-gray-300 dark:text-gray-600" size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">The bin is empty.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {deleted.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-500 line-through dark:text-gray-400">{t.title}</p>
                <p className="text-xs text-gray-400">deleted {formatDateForDisplay(t.deletedAt)}</p>
              </div>
              <button onClick={() => restoreTask(t.id)} className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-300">
                <RotateCcw size={13} /> Restore
              </button>
              <button
                onClick={() => window.confirm('Permanently delete this task? This cannot be undone.') && purgeTask(t.id)}
                aria-label="Delete forever"
                className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
