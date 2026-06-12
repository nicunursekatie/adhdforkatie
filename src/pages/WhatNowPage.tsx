import { useMemo, useState } from 'react';
import { ArrowLeft, Clock, Sparkles, X, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { EnergyLevel, WhatNowCriteria } from '../types';
import { recommendTasks } from '../utils/taskFilters';
import { getTaskRecommendationReason } from '../utils/taskPrioritization';
import { TaskCard } from '../components/tasks/TaskCard';
import { cn } from '../utils/cn';

type Step = 'time' | 'energy' | 'blockers' | 'results';

const TIME_OPTIONS: { value: WhatNowCriteria['availableTime']; label: string; sub: string }[] = [
  { value: 'short', label: 'A few minutes', sub: 'Up to 30 min' },
  { value: 'medium', label: 'A solid chunk', sub: 'Up to 2 hours' },
  { value: 'long', label: 'As long as it takes', sub: 'No limit' },
];

const ENERGY_OPTIONS: { value: EnergyLevel; label: string; sub: string }[] = [
  { value: 'low', label: '🔋 Low', sub: 'Tired, unfocused, need easy tasks' },
  { value: 'medium', label: '🔋🔋 Medium', sub: 'Average focus' },
  { value: 'high', label: '🔋🔋🔋 High', sub: 'Focused, ready to tackle anything' },
];

export default function WhatNowPage() {
  const tasks = useStore((s) => s.tasks);
  const [step, setStep] = useState<Step>('time');
  const [availableTime, setAvailableTime] = useState<WhatNowCriteria['availableTime']>('medium');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [blockerInput, setBlockerInput] = useState('');

  const recommendations = useMemo(
    () => recommendTasks(tasks, { availableTime, energyLevel, blockers }),
    [tasks, availableTime, energyLevel, blockers, step]
  );

  const addBlocker = () => {
    const b = blockerInput.trim();
    if (b && !blockers.includes(b)) setBlockers((bs) => [...bs, b]);
    setBlockerInput('');
  };

  const reset = () => {
    setStep('time');
    setBlockers([]);
    setBlockerInput('');
  };

  return (
    <div className="space-y-6">
      <header className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <Sparkles size={24} />
        </div>
        <h1 className="text-xl font-bold">What Now?</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Let the app decide what to do next, based on your capacity right now.
        </p>
      </header>

      <Steps step={step} />

      {step === 'time' && (
        <Choices
          title="How much time do you have?"
          options={TIME_OPTIONS}
          value={availableTime}
          onSelect={(v) => {
            setAvailableTime(v as WhatNowCriteria['availableTime']);
            setStep('energy');
          }}
        />
      )}

      {step === 'energy' && (
        <>
          <Choices
            title="How's your energy level?"
            options={ENERGY_OPTIONS}
            value={energyLevel}
            onSelect={(v) => {
              setEnergyLevel(v as EnergyLevel);
              setStep('blockers');
            }}
          />
          <BackButton onClick={() => setStep('time')} />
        </>
      )}

      {step === 'blockers' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Any current blockers?</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add anything limiting you right now (e.g. "no internet", "can't make noise", "no computer").
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={blockerInput}
                onChange={(e) => setBlockerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBlocker()}
                placeholder="Enter a blocker"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
              />
              <button onClick={addBlocker} className="rounded-lg bg-gray-100 px-3 text-sm font-medium dark:bg-gray-800">
                Add
              </button>
            </div>
            {blockers.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {blockers.map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-gray-800">
                    {b}
                    <button onClick={() => setBlockers((bs) => bs.filter((x) => x !== b))} aria-label={`Remove ${b}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setStep('results')}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Show me what to do →
          </button>
          <BackButton onClick={() => setStep('energy')} />
        </div>
      )}

      {step === 'results' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm dark:bg-brand-500/10">
            <span className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-300">
              <Clock size={14} /> {TIME_OPTIONS.find((t) => t.value === availableTime)?.label}
            </span>
            <span className="text-brand-700 dark:text-brand-300">·</span>
            <span className="font-medium text-brand-700 dark:text-brand-300">
              {ENERGY_OPTIONS.find((e) => e.value === energyLevel)?.label} energy
            </span>
            {blockers.length > 0 && (
              <>
                <span className="text-brand-700 dark:text-brand-300">·</span>
                <span className="text-brand-700 dark:text-brand-300">avoiding: {blockers.join(', ')}</span>
              </>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="card py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              No tasks fit right now. That's allowed — maybe rest, or capture something new.
            </div>
          ) : (
            <div className="space-y-2">
              {recommendations.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  reasons={getTaskRecommendationReason(task, 'smart', energyLevel)}
                />
              ))}
            </div>
          )}

          <button
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <RotateCcw size={15} /> Start over
          </button>
        </div>
      )}
    </div>
  );
}

function Steps({ step }: { step: Step }) {
  const order: Step[] = ['time', 'energy', 'blockers', 'results'];
  const idx = order.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2">
      {order.map((s, i) => (
        <div
          key={s}
          className={cn(
            'h-1.5 rounded-full transition-all',
            i <= idx ? 'w-8 bg-brand-600' : 'w-4 bg-gray-200 dark:bg-gray-700'
          )}
        />
      ))}
    </div>
  );
}

function Choices({
  title,
  options,
  value,
  onSelect,
}: {
  title: string;
  options: { value: string; label: string; sub: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-center text-lg font-semibold">{title}</h2>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onSelect(o.value)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition',
              value === o.value
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                : 'border-gray-200 hover:border-brand-300 dark:border-gray-700'
            )}
          >
            <div>
              <p className="font-medium">{o.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{o.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
    >
      <ArrowLeft size={15} /> Back
    </button>
  );
}
