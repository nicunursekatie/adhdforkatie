import { useMemo, useState } from 'react';
import { Tag, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ColorPicker } from '../components/common/ColorPicker';
import { randomColor } from '../utils/colors';

export default function CategoriesPage() {
  const categories = useStore((s) => s.categories);
  const tasks = useStore((s) => s.tasks);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [name, setName] = useState('');
  const [color, setColor] = useState(randomColor());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (t.deletedAt) continue;
      for (const cid of t.categoryIds) map.set(cid, (map.get(cid) ?? 0) + 1);
    }
    return map;
  }, [tasks]);

  const create = () => {
    if (!name.trim()) return;
    addCategory({ name, color });
    setName('');
    setColor(randomColor());
  };

  const startEdit = (id: string, n: string, c: string) => {
    setEditingId(id);
    setEditName(n);
    setEditColor(c);
  };
  const saveEdit = () => {
    if (editingId && editName.trim()) updateCategory(editingId, { name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">Categories</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Cross-cutting labels like Work, Home, Errands.</p>
      </header>

      <div className="card space-y-3 p-4">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            placeholder="New category name"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800"
          />
          <button onClick={create} disabled={!name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-sm font-semibold text-white disabled:opacity-50">
            <Plus size={16} /> Add
          </button>
        </div>
        <ColorPicker value={color} onChange={setColor} />
      </div>

      {categories.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <Tag className="text-gray-300 dark:text-gray-600" size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">No categories yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((c) =>
            editingId === c.id ? (
              <div key={c.id} className="card space-y-3 p-4">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                />
                <ColorPicker value={editColor} onChange={setEditColor} />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingId(null)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"><X size={15} /></button>
                  <button onClick={saveEdit} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white"><Check size={15} /></button>
                </div>
              </div>
            ) : (
              <div key={c.id} className="card flex items-center gap-3 p-3">
                <span className="h-7 w-7 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{counts.get(c.id) ?? 0} task{(counts.get(c.id) ?? 0) === 1 ? '' : 's'}</p>
                </div>
                <button onClick={() => startEdit(c.id, c.name, c.color)} aria-label="Edit" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"><Pencil size={15} /></button>
                <button
                  onClick={() => window.confirm(`Delete category "${c.name}"? It'll be removed from its tasks.`) && deleteCategory(c.id)}
                  aria-label="Delete"
                  className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
