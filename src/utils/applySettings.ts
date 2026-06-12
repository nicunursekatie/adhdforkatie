import { AppSettings } from '../types';

// Translate the visual-accommodation settings into <html> classes (see index.css).
export function applySettingsToDocument(settings: AppSettings) {
  const root = document.documentElement;
  const { visual } = settings;

  root.classList.remove('font-small', 'font-medium', 'font-large');
  root.classList.add(`font-${visual.fontSize}`);

  root.classList.toggle('reduce-motion', visual.reduceAnimations);
  root.classList.toggle('high-contrast', visual.highContrast);

  const prefersDark =
    visual.theme === 'dark' ||
    (visual.theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', prefersDark);
}
