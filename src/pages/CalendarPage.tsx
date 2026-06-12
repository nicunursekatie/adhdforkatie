import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { topLevelActive } from '../utils/taskFilters';
import { cn } from '../utils/cn';

export default function CalendarPage() {
  const tasks = useStore((s) => s.tasks);
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);

  const byDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of topLevelActive(tasks)) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    }
    return map;
  }, [tasks]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor));
    const end = endOfWeek(endOfMonth(cursor));
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedTasks = byDate.get(selected) ?? [];

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Calendar</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month" className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft size={18} /></button>
          <span className="min-w-[9rem] text-center text-sm font-medium">{format(cursor, 'MMMM yyyy')}</span>
          <button onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month" className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight size={18} /></button>
        </div>
      </header>

      <div className="card p-2">
        <div className="grid grid-cols-7 gap-1 px-1 pb-1 text-center text-[10px] font-semibold uppercase text-gray-400">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayTasks = byDate.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const isToday = isSameDay(day, new Date());
            const isSelected = key === selected;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  'flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-xs transition',
                  !inMonth && 'text-gray-300 dark:text-gray-700',
                  isSelected ? 'bg-brand-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800',
                  isToday && !isSelected && 'ring-1 ring-brand-400'
                )}
              >
                <span className={cn('font-medium', isToday && !isSelected && 'text-brand-600 dark:text-brand-400')}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold',
                      isSelected ? 'bg-white/25 text-white' : 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                    )}
                  >
                    {dayTasks.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {format(new Date(selected + 'T00:00:00'), 'EEEE, MMM d')} · {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'}
        </h2>
        {selectedTasks.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Nothing due this day.</p>
        ) : (
          <div className="space-y-2">
            {selectedTasks.map((t) => (
              <TaskCard key={t.id} task={t} onEdit={setEditing} />
            ))}
          </div>
        )}
      </div>

      {editing !== undefined && <TaskFormModal task={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
