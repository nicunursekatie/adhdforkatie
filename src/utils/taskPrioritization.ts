import { Task, EnergyLevel } from '../types';

// The six ADHD-aware sort modes. Each is an accommodation, not just a sort:
// they change *which* tasks are even shown so the list matches your capacity.
export type SortMode =
  | 'smart' // Composite score across urgency, priority, emotion, energy, deadline
  | 'energymatch' // Only tasks at or below your current energy
  | 'quickwins' // Short + low-stress tasks for momentum
  | 'eatthefrog' // The hard/important ones, for when you're charged up
  | 'deadline' // Pure urgency + due date
  | 'priority'; // Traditional high/medium/low

const urgencyScore = (u?: string): number =>
  ({ today: 4, week: 3, month: 2, someday: 1 } as Record<string, number>)[u ?? ''] ?? 2;

const priorityScore = (p?: string): number =>
  ({ urgent: 4, high: 3, medium: 2, low: 1 } as Record<string, number>)[p ?? ''] ?? 2;

const emotionalWeightScore = (e?: string): number =>
  ({ easy: 1, neutral: 2, stressful: 3, dreading: 4 } as Record<string, number>)[e ?? ''] ?? 2;

const energyRequiredScore = (e?: string): number =>
  ({ low: 1, medium: 2, high: 3 } as Record<string, number>)[e ?? ''] ?? 2;

// Overdue / due-today pressure.
const getTimeModifier = (task: Task): number => {
  if (!task.dueDate) return 0;
  const today = new Date();
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 10; // Overdue
  if (diffDays === 0) return 5; // Due today
  return 0;
};

// Smart score: higher urgency/priority raise it; lower emotional weight and
// lower energy required raise it (easier to *start*); quick wins get a bonus.
export const calculateSmartPriorityScore = (task: Task): number => {
  const urgency = urgencyScore(task.urgency);
  const priority = priorityScore(task.priority);
  const emotionalWeight = emotionalWeightScore(task.emotionalWeight);
  const energyRequired = energyRequiredScore(task.energyRequired);

  let score = urgency * 3 + priority * 2 + (5 - emotionalWeight) + (5 - energyRequired);
  score += getTimeModifier(task);
  if (task.estimatedMinutes && task.estimatedMinutes < 15) score += 2;
  return score;
};

export const sortTasks = (tasks: Task[], mode: SortMode, currentEnergy?: EnergyLevel): Task[] => {
  let filtered = [...tasks].filter((t) => !t.completed && !t.archived);

  switch (mode) {
    case 'smart':
      return filtered
        .map((task) => ({ ...task, smartPriorityScore: calculateSmartPriorityScore(task) }))
        .sort((a, b) => (b.smartPriorityScore || 0) - (a.smartPriorityScore || 0));

    case 'energymatch': {
      if (currentEnergy) {
        const levels = ['low', 'medium', 'high'];
        const cur = levels.indexOf(currentEnergy);
        filtered = filtered.filter(
          (t) => levels.indexOf(t.energyRequired || 'medium') <= cur
        );
      }
      return filtered.sort(
        (a, b) => emotionalWeightScore(a.emotionalWeight) - emotionalWeightScore(b.emotionalWeight)
      );
    }

    case 'quickwins':
      return filtered
        .filter((t) => {
          const timeOk = !t.estimatedMinutes || t.estimatedMinutes <= 30;
          const emotionalOk = emotionalWeightScore(t.emotionalWeight) <= 2;
          return timeOk && emotionalOk;
        })
        .sort((a, b) => (a.estimatedMinutes || 30) - (b.estimatedMinutes || 30));

    case 'eatthefrog':
      return filtered
        .filter(
          (t) => emotionalWeightScore(t.emotionalWeight) >= 3 || t.priority === 'high' || t.priority === 'urgent'
        )
        .sort((a, b) => urgencyScore(b.urgency) - urgencyScore(a.urgency));

    case 'deadline':
      return filtered.sort((a, b) => {
        const ua = urgencyScore(a.urgency);
        const ub = urgencyScore(b.urgency);
        if (ua !== ub) return ub - ua;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });

    case 'priority':
      return filtered.sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority));

    default:
      return filtered;
  }
};

// Human-readable reasons shown next to recommended tasks.
export const getTaskRecommendationReason = (
  task: Task,
  _mode: SortMode,
  currentEnergy?: EnergyLevel
): string[] => {
  const reasons: string[] = [];

  if (task.urgency === 'today') reasons.push('🔥 Due today');
  else if (task.urgency === 'week') reasons.push('📅 Due this week');

  if (task.emotionalWeight === 'easy') reasons.push('😊 Low emotional weight');
  else if (task.emotionalWeight === 'dreading') reasons.push('😱 Heavy — tackle when energized');

  if (currentEnergy && task.energyRequired) {
    const levels = ['low', 'medium', 'high'];
    if (levels.indexOf(task.energyRequired) <= levels.indexOf(currentEnergy))
      reasons.push('🔋 Matches your current energy');
    else reasons.push('⚡ Needs more energy than you have');
  }

  if (task.estimatedMinutes && task.estimatedMinutes <= 15) reasons.push('⚡ Quick win (under 15 min)');

  if (task.dueDate && new Date(task.dueDate) < new Date()) reasons.push('⏰ Overdue');

  return reasons;
};

export const getSortModeInfo = (mode: SortMode): { name: string; description: string } => {
  switch (mode) {
    case 'smart':
      return { name: 'Smart Sort', description: 'Best all-around order across urgency, priority, and how startable a task is' };
    case 'energymatch':
      return { name: 'Energy Match', description: 'Only tasks that match your current energy level' };
    case 'quickwins':
      return { name: 'Quick Wins', description: 'Short, low-stress tasks for building momentum' };
    case 'eatthefrog':
      return { name: 'Eat the Frog', description: 'The hardest / most important tasks, for when you have energy' };
    case 'deadline':
      return { name: 'Deadline Focus', description: 'Sorted purely by urgency and due dates' };
    case 'priority':
      return { name: 'Priority', description: 'Traditional high / medium / low sorting' };
  }
};

export const getFilteredCounts = (tasks: Task[], currentEnergy?: EnergyLevel) => {
  const active = tasks.filter((t) => !t.completed && !t.archived);
  const levels = ['low', 'medium', 'high'];
  return {
    quickWins: active.filter(
      (t) => (!t.estimatedMinutes || t.estimatedMinutes <= 30) && emotionalWeightScore(t.emotionalWeight) <= 2
    ).length,
    eatTheFrog: active.filter(
      (t) => emotionalWeightScore(t.emotionalWeight) >= 3 || t.priority === 'high' || t.priority === 'urgent'
    ).length,
    energyMatch: currentEnergy
      ? active.filter((t) => levels.indexOf(t.energyRequired || 'medium') <= levels.indexOf(currentEnergy)).length
      : active.length,
  };
};

export const getUrgencyEmoji = (u?: string): string =>
  ({ today: '🔥', tomorrow: '⏰', week: '📅', month: '📌', someday: '🌊' } as Record<string, string>)[u ?? ''] ?? '📌';

export const getEmotionalWeightEmoji = (w?: string): string =>
  ({ easy: '😊', neutral: '😐', stressful: '😰', dreading: '😱' } as Record<string, string>)[w ?? ''] ?? '😐';

export const getEnergyRequiredEmoji = (e?: string): string =>
  ({ low: '🔋', medium: '🔋🔋', high: '🔋🔋🔋' } as Record<string, string>)[e ?? ''] ?? '🔋🔋';
