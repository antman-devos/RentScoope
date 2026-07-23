import type { Listing } from "@/types/listing";
import type {
  BedroomDistributionEntry,
  BedroomGroupStatistics,
  DashboardModel,
  PriceDistributionBucket,
  PriceStatistics,
} from "@/types/analytics";
import { BEDROOM_CATEGORIES, DATA_SOURCE_LABEL } from "@/lib/constants";

/** Fixed monthly-price buckets (RM). Simple and predictable beats an
 * adaptive histogram for an MVP — the ranges cover the KL rental
 * market this tool targets. */
const PRICE_BUCKETS: Array<{ label: string; min: number; max: number }> = [
  { label: "< RM1,000", min: 0, max: 999 },
  { label: "RM1,000–1,999", min: 1000, max: 1999 },
  { label: "RM2,000–2,999", min: 2000, max: 2999 },
  { label: "RM3,000–3,999", min: 3000, max: 3999 },
  { label: "RM4,000–4,999", min: 4000, max: 4999 },
  { label: "RM5,000+", min: 5000, max: Infinity },
];

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
  }
  return sorted[mid] as number;
}

/**
 * "Fair price" is deliberately not the plain average, which outlier
 * penthouse or fire-sale listings can skew hard in either direction.
 * A 10%-trimmed mean (drop the bottom and top 10% of prices, then
 * average what's left) keeps the calculation simple and explainable
 * while being noticeably more robust than a raw average.
 */
function trimmedMean(values: number[], trimFraction = 0.1): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimFraction);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  const pool = trimmed.length > 0 ? trimmed : sorted;
  return average(pool);
}

function round(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100;
}

export function computePriceStatistics(listings: Listing[]): PriceStatistics {
  const prices = listings
    .map((l) => l.monthlyPrice)
    .filter((p): p is number => p !== null && p > 0);

  const sizes = listings
    .map((l) => l.unitSize)
    .filter((s): s is number => s !== null && s > 0);

  // Only listings with both a monthly price and a sqft size can
  // contribute to price-per-sqft. sqm listings are excluded rather
  // than converted, to avoid silently mixing unit systems.
  const perSqftRatios = listings
    .filter(
      (l) =>
        l.monthlyPrice !== null &&
        l.monthlyPrice > 0 &&
        l.unitSize !== null &&
        l.unitSize > 0 &&
        l.sizeUnit === "sqft",
    )
    .map((l) => (l.monthlyPrice as number) / (l.unitSize as number));

  return {
    count: listings.length,
    averageMonthlyPrice: round(average(prices)),
    medianMonthlyPrice: round(median(prices)),
    fairPriceEstimate: round(trimmedMean(prices)),
    lowestMonthlyPrice: prices.length ? Math.min(...prices) : null,
    highestMonthlyPrice: prices.length ? Math.max(...prices) : null,
    averageUnitSize: round(average(sizes)),
    pricePerSqft: round(average(perSqftRatios)),
  };
}

export function computeBedroomBreakdown(
  listings: Listing[],
): BedroomGroupStatistics[] {
  return BEDROOM_CATEGORIES.map((bedroomType) => {
    const group = listings.filter((l) => l.bedroomType === bedroomType);
    return {
      bedroomType,
      ...computePriceStatistics(group),
    };
  }).filter((group) => group.count > 0);
}

export function computePriceDistribution(
  listings: Listing[],
): PriceDistributionBucket[] {
  return PRICE_BUCKETS.map(({ label, min, max }) => ({
    bucketLabel: label,
    count: listings.filter(
      (l) =>
        l.monthlyPrice !== null && l.monthlyPrice >= min && l.monthlyPrice <= max,
    ).length,
  })).filter((bucket) => bucket.count > 0);
}

export function computeBedroomDistribution(
  listings: Listing[],
): BedroomDistributionEntry[] {
  const categories = [...BEDROOM_CATEGORIES, "Not Available"] as const;
  return categories
    .map((bedroomType) => ({
      bedroomType,
      count: listings.filter((l) => l.bedroomType === bedroomType).length,
    }))
    .filter((entry) => entry.count > 0);
}

export function buildDashboardModel(
  listings: Listing[],
  area: string,
  totalListingsCollected: number,
): DashboardModel {
  return {
    summary: {
      ...computePriceStatistics(listings),
      area,
      collectedAt: new Date().toISOString(),
      totalListingsCollected,
      dataSource: DATA_SOURCE_LABEL as "Speedhome",
    },
    bedroomBreakdown: computeBedroomBreakdown(listings),
    priceDistribution: computePriceDistribution(listings),
    bedroomDistribution: computeBedroomDistribution(listings),
  };
}
