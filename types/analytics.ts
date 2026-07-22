import type { BedroomType } from "@/types/listing";

/**
 * Core price statistics. "fairPriceEstimate" is deliberately not a
 * plain average — the Analytics Engine (Milestone 4) will compute it
 * as a median or trimmed mean and document the choice in code
 * comments there. This interface only describes the shape.
 */
export interface PriceStatistics {
  count: number;
  averageMonthlyPrice: number | null;
  medianMonthlyPrice: number | null;
  fairPriceEstimate: number | null;
  lowestMonthlyPrice: number | null;
  highestMonthlyPrice: number | null;
  averageUnitSize: number | null;
  /** Null when unit size data isn't available for enough listings. */
  pricePerSqft: number | null;
}

export interface BedroomGroupStatistics extends PriceStatistics {
  bedroomType: BedroomType;
}

export interface AnalyticsSummary extends PriceStatistics {
  area: string;
  /** ISO 8601 timestamp — surfaced in the dashboard metadata. */
  collectedAt: string;
  totalListingsCollected: number;
  dataSource: "Speedhome";
}

export interface PriceDistributionBucket {
  bucketLabel: string;
  count: number;
}

export interface BedroomDistributionEntry {
  bedroomType: BedroomType;
  count: number;
}

/** Everything the Presentation Layer needs to render the dashboard. */
export interface DashboardModel {
  summary: AnalyticsSummary;
  bedroomBreakdown: BedroomGroupStatistics[];
  priceDistribution: PriceDistributionBucket[];
  bedroomDistribution: BedroomDistributionEntry[];
}
