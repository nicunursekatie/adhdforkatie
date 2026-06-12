import { get, set } from 'idb-keyval';
import { supabase } from '../lib/supabase';
import {
  Task,
  Project,
  Category,
  DailyPlan,
  JournalEntry,
  AccountabilityResponse,
  AppSettings,
} from '../types';

// ---------------------------------------------------------------------------
// Cloud sync (Supabase). Design goals:
//  - Multi-device: Supabase Postgres is the source of truth.
//  - Instant + offline: the local IndexedDB cache (Zustand persist) boots first;
//    writes are optimistic and queued in an outbox if offline, flushed on
//    reconnect.
//  - Migration-free schema: each collection is a table of (id, user_id, data
//    jsonb, updated_at). The rich task model can keep gaining fields with no
//    SQL migrations — all filtering happens client-side anyway.
// ---------------------------------------------------------------------------

export type CollectionKey =
  | 'tasks'
  | 'projects'
  | 'categories'
  | 'dailyPlans'
  | 'journalEntries'
  | 'accountabilityResponses';

const TABLE: Record<CollectionKey, string> = {
  tasks: 'tasks',
  projects: 'projects',
  categories: 'categories',
  dailyPlans: 'daily_plans',
  journalEntries: 'journal_entries',
  accountabilityResponses: 'accountability_responses',
};

export interface RemoteState {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  dailyPlans: DailyPlan[];
  journalEntries: JournalEntry[];
  accountabilityResponses: AccountabilityResponse[];
  settings?: AppSettings;
}

type Op =
  | { type: 'upsert'; key: CollectionKey; id: string; record: unknown }
  | { type: 'delete'; key: CollectionKey; id: string }
  | { type: 'settings'; record: AppSettings };

const OUTBOX_KEY = 'sync-outbox';
let currentUserId: string | null = null;
let flushing = false;

export function setSyncUser(userId: string | null) {
  currentUserId = userId;
}

async function readOutbox(): Promise<Op[]> {
  return (await get(OUTBOX_KEY)) ?? [];
}
async function writeOutbox(ops: Op[]) {
  await set(OUTBOX_KEY, ops);
}

async function enqueue(op: Op) {
  const ops = await readOutbox();
  // Collapse: a newer op for the same record supersedes the older one.
  const filtered = ops.filter((o) => {
    if (op.type === 'settings') return o.type !== 'settings';
    if (o.type === 'settings') return true;
    return !(o.key === op.key && o.id === op.id);
  });
  filtered.push(op);
  await writeOutbox(filtered);
  void flushOutbox();
}

// Public write API used by the store (fire-and-forget; safe offline).
export const sync = {
  upsert(key: CollectionKey, record: { id: string }) {
    if (!supabase) return;
    void enqueue({ type: 'upsert', key, id: record.id, record });
  },
  remove(key: CollectionKey, id: string) {
    if (!supabase) return;
    void enqueue({ type: 'delete', key, id });
  },
  settings(record: AppSettings) {
    if (!supabase) return;
    void enqueue({ type: 'settings', record });
  },
};

async function runOp(op: Op): Promise<void> {
  if (!supabase || !currentUserId) throw new Error('not ready');
  if (op.type === 'settings') {
    const { error } = await supabase
      .from('settings')
      .upsert({ user_id: currentUserId, data: op.record, updated_at: new Date().toISOString() });
    if (error) throw error;
    return;
  }
  if (op.type === 'delete') {
    const { error } = await supabase.from(TABLE[op.key]).delete().eq('id', op.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from(TABLE[op.key]).upsert({
    id: op.id,
    user_id: currentUserId,
    data: op.record,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function flushOutbox(): Promise<void> {
  if (flushing || !supabase || !currentUserId || !navigator.onLine) return;
  flushing = true;
  try {
    let ops = await readOutbox();
    while (ops.length > 0) {
      const op = ops[0];
      try {
        await runOp(op);
      } catch {
        // Stop on first failure; keep the queue for the next attempt.
        break;
      }
      ops = ops.slice(1);
      await writeOutbox(ops);
    }
  } finally {
    flushing = false;
  }
}

// Initial load: pull every collection for the signed-in user.
export async function pullAll(userId: string): Promise<RemoteState> {
  if (!supabase) throw new Error('Supabase not configured');
  const sb = supabase;

  const collections = Object.keys(TABLE) as CollectionKey[];
  const results = await Promise.all(
    collections.map((key) => sb.from(TABLE[key]).select('data').eq('user_id', userId))
  );

  const state: Partial<RemoteState> = {};
  collections.forEach((key, i) => {
    const rows = results[i].data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (state as any)[key] = rows.map((r: any) => r.data);
  });

  const settingsRes = await sb.from('settings').select('data').eq('user_id', userId).maybeSingle();
  if (settingsRes.data?.data) state.settings = settingsRes.data.data as AppSettings;

  return state as RemoteState;
}

export interface RealtimeHandlers {
  onUpsert: (key: CollectionKey, record: unknown) => void;
  onDelete: (key: CollectionKey, id: string) => void;
  onSettings: (settings: AppSettings) => void;
}

// Subscribe to row changes so other devices stay in sync live.
export function subscribeToChanges(userId: string, handlers: RealtimeHandlers) {
  if (!supabase) return () => {};
  const sb = supabase;

  const channel = sb.channel(`sync:${userId}`);
  const keys = Object.keys(TABLE) as CollectionKey[];

  for (const key of keys) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE[key], filter: `user_id=eq.${userId}` },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (payload: any) => {
        if (payload.eventType === 'DELETE') handlers.onDelete(key, payload.old.id);
        else handlers.onUpsert(key, payload.new.data);
      }
    );
  }

  channel.on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'settings', filter: `user_id=eq.${userId}` },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (payload: any) => {
      if (payload.new?.data) handlers.onSettings(payload.new.data);
    }
  );

  channel.subscribe();
  return () => {
    void sb.removeChannel(channel);
  };
}

// Flush whenever connectivity returns.
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void flushOutbox());
}
