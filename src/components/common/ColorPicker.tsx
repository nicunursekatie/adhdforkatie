import { PALETTE } from '../../utils/colors';
import { cn } from '../../utils/cn';

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {PALETTE.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`Color ${c}`}
          className={cn(
            'h-6 w-6 rounded-full transition',
            value === c ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900' : ''
          )}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
