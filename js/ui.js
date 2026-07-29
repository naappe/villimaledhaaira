const THEME_KEY = 'villimale-supply-theme';

function resolvedTheme(preference) {
  if (preference !== 'system') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(preference) {
  document.documentElement.dataset.theme = resolvedTheme(preference);
  document.documentElement.dataset.themePreference = preference;
}

function installThemeControl() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || document.querySelector('#globalThemeControl')) return;

  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);

  const control = document.createElement('label');
  control.id = 'globalThemeControl';
  control.className = 'theme-control';
  control.innerHTML = `<span>Theme</span><select aria-label="Colour theme">
    <option value="system">System</option>
    <option value="light">Light</option>
    <option value="dark">Dark</option>
    <option value="high-contrast">High contrast</option>
  </select>`;
  control.querySelector('select').value = saved;
  control.querySelector('select').addEventListener('change', (event) => {
    localStorage.setItem(THEME_KEY, event.target.value);
    applyTheme(event.target.value);
  });
  topbar.insertBefore(control, topbar.lastElementChild);

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem(THEME_KEY) || 'system') === 'system') applyTheme('system');
  });
}

const REGION_LABELS = Object.freeze({
  'page-header': 'Page Header',
  'filter-toolbar': 'Filter / Toolbar',
  'kpi-summary': 'KPI Summary',
  'kpi-card': 'KPI Cards',
  'primary-content': 'Primary Content',
  'secondary-panel': 'Secondary Panel',
  'supporting-content': 'Supporting Content',
  'card-header': 'Card Header',
  'card-body': 'Card Body',
  'data-table': 'Data Table',
  'form-fields': 'Form / Fields',
  actions: 'Actions',
  pagination: 'Pagination'
});

let highlightTimer = null;

function visibleTargets(area) {
  return [...document.querySelectorAll(`[data-layout-area="${area}"]`)]
    .filter((element) => !element.closest('[role="dialog"]'))
    .filter((element) => element.getClientRects().length > 0);
}

function clearHighlights() {
  document.querySelectorAll('.layout-helper-highlight').forEach((element) => {
    element.classList.remove('layout-helper-highlight');
  });
}

function highlightArea(area) {
  const targets = visibleTargets(area);
  if (!targets.length) return;
  clearTimeout(highlightTimer);
  clearHighlights();
  targets.forEach((element) => element.classList.add('layout-helper-highlight'));
  targets[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
  highlightTimer = window.setTimeout(clearHighlights, 2200);
}

function detectedAreas() {
  return Object.keys(REGION_LABELS).filter((area) => visibleTargets(area).length > 0);
}

export function installPageHelper() {
  installThemeControl();
  document.querySelector('#globalPageHelper')?.remove();
  clearHighlights();

  const areas = detectedAreas();
  if (!areas.length) return;

  const helper = document.createElement('div');
  helper.id = 'globalPageHelper';
  helper.className = 'page-helper';
  helper.innerHTML = `
    <button class="page-helper-toggle" type="button" aria-expanded="false" aria-controls="pageHelperPanel">Page helper</button>
    <section class="page-helper-panel" id="pageHelperPanel" aria-label="Page structure" hidden>
      <div class="page-helper-head"><strong>Page structure</strong><button type="button" data-helper-close aria-label="Close page helper">×</button></div>
      <p>Select a region to find it on this page.</p>
      <div class="page-helper-list">
        ${areas.map((area) => `<button type="button" data-helper-area="${area}"><span>${REGION_LABELS[area]}</span><small>${visibleTargets(area).length}</small></button>`).join('')}
      </div>
    </section>`;

  document.body.append(helper);
  const toggle = helper.querySelector('.page-helper-toggle');
  const panel = helper.querySelector('.page-helper-panel');

  function setOpen(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => setOpen(panel.hidden));
  helper.querySelector('[data-helper-close]').addEventListener('click', () => setOpen(false));
  helper.addEventListener('click', (event) => {
    const button = event.target.closest('[data-helper-area]');
    if (!button) return;
    highlightArea(button.dataset.helperArea);
    if (window.matchMedia('(max-width: 560px)').matches) setOpen(false);
  });
}
