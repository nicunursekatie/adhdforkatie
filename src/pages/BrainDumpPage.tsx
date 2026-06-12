import { useMemo, useState } from 'react';
import { Brain, Shuffle, Plus, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { BRAIN_DUMP_PROMPTS } from '../utils/brainDumpPrompts';
import { cn } from '../utils/cn';

const CATEGORIES = ['Work', 'Home', 'Personal', 'Administrative'] as const;

export default function BrainDumpPage() {
  const addTask = useStore((s) => s.addTask);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>('Work');
  const [promptIndex, setPromptIndex] = useState(0);
  const [text, setText] = useState('');
  const [justAdded, setJustAdded] = useState<string[]>([]);

  const prompts = useMemo(
    () => BRAIN_DUMP_PROMPTS.filter((p) => p.category === activeCategory),
    [activeCategory]
  );
  const prompt = prompts[promptIndex % prompts.length];

  const nextPrompt = () => setPromptIndex((i) => i + 1);

  const dump = () => {
    const t = text.trim();
    if (!t) return;
    addTask({ title: t, braindumpSource: activeCategory });
    setJustAdded((a) => [t, ...a].slice(0, 8));
    setText('');
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Brain size={24} />
        </div>
        <h1 className="text-xl font-bold">Brain Dump</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Get the thoughts spinning in your head out of working memory and onto the screen. Don't filter, don't judge,
          don't organize — just capture. You can sort it later.
        </p>
      </header>

      <div className="flex justify-center gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => {
              setActiveCategory(c);
              setPromptIndex(0);
            }}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition',
              activeCategory === c
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-medium leading-snug">{prompt?.text}</p>
          <button
            onClick={nextPrompt}
            aria-label="Different prompt"
            className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-gray-800"
          >
            <Shuffle size={16} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) dump();
          }}
          placeholder="Type whatever comes to mind…"
          rows={3}
          autoFocus
          className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:focus:ring-brand-500/20"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">⌘/Ctrl + Enter to capture</span>
          <button
            onClick={dump}
            disabled={!text.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Plus size={16} /> Capture
          </button>
        </div>
      </div>

      {justAdded.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Captured just now</h2>
          <ul className="space-y-1.5">
            {justAdded.map((t, i) => (
              <li key={i} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-500/10 dark:text-green-300">
                <Check size={14} className="shrink-0" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-center text-xs text-gray-400">
            These are now in <span className="font-medium">Tasks</span> — give them energy/time later when you're ready.
          </p>
        </div>
      )}
    </div>
  );
}
