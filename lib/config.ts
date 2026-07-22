/**
 * Operational configuration for the collection engine and exports.
 * Values here are deliberately conservative to respect Speedhome's
 * public access — see Part 1 of the spec, "Data Collection Policy".
 *
 * Nothing in features/collector should hardcode a delay, timeout, or
 * page limit — it should import these instead.
 */

export const COLLECTION_CONFIG = {
  /** Minimum delay between sequential page requests, in milliseconds. */
  requestDelayMs: 750,

  /** Hard cap on pages collected per search, to avoid excessive crawling. */
  maxPages: 20,

  /** Per-request timeout before a page is treated as failed. */
  requestTimeoutMs: 15_000,

  /**
   * Identifies this collector to the origin server. Revisit in
   * Milestone 3 once the collector is implemented for real.
   */
  userAgent: "RentScoopeBot/0.1 (+https://rentscoope.example/about)",
} as const;

export const EXPORT_CONFIG = {
  /** Produces e.g. "speedhome_mont-kiara_20260722" before the extension. */
  filenamePrefix: "speedhome",
} as const;
