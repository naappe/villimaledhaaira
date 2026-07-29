# Ewity POS Professional Design System

This document is the canonical visual contract for the application. New pages must use the shared tokens and components; page-specific CSS must not redefine colors, typography, control geometry, table density, navigation dimensions, or interaction states.

## Design direction

Ewity is enterprise operational software. The interface must feel precise, calm, dense, and trustworthy. It must not use cartoon illustrations, oversized dashboard cards, decorative gradients, emoji icons, playful copy, or excessive rounding.

## Foundation

### Typography

- Font: Inter with system fallbacks
- Page title: 24px / 600
- Section title: 14–18px / 600
- Body and controls: 12px / 400–500
- Table headers and labels: 10px / 600, uppercase only where useful
- Monetary totals: tabular, 18–24px / 600

### Color

- Navigation: `#111827`
- Primary action: `#2854D8`
- Workspace: `#F4F6F9`
- Surface: `#FFFFFF`
- Strong text: `#101828`
- Body text: `#344054`
- Muted text: `#667085`
- Border: `#E1E5EB`
- Success: `#087A38` on `#DCFAE6`
- Warning: `#C2410C` on `#FFEAD5`
- Danger: `#B42318` on `#FEE4E2`

### Geometry

- Sidebar: 232px expanded / 56px collapsed
- Top bar: 60px
- Workspace padding: 30px desktop / 16px mobile
- Standard control height: 36px
- Standard operational row: 48px
- Radius: 3px, 4px, or 6px only
- Spacing follows a 4px base scale

## Components

### Navigation

Use dark navy navigation with monochrome line icons. Active pages use a restrained blue indicator and darker row—not a large colored block.

### Buttons

- Primary: solid blue, white label
- Secondary: white, neutral border
- Destructive: red, reserved for confirmed destructive actions
- Icon-only buttons require an accessible label and a real SVG icon
- Do not use Unicode symbols as production icons

### Forms

Labels are explicit and remain visible. Inputs use neutral borders, white surfaces, 36px height, and a blue focus ring. Validation appears beside the relevant field.

### Tables

Operational data uses tables instead of decorative cards. Headers are compact, rows are 48–54px, numbers align consistently, statuses use restrained semantic pills, and actions remain at the right edge.

### Summary metrics

Use summary cards only for decision-relevant totals. Cards have white surfaces, neutral borders, minimal shadow, and no decorative illustrations.

### Modals

Use modals for short, focused tasks. Long workflows use dedicated pages or side panels. Browser `alert()` is not an approved production interaction.

## Responsive behavior

Desktop preserves dense tables and a fixed navigation system. Tablet uses a drawer and stacked summaries. Mobile converts toolbars and forms to one column while retaining 44px minimum touch targets.

## Governance

1. Tokens belong only in `css/01-tokens.css`.
2. Reset and global interaction behavior belong only in `css/02-reset.css`.
3. Shell geometry belongs in `css/03-layout.css` through `css/06-content.css`.
4. Shared components belong in `css/07-components.css`.
5. Charts belong only in `css/08-charts.css`.
6. Responsive rules belong only in `css/09-responsive.css`.
7. Do not append temporary override layers.
8. Remove obsolete selectors when their components are deleted.
9. Every new page must be tested at desktop, tablet, and mobile widths.
