/**
 * Presentation-layer categorization only — compares a listing's
 * already-normalized monthlyPrice against the area's already-computed
 * fair-price estimate (or median as a fallback when fair price isn't
 * available). No new statistics are calculated here, just a label
 * derived from two existing numbers.
 */

export type PriceLabel = "Great Deal" | "Fair" | "Above Market";

const GREAT_DEAL_THRESHOLD = 0.85; // 15%+ below reference
const ABOVE_MARKET_THRESHOLD = 1.15; // 15%+ above reference

export function derivePriceLabel(
  monthlyPrice: number | null,
  referencePrice: number | null,
): PriceLabel | null {
  if (monthlyPrice === null || referencePrice === null || referencePrice <= 0) return null;
  const ratio = monthlyPrice / referencePrice;
  if (ratio <= GREAT_DEAL_THRESHOLD) return "Great Deal";
  if (ratio >= ABOVE_MARKET_THRESHOLD) return "Above Market";
  return "Fair";
}
