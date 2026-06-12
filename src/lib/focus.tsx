import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Focus tracking — supports both sides of ADHD attention regulation:
//  - catches rapid task-switching (a warning if you bounce after < 3 min)
//  - catches hyperfocus (suggests a break after 2 hours on one task)
// Lives only on this device (it's ephemeral, in-the-moment state).
// ---------------------------------------------------------------------------

interface FocusSession {
  taskId: string;
  taskTitle: string;
  startTime: number; // epoch ms
}

interface FocusValue {
  session: FocusSession | null;
  elapsedMinutes: number;
  shouldSuggestBreak: boolean;
  startFocus: (taskId: string, taskTitle: string) => void;
  stopFocus: () => void;
  /** Returns true if switching to this task would interrupt a very-fresh session. */
  wouldWarnSwitch: (taskId: string) => boolean;
}

const FocusContext = createContext<FocusValue | null>(null);
const STORAGE_KEY = 'focus-session';
const SWITCH_WARN_MINUTES = 3;
const BREAK_SUGGEST_MINUTES = 120;

export function FocusProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<FocusSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FocusSession) : null;
    } catch {
      return null;
    }
  });
  const [now, setNow] = useState(Date.now());
  const timer = useRef<number>();

  // Tick once a minute while a session is active.
  useEffect(() => {
    if (!session) return;
    setNow(Date.now());
    timer.current = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(timer.current);
  }, [session]);

  const persist = (s: FocusSession | null) => {
    setSession(s);
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const elapsedMinutes = session ? Math.max(0, (now - session.startTime) / 60000) : 0;

  const startFocus = useCallback((taskId: string, taskTitle: string) => {
    persist({ taskId, taskTitle, startTime: Date.now() });
  }, []);

  const stopFocus = useCallback(() => persist(null), []);

  const wouldWarnSwitch = useCallback(
    (taskId: string) => {
      if (!session || session.taskId === taskId) return false;
      return (Date.now() - session.startTime) / 60000 < SWITCH_WARN_MINUTES;
    },
    [session]
  );

  return (
    <FocusContext.Provider
      value={{
        session,
        elapsedMinutes,
        shouldSuggestBreak: elapsedMinutes >= BREAK_SUGGEST_MINUTES,
        startFocus,
        stopFocus,
        wouldWarnSwitch,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus(): FocusValue {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error('useFocus must be used within FocusProvider');
  return ctx;
}
