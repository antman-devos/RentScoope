import type { RawListingFields } from "@/types/raw";
import type { BedroomType, FurnitureStatus, Listing, SizeUnit } from "@/types/listing";

/** "RM 2,300" -> 2300. Returns null on anything unparsable rather
 * than throwing — a malformed price on one listing shouldn't sink
 * the whole batch. */
function parseCurrency(raw: string | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) ? value : null;
}

function parseSize(raw: string | null): { value: number | null; unit: SizeUnit | null } {
  if (!raw) return { value: null, unit: null };
  const match = raw.match(/([\d,]+(?:\.\d+)?)\s*(sqft|sqm)/i);
  if (!match) return { value: null, unit: null };
  const value = Number(match[1]?.replace(/,/g, ""));
  const unit = match[2]?.toLowerCase() === "sqm" ? "sqm" : "sqft";
  return { value: Number.isFinite(value) ? value : null, unit: unit as SizeUnit };
}

/**
 * bedroomRaw is either a digit ("0"-"5"+) for whole-unit rentals, or
 * a room-size word (SMALL/MEDIUM/MASTER/LARGE) for room-in-shared-house
 * listings, where the number doesn't represent the unit's total
 * bedroom count. Only the numeric form maps to a BedroomType; the
 * room-size form is honestly reported as "Not Available" rather than
 * guessed at.
 */
function mapBedroom(raw: string | null): BedroomType {
  if (!raw) return "Not Available";
  const trimmed = raw.trim();
  if (/^studio$/i.test(trimmed)) return "Studio";

  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber)) return "Not Available";
  if (asNumber <= 0) return "Studio";
  if (asNumber >= 5) return "5+ Bedroom";
  return `${asNumber} Bedroom` as BedroomType;
}

/**
 * Furniture status comes from a card-level amenity tag (e.g. "Fully
 * Furnished" among other tags like "WFH Ready"), extracted by
 * parser.ts's readFurnitureTag() — see that function's comment. This
 * is a different, more reliable source than the listing *detail*
 * page: investigation during Milestone 3 found the detail page's own
 * meta-description furnishing claim can directly contradict the
 * listing's actual description there (see README "Known
 * Limitations"), which is why furniture extraction was originally
 * skipped entirely. The card-level tag is closer to structured data
 * than free text, so it's used when present; "Not Available" still
 * covers every listing where no such tag appears.
 */
function mapFurniture(raw: string | null): FurnitureStatus {
  if (!raw) return "Not Available";
  const normalized = raw.toLowerCase();
  if (normalized.includes("fully")) return "Fully Furnished";
  if (normalized.includes("partial")) return "Partially Furnished";
  if (normalized.includes("unfurnished")) return "Unfurnished";
  return "Not Available";
}

function buildTitle(propertyName: string | null, area: string | null, bedroomType: BedroomType): string {
  const place = propertyName || area || "Listing";
  return bedroomType === "Not Available" ? `Unit at ${place}` : `${bedroomType} Unit at ${place}`;
}

export function normalizeListing(raw: RawListingFields, collectedAt: string): Listing {
  const bedroomType = mapBedroom(raw.bedroomRaw);
  const price = parseCurrency(raw.priceRaw);
  const { value: unitSize, unit: sizeUnit } = parseSize(raw.sizeRaw);

  return {
    listingId: raw.listingIdRaw,
    listingTitle: raw.listingTitle ?? buildTitle(raw.propertyName, raw.areaRaw, bedroomType),
    propertyName: raw.propertyName ?? "Not Available",
    area: raw.areaRaw ?? "Not Available",
    bedroomType,
    monthlyPrice: raw.priceTypeRaw === "monthly" ? price : null,
    yearlyPrice: raw.priceTypeRaw === "yearly" ? price : null,
    dailyPrice: raw.priceTypeRaw === "daily" ? price : null,
    unitSize,
    sizeUnit,
    furnitureStatus: mapFurniture(raw.furnitureRaw),
    location: raw.locationRaw ?? raw.areaRaw,
    listingUrl: raw.listingUrl ?? raw.sourceUrl,
    collectedAt,
    rawSourceUrl: raw.sourceUrl,
  };
}

export function normalizeListings(rawListings: RawListingFields[]): Listing[] {
  const collectedAt = new Date().toISOString();
  return rawListings
    .map((raw) => normalizeListing(raw, collectedAt))
    .filter((listing) => listing.monthlyPrice !== null || listing.yearlyPrice !== null);
}
