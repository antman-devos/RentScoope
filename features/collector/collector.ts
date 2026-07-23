import { COLLECTION_CONFIG } from "@/lib/config";
import type { RawListingFields } from "@/types/raw";
import type { CollectionError } from "@/types/collection";
import { fetchHtml, delay, HttpTimeoutError, HttpStatusError } from "@/features/collector/http-client";
import { fetchRobotsRules, isPathAllowed } from "@/features/collector/robots";
import { parseListingCards, hasNextPage } from "@/features/parser/parser";

const SPEEDHOME_ORIGIN = "https://speedhome.com";

export interface CollectSuccess {
  ok: true;
  rawListings: RawListingFields[];
  pagesCollected: number;
}
export interface CollectFailure {
  ok: false;
  error: CollectionError;
}
export type CollectResult = CollectSuccess | CollectFailure;

function mapFetchError(err: unknown): CollectionError {
  if (err instanceof HttpTimeoutError) {
    return {
      code: "NETWORK_TIMEOUT",
      message: "Speedhome took too long to respond. Please try again.",
    };
  }
  if (err instanceof HttpStatusError) {
    if (err.status === 404) {
      return { code: "NOT_FOUND", message: "That area page could not be found on Speedhome." };
    }
    return {
      code: "UNEXPECTED_ERROR",
      message: `Speedhome returned an unexpected response (status ${err.status}).`,
    };
  }
  return { code: "UNEXPECTED_ERROR", message: "Something went wrong while collecting listings." };
}

/**
 * Collects every listing card across the paginated area page at
 * https://speedhome.com/rent/{areaSlug}, respecting robots.txt and
 * the configured request delay/page cap (see lib/config.ts).
 *
 * Stops when: a page returns zero cards, pagination controls stop
 * pointing forward, or COLLECTION_CONFIG.maxPages is reached —
 * whichever comes first. A later page failing to load (e.g. a
 * transient timeout) is treated as "that's all there is" rather than
 * a hard failure, since we already have real results by that point.
 */
export async function collectListingsForArea(
  areaSlug: string,
  onPageCollected?: (page: number, listingsSoFar: number) => void,
): Promise<CollectResult> {
  const basePath = `/rent/${areaSlug}`;

  const robotsRules = await fetchRobotsRules(
    SPEEDHOME_ORIGIN,
    COLLECTION_CONFIG.userAgent,
    COLLECTION_CONFIG.requestTimeoutMs,
  );
  if (!isPathAllowed(robotsRules, basePath)) {
    return {
      ok: false,
      error: {
        code: "ROBOTS_DISALLOWED",
        message: "Speedhome's robots.txt disallows collecting this page.",
      },
    };
  }

  const rawListings: RawListingFields[] = [];
  let page = 1;
  let pagesCollected = 0;

  while (page <= COLLECTION_CONFIG.maxPages) {
    const pageUrl = `${SPEEDHOME_ORIGIN}${basePath}${page > 1 ? `?page=${page}` : ""}`;

    let html: string;
    try {
      html = await fetchHtml(pageUrl);
    } catch (err) {
      if (page === 1) return { ok: false, error: mapFetchError(err) };
      break;
    }

    const pageListings = parseListingCards(html, pageUrl);
    pagesCollected++;
    if (pageListings.length === 0) break;

    rawListings.push(...pageListings);
    onPageCollected?.(page, rawListings.length);

    const canContinue = hasNextPage(html, page);
    page++;
    if (!canContinue) break;
    if (page <= COLLECTION_CONFIG.maxPages) await delay(COLLECTION_CONFIG.requestDelayMs);
  }

  if (rawListings.length === 0) {
    return {
      ok: false,
      error: { code: "NO_RESULTS", message: "No listings were found for this area." },
    };
  }

  return { ok: true, rawListings, pagesCollected };
}

/** Resolves a pasted Speedhome URL to an area slug the collector can
 * paginate through. Single-listing "/details/..." URLs are rejected
 * with UNSUPPORTED_PAGE — collecting comparables needs an area
 * listing page, not one specific unit. */
export function resolveAreaSlugFromUrl(rawUrl: string): { areaSlug: string } | { error: CollectionError } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { error: { code: "INVALID_INPUT", message: "That doesn't look like a valid URL." } };
  }

  if (!parsed.hostname.endsWith("speedhome.com")) {
    return { error: { code: "INVALID_INPUT", message: "Please paste a speedhome.com URL." } };
  }

  const rentMatch = parsed.pathname.match(/\/rent\/([a-z0-9-]+)/i);
  if (rentMatch?.[1]) return { areaSlug: rentMatch[1].toLowerCase() };

  if (parsed.pathname.startsWith("/details/")) {
    return {
      error: {
        code: "UNSUPPORTED_PAGE",
        message:
          "That's a single listing page. Paste an area listings URL instead (e.g. speedhome.com/rent/montkiara).",
      },
    };
  }

  return {
    error: { code: "UNSUPPORTED_PAGE", message: "This Speedhome page type isn't supported yet." },
  };
}
