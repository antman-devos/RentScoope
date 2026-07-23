# RentScoope

See what similar homes cost before you decide. RentScoope collects rental
listings for a Malaysian area from [Speedhome](https://speedhome.com),
normalizes them, and gives you price/size analytics plus CSV/Excel export —
so a renter can sanity-check whether an asking price is fair before signing.

## Setup & running locally

Requires Node.js 20+.

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build        # production build
npm run start         # serve the production build
npm run lint           # ESLint
npm run typecheck      # tsc --noEmit
npm run test:parser    # fixture test for the Speedhome parser (no network needed)
```

No environment variables or API keys are required — there's no backend
besides the app's own `/api/collect` route.

## Architecture

```
Search input (area name or Speedhome URL)
        │
        ▼
Collector (features/collector)   — fetches paginated Speedhome HTML,
                                    respects robots.txt + request delay
        │
        ▼
Parser (features/parser)         — Cheerio: HTML → RawListingFields[]
        │
        ▼
Normalizer (features/normalizer) — RawListingFields[] → typed Listing[]
        │
        ▼
Analytics Engine (features/analytics) — Listing[] → DashboardModel
        │
        ▼
Dashboard UI (components/*)      — cards, charts, tables, export
```

- **`app/api/collect/route.ts`** is the only place the four features/*
  modules are wired together server-side (Cheerio and real network fetches
  need the Node runtime, not the browser or the Edge runtime).
- **`lib/collection-service.ts`** is the single function (`runCollection`)
  the UI calls. It hits `/api/collect` and reports progress. Its internals
  changed twice during this build (mock simulation → real API call) without
  the UI or `hooks/useCollection.ts` changing at all — that seam is
  deliberate.
- **`hooks/useCollection.ts`** owns the Idle → Searching → Collecting →
  Parsing → Normalizing → Analyzing → Completed/Failed state machine
  (`types/collection.ts`) and exposes it to `app/page.tsx`.
- **Types are the contract.** `types/raw.ts` (`RawListingFields`, all
  nullable strings — the parser must never throw on a missing field),
  `types/listing.ts` (`Listing`, the only shape the UI/analytics may
  touch), and `types/analytics.ts` (`DashboardModel`) were fixed in
  Milestone 1 and every later milestone was built to match them exactly.
- **Demo-data fallback.** If live collection fails, the error screen offers
  an explicit "View demo data instead" button (`getDemoDashboard` in
  `lib/collection-service.ts`). It's never triggered automatically and the
  resulting dashboard is always labeled "Demo data" — so a demo is never
  mistaken for live results.

## Data collection strategy (Milestone 3)

Investigated Speedhome directly (see "Known Limitations" for how) and chose
**HTML + Cheerio** over a public JSON endpoint (none was found — see
Milestone 5 notes below) or Playwright (unnecessary weight for cards that
render in plain HTML, and no evidence it would fare better against the
site's bot protection anyway).

Confirmed by direct inspection:
- Listings live at `speedhome.com/rent/<area-slug>`, paginated with
  `?page=N`.
- Each card links to `speedhome.com/details/<slug>` and renders as text in
  the pattern `{Property}, {Area} … {size} sqft bed {N}bathroom {N}parking
  {N} … RM {price} / month`.
- Room-in-shared-house listings (as opposed to whole-unit rentals) show a
  size word (`SMALL`/`MEDIUM`/`MASTER`) instead of a bedroom count, and
  often omit `sqft` entirely.

**Selector strategy:** cards are located by their one stable, semantic
feature — an `<a href="/details/...">` — rather than CSS classes, which in
a Tailwind/Next.js app are typically utility classes or hashed CSS-module
names with no semantic meaning and can change on every deploy. Fields are
then extracted with regexes run against that anchor's flattened text. This
was validated against a fixture built from real captured markup (`npm run
test:parser`), not live traffic — see Known Limitations.

Robots.txt is fetched and checked before collecting (`features/collector/
robots.ts`); a disallowed path aborts the search with a clear error rather
than collecting anyway. Requests are paced by `COLLECTION_CONFIG.requestDelayMs`
(750ms) and capped at `COLLECTION_CONFIG.maxPages` (20) — see `lib/config.ts`.

## Analytics Engine (Milestone 4)

`features/analytics/statistics.ts` computes, from a `Listing[]`: count,
average, median, lowest, highest, average unit size, and price/sqft
(sqft-only listings, not converted from sqm). **Fair Price Estimate** is
deliberately not the plain average — it's a 10%-trimmed mean (drop the
lowest and highest 10% of prices, then average what's left), which is
simple to explain and meaningfully more robust to an outlier penthouse or
fire-sale listing than a raw average.

## Search & autocomplete (Milestone 5)

Speedhome's `/rent/<area>` pages were inspected for a public search or
autocomplete API; none was found (no reachable `sitemap.xml`, no
documented endpoint, and no way to inspect XHR/network traffic from this
build environment — see Known Limitations). Per the milestone's own
fallback instruction, area suggestions come from a local dataset
(`data/areas.json`, 22 KL-area entries). Slugs for **Kuala Lumpur, KLCC,
Bangsar, Mont'Kiara, KL Sentral, Brickfields, and Bukit Damansara** were
directly confirmed against live Speedhome pages; the rest are best-effort
and may need correcting if an area returns no results.

## Exports (Milestone 6)

- **CSV** — [PapaParse](https://www.papaparse.com/), client-side, one row
  per listing.
- **Excel** — [ExcelJS](https://github.com/exceljs/exceljs), client-side,
  a listings sheet (bold header, autofilter) plus a Summary sheet.
- Filename: `speedhome_<area>_<YYYYMMDD>.xlsx` / `.csv`
  (`features/export/filename.ts`).
- Both buttons are disabled automatically when there's nothing to export.

## Known limitations

- **Speedhome could not be reached from this build/dev sandbox.** An
  early inspection request to `/rent/klcc` was rejected as bot traffic;
  later requests to `/rent/kuala-lumpur` and two `/details/...` pages
  succeeded and are what the parser was calibrated against (captured
  2026-07-22). A live run from `npm run dev` against `/api/collect` in
  this same sandbox got a **403** from Speedhome — the error was caught
  and surfaced cleanly as JSON rather than crashing the server, which is
  the behavior that matters, but **the parser's actual selectors have not
  been verified against a real 200 response with a browser's devtools
  open**. If a live search returns `NO_RESULTS` unexpectedly, this is the
  first thing to check with real network access.
- **Furniture status is always "Not Available" for live-collected
  listings.** During investigation, one listing's own meta-description
  claimed "Unfurnished" while its description text listed "Fully
  Furnished" with a full inventory. Given that contradiction in
  Speedhome's own data, guessing felt worse than reporting the gap
  honestly.
- **Yearly and daily prices are usually null.** Speedhome's cards and
  detail pages only reliably show a monthly RM price; the app reports
  what's actually present rather than deriving yearly = monthly × 12
  (that would be an assumption, not an extraction).
- **Area slugs beyond the 7 confirmed ones are best-effort.** See
  "Search & autocomplete" above.
- **Bot detection risk in production.** If Speedhome's protection blocks
  the deployed app's IP entirely, live collection will fail outright.
  The "View demo data instead" button exists specifically for this case.
- **Price-per-sqft mixes nothing** — only listings with a `sqft` size are
  included; `sqm` listings are excluded rather than converted, to avoid
  silently mixing unit systems.
- No automated end-to-end/integration tests — `npm run test:parser` is a
  fixture test for the parser/normalizer only, chosen over a full test
  framework (Jest/Vitest) to keep dependencies minimal for an MVP.

## Future improvements

- Verify and correct the parser's selectors against a real 200 response
  once run somewhere with network access to speedhome.com.
- Verify/expand `data/areas.json` slugs beyond the 7 directly confirmed.
- Server-Sent Events or polling for real per-page collection progress,
  instead of the current coarse Searching → Collecting → Completed states
  (a deliberate MVP simplification — see `lib/collection-service.ts`).
- Cache recent collection results (e.g. per area, 15-30 min TTL) to avoid
  re-scraping on repeated searches for the same area.
- Retry-with-backoff for transient page failures mid-pagination, rather
  than stopping at "that's all there is."
- If Speedhome's bot protection turns out to be consistently blocking,
  revisit the Playwright option explicitly ruled out in Milestone 3.

## Folder structure

```
app/
  api/collect/route.ts   Server route: Collector → Normalizer → Analytics
  page.tsx                Dashboard composition
  layout.tsx, globals.css
components/
  layout/, search/, progress/, summary/, charts/, tables/, states/, ui/
features/
  collector/    Collector, robots.txt, HTTP client
  parser/       Cheerio parser + fixture test
  normalizer/   RawListingFields[] → Listing[]
  analytics/    Statistics / Analytics Engine
  export/       CSV (PapaParse) + Excel (ExcelJS)
hooks/useCollection.ts   Search state machine
lib/            config, constants, mock data, collection-service, utils
types/          Listing, RawListingFields, DashboardModel, Collection*
data/areas.json Local area-suggestion fallback
```

## Dependencies

Runtime: `next`, `react`, `react-dom`, `cheerio`, `papaparse`, `exceljs`,
`recharts`, `lucide-react`, `class-variance-authority`, `clsx`,
`tailwind-merge`.
Dev: `typescript`, `tailwindcss` v4 (+ `@tailwindcss/postcss`), `eslint` v9
(+ `eslint-config-next`), `prettier`, `tsx` (runs `test:parser`), plus
their `@types/*` packages.

## Build verification

```bash
npm run typecheck   # ✓ no errors
npm run lint         # ✓ no errors or warnings
npm run test:parser  # ✓ parser/normalizer fixture assertions pass
npm run build         # ✓ production build succeeds
```

All four were run and passed at the end of every milestone in this build.

## Demo checklist

1. `npm run dev`, open `http://localhost:3000`.
2. Type an area (e.g. "Bangsar") and watch the mock autocomplete suggest it
   — or paste a `speedhome.com/rent/...` URL.
3. Submit and narrate the progress card (Searching → Collecting →
   Analyzing → Completed).
4. If live collection fails (likely, from a network without access to
   Speedhome, or if bot-blocked), click **"View demo data instead"** and
   point out the "Demo data" badge — nothing is ever silently faked.
5. Walk through Summary Cards → Price Distribution → Bedroom Distribution
   → Price Summary Table → Listings Table.
6. Click **Export CSV** and **Export Excel**; open the file and show the
   filename format (`speedhome_<area>_<date>`).
7. Resize the window narrow to show the responsive layout.
8. Type a nonsense area (e.g. "asdf123") to show the Failed state and the
   "View demo data instead" escape hatch on a `NO_RESULTS` error.
