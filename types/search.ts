export type SearchMode = "AREA" | "URL";

export interface SearchRequest {
  /** Exactly what the user typed or pasted, before any processing. */
  rawInput: string;
  mode: SearchMode;
  /** Slugified area name (AREA mode) or the validated URL (URL mode). */
  normalizedQuery: string;
}

/** A single entry in the autocomplete suggestion list. */
export interface AreaSuggestion {
  /** Human-readable name, e.g. "Mont Kiara". */
  label: string;
  /** URL-safe slug, e.g. "mont-kiara". */
  value: string;
}
