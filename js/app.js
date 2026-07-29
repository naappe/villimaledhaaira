import { DATA } from './data.js';
import { initSidebar } from './sidebar.js';
import { initFilters } from './filters.js';
import { renderLineChart } from './charts.js';
import { renderKPIs } from './kpi.js';
import { renderTable } from './table.js';

const state = {
  sidebarCollapsed: false,
  drawerOpen: false,
  outletId: 'all',
  dateRange: { ...DATA.meta.range },
  sort: { key: 'revenue', dir: -1 }
};

function filterSeries(rows) {
  const { from, to } = state.dateRange;
  return rows.filter(({ date }) => (!from || date >= from) && (!to || date <= to));
}

function renderDashboard() {
  renderLineChart(filterSeries(DATA.series.netSales), document.querySelector('#net-sales-chart'), { money: true });
  renderLineChart(filterSeries(DATA.series.salesCount), document.querySelector('#sales-count-chart'));
  renderKPIs(DATA.kpis, document.querySelector('#kpi-grid'));
  renderTable(DATA.topProducts, document.querySelector('#products-table'), state);
}

function initBanner() {
  const banner = document.querySelector('#mobile-banner');
  if (!banner) return;
  if (localStorage.getItem('ewity-mobile-banner-dismissed') === 'true') banner.hidden = true;
  document.querySelector('#dismiss-banner')?.addEventListener('click', () => {
    banner.hidden = true;
    localStorage.setItem('ewity-mobile-banner-dismissed', 'true');
  });
}

async function bootstrap() {
  const response = await fetch('./dashboard.html');
  if (!response.ok) throw new Error(`Dashboard could not be loaded (${response.status})`);
  document.querySelector('#content').innerHTML = await response.text();
  initSidebar(state);
  initFilters(DATA, state, renderDashboard);
  initBanner();
  renderDashboard();
}

bootstrap().catch((error) => {
  console.error(error);
  document.querySelector('#content').innerHTML = `<section class="card load-error"><h1>Dashboard unavailable</h1><p>${error.message}</p></section>`;
});
