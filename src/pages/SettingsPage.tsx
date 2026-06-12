import { useRef } from 'react';
import { Download, Upload, Eye, Clock, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { AppSettings } from '../types';
import { cn } from '../utils/cn';

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        {icon} {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition',
            value === o ? 'bg-white text-brand-700 shadow-sm dark:bg-gray-700 dark:text-brand-300' : 'text-gray-500'
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn('relative h-6 w-11 rounded-full transition', checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition', checked ? 'left-[1.375rem]' : 'left-0.5')} />
    </button>
  );
}

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const fileRef = useRef<HTMLInputElement>(null);

  const setVisual = (v: Partial<AppSettings['visual']>) => updateSettings({ visual: { ...settings.visual, ...v } });
  const setTime = (v: Partial<AppSettings['timeManagement']>) =>
    updateSettings({ timeManagement: { ...settings.timeManagement, ...v } });
  const setAI = (v: Partial<AppSettings['ai']>) => updateSettings({ ai: { ...settings.ai, ...v } });

  const exportData = () => {
    const state = useStore.getState();
    const data = {
      tasks: state.tasks,
      projects: state.projects,
      categories: state.categories,
      dailyPlans: state.dailyPlans,
      journalEntries: state.journalEntries,
      accountabilityResponses: state.accountabilityResponses,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adhd-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        useStore.getState().importData(data);
        alert('Data imported successfully.');
      } catch {
        alert('That file could not be read as a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tune the app to the way your brain and senses work.</p>
      </header>

      <Card title="Visual & sensory" icon={<Eye size={16} className="text-brand-500" />}>
        <Row label="Font size">
          <Pills options={['small', 'medium', 'large']} value={settings.visual.fontSize} onChange={(v) => setVisual({ fontSize: v })} />
        </Row>
        <Row label="Layout density">
          <Pills options={['compact', 'comfortable', 'spacious']} value={settings.visual.layoutDensity} onChange={(v) => setVisual({ layoutDensity: v })} />
        </Row>
        <Row label="Theme">
          <Pills options={['light', 'dark', 'system']} value={settings.visual.theme} onChange={(v) => setVisual({ theme: v })} />
        </Row>
        <Row label="Reduce animations" hint="Calmer, less motion on screen">
          <Toggle checked={settings.visual.reduceAnimations} onChange={(v) => setVisual({ reduceAnimations: v })} />
        </Row>
        <Row label="High contrast" hint="Stronger borders and colors">
          <Toggle checked={settings.visual.highContrast} onChange={(v) => setVisual({ highContrast: v })} />
        </Row>
      </Card>

      <Card title="Time & transitions" icon={<Clock size={16} className="text-brand-500" />}>
        <Row label="Buffer between tasks" hint="Minutes of breathing room">
          <input
            type="number"
            min={0}
            value={settings.timeManagement.defaultBufferTime}
            onChange={(e) => setTime({ defaultBufferTime: Number(e.target.value) })}
            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </Row>
        <Row label="Getting-ready time" hint="Minutes to add before appointments">
          <input
            type="number"
            min={0}
            value={settings.timeManagement.gettingReadyTime}
            onChange={(e) => setTime({ gettingReadyTime: Number(e.target.value) })}
            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </Row>
        <Row label="Time-blindness alerts" hint="Gentle nudges about elapsed time">
          <Toggle checked={settings.timeManagement.timeBlindnessAlerts} onChange={(v) => setTime({ timeBlindnessAlerts: v })} />
        </Row>
        <Row label="Auto-adjust estimates" hint="Learn from how long things actually took">
          <Toggle checked={settings.timeManagement.autoAdjustEstimates} onChange={(v) => setTime({ autoAdjustEstimates: v })} />
        </Row>
      </Card>

      <Card title="AI task breakdown" icon={<Sparkles size={16} className="text-brand-500" />}>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional. Paste your own OpenAI API key to turn vague, overwhelming tasks into concrete steps. The key is
          stored only on this device and never sent anywhere except OpenAI. Without a key, breakdown still works using
          built-in guided prompts.
        </p>
        <Row label="OpenAI API key">
          <input
            type="password"
            placeholder="sk-…"
            value={settings.ai.apiKey}
            onChange={(e) => setAI({ apiKey: e.target.value })}
            className="w-48 rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </Row>
        <Row label="Model">
          <input
            value={settings.ai.model}
            onChange={(e) => setAI({ model: e.target.value })}
            className="w-48 rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
        </Row>
      </Card>

      <Card title="Your data" icon={<Download size={16} className="text-brand-500" />}>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Everything lives in this browser. Export a backup regularly, or to move to another device.
        </p>
        <div className="flex gap-2">
          <button onClick={exportData} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <Download size={15} /> Export backup
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
            <Upload size={15} /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])}
          />
        </div>
      </Card>
    </div>
  );
}
