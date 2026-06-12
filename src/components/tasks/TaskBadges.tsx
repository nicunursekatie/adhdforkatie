import { Clock } from 'lucide-react';
import { Task } from '../../types';
import {
  getEmotionalWeightEmoji,
  getEnergyRequiredEmoji,
  getUrgencyEmoji,
} from '../../utils/taskPrioritization';
import { getDueDateStatus } from '../../utils/dateUtils';

function formatMinutes(min?: number): string | null {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const pill =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium';

// The visible "shape" of a task: energy, emotion, time, urgency, due date.
// These are what make capacity-aware decisions possible at a glance.
export function TaskBadges({ task }: { task: Task }) {
  const time = formatMinutes(task.estimatedMinutes);
  const due = getDueDateStatus(task.dueDate);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {due && (
        <span className={`${pill} bg-gray-100 dark:bg-gray-800 ${due.className}`}>{due.text}</span>
      )}
      {task.urgency && (
        <span className={`${pill} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
          {getUrgencyEmoji(task.urgency)} {task.urgency}
        </span>
      )}
      {time && (
        <span className={`${pill} bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300`}>
          <Clock size={11} /> {time}
        </span>
      )}
      {task.energyRequired && (
        <span
          className={`${pill} bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300`}
          title={`${task.energyRequired} energy`}
        >
          {getEnergyRequiredEmoji(task.energyRequired)}
        </span>
      )}
      {task.emotionalWeight && task.emotionalWeight !== 'neutral' && (
        <span
          className={`${pill} bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300`}
          title={`feels: ${task.emotionalWeight}`}
        >
          {getEmotionalWeightEmoji(task.emotionalWeight)} {task.emotionalWeight}
        </span>
      )}
    </div>
  );
}
