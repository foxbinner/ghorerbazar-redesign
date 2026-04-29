import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
}

// Service role client — bypasses RLS for all admin DB operations.
// global.headers forces the service role JWT on every request regardless of auth state.
// Unique storageKey prevents this client from reading the user's localStorage session.
export const supabaseAdmin = createClient(url, key, {
  global: {
    headers: {
      Authorization: `Bearer ${key}`,
    },
  },
  auth: {
    storageKey: 'gb_admin_srole',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
