import { useRef, useState } from 'react';
import { Plus, Circle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { extractDateFromText, formatDateString } from '../../utils/dateUtils';
import { Priority } from '../../types';

interface Props {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  placeholder?: string;
  autoFocus?: boolean;
}

// Friction-free capture: type a thought and hit Enter. We parse a natural-
// language due date ("call mom tomorrow") and a !high / !low priority marker
// out of the text so you never have to open a form just to get it down.
export function QuickCapture({
  onTaskAdded,
  defaultProjectId = null,
  placeholder = 'Add a task… (try "email Sam tomorrow !high")',
  autoFocus,
}: Props) {
  const addTask = useStore((s) => s.addTask);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const processInput = (input: string) => {
    let text = input;
    let dueDate: string | null = null;
    let priority: Priority = 'medium';

    const { cleanedText, date } = extractDateFromText(input);
    if (date) {
      text = cleanedText;
      dueDate = formatDateString(date);
    }

    if (/!high/i.test(text)) {
      priority = 'high';
      text = text.replace(/!high/i, '');
    } else if (/!urgent/i.test(text)) {
      priority = 'urgent';
      text = text.replace(/!urgent/i, '');
    } else if (/!low/i.test(text)) {
      priority = 'low';
      text = text.replace(/!low/i, '');
    } else if (/!medium/i.test(text)) {
      priority = 'medium';
      text = text.replace(/!medium/i, '');
    }

    text = text.replace(/\s+/g, ' ').trim();
    return { title: text, dueDate, priority };
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    const { title: processed, dueDate, priority } = processInput(title);
    if (!processed) return;
    addTask({ title: processed, dueDate, priority, projectId: defaultProjectId });
    setTitle('');
    onTaskAdded?.();
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 dark:border-gray-800 dark:bg-gray-900 dark:focus-within:ring-brand-500/20">
      <Circle size={18} className="shrink-0 text-gray-400" />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        placeholder={placeholder}
        aria-label="Quick add task"
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none dark:text-gray-100"
      />
      {title.trim() && (
        <button
          onClick={handleAdd}
          aria-label="Add task"
          className="rounded-lg bg-brand-600 p-1.5 text-white transition hover:bg-brand-700"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}
