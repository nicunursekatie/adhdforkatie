import { useMemo, useState } from 'react';
import { CalendarCheck, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { JournalEntry } from '../types';
import { getOverdueTasks, topLevelActive } from '../utils/taskFilters';
import { getDaysBetween, getTodayString, formatDateForDisplay } from '../utils/dateUtils';
import { cn } from '../utils/cn';

type Section = NonNullable<JournalEntry['section']>;

const SECTIONS: { key: Section; title: string; prompt: string }[] = [
  { key: 'reflect', title: 'Reflect', prompt: 'What went well this week? What drained you? Be honest and kind.' },
  { key: 'overdue', title: 'Loose ends', prompt: 'Look at what slipped. What actually needs to carry forward vs. let go?' },
  { key: 'upcoming', title: 'The week ahead', prompt: "What matters most next week? What's the ONE thing you don't want to drop?" },
  { key: 'projects', title: 'Projects', prompt: "What's the next move on each project you care about?" },
  { key: 'life-areas', title: 'Life areas', prompt: 'Health, relationships, home, money, fun — anything being neglected?' },
];

const MOODS: { value: NonNullable<JournalEntry['mood']>; label: string }[] = [
  { value: 'great', label: '😄 Great' },
  { value: 'good', label: '🙂 Good' },
  { value: 'neutral', label: '😐 Neutral' },
  { value: 'challenging', label: '😕 Challenging' },
  { value: 'difficult', label: '😞 Difficult' },
];

export default function WeeklyReviewPage() {
  const tasks = useStore((s) => s.tasks);
  const journalEntries = useStore((s) => s.journalEntries);
  const addJournalEntry = useStore((s) => s.addJournalEntry);

  const [active, setActive] = useState<Section>('reflect');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [mood, setMood] = useState<JournalEntry['mood']>();
  const [savedFlash, setSavedFlash] = useState(false);

  const overdue = useMemo(() => getOverdueTasks(tasks), [tasks]);
  const upcoming = useMemo(() => {
    const today = getTodayString();
    return topLevelActive(tasks).filter((t) => {
      if (!t.dueDate) return false;
      const d = getDaysBetween(today, t.dueDate);
      return d !== null && d >= 0 && d <= 7;
    });
  }, [tasks]);
  const projects = useStore((s) => s.projects).filter((p) => !p.archived && !p.completed);

  const recentEntries = useMemo(
    () => journalEntries.filter((e) => e.section === active).slice(0, 5),
    [journalEntries, active]
  );

  const save = () => {
    const content = (drafts[active] ?? '').trim();
    if (!content) return;
    const section = SECTIONS.find((s) => s.key === active)!;
    addJournalEntry({ content, section: active, prompt: section.prompt, mood, title: section.title });
    setDrafts((d) => ({ ...d, [active]: '' }));
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const activeSection = SECTIONS.find((s) => s.key === active)!;

  return (
    <div className="space-y-5">
      <header className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <CalendarCheck size={24} />
        </div>
        <h1 className="text-xl font-bold">Weekly Review</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
          A recurring external memory check, so nothing important lives only in your head. Take it one section at a time.
        </p>
      </header>

      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          How did this week feel?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(mood === m.value ? undefined : m.value)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                mood === m.value
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActive(s.key)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
              active === s.key ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm font-medium">{activeSection.prompt}</p>

        {/* Context for the section so review is grounded in reality, not memory. */}
        {active === 'overdue' && (
          <ReviewList label="Overdue right now" items={overdue.map((t) => `${t.title}${t.dueDate ? ` · ${formatDateForDisplay(t.dueDate)}` : ''}`)} />
        )}
        {active === 'upcoming' && (
          <ReviewList label="Due in the next 7 days" items={upcoming.map((t) => `${t.title} · ${formatDateForDisplay(t.dueDate)}`)} />
        )}
        {active === 'projects' && <ReviewList label="Active projects" items={projects.map((p) => p.name)} />}

        <textarea
          value={drafts[active] ?? ''}
          onChange={(e) => setDrafts((d) => ({ ...d, [active]: e.target.value }))}
          placeholder="Write freely…"
          rows={4}
          className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {savedFlash && <span className="text-xs text-green-600">Saved ✓</span>}
          <button
            onClick={save}
            disabled={!(drafts[active] ?? '').trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={15} /> Save reflection
          </button>
        </div>
      </div>

      {recentEntries.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Past {activeSection.title.toLowerCase()} notes</h2>
          <div className="space-y-2">
            {recentEntries.map((e) => (
              <div key={e.id} className="card p-3">
                <p className="text-xs text-gray-400">{formatDateForDisplay(e.date)}{e.mood ? ` · ${e.mood}` : ''}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{e.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{label} ({items.length})</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400">Nothing here — nice.</p>
      ) : (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-600 dark:text-gray-300">
          {items.slice(0, 10).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
