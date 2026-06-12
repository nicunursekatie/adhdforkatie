import { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, Clock, X, GripVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task, TimeBlock } from '../types';
import { topLevelActive } from '../utils/taskFilters';
import { getTodayString, formatDateForDisplay } from '../utils/dateUtils';
import { cn } from '../utils/cn';

function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function PlannerPage() {
  const tasks = useStore((s) => s.tasks);
  const dailyPlans = useStore((s) => s.dailyPlans);
  const addTimeBlock = useStore((s) => s.addTimeBlock);
  const deleteTimeBlock = useStore((s) => s.deleteTimeBlock);
  const assignTaskToBlock = useStore((s) => s.assignTaskToBlock);
  const unassignTaskFromBlock = useStore((s) => s.unassignTaskFromBlock);

  const [date, setDate] = useState(getTodayString());
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const plan = useMemo(() => dailyPlans.find((p) => p.date === date), [dailyPlans, date]);
  const blocks = plan?.timeBlocks ?? [];

  const assignedIds = useMemo(
    () => new Set(blocks.flatMap((b) => b.taskIds)),
    [blocks]
  );
  const unscheduled = useMemo(
    () => topLevelActive(tasks).filter((t) => !assignedIds.has(t.id)),
    [tasks, assignedIds]
  );
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const activeTask = activeId ? taskById.get(activeId) : null;

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const taskId = String(e.active.id);
    const over = e.over?.id ? String(e.over.id) : null;
    const fromBlock = e.active.data.current?.blockId as string | undefined;

    if (!over) return;
    if (over === 'unscheduled') {
      if (fromBlock) unassignTaskFromBlock(date, fromBlock, taskId);
      return;
    }
    // over is a block id
    if (fromBlock === over) return;
    if (fromBlock) unassignTaskFromBlock(date, fromBlock, taskId);
    assignTaskToBlock(date, over, taskId);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Daily Planner</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(shiftDate(date, -1))} aria-label="Previous day" className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setDate(getTodayString())}
            className="min-w-[7rem] rounded-md px-2 py-1 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {date === getTodayString() ? 'Today' : formatDateForDisplay(date)}
          </button>
          <button onClick={() => setDate(shiftDate(date, 1))} aria-label="Next day" className="rounded-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Decide <em>when</em>, not just what. Drag tasks into time blocks so "when will I do this?" lives on the
        screen instead of in your head.
      </p>

      <DndContext
        sensors={sensors}
        onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <UnscheduledPool tasks={unscheduled} />
          <BlocksColumn
            date={date}
            blocks={blocks}
            taskById={taskById}
            onAddBlock={(b) => addTimeBlock(date, b)}
            onDeleteBlock={(id) => deleteTimeBlock(date, id)}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="card flex items-center gap-2 px-3 py-2 text-sm shadow-lg">
              <GripVertical size={14} className="text-gray-400" />
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DraggableTask({ task, blockId }: { task: Task; blockId?: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { blockId },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex cursor-grab items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800',
        isDragging && 'opacity-40'
      )}
    >
      <GripVertical size={14} className="shrink-0 text-gray-400" />
      <span className="min-w-0 flex-1 truncate">{task.title}</span>
      {task.estimatedMinutes && (
        <span className="shrink-0 text-xs text-gray-400">{task.estimatedMinutes}m</span>
      )}
    </div>
  );
}

function UnscheduledPool({ tasks }: { tasks: Task[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled' });
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Unscheduled ({tasks.length})</h2>
      <div
        ref={setNodeRef}
        className={cn(
          'card min-h-[8rem] space-y-2 p-3 transition',
          isOver && 'ring-2 ring-brand-400'
        )}
      >
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">Everything's scheduled. 🎉</p>
        ) : (
          tasks.map((t) => <DraggableTask key={t.id} task={t} />)
        )}
      </div>
    </div>
  );
}

function BlocksColumn({
  date,
  blocks,
  taskById,
  onAddBlock,
  onDeleteBlock,
}: {
  date: string;
  blocks: TimeBlock[];
  taskById: Map<string, Task>;
  onAddBlock: (b: Omit<TimeBlock, 'id'>) => void;
  onDeleteBlock: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [start, setStart] = useState('09:00');
  const [end, setEnd] = useState('10:00');
  const [title, setTitle] = useState('');

  const sorted = [...blocks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAdd = () => {
    onAddBlock({ startTime: start, endTime: end, title: title.trim() || 'Focus block', description: '', taskIds: [] });
    setTitle('');
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Time blocks ({blocks.length})</h2>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-500/10"
        >
          <Plus size={14} /> Add block
        </button>
      </div>

      {adding && (
        <div className="card mb-2 space-y-2 p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Block name (e.g. Deep work)"
            className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="flex items-center gap-2">
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" />
            <span className="text-gray-400">→</span>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800" />
            <button onClick={handleAdd} className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sorted.length === 0 && !adding && (
          <p className="card px-4 py-6 text-center text-xs text-gray-400">No blocks yet. Add one to start time-blocking {date === getTodayString() ? 'today' : 'this day'}.</p>
        )}
        {sorted.map((block) => (
          <BlockDroppable key={block.id} block={block} taskById={taskById} onDelete={() => onDeleteBlock(block.id)} />
        ))}
      </div>
    </div>
  );
}

function BlockDroppable({
  block,
  taskById,
  onDelete,
}: {
  block: TimeBlock;
  taskById: Map<string, Task>;
  onDelete: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: block.id });
  const blockTasks = block.taskIds.map((id) => taskById.get(id)).filter(Boolean) as Task[];

  return (
    <div ref={setNodeRef} className={cn('card p-3 transition', isOver && 'ring-2 ring-brand-400')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock size={14} className="text-brand-500" />
          <span>{block.startTime}–{block.endTime}</span>
          <span className="text-gray-400">·</span>
          <span>{block.title}</span>
        </div>
        <button onClick={onDelete} aria-label="Delete block" className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
          <X size={14} />
        </button>
      </div>
      <div className="mt-2 space-y-1.5">
        {blockTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 py-3 text-center text-xs text-gray-400 dark:border-gray-700">
            Drop tasks here
          </p>
        ) : (
          blockTasks.map((t) => <DraggableTask key={t.id} task={t} blockId={block.id} />)
        )}
      </div>
    </div>
  );
}
