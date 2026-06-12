import { Check, Circle, Pencil, Trash2, Timer } from 'lucide-react';
import { Task } from '../../types';
import { useStore } from '../../store/useStore';
import { useFocus } from '../../lib/focus';
import { TaskBadges } from './TaskBadges';
import { cn } from '../../utils/cn';

interface Props {
  task: Task;
  onEdit?: (task: Task) => void;
  reasons?: string[]; // optional "why this task" hints (used by What Now)
}

export function TaskCard({ task, onEdit, reasons }: Props) {
  const toggleComplete = useStore((s) => s.toggleComplete);
  const deleteTask = useStore((s) => s.deleteTask);
  const projects = useStore((s) => s.projects);
  const categories = useStore((s) => s.categories);
  const { session, startFocus, stopFocus, wouldWarnSwitch } = useFocus();
  const isFocused = session?.taskId === task.id;

  const handleFocus = () => {
    if (isFocused) {
      stopFocus();
      return;
    }
    if (
      wouldWarnSwitch(task.id) &&
      !window.confirm("You just started another task less than 3 minutes ago. Switching this fast is a classic ADHD trap — switch anyway?")
    ) {
      return;
    }
    startFocus(task.id, task.title);
  };

  const allTasks = useStore((s) => s.tasks);
  const subtasks = allTasks.filter((t) => t.parentTaskId === task.id && !t.deletedAt);
  const doneSubtasks = subtasks.filter((t) => t.completed).length;

  const project = task.projectId ? projects.find((p) => p.id === task.projectId) : null;
  const taskCategories = categories.filter((c) => task.categoryIds.includes(c.id));

  return (
    <div className="card group flex gap-3 p-3">
      <button
        onClick={() => toggleComplete(task.id)}
        aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
        className={cn(
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition',
          task.completed
            ? 'border-brand-600 bg-brand-600 text-white'
            : 'border-gray-300 text-transparent hover:border-brand-500 dark:border-gray-600'
        )}
      >
        {task.completed ? <Check size={13} /> : <Circle size={13} />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium leading-snug',
            task.completed && 'text-gray-400 line-through dark:text-gray-600'
          )}
        >
          {task.title}
        </p>

        {task.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
            {task.description}
          </p>
        )}

        {(project || taskCategories.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {project && (
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.color }} />
                {project.name}
              </span>
            )}
            {taskCategories.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        )}

        {!task.completed && <TaskBadges task={task} />}

        {subtasks.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${(doneSubtasks / subtasks.length) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400">{doneSubtasks}/{subtasks.length} subtasks</span>
          </div>
        )}

        {reasons && reasons.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-brand-600 dark:text-brand-400">
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-start gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        {!task.completed && (
          <button
            onClick={handleFocus}
            aria-label={isFocused ? 'Stop focus' : 'Focus on this task'}
            className={cn(
              'rounded-md p-1.5',
              isFocused
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800'
            )}
          >
            <Timer size={15} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <Pencil size={15} />
          </button>
        )}
        <button
          onClick={() => deleteTask(task.id)}
          aria-label="Delete task"
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
