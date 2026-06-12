import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import { applySettingsToDocument } from './utils/applySettings';
import { seedSampleData } from './store/sampleData';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import WhatNowPage from './pages/WhatNowPage';
import PlannerPage from './pages/PlannerPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  const settings = useStore((s) => s.settings);
  const hasSeeded = useStore((s) => s.hasSeededSampleData);

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

  // First-run: give a gentle starting set so the app isn't an empty void.
  useEffect(() => {
    if (!hasSeeded) seedSampleData();
  }, [hasSeeded]);

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/what-now" element={<WhatNowPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
}
