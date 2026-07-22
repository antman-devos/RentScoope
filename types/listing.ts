export type BedroomType =
  | "Studio"
  | "1 Bedroom"
  | "2 Bedroom"
  | "3 Bedroom"
  | "4 Bedroom"
  | "5+ Bedroom"
  | "Not Available";

export type FurnitureStatus =
  | "Fully Furnished"
  | "Partially Furnished"
  | "Unfurnished"
  | "Not Available";

export type SizeUnit = "sqft" | "sqm";

/**
 * The one and only shape the UI and analytics engine may consume.
 * Never let a component or a statistics function touch RawListingFields
 * or raw HTML directly — everything flows through this model first.
 */
export interface Listing {
  listingId: string | null;
  listingTitle: string;
  propertyName: string;
  area: string;
  bedroomType: BedroomType;

  monthlyPrice: number | null;
  yearlyPrice: number | null;
  dailyPrice: number | null;

  unitSize: number | null;
  sizeUnit: SizeUnit | null;

  furnitureStatus: FurnitureStatus;
  location: string | null;

  listingUrl: string;
  /** ISO 8601 timestamp of when this listing was collected. */
  collectedAt: string;
  /** The exact page URL this listing was extracted from. */
  rawSourceUrl: string;
}
