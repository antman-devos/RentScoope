/**
 * Presentation-layer only: derives a few plain-language sentences
 * from an already-computed DashboardModel. No calculation happens
 * here — every number comes straight from features/analytics, this
 * just phrases it. Nothing here is AI-generated; it's template
 * strings driven by which bucket/category already has the highest
 * count.
 */
import type { BedroomType } from "@/types/listing";
import type { DashboardModel, PriceDistributionBucket } from "@/types/analytics";

/** "RM1,000–1,999" -> "between RM1,000 and RM1,999".
 * "< RM1,000" -> "under RM1,000". "RM5,000+" -> "RM5,000 or more". */
export function priceRangeProse(bucketLabel: string): string {
  if (bucketLabel.startsWith("< ")) {
    return `under ${bucketLabel.slice(2)}`;
  }
  if (bucketLabel.endsWith("+")) {
    return `${bucketLabel.slice(0, -1)} or more`;
  }
  const [low, high] = bucketLabel.split("\u2013"); // en dash, matches PRICE_BUCKETS labels
  if (low && high) return `between ${low} and RM${high}`;
  return bucketLabel;
}

function topPriceBucket(buckets: PriceDistributionBucket[]): PriceDistributionBucket | null {
  if (buckets.length === 0) return null;
  return buckets.reduce((max, b) => (b.count > max.count ? b : max), buckets[0] as PriceDistributionBucket);
}

function bedroomProseLabel(type: BedroomType): string {
  if (type === "Studio") return "Studio";
  if (type === "5+ Bedroom") return "5+ bedroom";
  const match = type.match(/^(\d+) Bedroom$/);
  return match ? `${match[1]}-bedroom` : type;
}

export interface MarketInsight {
  /** e.g. "Most homes here rent between RM1,000 and RM1,999 a month." */
  priceRangeSentence: string | null;
  /** e.g. "Studio and 1-bedroom homes make up most of the listings here." */
  bedroomMixSentence: string | null;
  /** Raw value so the component can render it with its own emphasis. */
  fairRent: number | null;
}

export function deriveMarketInsight(dashboard: DashboardModel): MarketInsight {
  const topBucket = topPriceBucket(dashboard.priceDistribution);
  const priceRangeSentence = topBucket
    ? `Most homes here rent ${priceRangeProse(topBucket.bucketLabel)} a month.`
    : null;

  const knownCategories = dashboard.bedroomDistribution.filter((b) => b.bedroomType !== "Not Available");
  const totalKnown = knownCategories.reduce((sum, b) => sum + b.count, 0);
  const sorted = [...knownCategories].sort((a, b) => b.count - a.count);

  let bedroomMixSentence: string | null = null;
  if (sorted.length > 0 && totalKnown > 0) {
    const picked: typeof sorted = [];
    let runningCount = 0;
    for (const entry of sorted) {
      picked.push(entry);
      runningCount += entry.count;
      if (runningCount / totalKnown >= 0.5 || picked.length === 2) break;
    }
    const labels = picked.map((e) => bedroomProseLabel(e.bedroomType));
    const joined = new Intl.ListFormat("en", { type: "conjunction" }).format(labels);
    bedroomMixSentence = `${joined} homes make up most of the listings here.`;
  }

  return {
    priceRangeSentence,
    bedroomMixSentence,
    fairRent: dashboard.summary.fairPriceEstimate,
  };
}
