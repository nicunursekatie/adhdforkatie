import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Keys come from env (Vite exposes VITE_*). Never hard-code them.
// See SUPABASE_SETUP.md for how to create a project and fill these in.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
