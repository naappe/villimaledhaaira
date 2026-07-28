import { state, calculateStockBySupplyId, calculateStockValue } from './state.js';

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MVR' });
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
}

function supplyOptions(selected = '') {
  return state.supply.map((item) => `
    <option value="${item.id}" ${String(item.id) === String(selected) ? 'selected' : ''}>
      ${escapeHtml(item.Name || `Item ${item.id}`)} · ${escapeHtml(item.Unit || '')}
    </option>`).join('');
}

function vendorOptions(selected = '') {
  return state.vendors.map((vendor) => `
    <option value="${vendor.id}" ${String(vendor.id) === String(selected) ? 'selected' : ''}>
      ${escapeHtml(vendor.name)}
    </option>`).join('');
}

export function dashboardView() {
  const inTotal = state.transactions.filter((row) => row.direction === 'IN').reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const outTotal = state.transactions.filter((row) => row.direction === 'OUT').reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  return `
    <section class="page-heading"><div><h1>Supply Dashboard</h1><p>Current stock, movements, vendors, and item value.</p></div></section>
    <section class="grid kpis">
      <article class="card"><div class="kpi-label">Supply Items</div><div class="kpi-value">${number.format(state.supply.length)}</div></article>
      <article class="card"><div class="kpi-label">Supply In</div><div class="kpi-value">${number.format(inTotal)}</div></article>
      <article class="card"><div class="kpi-label">Supply Out</div><div class="kpi-value">${number.format(outTotal)}</div></article>
      <article class="card"><div class="kpi-label">Stock Value</div><div class="kpi-value">${money.format(calculateStockValue())}</div></article>
    </section>
    <section class="card" style="margin-top:var(--space-4)">
      <h2>Current Stock</h2>
      ${supplyTable(false)}
    </section>`;
}

export function movementView(direction) {
  const isIn = direction === 'IN';
  return `
    <section class="page-heading"><div><h1>Supply ${isIn ? 'In' : 'Out'}</h1><p>${isIn ? 'Receive stock from a vendor.' : 'Issue stock for use or transfer.'}</p></div></section>
    <section class="grid two">
      <form class="card" id="movement-form" data-direction="${direction}">
        <h2>New ${isIn ? 'Receipt' : 'Issue'}</h2>
        <div class="field"><label>Supply item</label><select class="select" name="supply_id" required><option value="">Select item</option>${supplyOptions()}</select></div>
        ${isIn ? `<div class="field"><label>Vendor</label><select class="select" name="vendor_id"><option value="">Select vendor</option>${vendorOptions()}</select></div>` : ''}
        <div class="form-grid">
          <div class="field"><label>Quantity</label><input class="input" type="number" min="0.001" step="0.001" name="quantity" required></div>
          <div class="field"><label>Date</label><input class="input" type="date" name="transaction_date" value="${new Date().toISOString().slice(0,10)}" required></div>
          <div class="field"><label>Reference</label><input class="input" name="reference_no" placeholder="Optional"></div>
        </div>
        <div class="field"><label>Notes</label><textarea class="textarea" name="notes" rows="3"></textarea></div>
        <button class="btn btn-primary" type="submit">Save Supply ${isIn ? 'In' : 'Out'}</button>
      </form>
      <article class="card"><h2>Recent ${isIn ? 'Receipts' : 'Issues'}</h2>${movementTable(direction)}</article>
    </section>`;
}

export function vendorsView() {
  return `
    <section class="page-heading"><div><h1>Vendors</h1><p>Maintain supplier contact details separately from inventory items.</p></div></section>
    <section class="grid two">
      <form class="card" id="vendor-form">
        <h2>${state.editingVendorId ? 'Edit Vendor' : 'Add Vendor'}</h2>
        <div class="field"><label>Name</label><input class="input" name="name" required></div>
        <div class="field"><label>Contact person</label><input class="input" name="contact_person"></div>
        <div class="form-grid">
          <div class="field"><label>Phone</label><input class="input" name="phone"></div>
          <div class="field"><label>Email</label><input class="input" type="email" name="email"></div>
          <div class="field"><label>TIN</label><input class="input" name="tin"></div>
        </div>
        <div class="field"><label>Address</label><textarea class="textarea" name="address" rows="3"></textarea></div>
        <div class="toolbar"><button class="btn btn-primary" type="submit">Save Vendor</button><button class="btn btn-secondary" type="reset">Clear</button></div>
      </form>
      <article class="card"><h2>Vendor Directory</h2>${vendorTable()}</article>
    </section>`;
}

export function adminView() {
  return `
    <section class="page-heading"><div><h1>Admin</h1><p>Manage supply master data and database setup.</p></div></section>
    <div class="notice">The current <strong>supply</strong> table remains the item master. Stock quantities come from the separate movement table, so editing CSS or page layout cannot change inventory mathematics.</div>
    <section class="grid two">
      <form class="card" id="supply-form">
        <h2>${state.editingSupplyId ? 'Edit Supply Item' : 'Add Supply Item'}</h2>
        <div class="form-grid">
          <div class="field"><label>Name</label><input class="input" name="Name" required></div>
          <div class="field"><label>Unit</label><input class="input" name="Unit" placeholder="kg, pcs, box"></div>
          <div class="field"><label>Rate</label><input class="input" type="number" min="0" step="0.0001" name="Rate"></div>
          <div class="field"><label>Category</label><input class="input" name="Catogories"></div>
          <div class="field"><label>Vendor</label><input class="input" name="Vendor"></div>
        </div>
        <div class="toolbar"><button class="btn btn-primary" type="submit">Save Item</button><button class="btn btn-secondary" type="reset">Clear</button></div>
      </form>
      <article class="card"><h2>System Structure</h2><p>Design: <code>css/tokens.css</code> and <code>css/app.css</code></p><p>Database: <code>js/db.js</code></p><p>Calculations: <code>js/state.js</code></p><p>Pages: <code>js/views.js</code></p><p>Events: <code>js/app.js</code></p></article>
    </section>
    <section class="card" style="margin-top:var(--space-4)"><h2>Supply Master</h2>${supplyTable(true)}</section>`;
}

function supplyTable(showActions) {
  if (!state.supply.length) return '<div class="empty">No supply items found.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Category</th><th>Unit</th><th>Rate</th><th>Stock</th><th>Value</th>${showActions ? '<th>Actions</th>' : ''}</tr></thead><tbody>${state.supply.map((item) => {
    const stock = calculateStockBySupplyId(item.id);
    return `<tr><td><strong>${escapeHtml(item.Name || '')}</strong></td><td>${escapeHtml(item.Catogories || '—')}</td><td>${escapeHtml(item.Unit || '—')}</td><td>${money.format(Number(item.Rate || 0))}</td><td>${number.format(stock)}</td><td>${money.format(stock * Number(item.Rate || 0))}</td>${showActions ? `<td><button class="btn btn-secondary" data-edit-supply="${item.id}">Edit</button> <button class="btn btn-danger" data-delete-supply="${item.id}">Delete</button></td>` : ''}</tr>`;
  }).join('')}</tbody></table></div>`;
}

function movementTable(direction) {
  const rows = state.transactions.filter((row) => row.direction === direction).slice(0, 25);
  if (!rows.length) return '<div class="empty">No movements yet.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Date</th><th>Item</th><th>Quantity</th><th>Reference</th></tr></thead><tbody>${rows.map((row) => {
    const item = state.supply.find((value) => Number(value.id) === Number(row.supply_id));
    return `<tr><td>${escapeHtml(row.transaction_date || '')}</td><td>${escapeHtml(item?.Name || `Item ${row.supply_id}`)}</td><td>${number.format(Number(row.quantity || 0))} ${escapeHtml(item?.Unit || '')}</td><td>${escapeHtml(row.reference_no || '—')}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function vendorTable() {
  if (!state.vendors.length) return '<div class="empty">No vendors found.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead><tbody>${state.vendors.map((vendor) => `<tr><td><strong>${escapeHtml(vendor.name)}</strong></td><td>${escapeHtml(vendor.contact_person || '—')}</td><td>${escapeHtml(vendor.phone || '—')}</td><td>${escapeHtml(vendor.email || '—')}</td><td><button class="btn btn-secondary" data-edit-vendor="${vendor.id}">Edit</button> <button class="btn btn-danger" data-delete-vendor="${vendor.id}">Delete</button></td></tr>`).join('')}</tbody></table></div>`;
}