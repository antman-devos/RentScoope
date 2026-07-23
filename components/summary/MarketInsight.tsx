import type { DashboardModel } from "@/types/analytics";
import { deriveMarketInsight } from "@/lib/insights";
import { NOT_AVAILABLE_LABEL } from "@/lib/constants";

interface MarketInsightProps {
  dashboard: DashboardModel;
}

/**
 * The primary focal point of the results: states the answer to "Is
 * this rent fair?" in one huge number, rather than making the renter
 * hunt for it in a grid of equally-weighted stats. Every sentence
 * and the number itself come straight from features/analytics — see
 * lib/insights.ts. Nothing here is calculated, only phrased and sized.
 */
export function MarketInsight({ dashboard }: MarketInsightProps) {
  const insight = deriveMarketInsight(dashboard);
  const sentences = [insight.priceRangeSentence, insight.bedroomMixSentence].filter(
    (s): s is string => Boolean(s),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-primary/[0.04] to-transparent p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Fair rent estimate
          </p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-primary sm:text-6xl">
            {insight.fairRent === null
              ? NOT_AVAILABLE_LABEL
              : `RM ${insight.fairRent.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            per month, based on comparable homes nearby
          </p>
        </div>
        {sentences.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm text-foreground sm:max-w-xs sm:text-right sm:text-base">
            {sentences.map((sentence) => (
              <li key={sentence}>{sentence}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
