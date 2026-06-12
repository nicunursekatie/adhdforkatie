import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public Supabase config for this app.
//
// These two values are PUBLIC by design — the publishable key is meant to be
// shipped in the browser bundle, and all data access is protected by Row-Level
// Security (see supabase/schema.sql), not by keeping the key secret. They're
// baked in as defaults so deploys work with no extra setup; you can still
// override them with VITE_SUPABASE_* env vars (e.g. to point at another project).
const DEFAULT_URL = 'https://ruhyfserlmdhdydknyjk.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_hoD7cjxs7hKUbHVDh3j4Ig__eSedMea';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || DEFAULT_URL;
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || DEFAULT_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// `null` when not configured so the app can show a setup screen instead of crashing.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // needed for magic-link callbacks
        flowType: 'pkce', // code in query string — avoids clashing with hash routing
      },
    })
  : null;
