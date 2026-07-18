# White Saffron Finance

A mobile-friendly bill entry, bill total, rate history, and vendor price comparison website for Cafe' White Saffron.

Live site: `https://naappe.github.io/villimaledhaaira/`

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Pages
- Browser `localStorage`

No framework, server, package manager, or build process is required.

## Current File Structure

```text
villimaledhaaira/
├── index.html          # Complete Finance application
├── price-cards.html    # Standalone price comparison page
└── README.md           # System documentation
```

## Main Pages

### 1. Bill Entry

Used to enter and save a supplier bill.

Required bill fields:

- Vendor
- Bill date
- At least one valid item row

Item fields:

- Description
- Unit
- Quantity
- Pack format
- Rate

The entry table calculates rates before the bill is saved.

### 2. Bill Total

Shows saved bills and summary totals.

Functions:

- Search by vendor or item
- Total bill count
- Net total
- GST total
- Grand total
- Saved bill list

### 3. Rate History

Shows item rates from saved bills.

Functions:

- Search by item or vendor
- View historical vendor rates
- Compare a rate with the previous saved rate
- Show percentage increase, decrease, or no change

### 4. Price Cards

Shows simple purchasing prices as cards.

For weight items, each card keeps:

- Item name
- Vendor
- Date
- Price per 1 KG
- Price per 1 G
- Comparison with another vendor

For liquid items:

- Price per 1 L
- Price per 1 ML

For piece items:

- Price per 1 PCS

## Browser Storage

Saved bills are stored in the browser under:

```js
whiteSaffronMultiBillsV3
```

Storage type:

```js
localStorage
```

Important consequences:

- Data is available only in the browser where it was saved.
- Clearing browser storage removes the saved bills.
- Opening the website on another device does not automatically show the same data.
- A future Supabase integration would be required for shared multi-device storage.

## Bill Data Structure

Each saved bill follows this general structure:

```js
{
  id: 1720000000000,
  vendor: "STO",
  date: "2026-07-18",
  status: "Paid",
  payment: "Cash",
  items: [],
  net: 100,
  gst: 8,
  total: 108
}
```

Each item contains the entered values and calculated values:

```js
{
  desc: "Kaashi",
  unit: "CSE",
  qty: 1,
  pack: "50x1 kg",
  rate: 100,
  packRate: 2,
  majorRate: 2,
  minorRate: 0.002,
  majorLabel: "KG",
  minorLabel: "G",
  total: 100
}
```

## Supported Pack Format

The parser expects:

```text
SIZE x COUNT UNIT
```

Accepted multiplication characters:

```text
x
×
*
```

Supported measurements:

```text
kg
g
l
ml
pcs
pc
```

Examples:

```text
500x10 g
1x50 kg
330x24 ml
1x12 l
1x24 pcs
```

## Pack Parsing

For:

```text
50x1 kg
```

The system reads:

```text
size = 50
count = 1
measurement = kg
```

If bill quantity is `1`, the total number of packs is:

```text
packs = quantity × count
packs = 1 × 1
packs = 1
```

## Core Formulas

### Line Total

```text
Line Total = Quantity × Rate
```

Example:

```text
1 × MVR 100 = MVR 100
```

### Total Number of Packs

```text
Total Packs = Quantity × Pack Count
```

### Weight Conversion

When the pack unit is kilograms:

```text
Total Grams = Total Packs × Pack Size × 1000
```

When the pack unit is grams:

```text
Total Grams = Total Packs × Pack Size
```

Then:

```text
Total KG = Total Grams ÷ 1000
```

### Price per KG

```text
Price per 1 KG = Entered Rate ÷ Total KG
```

Example:

```text
Rate = MVR 100
Total KG = 50
Price per KG = 100 ÷ 50
Price per KG = MVR 2
```

### Price per Gram

```text
Price per 1 G = Entered Rate ÷ Total Grams
```

Example:

```text
Rate = MVR 100
Total Grams = 50,000
Price per G = 100 ÷ 50,000
Price per G = MVR 0.002
```

### Liquid Conversion

When the pack unit is litres:

```text
Total ML = Total Packs × Pack Size × 1000
```

When the pack unit is millilitres:

```text
Total ML = Total Packs × Pack Size
```

Then:

```text
Total L = Total ML ÷ 1000
```

### Price per Litre

```text
Price per 1 L = Entered Rate ÷ Total L
```

### Price per Millilitre

```text
Price per 1 ML = Entered Rate ÷ Total ML
```

### Piece Calculation

```text
Total PCS = Total Packs × Pack Size
```

```text
Price per 1 PCS = Entered Rate ÷ Total PCS
```

### Price per Pack

```text
Price per Pack = Entered Rate ÷ Total Packs
```

This calculation is retained internally even when it is not displayed on the Price Cards page.

## GST Formulas

### Add GST

When GST is exclusive:

```text
GST = Subtotal × GST Rate ÷ 100
Grand Total = Subtotal + GST
Net Total = Subtotal
```

Example with 8% GST:

```text
Subtotal = MVR 100
GST = 100 × 8 ÷ 100 = MVR 8
Grand Total = MVR 108
```

### GST Included

When the entered total already includes GST:

```text
Net Total = Entered Total ÷ (1 + GST Rate ÷ 100)
GST = Entered Total - Net Total
Grand Total = Entered Total
```

### Without GST

```text
Net Total = Subtotal
GST = 0
Grand Total = Subtotal
```

## Rate History Formula

For the same vendor and item:

```text
Difference = Current Rate - Previous Rate
```

```text
Percentage Change = Difference ÷ Previous Rate × 100
```

Display rules:

- Positive result: price increased
- Negative result: price decreased
- Zero: no change
- No previous record: first price

## Vendor Comparison Formula

The Price Cards page groups records by normalized item description and measurement type.

It excludes the current vendor and finds another vendor price for the same item.

```text
Difference = Current Unit Price - Comparison Vendor Unit Price
```

```text
Percentage Difference = Absolute Difference ÷ Comparison Vendor Unit Price × 100
```

Results:

- Lower current price: cheaper
- Higher current price: more expensive
- Equal price: same price
- No matching vendor: no other vendor price available

## Important Functions

The application uses functions with responsibilities similar to the following:

### `parsePack(value)`

Parses pack text such as `500x10 g` into size, count, and measurement.

### `calc(row)`

Calculates:

- Total weight, volume, or pieces
- Pack rate
- Major-unit rate
- Minor-unit rate
- Line total

### `renderRows()`

Creates and refreshes bill-entry rows.

### `rowCalc(index)`

Updates the live calculations for one item row.

### `valid()`

Returns complete and valid item rows only.

### `totals()`

Calculates net, GST, and grand total.

### `renderTotals()`

Displays the current bill summary.

### `renderSaved()`

Displays saved bill records and bill KPIs.

### `renderRates()`

Displays rate history and previous-price changes.

### `renderPriceCards()`

Builds price cards and vendor comparisons.

### `showPage(pageName)`

Changes the visible application page and updates the URL hash.

## Navigation Structure

The main application uses page sections inside `index.html`.

Typical URL hashes:

```text
#entry
#totals
#rates
#prices
```

The default page is Bill Entry.

## Theme Structure

The interface uses a shared dark theme:

```text
Background: dark charcoal
Panels: charcoal cards
Accent: amber
Positive price movement: green
Negative price movement: red
Neutral comparison: yellow
```

The same design system is used for:

- Navigation
- Forms
- Tables
- KPI cards
- Price cards
- Buttons
- Filters
- Empty states
- Mobile layout

## Validation Rules

A bill cannot be saved unless:

- Vendor is entered
- Date is selected
- At least one item has a description
- Quantity is valid
- Pack format is valid
- Rate is greater than zero

Rows that cannot be parsed are not included in the saved bill.

## Known Limitation

The current application is local-browser based. It is not yet a shared ERP database.

For production multi-user use, recommended future work is:

1. Move bills and items to Supabase.
2. Add authenticated users and roles.
3. Store vendors in a dedicated table.
4. Store products with normalized names and units.
5. Add edit and delete permissions.
6. Add automatic backups and exports.
7. Add server-side reporting and audit history.

## Deployment

GitHub Pages serves the files directly from the repository.

After a commit reaches the publishing branch, allow GitHub Pages a short time to deploy the update.
