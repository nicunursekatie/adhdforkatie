import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Sun, AlertTriangle, CalendarDays } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { getTasksDueToday, getOverdueTasks } from '../utils/taskFilters';
import { getTimeContext, formatTimeRemaining } from '../utils/timeAwareness';

export default function Dashboard() {
  const tasks = useStore((s) => s.tasks);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);

  const dueToday = useMemo(() => getTasksDueToday(tasks), [tasks]);
  const overdue = useMemo(() => getOverdueTasks(tasks), [tasks]);
  const timeCtx = useMemo(() => getTimeContext(tasks), [tasks]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold">{greeting} 👋</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Time-awareness banner — makes the invisible day visible. */}
      <div className="card overflow-hidden p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sun size={18} className="text-amber-500" />
            <span className="text-sm font-medium">
              {timeCtx.isUsingNextDay
                ? 'The day is winding down — planning into tomorrow'
                : `~${formatTimeRemaining(timeCtx.productiveHoursRemaining * 60)} of usable time left today`}
            </span>
          </div>
          <span className="text-xs text-gray-400">{Math.round(timeCtx.dayProgress * 100)}% of day</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
            style={{ width: `${Math.round(timeCtx.dayProgress * 100)}%` }}
          />
        </div>
        {timeCtx.nextDeadline && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Next deadline: <span className="font-medium">{timeCtx.nextDeadline.task.title}</span> in{' '}
            {formatTimeRemaining(timeCtx.nextDeadline.minutesUntil)}
          </p>
        )}
      </div>

      <QuickCapture />

      <Link
        to="/what-now"
        className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white shadow-sm transition hover:from-brand-700 hover:to-brand-600"
      >
        <span className="flex items-center gap-2 font-semibold">
          <Sparkles size={18} /> Not sure what to do? Ask "What Now?"
        </span>
        <span aria-hidden>→</span>
      </Link>

      {overdue.length > 0 && (
        <Section title="Overdue" icon={<AlertTriangle size={16} className="text-red-500" />} count={overdue.length}>
          {overdue.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} />
          ))}
        </Section>
      )}

      <Section title="Due today" icon={<CalendarDays size={16} className="text-brand-500" />} count={dueToday.length}>
        {dueToday.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Nothing due today. Breathe. 🌿
          </p>
        ) : (
          dueToday.map((t) => <TaskCard key={t.id} task={t} onEdit={setEditing} />)
        )}
      </Section>

      {editing !== undefined && <TaskFormModal task={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}

function Section({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        {icon} {title} <span className="text-gray-400">({count})</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
