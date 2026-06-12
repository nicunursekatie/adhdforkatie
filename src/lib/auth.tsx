import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { useStore } from '../store/useStore';
import { setSyncUser, pullAll, subscribeToChanges, flushOutbox } from '../store/sync';
import { seedSampleData } from '../store/sampleData';

type Status = 'loading' | 'configuring' | 'signed-out' | 'signed-in';

interface AuthValue {
  status: Status;
  user: User | null;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? 'loading' : 'configuring');
  const [user, setUser] = useState<User | null>(null);

  // Track the Supabase session.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setStatus(data.session?.user ? 'signed-in' : 'signed-out');
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'signed-in' : 'signed-out');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // When signed in: become the sync user, pull everything, go live, flush queue.
  useEffect(() => {
    if (status !== 'signed-in' || !user) return;
    let cancelled = false;
    setSyncUser(user.id);

    (async () => {
      try {
        const remote = await pullAll(user.id);
        if (cancelled) return;
        useStore.getState().hydrate(remote);

        // Brand-new account with nothing stored anywhere: give a gentle start.
        const empty =
          remote.tasks.length === 0 &&
          remote.projects.length === 0 &&
          remote.categories.length === 0;
        if (empty) seedSampleData();
      } catch {
        // Offline / transient: keep the local cache; realtime + flush recover later.
      }
      void flushOutbox();
    })();

    const store = useStore.getState();
    const unsubscribe = subscribeToChanges(user.id, {
      onUpsert: (key, record) => store.applyRemoteUpsert(key, record),
      onDelete: (key, recordId) => store.applyRemoteDelete(key, recordId),
      onSettings: (settings) => store.applyRemoteSettings(settings),
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [status, user]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase is not configured.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    setSyncUser(null);
    if (supabase) await supabase.auth.signOut();
    useStore.getState().resetLocal();
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, signInWithMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
