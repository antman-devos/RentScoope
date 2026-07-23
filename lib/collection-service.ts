/**
 * Single entry point the UI calls to run a search. This now calls
 * the real /api/collect route (Collector -> Parser -> Normalizer ->
 * Analytics against live Speedhome data). If live collection fails,
 * the caller can explicitly opt into `getDemoDashboard` to fall back
 * to local mock data — never silently, always as a clearly-labeled
 * user choice (see components/states/ErrorState.tsx).
 *
 * A single request/response API route can't stream granular
 * per-page progress the way the Milestone 2-4 mock simulation did,
 * so live progress is intentionally coarser (Searching -> Collecting
 * -> Completed) rather than faking page-by-page numbers we don't
 * have. That's a deliberate MVP simplification, not an oversight —
 * see README "Known Limitations".
 */
import type { CollectionProgress, CollectionError } from "@/types/collection";
import type { DashboardModel } from "@/types/analytics";
import type { Listing } from "@/types/listing";
import type { AreaSuggestion, SearchMode } from "@/types/search";
import areas from "@/data/areas.json";
import { generateMockListings, toSlug } from "@/lib/mock-data";
import { buildDashboardModel } from "@/features/analytics/statistics";

const AREA_LIST = areas as AreaSuggestion[];

export function getAreaSuggestions(query: string): AreaSuggestion[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return AREA_LIST.filter((a) => a.label.toLowerCase().includes(trimmed)).slice(
    0,
    6,
  );
}

export function detectSearchMode(rawInput: string): SearchMode {
  const trimmed = rawInput.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.includes("speedhome.com")
    ? "URL"
    : "AREA";
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RunCollectionArgs {
  rawInput: string;
  onProgress: (progress: CollectionProgress) => void;
}

interface RunCollectionResult {
  ok: true;
  area: string;
  dashboard: DashboardModel;
  listings: Listing[];
}

interface RunCollectionFailure {
  ok: false;
  error: CollectionError;
}

export async function runCollection({
  rawInput,
  onProgress,
}: RunCollectionArgs): Promise<RunCollectionResult | RunCollectionFailure> {
  const start = Date.now();
  const mode = detectSearchMode(rawInput);
  const elapsed = () => Date.now() - start;

  onProgress({
    status: "SEARCHING",
    currentPage: null,
    totalPages: null,
    listingsFound: 0,
    elapsedMs: elapsed(),
    message: "Resolving search target...",
  });

  let matchedArea: AreaSuggestion | undefined;
  if (mode === "AREA") {
    const trimmedLower = rawInput.trim().toLowerCase();
    matchedArea = AREA_LIST.find(
      (a) => a.label.toLowerCase() === trimmedLower || a.value === toSlug(rawInput),
    );
    if (!matchedArea) {
      return {
        ok: false,
        error: {
          code: "NO_RESULTS",
          message:
            "That area isn't in our known list yet. Try a suggested area, or paste a Speedhome area URL directly.",
        },
      };
    }
  }

  await delay(150); // let the UI actually render the "Searching" stage before the network call

  onProgress({
    status: "COLLECTING",
    currentPage: null,
    totalPages: null,
    listingsFound: 0,
    elapsedMs: elapsed(),
    message: "Collecting listings from Speedhome — this can take a few seconds...",
  });

  const query =
    mode === "AREA"
      ? `area=${encodeURIComponent((matchedArea as AreaSuggestion).value)}`
      : `url=${encodeURIComponent(rawInput.trim())}`;

  let response: Response;
  try {
    response = await fetch(`/api/collect?${query}`);
  } catch {
    return {
      ok: false,
      error: { code: "NETWORK_TIMEOUT", message: "Couldn't reach the collection service. Please try again." },
    };
  }

  const body = (await response.json().catch(() => null)) as
    | { ok: true; area: string; dashboard: DashboardModel; listings: Listing[] }
    | { ok: false; error: CollectionError }
    | null;

  if (!body) {
    return { ok: false, error: { code: "UNEXPECTED_ERROR", message: "Received an invalid response." } };
  }
  if (!body.ok) {
    return { ok: false, error: body.error };
  }

  onProgress({
    status: "ANALYZING",
    currentPage: null,
    totalPages: null,
    listingsFound: body.listings.length,
    elapsedMs: elapsed(),
    message: "Calculating price statistics...",
  });
  await delay(150);

  onProgress({
    status: "COMPLETED",
    currentPage: null,
    totalPages: null,
    listingsFound: body.listings.length,
    elapsedMs: elapsed(),
    message: "Done.",
  });

  return { ok: true, area: body.area, dashboard: body.dashboard, listings: body.listings };
}

/**
 * Explicit, user-initiated fallback to local mock data — used only
 * when the person clicks "View demo data instead" after a live
 * collection failure. Never invoked automatically, so a demo dataset
 * is never mistaken for a live one.
 */
export function getDemoDashboard(areaSlug: string): { dashboard: DashboardModel; listings: Listing[] } {
  const listings = generateMockListings(areaSlug);
  const dashboard = buildDashboardModel(listings, areaSlug, listings.length);
  return { dashboard, listings };
}
