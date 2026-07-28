import { APP_CONFIG } from './config.js?v=20260728-4';

const { createClient } = window.supabase;
export const db = createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);

function assertNoError(error, context) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function listSupply() {
  const { data, error } = await db
    .from(APP_CONFIG.tables.supply)
    .select('*')
    .order('Name', { ascending: true });
  assertNoError(error, 'Unable to load supply');
  return data ?? [];
}

export async function saveSupplyItem(payload, id = null) {
  const query = id
    ? db.from(APP_CONFIG.tables.supply).update(payload).eq('id', id)
    : db.from(APP_CONFIG.tables.supply).insert(payload);
  const { data, error } = await query.select().single();
  assertNoError(error, 'Unable to save supply item');
  return data;
}

export async function deleteSupplyItem(id) {
  const { error } = await db.from(APP_CONFIG.tables.supply).delete().eq('id', id);
  assertNoError(error, 'Unable to delete supply item');
}

export async function listTransactions(limit = 200) {
  const { data, error } = await db
    .from(APP_CONFIG.tables.transactions)
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(limit);
  assertNoError(error, 'Unable to load supply movements');
  return data ?? [];
}

export async function createTransaction(payload) {
  const { data, error } = await db
    .from(APP_CONFIG.tables.transactions)
    .insert(payload)
    .select()
    .single();
  assertNoError(error, 'Unable to save supply movement');
  return data;
}

export async function listVendors() {
  const { data, error } = await db
    .from(APP_CONFIG.tables.vendors)
    .select('*')
    .order('name', { ascending: true });
  assertNoError(error, 'Unable to load vendors');
  return data ?? [];
}

export async function saveVendor(payload, id = null) {
  const query = id
    ? db.from(APP_CONFIG.tables.vendors).update(payload).eq('id', id)
    : db.from(APP_CONFIG.tables.vendors).insert(payload);
  const { data, error } = await query.select().single();
  assertNoError(error, 'Unable to save vendor');
  return data;
}

export async function deleteVendor(id) {
  const { error } = await db.from(APP_CONFIG.tables.vendors).delete().eq('id', id);
  assertNoError(error, 'Unable to delete vendor');
}