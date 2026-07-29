import { DATA } from './data.js';
import { initSidebar } from './sidebar.js';
import { initFilters } from './filters.js';
import { renderLineChart } from './charts.js';
import { renderKPIs } from './kpi.js';
import { renderTable } from './table.js';
import { initExpenses } from './expenses.js';

const state={sidebarCollapsed:false,drawerOpen:false,outletId:'all',dateRange:{...DATA.meta.range},sort:{key:'revenue',dir:-1}};
const routes={dashboard:{file:'dashboard.html',title:'Sales Dashboard'},expenses:{file:'expenses.html',title:'Expenses'}};
function filterSeries(rows){const{from,to}=state.dateRange;return rows.filter(({date})=>(!from||date>=from)&&(!to||date<=to))}
function renderDashboard(){renderLineChart(filterSeries(DATA.series.netSales),document.querySelector('#net-sales-chart'),{money:true});renderLineChart(filterSeries(DATA.series.salesCount),document.querySelector('#sales-count-chart'));renderKPIs(DATA.kpis,document.querySelector('#kpi-grid'));renderTable(DATA.topProducts,document.querySelector('#products-table'),state)}
function initBanner(){const banner=document.querySelector('#mobile-banner');if(!banner)return;if(localStorage.getItem('ewity-mobile-banner-dismissed')==='true')banner.hidden=true;document.querySelector('#dismiss-banner')?.addEventListener('click',()=>{banner.hidden=true;localStorage.setItem('ewity-mobile-banner-dismissed','true')})}
async function navigate(routeName){const name=routes[routeName]?routeName:'dashboard',route=routes[name],response=await fetch(`./${route.file}?v=4`);if(!response.ok)throw new Error(`${route.title} could not be loaded (${response.status})`);document.querySelector('#content').innerHTML=await response.text();document.querySelector('#page-title').textContent=route.title;document.title=`Ewity POS · ${route.title}`;document.querySelectorAll('[data-route]').forEach(x=>x.classList.toggle('active',x.dataset.route===name));history.replaceState(null,'',name==='dashboard'?'#dashboard':`#${name}`);if(name==='dashboard'){initFilters(DATA,state,renderDashboard);initBanner();renderDashboard()}if(name==='expenses')initExpenses();document.querySelector('.app').classList.remove('drawer-open');window.scrollTo(0,0)}
async function bootstrap(){initSidebar(state);document.addEventListener('click',event=>{const link=event.target.closest('[data-route]');if(!link)return;event.preventDefault();navigate(link.dataset.route).catch(showError)});await navigate(location.hash.slice(1)||'dashboard')}
function showError(error){console.error(error);document.querySelector('#content').innerHTML=`<section class="card load-error"><h1>Page unavailable</h1><p>${error.message}</p></section>`}
bootstrap().catch(showError);
