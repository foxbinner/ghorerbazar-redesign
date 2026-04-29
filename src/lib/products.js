import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';

export async function fetchProducts({ category, brand, flag, search, page = 1, perPage = 20 } = {}) {
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category) query = query.eq('item_category', category);
  if (brand)    query = query.eq('item_brand', brand);
  if (flag)     query = query.eq('product_flag', flag);
  if (search)   query = query.ilike('product_name', `%${search}%`);

  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { products: data ?? [], total: count ?? 0 };
}

export async function fetchAllProducts({ category, category2, brand, flag, search, limit } = {}) {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category)  query = query.eq('item_category', category);
  if (category2) query = query.eq('item_category2', category2);
  if (brand)     query = query.eq('item_brand', brand);
  if (flag)      query = query.eq('product_flag', flag);
  if (search)    query = query.ilike('product_name', `%${search}%`);
  if (limit)     query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (error) return null;
  return data;
}

export async function fetchRelatedProducts(category, excludeSlug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('item_category', category)
    .eq('is_active', true)
    .neq('slug', excludeSlug)
    .limit(8);
  if (error) return [];
  return data ?? [];
}

export async function fetchProductsBySlugs(slugs) {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('slug', slugs)
    .eq('is_active', true);
  if (error) return [];
  return data ?? [];
}

// Admin functions
export async function adminFetchAllProducts({ search, category, flag } = {}) {
  let query = supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (search)   query = query.ilike('product_name', `%${search}%`);
  if (category) query = query.eq('item_category', category);
  if (flag)     query = query.eq('product_flag', flag);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function adminUpsertProduct(product) {
  const { id, ...fields } = product;
  if (id) {
    const { error } = await supabaseAdmin.from('products').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('products').insert(fields);
    if (error) throw error;
  }
}

export async function adminDeleteProduct(id) {
  const { error } = await supabaseAdmin.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

export async function adminHardDeleteProduct(id) {
  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Categories
export async function fetchCategories() {
  const { data, error } = await supabaseAdmin.from('categories').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function upsertCategory(id, fields) {
  if (id) {
    const { error } = await supabaseAdmin.from('categories').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('categories').insert(fields);
    if (error) throw error;
  }
}

export async function deleteCategory(id) {
  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// Brands
export async function fetchBrands() {
  const { data, error } = await supabaseAdmin.from('brands').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}

export async function upsertBrand(id, fields) {
  if (id) {
    const { error } = await supabaseAdmin.from('brands').update(fields).eq('id', id);
    if (error) throw error;
  } else {
    const { error } = await supabaseAdmin.from('brands').insert(fields);
    if (error) throw error;
  }
}

export async function deleteBrand(id) {
  const { error } = await supabaseAdmin.from('brands').delete().eq('id', id);
  if (error) throw error;
}
