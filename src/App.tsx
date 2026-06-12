import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { useAuth } from './lib/auth';
import { applySettingsToDocument } from './utils/applySettings';
import { AppLayout } from './components/layout/AppLayout';
import { SignIn } from './components/auth/SignIn';
import { SetupNotice } from './components/auth/SetupNotice';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import WhatNowPage from './pages/WhatNowPage';
import PlannerPage from './pages/PlannerPage';
import SettingsPage from './pages/SettingsPage';
import BrainDumpPage from './pages/BrainDumpPage';
import BreakdownPage from './pages/BreakdownPage';
import AccountabilityPage from './pages/AccountabilityPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import CalendarPage from './pages/CalendarPage';
import DeletedTasksPage from './pages/DeletedTasksPage';
import MorePage from './pages/MorePage';

export default function App() {
  const settings = useStore((s) => s.settings);
  const { status } = useAuth();

  // Apply visual accommodations whenever they change.
  useEffect(() => {
    applySettingsToDocument(settings);
  }, [settings]);

  // React to OS theme changes when "system" is selected.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applySettingsToDocument(useStore.getState().settings);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (status === 'configuring') return <SetupNotice />;
  if (status === 'loading') return <LoadingScreen />;
  if (status === 'signed-out') return <SignIn />;

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/what-now" element={<WhatNowPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/brain-dump" element={<BrainDumpPage />} />
        <Route path="/breakdown" element={<BreakdownPage />} />
        <Route path="/accountability" element={<AccountabilityPage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/deleted-tasks" element={<DeletedTasksPage />} />
        <Route path="/more" element={<MorePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
    </div>
  );
}
