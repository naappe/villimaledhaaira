export const state = {
  supply: [],
  transactions: [],
  vendors: [],
  currentPage: 'dashboard',
  editingSupplyId: null,
  editingVendorId: null
};

export function getSupplyById(id) {
  return state.supply.find((item) => Number(item.id) === Number(id));
}

export function getVendorById(id) {
  return state.vendors.find((vendor) => Number(vendor.id) === Number(id));
}

export function calculateStockBySupplyId(supplyId) {
  return state.transactions.reduce((stock, row) => {
    if (Number(row.supply_id) !== Number(supplyId)) return stock;
    const quantity = Number(row.quantity || 0);
    return row.direction === 'OUT' ? stock - quantity : stock + quantity;
  }, 0);
}

export function calculateStockValue() {
  return state.supply.reduce((total, item) => {
    return total + calculateStockBySupplyId(item.id) * Number(item.Rate || 0);
  }, 0);
}
