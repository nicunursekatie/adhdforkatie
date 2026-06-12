import { Task } from '../types';

// ---------------------------------------------------------------------------
// Time-blindness support. Makes the invisible visible: how much of the
// productive day is left, what fraction of it a task would eat, and what's
// the next deadline bearing down. Ported from the original app's model of a
// long ADHD day (8 AM–2 AM) with break/transition overhead removed.
// ---------------------------------------------------------------------------

export interface TimeContext {
  currentTime: Date;
  dayProgress: number; // 0-1
  hoursRemaining: number;
  productiveHoursRemaining: number;
  isUsingNextDay: boolean;
  nextDeadline?: {
    task: Task;
    minutesUntil: number;
    urgency: 'safe' | 'warning' | 'urgent' | 'critical';
  };
}

export const getTimeContext = (tasks: Task[]): TimeContext => {
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(8, 0, 0, 0); // Productive day starts at 8 AM

  const endOfDay = new Date(now);
  if (now.getHours() >= 0 && now.getHours() < 8) {
    // Early morning — still inside yesterday's productive window.
    endOfDay.setHours(2, 0, 0, 0);
    startOfDay.setDate(startOfDay.getDate() - 1);
    startOfDay.setHours(8, 0, 0, 0);
  } else {
    // Day ends at 2 AM tomorrow.
    endOfDay.setDate(endOfDay.getDate() + 1);
    endOfDay.setHours(2, 0, 0, 0);
  }

  const totalDayMinutes = 18 * 60; // 8 AM -> 2 AM
  const minutesSinceStart = Math.max(0, (now.getTime() - startOfDay.getTime()) / (1000 * 60));
  const dayProgress = Math.min(1, minutesSinceStart / totalDayMinutes);

  const hoursRemaining = Math.max(0, (endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));

  // Near the end of the day, roll over to tomorrow's productive time.
  let effectiveHoursRemaining = hoursRemaining;
  let isUsingNextDay = false;
  if (hoursRemaining < 2) {
    effectiveHoursRemaining = 15; // tomorrow's productive hours (18 - 3 for breaks)
    isUsingNextDay = true;
  }

  const productiveHoursRemaining = !isUsingNextDay && effectiveHoursRemaining > 3
    ? effectiveHoursRemaining - 3 // subtract meals / breaks / transitions
    : isUsingNextDay
      ? effectiveHoursRemaining
      : Math.max(0, effectiveHoursRemaining * 0.7);

  const upcoming = tasks
    .filter((t) => t.dueDate && !t.completed && !t.archived)
    .map((task) => {
      const minutesUntil = (new Date(task.dueDate!).getTime() - now.getTime()) / (1000 * 60);
      let urgency: 'safe' | 'warning' | 'urgent' | 'critical' = 'safe';
      if (minutesUntil < 15) urgency = 'critical';
      else if (minutesUntil < 60) urgency = 'urgent';
      else if (minutesUntil < 180) urgency = 'warning';
      return { task, minutesUntil, urgency };
    })
    .sort((a, b) => a.minutesUntil - b.minutesUntil);

  return {
    currentTime: now,
    dayProgress,
    hoursRemaining,
    productiveHoursRemaining,
    isUsingNextDay,
    nextDeadline: upcoming[0],
  };
};

export const formatTimeRemaining = (minutes: number): string => {
  const abs = Math.abs(minutes);
  const overdue = minutes < 0;
  let s: string;
  if (abs < 60) s = `${Math.round(abs)}min`;
  else if (abs < 1440) {
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    s = m > 0 ? `${h}h ${m}min` : `${h}h`;
  } else {
    const d = Math.floor(abs / 1440);
    const h = Math.floor((abs % 1440) / 60);
    s = h > 0 ? `${d}d ${h}h` : `${d}d`;
  }
  return overdue ? `${s} ago` : s;
};

// What fraction of the remaining productive day a task would consume.
export const getDayFractionForTask = (task: Task, ctx: TimeContext, fallbackMinutes = 30): number => {
  const minutes = task.estimatedMinutes || fallbackMinutes;
  const hours = minutes / 60;
  if (ctx.productiveHoursRemaining <= 0.1) return hours > 0.1 ? 1 : 0;
  return Math.min(hours / ctx.productiveHoursRemaining, 1);
};
