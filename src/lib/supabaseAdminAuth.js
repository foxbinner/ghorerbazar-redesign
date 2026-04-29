import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

// Admin panel session client — anon key + isolated storage key.
// Keeps admin login session separate from user session.
export const supabaseAdminAuth = createClient(url, key, {
  auth: {
    storageKey: 'gb_admin_auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
