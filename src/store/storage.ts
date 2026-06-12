import { get, set, del } from 'idb-keyval';
import { StateStorage } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// The single source of truth for persistence. Everything lives in IndexedDB
// (robust, large-capacity, offline, private — nothing leaves the device).
//
// This is deliberately a thin adapter behind Zustand's StateStorage interface.
// To add cloud sync later (e.g. Supabase), implement the same three methods
// against a remote store, or layer a sync engine on top — no call sites change.
// ---------------------------------------------------------------------------
export const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};
