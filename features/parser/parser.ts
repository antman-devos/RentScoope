import * as cheerio from "cheerio";
import type { Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";

import type { RawListingFields } from "@/types/raw";

/**
 * Parses a Speedhome area-listing page into RawListingFields[].
 *
 * Selector strategy: cards are located by their one stable, semantic
 * feature: an <a href="/details/..."> link. Fields inside a card are
 * then extracted with *targeted* selectors against real captured
 * markup (see parser.test.ts), not whole-card text regex:
 *
 *  - Property name + area come from the card's `aria-label`
 *    ("View details for {Name}, {Area}"), with the `[class*=
 *    "propertyTitle"]` heading as a fallback. Both are clean,
 *    structured sources -- unlike the card's flattened text, which
 *    also contains badge labels ("VERIFIED", "ZERO DEPOSIT") and
 *    carousel prev/next button glyphs ("‹" "›") interleaved with the
 *    name, and previously produced garbled results.
 *  - Bedroom/size come from inside `[class*="propertySpecs"]`.
 *    Bedroom in particular is *not* preceded by the word "bed" in
 *    the DOM text -- that word only exists as an `<img alt="bed">`
 *    attribute, which `.text()` does not include. It's just a bare
 *    number (or a room-size word like "MEDIUM") immediately after
 *    that icon.
 *  - Furniture status comes from `[class*="titleText"]` amenity tags
 *    on the card itself (e.g. "Fully Furnished", "WFH Ready", "Fast
 *    Lift") when one matches a known furnishing value. This is a
 *    different, more reliable source than the listing detail page:
 *    investigation there found the meta-description's furnishing
 *    claim can directly contradict the listing's own description.
 *
 * CSS Modules class names are `Component_purpose__<hash>` --  the
 * hash suffix changes per build, but the human-readable prefix
 * (`propertyTitle`, `propertySpecs`, ...) is generated from
 * Speedhome's own source and is far more stable, so selectors below
 * match on that prefix via `[class*="..."]` rather than the full
 * class name.
 */

const BADGE_WORDS = [
  "ZERO DEPOSIT",
  "ZERODEPOSIT",
  "COOKING READY",
  "ACCEPT ALL RACES",
  "FEMALE ONLY",
  "MALE ONLY",
  "VERIFIED",
  "Video Call Viewing",
];

const FURNITURE_VALUES = ["Fully Furnished", "Partially Furnished", "Unfurnished"];

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function stripBadgeWords(text: string): string {
  let result = text;
  for (const word of BADGE_WORDS) {
    result = result.split(word).join(" ");
  }
  return normalizeWhitespace(result);
}

const PRICE_WITH_PERIOD_PATTERN = /RM\s?([\d,]+(?:\.\d+)?)\s*\/\s*(month|year|day)/i;
const PRICE_ONLY_PATTERN = /RM\s?([\d,]+(?:\.\d+)?)/i;
const SIZE_PATTERN = /([\d,]+)\s*sqft/i;

/** "View details for Cliveden, Plaza Damas 3" -> "Cliveden, Plaza Damas 3" */
function stripAriaLabelPrefix(ariaLabel: string): string {
  return ariaLabel.replace(/^view details for\s*/i, "").trim();
}

/** "Cliveden, Plaza Damas 3" -> { propertyName: "Cliveden", area: "Plaza Damas 3" }.
 * Falls back to treating the whole string as the property name when
 * there's no comma (some listings have no area suffix at all). */
function splitNameAndArea(nameSource: string): { propertyName: string | null; area: string | null } {
  const cleaned = stripBadgeWords(nameSource);
  const match = cleaned.match(/^(.*),\s*([^,]+)$/);
  if (!match) return { propertyName: cleaned || null, area: null };
  return {
    propertyName: normalizeWhitespace(match[1] ?? "") || null,
    area: normalizeWhitespace(match[2] ?? "") || null,
  };
}

/** Reads the bare value (number, or a room-size word like "MEDIUM")
 * that follows an `<img alt="bed">`-style icon inside a specs block. */
function readSpecValue($: cheerio.CheerioAPI, specsRoot: Cheerio<AnyNode>, iconAlt: string): string | null {
  const icon = specsRoot.find(`img[alt="${iconAlt}"]`);
  if (icon.length === 0) return null;
  const container = icon.closest("span");
  const value = normalizeWhitespace((container.length ? container : icon.parent()).text());
  return value || null;
}

function readFurnitureTag($: cheerio.CheerioAPI, card: Cheerio<AnyNode>): string | null {
  // Confirmed against live data (2026-07-23): each card shows only 3
  // rotating highlight tags (e.g. "Near Transit", "WFH Ready", "Fast
  // Lift", "Parking Included"), and "Fully Furnished" is just one of
  // many possible values competing for those 3 slots — most listings
  // simply don't have it showing, not because extraction is broken.
  // "Not Available" is the honest, correct result for those.
  const tags = card
    .find('[class*="titleText"]')
    .map((_, tagEl) => normalizeWhitespace($(tagEl).text()))
    .get();
  return tags.find((tag) => FURNITURE_VALUES.some((v) => v.toLowerCase() === tag.toLowerCase())) ?? null;
}

export function parseListingCards(html: string, sourceUrl: string): RawListingFields[] {
  const $ = cheerio.load(html);
  const seenHrefs = new Set<string>();
  const results: RawListingFields[] = [];

  $('a[href*="/details/"]').each((_, el) => {
    const card = $(el);
    const hrefRaw = card.attr("href");
    if (!hrefRaw) return;

    const absoluteUrl = new URL(hrefRaw, sourceUrl).toString();
    if (seenHrefs.has(absoluteUrl)) return; // same card can wrap image + text separately
    seenHrefs.add(absoluteUrl);

    const ariaName = stripAriaLabelPrefix(card.attr("aria-label") ?? "");
    const headingName = normalizeWhitespace(card.find('[class*="propertyTitle"]').first().text());
    const { propertyName, area } = splitNameAndArea(ariaName || headingName);

    const specsRoot = card.find('[class*="propertySpecs"]').first();
    const specsText = normalizeWhitespace(specsRoot.length ? specsRoot.text() : "");
    const sizeMatch = specsText.match(SIZE_PATTERN);
    const sizeRaw = sizeMatch ? `${sizeMatch[1]} sqft` : null;
    const bedroomRaw = readSpecValue($, specsRoot, "bed");

    const priceRoot = card.find('[class*="propertyPrice"]').first();
    const priceText = normalizeWhitespace(priceRoot.length ? priceRoot.text() : card.text());
    const priceWithPeriod = priceText.match(PRICE_WITH_PERIOD_PATTERN);
    const priceOnly = priceWithPeriod ? null : priceText.match(PRICE_ONLY_PATTERN);
    const priceRaw = priceWithPeriod
      ? `RM ${priceWithPeriod[1]}`
      : priceOnly
        ? `RM ${priceOnly[1]}`
        : null;
    const priceTypeRaw: RawListingFields["priceTypeRaw"] = priceWithPeriod
      ? priceWithPeriod[2]?.toLowerCase() === "year"
        ? "yearly"
        : priceWithPeriod[2]?.toLowerCase() === "day"
          ? "daily"
          : "monthly"
      : priceRaw
        ? "monthly"
        : null;

    const furnitureRaw = readFurnitureTag($, card);
    const listingIdRaw = absoluteUrl.split("/").filter(Boolean).pop() ?? null;

    results.push({
      listingTitle: null, // Not present as a distinct field on the listing card; derived in the Normalizer.
      propertyName,
      areaRaw: area,
      bedroomRaw,
      priceRaw,
      priceTypeRaw,
      sizeRaw,
      furnitureRaw,
      listingUrl: absoluteUrl,
      listingIdRaw,
      locationRaw: area,
      sourceUrl,
    });
  });

  return results;
}

/**
 * True if the page's pagination controls reference a page number
 * higher than `currentPage` — used by the collector to decide
 * whether to keep paginating. Falls back to "keep going until a
 * page returns zero cards" (handled by the collector) if pagination
 * controls aren't found, so this is a nice-to-have optimization, not
 * a hard requirement.
 */
export function hasNextPage(html: string, currentPage: number): boolean {
  const $ = cheerio.load(html);
  let found = false;
  $("a[href*='page=']").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(/page=(\d+)/);
    if (match && Number(match[1]) > currentPage) found = true;
  });
  return found;
}
