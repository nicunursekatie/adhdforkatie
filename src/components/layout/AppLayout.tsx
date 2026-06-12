import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ListChecks,
  Sparkles,
  CalendarClock,
  Settings as SettingsIcon,
  LogOut,
  Brain,
  Wand2,
  HeartHandshake,
  CalendarCheck,
  FolderKanban,
  Tag,
  CalendarDays,
  Trash2,
  LayoutGrid,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { useAuth } from '../../lib/auth';
import { FocusBar } from '../focus/FocusBar';

// Full list for the desktop sidebar.
const SIDEBAR = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/what-now', label: 'What Now?', icon: Sparkles },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/brain-dump', label: 'Brain Dump', icon: Brain },
  { to: '/breakdown', label: 'Break it down', icon: Wand2 },
  { to: '/accountability', label: 'Check-in', icon: HeartHandshake },
  { to: '/weekly-review', label: 'Weekly Review', icon: CalendarCheck },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/categories', label: 'Categories', icon: Tag },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/deleted-tasks', label: 'Deleted', icon: Trash2 },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

// Core five for the mobile bottom bar (everything else lives under "More").
const BOTTOM = [
  { to: '/', label: 'Today', icon: Home, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/what-now', label: 'What Now', icon: Sparkles },
  { to: '/planner', label: 'Planner', icon: CalendarClock },
  { to: '/more', label: 'More', icon: LayoutGrid },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 dark:border-gray-800 dark:bg-gray-900 md:flex">
        <div className="mb-6 px-3">
          <h1 className="text-lg font-bold text-brand-600 dark:text-brand-400">ADHD Planner</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">made for the way your brain works</p>
        </div>
        <nav className="space-y-0.5">
          {SIDEBAR.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 pt-6">
          {user?.email && (
            <p className="mb-1 truncate text-xs text-gray-400" title={user.email}>
              {user.email}
            </p>
          )}
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <h1 className="text-base font-bold text-brand-600 dark:text-brand-400">ADHD Planner</h1>
        <button onClick={signOut} aria-label="Sign out" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
          <LogOut size={16} />
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">{children}</div>
      </main>

      <FocusBar />

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95 md:hidden">
        {BOTTOM.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
