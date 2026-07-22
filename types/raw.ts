/**
 * Fields exactly as extracted from HTML, before any normalization.
 * Everything is a nullable string because the parser must never
 * throw on a missing field — it returns partial data instead.
 *
 * The Normalizer (features/normalizer) is the only module allowed
 * to turn these into typed, calculation-ready values (see Listing
 * in types/listing.ts).
 */
export interface RawListingFields {
  listingTitle: string | null;
  propertyName: string | null;
  areaRaw: string | null;
  bedroomRaw: string | null;
  /** e.g. "RM 2,300" */
  priceRaw: string | null;
  priceTypeRaw: "monthly" | "yearly" | "daily" | null;
  /** e.g. "900 sqft" */
  sizeRaw: string | null;
  /** e.g. "FULLY FURNISHED" */
  furnitureRaw: string | null;
  listingUrl: string | null;
  listingIdRaw: string | null;
  locationRaw: string | null;
  /** The exact page URL this listing was extracted from. */
  sourceUrl: string;
}
