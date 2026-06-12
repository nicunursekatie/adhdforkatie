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
import { sync, CollectionKey, RemoteState } from './sync';
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

  // Data management
  importData: (data: Partial<AppState>) => void;
  markSeeded: () => void;

  // Cloud sync hooks (no re-push — applied from remote)
  hydrate: (state: RemoteState) => void;
  applyRemoteUpsert: (key: CollectionKey, record: unknown) => void;
  applyRemoteDelete: (key: CollectionKey, id: string) => void;
  applyRemoteSettings: (settings: AppSettings) => void;
  resetLocal: () => void;
}

// Merge a record into a collection array by id (insert or replace).
function upsertById<T extends { id: string }>(arr: T[], record: T): T[] {
  const i = arr.findIndex((x) => x.id === record.id);
  if (i === -1) return [record, ...arr];
  const copy = arr.slice();
  copy[i] = record;
  return copy;
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
        sync.upsert('tasks', newTask);
        return newTask;
      },

      updateTask: (taskId, updates) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, ...updates, updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('tasks', updated);
      },

      toggleComplete: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? now() : null,
              updatedAt: now(),
            };
            return updated;
          }),
        }));
        if (updated) sync.upsert('tasks', updated);
      },

      deleteTask: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, deletedAt: now(), updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('tasks', updated);
      },

      restoreTask: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, deletedAt: null, updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('tasks', updated);
      },

      purgeTask: (taskId) => {
        const children = get().tasks.filter((t) => t.parentTaskId === taskId).map((t) => t.id);
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== taskId && t.parentTaskId !== taskId) }));
        sync.remove('tasks', taskId);
        children.forEach((cid) => sync.remove('tasks', cid));
      },

      archiveTask: (taskId) => {
        let updated: Task | undefined;
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            updated = { ...t, archived: true, updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('tasks', updated);
      },

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
        sync.upsert('projects', newProject);
        return newProject;
      },

      updateProject: (projectId, updates) => {
        let updated: Project | undefined;
        set((s) => ({
          projects: s.projects.map((p) => {
            if (p.id !== projectId) return p;
            updated = { ...p, ...updates, updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('projects', updated);
      },

      deleteProject: (projectId) => {
        // Detach tasks rather than deleting them — losing tasks feels punishing.
        const affected = get()
          .tasks.filter((t) => t.projectId === projectId)
          .map((t) => ({ ...t, projectId: null, updatedAt: now() }));
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== projectId),
          tasks: s.tasks.map((t) => (t.projectId === projectId ? { ...t, projectId: null, updatedAt: now() } : t)),
        }));
        sync.remove('projects', projectId);
        affected.forEach((t) => sync.upsert('tasks', t));
      },

      addCategory: (category) => {
        const newCategory: Category = {
          id: id(),
          name: category.name.trim(),
          color: category.color ?? '#10b981',
          createdAt: now(),
          updatedAt: now(),
        };
        set((s) => ({ categories: [...s.categories, newCategory] }));
        sync.upsert('categories', newCategory);
        return newCategory;
      },

      updateCategory: (categoryId, updates) => {
        let updated: Category | undefined;
        set((s) => ({
          categories: s.categories.map((c) => {
            if (c.id !== categoryId) return c;
            updated = { ...c, ...updates, updatedAt: now() };
            return updated;
          }),
        }));
        if (updated) sync.upsert('categories', updated);
      },

      deleteCategory: (categoryId) => {
        const affected = get()
          .tasks.filter((t) => t.categoryIds.includes(categoryId))
          .map((t) => ({ ...t, categoryIds: t.categoryIds.filter((c) => c !== categoryId), updatedAt: now() }));
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== categoryId),
          tasks: s.tasks.map((t) =>
            t.categoryIds.includes(categoryId)
              ? { ...t, categoryIds: t.categoryIds.filter((c) => c !== categoryId), updatedAt: now() }
              : t
          ),
        }));
        sync.remove('categories', categoryId);
        affected.forEach((t) => sync.upsert('tasks', t));
      },

      addTimeBlock: (date, block) => {
        set((s) => ({ dailyPlans: ensurePlan(s.dailyPlans, date) }));
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date ? { ...p, timeBlocks: [...p.timeBlocks, { ...block, id: id() }] } : p
          ),
        }));
        pushPlan(get(), date);
      },

      updateTimeBlock: (date, blockId, updates) => {
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date
              ? { ...p, timeBlocks: p.timeBlocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)) }
              : p
          ),
        }));
        pushPlan(get(), date);
      },

      deleteTimeBlock: (date, blockId) => {
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
            p.date === date ? { ...p, timeBlocks: p.timeBlocks.filter((b) => b.id !== blockId) } : p
          ),
        }));
        pushPlan(get(), date);
      },

      assignTaskToBlock: (date, blockId, taskId) => {
        set((s) => ({ dailyPlans: ensurePlan(s.dailyPlans, date) }));
        set((s) => ({
          dailyPlans: s.dailyPlans.map((p) =>
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
        }));
        pushPlan(get(), date);
      },

      unassignTaskFromBlock: (date, blockId, taskId) => {
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
        }));
        pushPlan(get(), date);
      },

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
        sync.upsert('journalEntries', newEntry);
      },

      addAccountabilityResponse: (resp) => {
        const record: AccountabilityResponse = { ...resp, id: id(), createdAt: now() };
        set((s) => ({ accountabilityResponses: [record, ...s.accountabilityResponses] }));
        sync.upsert('accountabilityResponses', record);
      },

      updateSettings: (updates) => {
        const next: AppSettings = {
          timeManagement: { ...get().settings.timeManagement, ...updates.timeManagement },
          visual: { ...get().settings.visual, ...updates.visual },
          ai: { ...get().settings.ai, ...updates.ai },
        };
        set({ settings: next });
        sync.settings(next);
      },

      importData: (data) => set((s) => ({ ...s, ...data })),
      markSeeded: () => set({ hasSeededSampleData: true }),

      hydrate: (state) =>
        set((s) => ({
          tasks: state.tasks ?? [],
          projects: state.projects ?? [],
          categories: state.categories ?? [],
          dailyPlans: state.dailyPlans ?? [],
          journalEntries: state.journalEntries ?? [],
          accountabilityResponses: state.accountabilityResponses ?? [],
          settings: state.settings ?? s.settings,
        })),

      applyRemoteUpsert: (key, record) =>
        set((s) => ({ [key]: upsertById(s[key] as { id: string }[], record as { id: string }) }) as Partial<AppState>),

      applyRemoteDelete: (key, recordId) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== recordId) }) as Partial<AppState>),

      applyRemoteSettings: (settings) => set({ settings }),

      resetLocal: () =>
        set({
          tasks: [],
          projects: [],
          categories: [],
          dailyPlans: [],
          journalEntries: [],
          accountabilityResponses: [],
        }),
    }),
    {
      name: 'adhd-planner',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      // The local copy is just an offline cache; auth state lives in Supabase.
      partialize: (s) => ({
        tasks: s.tasks,
        projects: s.projects,
        categories: s.categories,
        dailyPlans: s.dailyPlans,
        journalEntries: s.journalEntries,
        accountabilityResponses: s.accountabilityResponses,
        settings: s.settings,
        hasSeededSampleData: s.hasSeededSampleData,
      }),
    }
  )
);

function ensurePlan(plans: DailyPlan[], date: string): DailyPlan[] {
  if (plans.some((p) => p.date === date)) return plans;
  return [...plans, { id: crypto.randomUUID(), date, timeBlocks: [] }];
}

function pushPlan(state: AppState, date: string) {
  const plan = state.dailyPlans.find((p) => p.date === date);
  if (plan) sync.upsert('dailyPlans', plan);
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
