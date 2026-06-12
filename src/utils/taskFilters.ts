import { Task, WhatNowCriteria } from '../types';
import { isToday, isPastDate } from './dateUtils';
import { sortTasks } from './taskPrioritization';

// Top-level (non-subtask), active tasks.
export const topLevelActive = (tasks: Task[]): Task[] =>
  tasks.filter((t) => !t.completed && !t.archived && !t.deletedAt && !t.parentTaskId);

export const getSubtasks = (tasks: Task[], parentId: string): Task[] =>
  tasks.filter((t) => t.parentTaskId === parentId && !t.deletedAt);

export const getTasksDueToday = (tasks: Task[]): Task[] =>
  topLevelActive(tasks).filter((t) => t.dueDate && isToday(t.dueDate));

export const getOverdueTasks = (tasks: Task[]): Task[] =>
  topLevelActive(tasks).filter((t) => t.dueDate && isPastDate(t.dueDate));

// Available to start = no start date, or its start date has arrived.
export const getActionableTasks = (tasks: Task[]): Task[] =>
  topLevelActive(tasks).filter((t) => !t.startDate || isPastDate(t.startDate) || isToday(t.startDate));

// "What Now?" recommendation engine: filter by available time, then smart-sort
// against current energy, and return the top few so the choice is made *for* you.
export const recommendTasks = (tasks: Task[], criteria: WhatNowCriteria, limit = 5): Task[] => {
  let filtered = getActionableTasks(tasks);

  if (criteria.availableTime === 'short') {
    filtered = filtered.filter((t) => !t.estimatedMinutes || t.estimatedMinutes <= 30);
  } else if (criteria.availableTime === 'medium') {
    filtered = filtered.filter((t) => !t.estimatedMinutes || t.estimatedMinutes <= 120);
  }

  return sortTasks(filtered, 'smart', criteria.energyLevel).slice(0, limit);
};
