import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

export async function fetchSettings() {
  const { data, error } = await supabase.from('site_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data ?? []).map(r => [r.key, r.value]));
}

export async function saveSettings(entries) {
  const rows = entries.map(({ key, value }) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
  const { error } = await supabaseAdmin.from('site_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}
