import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

export async function fetchUserOrders(userId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllOrders({ status, search } = {}) {
  let query = supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function insertOrder(orderData) {
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabaseAdmin.from('orders').update({ status }).eq('id', id);
  if (error) throw error;
}
