import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, Plus, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ColorPicker } from '../components/common/ColorPicker';
import { randomColor } from '../utils/colors';

export default function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const addProject = useStore((s) => s.addProject);

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(randomColor());

  const counts = useMemo(() => {
    const map = new Map<string, { open: number; done: number }>();
    for (const t of tasks) {
      if (!t.projectId || t.deletedAt) continue;
      const c = map.get(t.projectId) ?? { open: 0, done: 0 };
      t.completed ? c.done++ : c.open++;
      map.set(t.projectId, c);
    }
    return map;
  }, [tasks]);

  const create = () => {
    if (!name.trim()) return;
    addProject({ name, color });
    setName('');
    setColor(randomColor());
    setAdding(false);
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{projects.length} project{projects.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          <Plus size={16} /> New
        </button>
      </header>

      {adding && (
        <div className="card space-y-3 p-4">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="Project name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
          />
          <ColorPicker value={color} onChange={setColor} />
          <div className="flex gap-2">
            <button onClick={() => setAdding(false)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm dark:border-gray-700">Cancel</button>
            <button onClick={create} disabled={!name.trim()} className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white disabled:opacity-50">Create</button>
          </div>
        </div>
      )}

      {projects.length === 0 && !adding ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <FolderKanban className="text-gray-300 dark:text-gray-600" size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">No projects yet. Group related tasks into a project.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => {
            const c = counts.get(p.id) ?? { open: 0, done: 0 };
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-300">
                <span className="h-9 w-9 shrink-0 rounded-lg" style={{ backgroundColor: p.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.open} open · {c.done} done</p>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
