import { useEffect, useState } from 'react';
import { X, Check, Circle, Plus } from 'lucide-react';
import { useStore } from '../../store/useStore';
import {
  Task,
  Priority,
  EnergyLevel,
  EmotionalWeight,
  Urgency,
  TaskSize,
} from '../../types';
import { cn } from '../../utils/cn';

interface Props {
  task?: Task | null; // present = edit mode
  defaultProjectId?: string | null;
  onClose: () => void;
}

const TIME_PRESETS: { label: string; minutes: number }[] = [
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '2h', minutes: 120 },
  { label: '4h', minutes: 240 },
  { label: 'Day', minutes: 480 },
];

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
const URGENCIES: Urgency[] = ['today', 'tomorrow', 'week', 'month', 'someday'];
const SIZES: TaskSize[] = ['tiny', 'small', 'medium', 'large', 'huge'];

const ENERGY: { value: EnergyLevel; label: string }[] = [
  { value: 'low', label: '🔋 Low' },
  { value: 'medium', label: '🔋🔋 Medium' },
  { value: 'high', label: '🔋🔋🔋 High' },
];

const EMOTION: { value: EmotionalWeight; label: string }[] = [
  { value: 'easy', label: '😊 Easy / fun' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'stressful', label: '😰 Stressful' },
  { value: 'dreading', label: '😱 Dreading it' },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | undefined;
  onChange: (v: T | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={cn(
            'rounded-lg border px-3 py-1.5 text-sm transition',
            value === o.value
              ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
              : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{children}</label>;
}

export function TaskFormModal({ task, defaultProjectId = null, onClose }: Props) {
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const toggleComplete = useStore((s) => s.toggleComplete);
  const projects = useStore((s) => s.projects);
  const categories = useStore((s) => s.categories);
  const subtasks = useStore((s) => (task ? s.tasks.filter((t) => t.parentTaskId === task.id && !t.deletedAt) : []));
  const [newSubtask, setNewSubtask] = useState('');

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    projectId: task?.projectId ?? defaultProjectId,
    categoryIds: task?.categoryIds ?? [],
    dueDate: task?.dueDate ?? '',
    startDate: task?.startDate ?? '',
    priority: task?.priority,
    urgency: task?.urgency,
    energyRequired: task?.energyRequired,
    emotionalWeight: task?.emotionalWeight,
    estimatedMinutes: task?.estimatedMinutes,
    size: task?.size,
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    const payload = {
      title: form.title,
      description: form.description,
      projectId: form.projectId || null,
      categoryIds: form.categoryIds,
      dueDate: form.dueDate || null,
      startDate: form.startDate || null,
      priority: form.priority,
      urgency: form.urgency,
      energyRequired: form.energyRequired,
      emotionalWeight: form.emotionalWeight,
      estimatedMinutes: form.estimatedMinutes,
      size: form.size,
    };
    if (task) updateTask(task.id, payload);
    else addTask(payload);
    onClose();
  };

  const toggleCategory = (id: string) =>
    set(
      'categoryIds',
      form.categoryIds.includes(id)
        ? form.categoryIds.filter((c) => c !== id)
        : [...form.categoryIds, id]
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-b-none sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold">{task ? 'Edit task' : 'New task'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="What needs doing?"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-500/20"
            />
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <div>
              <Label>Start date</Label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <Label>How long will this take?</Label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_PRESETS.map((p) => (
                <button
                  key={p.minutes}
                  type="button"
                  onClick={() => set('estimatedMinutes', form.estimatedMinutes === p.minutes ? undefined : p.minutes)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-sm transition',
                    form.estimatedMinutes === p.minutes
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                  )}
                >
                  {p.label}
                </button>
              ))}
              <input
                type="number"
                min={1}
                placeholder="custom min"
                value={form.estimatedMinutes && !TIME_PRESETS.some((p) => p.minutes === form.estimatedMinutes) ? form.estimatedMinutes : ''}
                onChange={(e) => set('estimatedMinutes', e.target.value ? Number(e.target.value) : undefined)}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          <div>
            <Label>How much energy needed?</Label>
            <Segmented options={ENERGY} value={form.energyRequired} onChange={(v) => set('energyRequired', v)} />
          </div>

          <div>
            <Label>How do you feel about this?</Label>
            <Segmented options={EMOTION} value={form.emotionalWeight} onChange={(v) => set('emotionalWeight', v)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Segmented
                options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                value={form.priority}
                onChange={(v) => set('priority', v)}
              />
            </div>
            <div>
              <Label>Urgency</Label>
              <Segmented
                options={URGENCIES.map((u) => ({ value: u, label: u }))}
                value={form.urgency}
                onChange={(v) => set('urgency', v)}
              />
            </div>
          </div>

          <div>
            <Label>Size</Label>
            <Segmented options={SIZES.map((s) => ({ value: s, label: s }))} value={form.size} onChange={(v) => set('size', v)} />
          </div>

          {projects.length > 0 && (
            <div>
              <Label>Project</Label>
              <select
                value={form.projectId ?? ''}
                onChange={(e) => set('projectId', e.target.value || null)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {categories.length > 0 && (
            <div>
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCategory(c.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition',
                      form.categoryIds.includes(c.id)
                        ? 'border-transparent text-white'
                        : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                    )}
                    style={form.categoryIds.includes(c.id) ? { backgroundColor: c.color } : undefined}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {task && (
            <div>
              <Label>
                Subtasks{subtasks.length > 0 ? ` (${subtasks.filter((s) => s.completed).length}/${subtasks.length})` : ''}
              </Label>
              <div className="space-y-1.5">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-1.5 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => toggleComplete(st.id)}
                      aria-label={st.completed ? 'Mark incomplete' : 'Mark complete'}
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded-full border',
                        st.completed ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 text-transparent dark:border-gray-600'
                      )}
                    >
                      {st.completed ? <Check size={11} /> : <Circle size={11} />}
                    </button>
                    <span className={cn('flex-1 text-sm', st.completed && 'text-gray-400 line-through')}>{st.title}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newSubtask.trim()) {
                        addTask({ title: newSubtask.trim(), parentTaskId: task.id, projectId: task.projectId });
                        setNewSubtask('');
                      }
                    }}
                    placeholder="Add a subtask…"
                    className="flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newSubtask.trim()) return;
                      addTask({ title: newSubtask.trim(), parentTaskId: task.id, projectId: task.projectId });
                      setNewSubtask('');
                    }}
                    className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    aria-label="Add subtask"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </div>
    </div>
  );
}
