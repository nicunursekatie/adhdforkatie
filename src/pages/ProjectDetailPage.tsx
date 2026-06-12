import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Task } from '../types';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { sortTasks } from '../utils/taskPrioritization';

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const deleteProject = useStore((s) => s.deleteProject);
  const [editing, setEditing] = useState<Task | null | undefined>(undefined);

  const project = projects.find((p) => p.id === projectId);

  const projectTasks = useMemo(
    () =>
      sortTasks(
        tasks.filter((t) => t.projectId === projectId && !t.parentTaskId && !t.deletedAt),
        'smart'
      ),
    [tasks, projectId]
  );
  const done = useMemo(
    () => tasks.filter((t) => t.projectId === projectId && t.completed && !t.deletedAt),
    [tasks, projectId]
  );

  if (!project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500"><ArrowLeft size={15} /> Projects</Link>
        <p className="text-sm text-gray-500">That project doesn't exist.</p>
      </div>
    );
  }

  const remove = () => {
    if (window.confirm(`Delete "${project.name}"? Its tasks will be kept and just un-assigned.`)) {
      deleteProject(project.id);
      navigate('/projects');
    }
  };

  return (
    <div className="space-y-5">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        <ArrowLeft size={15} /> Projects
      </Link>

      <header className="flex items-center gap-3">
        <span className="h-10 w-10 shrink-0 rounded-xl" style={{ backgroundColor: project.color }} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold">{project.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{projectTasks.length} open · {done.length} done</p>
        </div>
        <button onClick={remove} aria-label="Delete project" className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10">
          <Trash2 size={16} />
        </button>
      </header>

      <QuickCapture defaultProjectId={project.id} placeholder={`Add a task to ${project.name}…`} />

      {projectTasks.length === 0 ? (
        <p className="card px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No open tasks in this project.</p>
      ) : (
        <div className="space-y-2">
          {projectTasks.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={setEditing} />
          ))}
        </div>
      )}

      {editing !== undefined && <TaskFormModal task={editing} onClose={() => setEditing(undefined)} />}
    </div>
  );
}
