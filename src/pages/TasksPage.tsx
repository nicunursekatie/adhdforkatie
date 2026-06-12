import { useMemo, useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task, EnergyLevel } from '../types';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { SortBar } from '../components/tasks/SortBar';
import { SortMode, sortTasks, getFilteredCounts } from '../utils/taskPrioritization';
import { topLevelActive } from '../utils/taskFilters';

export default function TasksPage() {
  const tasks = useStore((s) => s.tasks);
  const [mode, setMode] = useState<SortMode>('smart');
  const [energy, setEnergy] = useState<EnergyLevel>('medium');
  const [showCompleted, setShowCompleted] = useState(false);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined); // undefined = closed

  const active = useMemo(() => topLevelActive(tasks), [tasks]);
  const sorted = useMemo(() => sortTasks(active, mode, energy), [active, mode, energy]);
  const counts = useMemo(() => getFilteredCounts(active, energy), [active, energy]);
  const completed = useMemo(
    () => tasks.filter((t) => t.completed && !t.archived && !t.deletedAt),
    [tasks]
  );

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {active.length} open · {counts.quickWins} quick wins
          </p>
        </div>
        <button
          onClick={() => setEditing(null)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New task
        </button>
      </header>

      <QuickCapture />

      <SortBar mode={mode} onModeChange={setMode} energy={energy} onEnergyChange={setEnergy} />

      {sorted.length === 0 ? (
        <EmptyState mode={mode} />
      ) : (
        <div className="space-y-2">
          {sorted.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={setEditing} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showCompleted ? 'Hide' : 'Show'} completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-2">
              {completed.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={setEditing} />
              ))}
            </div>
          )}
        </div>
      )}

      {editing !== undefined && <TaskFormModal task={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function EmptyState({ mode }: { mode: SortMode }) {
  const msg =
    mode === 'quickwins'
      ? 'No quick wins right now — try adding a short, low-stress task.'
      : mode === 'eatthefrog'
        ? 'No big/scary tasks flagged. Nice.'
        : mode === 'energymatch'
          ? 'Nothing matches that energy level. Try bumping it up, or add a task.'
          : 'Nothing here yet. Capture a thought above to get started.';
  return (
    <div className="card flex flex-col items-center gap-2 py-12 text-center">
      <ListChecks className="text-gray-300 dark:text-gray-600" size={32} />
      <p className="text-sm text-gray-500 dark:text-gray-400">{msg}</p>
    </div>
  );
}
