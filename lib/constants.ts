/**
 * Static, human-facing labels. These describe what the product IS —
 * they don't change between environments. Tunable operational values
 * (delays, limits, timeouts) belong in lib/config.ts instead.
 */

export const APP_NAME = "RentScoope";
export const APP_TAGLINE = "See what similar homes cost before you decide.";

/** Attribution shown in the dashboard and included in every export. */
export const DATA_SOURCE_LABEL = "Speedhome";

/** Bedroom categories used for grouping in the Price Summary Table. */
export const BEDROOM_CATEGORIES = [
  "Studio",
  "1 Bedroom",
  "2 Bedroom",
  "3 Bedroom",
  "4 Bedroom",
  "5+ Bedroom",
] as const;

/** Human-friendly placeholder shown for any missing data cell. */
export const NOT_AVAILABLE_LABEL = "Not Available";
