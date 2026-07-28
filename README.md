# Villimalé Supply Management

A static GitHub Pages inventory application connected to Supabase.

## Pages

- Dashboard — stock totals and value
- Supply In — receive inventory from vendors
- Supply Out — issue inventory with stock validation
- Vendors — separate vendor directory
- Admin — supply item master management

## Architecture rule

Visual design is deliberately separated from application behavior:

- `css/tokens.css` — colors, padding, spacing, radius, typography, sidebar width
- `css/app.css` — component and responsive layout styles
- `js/config.js` — public environment configuration and table names
- `js/db.js` — Supabase queries only
- `js/state.js` — inventory calculations and application state only
- `js/views.js` — HTML rendering only
- `js/app.js` — navigation, forms, and event handlers only

Changing CSS variables or layout styles does not change stock calculations or database operations.

## Supabase setup

1. Keep the existing `public.supply` table.
2. Open the Supabase SQL Editor.
3. Run `supabase/schema.sql` once.
4. Ensure `public.supply` has suitable RLS policies if RLS is enabled.

`public.supply_transactions` is the stock ledger. Current stock is calculated as:

```text
SUM(IN quantity) - SUM(OUT quantity)
```

Do not store editable stock balances directly in the item master. The movement ledger preserves history and prevents silent stock corruption.

## Security note

The publishable Supabase key is safe to expose in a browser application only when Row Level Security policies correctly restrict access. The starter SQL contains temporary public policies so the prototype can operate. Replace them with authenticated admin/staff policies before using sensitive or production data.
