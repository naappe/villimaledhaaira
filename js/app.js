import { listSupply, listTransactions, listVendors, saveSupplyItem, deleteSupplyItem, createTransaction, saveVendor, deleteVendor } from './db.js';
import { state, getSupplyById, getVendorById, calculateStockBySupplyId } from './state.js';
import { dashboardView, movementView, vendorsView, adminView } from './views.js';

const root = document.querySelector('#page-root');
const status = document.querySelector('#app-status');

const pages = {
  dashboard: dashboardView,
  'supply-in': () => movementView('IN'),
  'supply-out': () => movementView('OUT'),
  vendors: vendorsView,
  admin: adminView
};

function setStatus(message, type = 'info') {
  status.textContent = message;
  status.dataset.type = type;
}

function formPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function render(page = state.currentPage) {
  state.currentPage = pages[page] ? page : 'dashboard';
  root.innerHTML = pages[state.currentPage]();
  document.querySelectorAll('[data-page]').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === state.currentPage);
  });
  history.replaceState(null, '', `#${state.currentPage}`);
  document.body.classList.remove('menu-open');
}

async function importLegacyVendors() {
  if (state.vendors.length || !state.supply.length) return 0;

  const names = [...new Map(
    state.supply
      .map((item) => String(item.Vendor || '').trim())
      .filter(Boolean)
      .map((name) => [name.toLocaleLowerCase(), name])
  ).values()];

  if (!names.length) return 0;

  let imported = 0;
  for (const name of names) {
    try {
      await saveVendor({ name });
      imported += 1;
    } catch (error) {
      console.warn(`Could not import vendor "${name}":`, error);
    }
  }

  if (imported) state.vendors = await listVendors();
  return imported;
}

async function loadAll() {
  setStatus('Loading data…');

  const sources = [
    { name: 'supply', request: listSupply() },
    { name: 'supply_transactions', request: listTransactions() },
    { name: 'supply_vendors', request: listVendors() }
  ];

  const results = await Promise.allSettled(sources.map((source) => source.request));

  state.supply = results[0].status === 'fulfilled' ? results[0].value : [];
  state.transactions = results[1].status === 'fulfilled' ? results[1].value : [];
  state.vendors = results[2].status === 'fulfilled' ? results[2].value : [];

  const failed = results
    .map((result, index) => ({ result, table: sources[index].name }))
    .filter(({ result }) => result.status === 'rejected')
    .map(({ result, table }) => ({
      table,
      message: result.reason?.message || String(result.reason || 'Unknown database error')
    }));

  if (failed.length) {
    const failedNames = failed.map((item) => item.table).join(', ');
    setStatus(`Setup required: ${failedNames}`, 'warning');
    console.group('Supabase table load errors');
    failed.forEach((item) => console.error(`${item.table}: ${item.message}`));
    console.info('Run supabase/schema.sql in the Supabase SQL Editor, then refresh this page.');
    console.groupEnd();
  } else {
    const imported = await importLegacyVendors();
    setStatus(imported ? `Connected · ${imported} vendors imported` : 'Connected to Supabase', 'success');
  }

  render(location.hash.slice(1) || 'dashboard');
}

document.addEventListener('click', async (event) => {
  const nav = event.target.closest('[data-page]');
  if (nav) return render(nav.dataset.page);

  if (event.target.closest('[data-menu-toggle]')) {
    document.body.classList.toggle('menu-open');
    return;
  }

  const editSupply = event.target.closest('[data-edit-supply]');
  if (editSupply) {
    state.editingSupplyId = Number(editSupply.dataset.editSupply);
    render('admin');
    const item = getSupplyById(state.editingSupplyId);
    const form = document.querySelector('#supply-form');
    Object.entries(item || {}).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? '';
    });
    form.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const removeSupply = event.target.closest('[data-delete-supply]');
  if (removeSupply) {
    const id = Number(removeSupply.dataset.deleteSupply);
    if (!confirm('Delete this supply item? Existing movements may depend on it.')) return;
    try {
      await deleteSupplyItem(id);
      state.supply = state.supply.filter((item) => Number(item.id) !== id);
      render('admin');
      setStatus('Supply item deleted', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
    return;
  }

  const editVendor = event.target.closest('[data-edit-vendor]');
  if (editVendor) {
    state.editingVendorId = Number(editVendor.dataset.editVendor);
    render('vendors');
    const vendor = getVendorById(state.editingVendorId);
    const form = document.querySelector('#vendor-form');
    Object.entries(vendor || {}).forEach(([key, value]) => {
      if (form.elements[key]) form.elements[key].value = value ?? '';
    });
    return;
  }

  const removeVendor = event.target.closest('[data-delete-vendor]');
  if (removeVendor) {
    const id = Number(removeVendor.dataset.deleteVendor);
    if (!confirm('Delete this vendor?')) return;
    try {
      await deleteVendor(id);
      state.vendors = state.vendors.filter((vendor) => Number(vendor.id) !== id);
      render('vendors');
      setStatus('Vendor deleted', 'success');
    } catch (error) { setStatus(error.message, 'error'); }
  }
});

document.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;

  try {
    if (form.id === 'supply-form') {
      const payload = formPayload(form);
      payload.Rate = payload.Rate === '' ? null : Number(payload.Rate);
      const saved = await saveSupplyItem(payload, state.editingSupplyId);
      state.supply = state.editingSupplyId
        ? state.supply.map((item) => Number(item.id) === Number(saved.id) ? saved : item)
        : [...state.supply, saved];
      state.editingSupplyId = null;
      render('admin');
      return setStatus('Supply item saved', 'success');
    }

    if (form.id === 'movement-form') {
      const payload = formPayload(form);
      payload.direction = form.dataset.direction;
      payload.supply_id = Number(payload.supply_id);
      payload.vendor_id = payload.vendor_id ? Number(payload.vendor_id) : null;
      payload.quantity = Number(payload.quantity);
      const currentStock = calculateStockBySupplyId(payload.supply_id);
      if (payload.direction === 'OUT' && payload.quantity > currentStock) {
        throw new Error(`Insufficient stock. Available: ${currentStock}`);
      }
      const saved = await createTransaction(payload);
      state.transactions.unshift(saved);
      render(payload.direction === 'IN' ? 'supply-in' : 'supply-out');
      return setStatus(`Supply ${payload.direction.toLowerCase()} saved`, 'success');
    }

    if (form.id === 'vendor-form') {
      const payload = formPayload(form);
      const saved = await saveVendor(payload, state.editingVendorId);
      state.vendors = state.editingVendorId
        ? state.vendors.map((vendor) => Number(vendor.id) === Number(saved.id) ? saved : vendor)
        : [...state.vendors, saved];
      state.editingVendorId = null;
      render('vendors');
      return setStatus('Vendor saved', 'success');
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message, 'error');
  }
});

document.addEventListener('reset', (event) => {
  if (event.target.id === 'supply-form') state.editingSupplyId = null;
  if (event.target.id === 'vendor-form') state.editingVendorId = null;
  queueMicrotask(() => render(state.currentPage));
});

window.addEventListener('hashchange', () => render(location.hash.slice(1)));
loadAll().catch((error) => {
  console.error(error);
  setStatus(error.message, 'error');
});