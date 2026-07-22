import type { Listing } from "@/types/listing";

/**
 * Explicit application state machine — see Part 3 of the spec.
 * Deliberately not a set of generic boolean loading flags.
 *
 *   Idle -> Searching -> Collecting -> Parsing -> Normalizing
 *        -> Analyzing -> Completed
 *                      -> Failed (from any stage)
 */
export type CollectionStatus =
  | "IDLE"
  | "SEARCHING"
  | "COLLECTING"
  | "PARSING"
  | "NORMALIZING"
  | "ANALYZING"
  | "COMPLETED"
  | "FAILED";

export interface CollectionProgress {
  status: CollectionStatus;
  /** Null while the current page number isn't yet known. */
  currentPage: number | null;
  /** Null when the total page count can't be determined up front. */
  totalPages: number | null;
  listingsFound: number;
  elapsedMs: number;
  /** Short, user-facing status line, e.g. "Parsing..." */
  message: string;
}

export type CollectionErrorCode =
  | "INVALID_INPUT"
  | "ROBOTS_DISALLOWED"
  | "NETWORK_TIMEOUT"
  | "NOT_FOUND"
  | "UNSUPPORTED_PAGE"
  | "NO_RESULTS"
  | "UNEXPECTED_ERROR";

export interface CollectionError {
  code: CollectionErrorCode;
  /** User-friendly message — never a raw stack trace. */
  message: string;
}

export interface CollectionResult {
  area: string;
  sourceUrl: string;
  listings: Listing[];
  totalListings: number;
  collectionTimeMs: number;
  /** ISO 8601 timestamp. */
  collectedAt: string;
  dataSource: "Speedhome";
}
