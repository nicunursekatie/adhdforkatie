import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Task,
  Project,
  Category,
  DailyPlan,
  TimeBlock,
  JournalEntry,
  AccountabilityResponse,
  AppSettings,
  DEFAULT_SETTINGS,
} from '../types';
import { idbStorage } from './storage';
import { getTodayString } from '../utils/dateUtils';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export type NewTask = Partial<Task> & { title: string };

interface AppState {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  dailyPlans: DailyPlan[];
  journalEntries: JournalEntry[];
  accountabilityResponses: AccountabilityResponse[];
  settings: AppSettings;
  hasSeededSampleData: boolean;

  // Tasks
  addTask: (task: NewTask) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void; // soft delete
  restoreTask: (id: string) => void;
  purgeTask: (id: string) => void; // permanent
  archiveTask: (id: string) => void;

  // Projects
  addProject: (project: Partial<Project> & { name: string }) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Categories
  addCategory: (category: Partial<Category> & { name: string }) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Daily plans / time blocks
  getDailyPlan: (date: string) => DailyPlan;
  addTimeBlock: (date: string, block: Omit<TimeBlock, 'id'>) => void;
  updateTimeBlock: (date: string, blockId: string, updates: Partial<TimeBlock>) => void;
  deleteTimeBlock: (date: string, blockId: string) => void;
  assignTaskToBlock: (date: string, blockId: string, taskId: string) => void;
  unassignTaskFromBlock: (date: string, blockId: string, taskId: string) => void;

  // Journal / accountability
  addJournalEntry: (entry: Partial<JournalEntry> & { content: string }) => void;
  addAccountabilityResponse: (resp: Omit<AccountabilityResponse, 'id' | 'createdAt'>) => void;

  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Bulk / data management
  importData: (data: Partial<AppState>) => void;
  markSeeded: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      categories: [],
      dailyPlans: [],
      journalEntries: [],
      accountabilityResponses: [],
      settings: DEFAULT_SETTINGS,
      hasSeededSampleData: false,

      addTask: (task) => {
        const newTask: Task = {
          id: id(),
          title: task.title.trim(),
          description: task.description ?? '',
          completed: false,
          archived: false,
          dueDate: task.dueDate ?? null,
          startDate: task.startDate ?? null,
          projectId: task.projectId ?? null,
          categoryIds: task.categoryIds ?? [],
          parentTaskId: task.parentTaskId ?? null,
          priority: task.priority,
          size: task.size,
          estimatedMinutes: task.estimatedMinutes,
          urgency: task.urgency,
          importance: task.importance,
          emotionalWeight: task.emotionalWeight,
          energyRequired: task.energyRequired,
          actualMinutesSpent: task.actualMinutesSpent ?? null,
          braindumpSource: task.braindumpSource,
          aiProcessed: task.aiProcessed,
          deletedAt: null,
          createdAt: now(),
          updatedAt: now(),
          completedAt: null,
          dependsOn: task.dependsOn ?? [],
        };
        set((s) => ({ tasks: [newTask, ...s.tasks] }));
        return newTask;
      },

      updateTask: (taskId, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates, updatedAt: now() } : t
          ),
        })),

      toggleComplete: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? now() : null,
                  updatedAt: now(),
                }
              : t
          ),
        })),

      deleteTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, deletedAt: now(), updatedAt: now() } : t
          ),
        })),

      restoreTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, deletedAt: null, updatedAt: now() } : t
          ),
        })),

      purgeTask: (taskId) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId && t.parentTaskId !== taskId) })),

      archiveTask: (taskId) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, archived: true, updatedAt: now() } : t
          ),
        })),

      addProject: (project) => {
        const newProject: Project = {
          id: id(),
          name: project.name.trim(),
          description: project.description ?? '',
          color: project.color ?? '#6366f1',
          order: project.order,
          completed: false,
          archived: false,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ projects: [...s.projects, newProject] }));
        return newProject;
      },

      updateProject: (projectId, updates) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: now() } : p
          ),
        })),

      deleteProject: (projectId) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          // Detach tasks rather than deleting them — losing tasks feels punishing.
          tasks: s.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: null } : t)),
        })),

      addCategory: (category) => {
        const newCategory: Category = {
          id: id(),
          name: category.name.trim(),
          color: category.color ?? '#10b981',
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ categories: [...s.categories, newCategory] }));
        return newCategory;
      },

      updateCategory: (categoryId, updates) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === categoryId ? { ...c, ...updates, updatedAt: now() } : c
          ),
        })),

      deleteCategory: (categoryId) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== categoryId),
          tasks: s.tasks.map((t) => ({
            ...t,
            categoryIds: t.categoryIds.filter((cid) => cid !== categoryId),
          })),
        })),

      getDailyPlan: (date) => {
        const existing = get().dailyPlans.find((p) => p.date === date);
        if (existing) return existing;
        const plan: DailyPlan = { id: id(), date, timeBlocks: [] };
        set((s) => ({ dailyPlans: [...s.dailyPlans, plan] }));
        return plan;
      },

      addTimeBlock: (date, block) =>
        set((s) => {
          const plans = ensurePlan(s.dailyPlans, date);
          return {
            dailyPlans: plans.map((p) =>
              p.date === date ? { ...p, timeBlocks: [...p.timeBlocks, { ...block, id: id() }] } : p
            ),
          };
        }),

      updateTimeBlock: (date, blockId, updates) =>
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date
              ? { ...p, timeBlocks: p.timeBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)) }
              : p
          ),
        })),

      deleteTimeBlock: (date, blockId) =>
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date ? { ...p, timeBlocks: p.timeBlocks.filter((b) => b.id !== blockId) } : p
          ),
        })),

      assignTaskToBlock: (date, blockId, taskId) =>
        set((s) => {
          const plans = ensurePlan(s.dailyPlans, date);
          return {
            dailyPlans: plans.map((p) =>
              p.date === date
                ? {
                    ...p,
                    timeBlocks: p.timeBlocks.map((b) =>
                      b.id === blockId && !b.taskIds.includes(taskId)
                        ? { ...b, taskIds: [...b.taskIds, taskId] }
                        : b
                    ),
                  }
                : p
            ),
          };
        }),

      unassignTaskFromBlock: (date, blockId, taskId) =>
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date
              ? {
                  ...p,
                  timeBlocks: p.timeBlocks.map((b) =>
                    b.id === blockId ? { ...b, taskIds: b.taskIds.filter((t) => t !== taskId) } : b
                  ),
                }
              : p
          ),
        })),

      addJournalEntry: (entry) => {
        const today = new Date();
        const newEntry: JournalEntry = {
          id: id(),
          date: entry.date ?? getTodayString(),
          title: entry.title ?? '',
          content: entry.content,
          section: entry.section,
          prompt: entry.prompt,
          mood: entry.mood,
          weekNumber: entry.weekNumber ?? getWeekNumber(today),
          weekYear: entry.weekYear ?? today.getFullYear(),
          tags: entry.tags,
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ journalEntries: [newEntry, ...s.journalEntries] }));
      },

      addAccountabilityResponse: (resp) =>
        set((s) => ({
          accountabilityResponses: [
            { ...resp, id: id(), createdAt: now() },
            ...s.accountabilityResponses,
          ],
        })),

      updateSettings: (updates) =>
        set((s) => ({
          settings: {
            timeManagement: { ...s.settings.timeManagement, ...updates.timeManagement },
            visual: { ...s.settings.visual, ...updates.visual },
            ai: { ...s.settings.ai, ...updates.ai },
          },
        })),

      importData: (data) => set((s) => ({ ...s, ...data })),
      markSeeded: () => set({ hasSeededSampleData: true }),
    }),
    {
      name: 'adhd-planner',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

function ensurePlan(plans: DailyPlan[], date: string): DailyPlan[] {
  if (plans.some((p) => p.date === date)) return plans;
  return [...plans, { id: crypto.randomUUID(), date, timeBlocks: [] }];
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
