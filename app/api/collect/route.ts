import { NextResponse } from "next/server";

import type { CollectionError } from "@/types/collection";
import { collectListingsForArea, resolveAreaSlugFromUrl } from "@/features/collector/collector";
import { normalizeListings } from "@/features/normalizer/normalizer";
import { buildDashboardModel } from "@/features/analytics/statistics";
import areas from "@/data/areas.json";

// Cheerio + real fetch() to an external origin needs the Node runtime,
// not the Edge runtime.
export const runtime = "nodejs";

function errorResponse(error: CollectionError, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

const ERROR_STATUS: Record<CollectionError["code"], number> = {
  INVALID_INPUT: 400,
  ROBOTS_DISALLOWED: 403,
  NETWORK_TIMEOUT: 504,
  NOT_FOUND: 404,
  UNSUPPORTED_PAGE: 400,
  NO_RESULTS: 404,
  UNEXPECTED_ERROR: 500,
};

/**
 * GET /api/collect?area=<slug>            — collect by known area slug
 * GET /api/collect?url=<speedhome-url>     — collect by pasted Speedhome URL
 *
 * Orchestrates Collector -> Normalizer -> Analytics Engine and
 * returns a DashboardModel plus the normalized Listing[] the client
 * needs for the listings table and exports.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const areaParam = searchParams.get("area")?.trim();
  const urlParam = searchParams.get("url")?.trim();

  if (!areaParam && !urlParam) {
    return errorResponse(
      { code: "INVALID_INPUT", message: "Provide either an area or a url query parameter." },
      400,
    );
  }

  let areaSlug: string;
  if (urlParam) {
    const resolved = resolveAreaSlugFromUrl(urlParam);
    if ("error" in resolved) return errorResponse(resolved.error, ERROR_STATUS[resolved.error.code]);
    areaSlug = resolved.areaSlug;
  } else {
    // Only accept slugs we actually know about — see data/areas.json
    // and README "Known Limitations" on why this local list exists
    // instead of a public Speedhome search API.
    const known = (areas as Array<{ label: string; value: string }>).find(
      (a) => a.value === areaParam || a.label.toLowerCase() === areaParam?.toLowerCase(),
    );
    if (!known) {
      return errorResponse(
        { code: "NO_RESULTS", message: "Unknown area. Try one of the suggested areas, or paste a Speedhome URL." },
        404,
      );
    }
    areaSlug = known.value;
  }

  const collected = await collectListingsForArea(areaSlug);
  if (!collected.ok) {
    return errorResponse(collected.error, ERROR_STATUS[collected.error.code]);
  }

  const listings = normalizeListings(collected.rawListings);
  if (listings.length === 0) {
    return errorResponse(
      { code: "NO_RESULTS", message: "Listings were found but none had a usable price." },
      404,
    );
  }

  const dashboard = buildDashboardModel(listings, areaSlug, listings.length);

  return NextResponse.json({
    ok: true,
    area: areaSlug,
    dashboard,
    listings,
    pagesCollected: collected.pagesCollected,
  });
}
