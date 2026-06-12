import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Sparkles, Loader2, Check, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { breakdownTask, BreakdownInput, GeneratedStep } from '../utils/aiService';
import { getEnergyRequiredEmoji, getEmotionalWeightEmoji } from '../utils/taskPrioritization';

const FIELDS: { key: keyof BreakdownInput; label: string; placeholder: string }[] = [
  { key: 'idealOutcome', label: 'What would "done" look like?', placeholder: 'The ideal outcome…' },
  { key: 'blockers', label: "What's blocking you?", placeholder: "What's in the way right now…" },
  { key: 'timeConstraints', label: 'Any time constraints?', placeholder: 'Deadlines, time available…' },
  { key: 'people', label: 'Who else is involved?', placeholder: 'People you need to talk to…' },
  { key: 'infoNeeded', label: 'What do you need to find out?', placeholder: 'Missing information…' },
  { key: 'decisions', label: 'What decisions are needed?', placeholder: 'Choices you have to make…' },
  { key: 'waitingOn', label: 'Are you waiting on anything?', placeholder: 'Things outside your control…' },
];

export default function BreakdownPage() {
  const navigate = useNavigate();
  const addTask = useStore((s) => s.addTask);
  const ai = useStore((s) => s.settings.ai);

  const [input, setInput] = useState<BreakdownInput>({ title: '' });
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<GeneratedStep[] | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const set = (key: keyof BreakdownInput, value: string) => setInput((i) => ({ ...i, [key]: value }));

  const generate = async () => {
    if (!input.title.trim()) return;
    setLoading(true);
    const result = await breakdownTask(input, ai);
    setLoading(false);
    setSteps(result.steps);
    setUsedAI(result.usedAI);
    setSelected(new Set(result.steps.map((_, i) => i)));
  };

  const addSelected = () => {
    if (!steps) return;
    // Create the fuzzy task as a parent, and each chosen step as a subtask.
    const parent = addTask({ title: input.title.trim(), description: input.idealOutcome });
    steps.forEach((step, i) => {
      if (!selected.has(i)) return;
      addTask({
        title: step.title,
        description: step.description ?? '',
        parentTaskId: parent.id,
        estimatedMinutes: step.estimatedMinutes,
        energyRequired: step.energyRequired,
        emotionalWeight: step.emotionalWeight,
        aiProcessed: usedAI,
      });
    });
    navigate('/tasks');
  };

  return (
    <div className="space-y-5">
      <header className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Wand2 size={24} />
        </div>
        <h1 className="text-xl font-bold">Break it down</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Got a task that feels too big or too vague to start? Answer a few questions and we'll turn it into small,
          concrete next steps.
        </p>
      </header>

      {!steps ? (
        <div className="space-y-4">
          <div className="card p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              The overwhelming task
            </label>
            <input
              autoFocus
              value={input.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder='e.g. "Sort out my taxes" or "Plan Mom’s birthday"'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-500/20"
            />
          </div>

          <p className="px-1 text-xs text-gray-400">
            These are all optional — answer whichever ones help. Even one or two makes the steps sharper.
          </p>

          <div className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key} className="card p-4">
                <label className="mb-1.5 block text-sm font-medium">{f.label}</label>
                <textarea
                  value={input[f.key] ?? ''}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            {ai.apiKey
              ? '✨ Using your OpenAI key for smart breakdown.'
              : 'No AI key set — using the built-in guided breakdown. Add a key in Settings for smarter steps.'}
          </div>

          <button
            onClick={generate}
            disabled={!input.title.trim() || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? 'Thinking…' : 'Break it into steps'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSteps(null)} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft size={15} /> Back to questions
          </button>

          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">{steps.length} steps for "{input.title}"</h2>
            <span className="text-xs text-gray-400">{usedAI ? '✨ AI' : 'guided'}</span>
          </div>

          <div className="space-y-2">
            {steps.map((step, i) => (
              <label
                key={i}
                className="card flex cursor-pointer items-start gap-3 p-3"
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => {
                    const next = new Set(selected);
                    next.has(i) ? next.delete(i) : next.add(i);
                    setSelected(next);
                  }}
                  className="mt-1 h-4 w-4 accent-brand-600"
                />
                <div className="min-w-0 flex-1">
                  <input
                    value={step.title}
                    onChange={(e) =>
                      setSteps((s) => s!.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                    }
                    className="w-full bg-transparent text-sm font-medium outline-none"
                  />
                  {step.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-gray-400">
                    {step.estimatedMinutes && <span>⏱ {step.estimatedMinutes}m</span>}
                    {step.energyRequired && <span>{getEnergyRequiredEmoji(step.energyRequired)} {step.energyRequired}</span>}
                    {step.emotionalWeight && <span>{getEmotionalWeightEmoji(step.emotionalWeight)} {step.emotionalWeight}</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={addSelected}
            disabled={selected.size === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Check size={18} /> Add {selected.size} step{selected.size === 1 ? '' : 's'} as tasks
          </button>
        </div>
      )}
    </div>
  );
}
