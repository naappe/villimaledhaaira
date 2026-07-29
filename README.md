# Ewity POS Sales Dashboard

A complete, responsive Ewity-style sales dashboard implemented in vanilla HTML, CSS, and JavaScript from the supplied design-system specification.

## Run

Serve the repository with any static web server and open `index.html`. GitHub Pages can serve the project directly; no build command or framework is required.

## Canonical structure

- `index.html` — application shell
- `dashboard.html` — Sales Dashboard view
- `assets/` — logo, icon sprite, and avatar
- `css/01-tokens.css` — colors, type, spacing, dimensions, radius, and shadows
- `css/02-reset.css` — reset and base rules
- `css/03-layout.css` — application shell
- `css/04-sidebar.css` — navigation and collapsed state
- `css/05-topbar.css` — top bar and account area
- `css/06-content.css` — page layout and filters
- `css/07-components.css` — cards, banner, KPIs, table, and modal
- `css/08-charts.css` — SVG chart styling and tooltip
- `css/09-responsive.css` — desktop, tablet, and mobile behavior
- `js/data.js` — mock sales data only
- `js/app.js` — dashboard bootstrap
- `js/sidebar.js` — navigation, drawer, submenu, and register interactions
- `js/filters.js` — outlet and date filters
- `js/charts.js` — SVG line chart rendering
- `js/kpi.js` — KPI rendering and drill-down interaction
- `js/table.js` — product table rendering and sorting
- `js/utils.js` — shared formatters

## Design system

The application uses Inter with a system fallback, Ewity blue `#356ec9`, dark blue `#2b5aa6`, app background `#f5f6f8`, white cards, a 180px desktop sidebar (56px collapsed), a 44px top bar, 24px content padding, 16px grid gaps, and 200px chart regions.

## Included behavior

- Collapsible desktop sidebar and mobile off-canvas drawer
- Exclusive expandable navigation submenus
- Register demonstration modal
- Outlet and date-range filters
- Two interactive SVG line charts with hover tooltips
- Dismissible mobile-app banner persisted with `localStorage`
- Eleven clickable KPI cards
- Sortable top-selling-products table with detail actions
- Responsive layouts at desktop, tablet, and mobile breakpoints

The supplied specification defines a front-end dashboard prototype. Backend services, authentication, real-time updates, exports, global search, and notification services are intentionally outside this implementation.
