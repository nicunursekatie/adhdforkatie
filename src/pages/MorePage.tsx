import { Link } from 'react-router-dom';
import {
  Brain,
  Wand2,
  HeartHandshake,
  CalendarCheck,
  FolderKanban,
  Tag,
  CalendarDays,
  Trash2,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react';

const LINKS = [
  { to: '/brain-dump', label: 'Brain Dump', desc: 'Empty your head, fast', icon: Brain },
  { to: '/breakdown', label: 'Break it down', desc: 'Turn a fuzzy task into steps', icon: Wand2 },
  { to: '/accountability', label: 'Gentle check-in', desc: 'Review what slipped, no shame', icon: HeartHandshake },
  { to: '/weekly-review', label: 'Weekly Review', desc: 'Reflect & reset', icon: CalendarCheck },
  { to: '/projects', label: 'Projects', desc: 'Group related tasks', icon: FolderKanban },
  { to: '/categories', label: 'Categories', desc: 'Labels like Work & Home', icon: Tag },
  { to: '/calendar', label: 'Calendar', desc: 'See due dates by month', icon: CalendarDays },
  { to: '/deleted-tasks', label: 'Deleted tasks', desc: 'Restore anything', icon: Trash2 },
  { to: '/settings', label: 'Settings', desc: 'Make it yours', icon: SettingsIcon },
];

export default function MorePage() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold">More</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Every tool, one tap away.</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        {LINKS.map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="card flex items-center gap-3 p-4 transition hover:border-brand-300">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Icon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
