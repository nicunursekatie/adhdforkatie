import { Check, Circle, Pencil, Trash2 } from 'lucide-react';
import { Task } from '../../types';
import { useStore } from '../../store/useStore';
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
