import { SortMode, getSortModeInfo } from '../../utils/taskPrioritization';
import { EnergyLevel } from '../../types';
import { cn } from '../../utils/cn';

const MODES: SortMode[] = ['smart', 'energymatch', 'quickwins', 'eatthefrog', 'deadline', 'priority'];

interface Props {
  mode: SortMode;
  onModeChange: (m: SortMode) => void;
  energy: EnergyLevel;
  onEnergyChange: (e: EnergyLevel) => void;
}

export function SortBar({ mode, onModeChange, energy, onEnergyChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {MODES.map((m) => {
          const info = getSortModeInfo(m);
          return (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              title={info.description}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
                mode === m
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {info.name}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50">
        <p className="text-xs text-gray-500 dark:text-gray-400">{getSortModeInfo(mode).description}</p>
        {(mode === 'energymatch' || mode === 'smart') && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">Energy:</span>
            {(['low', 'medium', 'high'] as EnergyLevel[]).map((e) => (
              <button
                key={e}
                onClick={() => onEnergyChange(e)}
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-medium capitalize transition',
                  energy === e
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
