import { useStore } from './useStore';
import { getTodayString, getTomorrowString } from '../utils/dateUtils';

// A small, friendly starting set so a brand-new user sees how the ADHD-aware
// fields shape the views — rather than an intimidating blank screen.
export function seedSampleData() {
  const store = useStore.getState();
  if (store.hasSeededSampleData) return;

  const work = store.addCategory({ name: 'Work', color: '#3b82f6' });
  const home = store.addCategory({ name: 'Home', color: '#10b981' });
  store.addCategory({ name: 'Personal', color: '#f59e0b' });

  const project = store.addProject({
    name: 'Get organized',
    description: 'Starter project to play with',
    color: '#6366f1',
  });

  store.addTask({
    title: 'Reply to that one email',
    categoryIds: [work.id],
    estimatedMinutes: 10,
    energyRequired: 'low',
    emotionalWeight: 'neutral',
    urgency: 'today',
    priority: 'medium',
    dueDate: getTodayString(),
  });

  store.addTask({
    title: 'Book dentist appointment',
    categoryIds: [home.id],
    estimatedMinutes: 15,
    energyRequired: 'medium',
    emotionalWeight: 'dreading',
    urgency: 'week',
    priority: 'high',
  });

  store.addTask({
    title: 'Tidy the kitchen counter',
    categoryIds: [home.id],
    estimatedMinutes: 20,
    energyRequired: 'low',
    emotionalWeight: 'easy',
    urgency: 'someday',
  });

  store.addTask({
    title: 'Draft the quarterly report',
    projectId: project.id,
    categoryIds: [work.id],
    estimatedMinutes: 120,
    energyRequired: 'high',
    emotionalWeight: 'stressful',
    urgency: 'tomorrow',
    priority: 'high',
    dueDate: getTomorrowString(),
  });

  store.markSeeded();
}
