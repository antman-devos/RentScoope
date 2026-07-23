import { Banknote, Layers, Ruler, ScanSearch, TrendingDown, TrendingUp } from "lucide-react";

import type { AnalyticsSummary } from "@/types/analytics";
import { InfoTooltip } from "@/components/ui/tooltip";
import { NOT_AVAILABLE_LABEL } from "@/lib/constants";

function formatRM(value: number | null): string {
  if (value === null) return NOT_AVAILABLE_LABEL;
  return `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

function formatSqft(value: number | null): string {
  if (value === null) return NOT_AVAILABLE_LABEL;
  return `${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })} sqft`;
}

interface SummaryCardsProps {
  summary: AnalyticsSummary;
}

/**
 * Seven supporting metrics — deliberately lower visual weight than
 * the Fair Rent hero above them (MarketInsight.tsx), which is the
 * one number renters actually came here for. Same values as before;
 * Fair Rent itself moved out of this grid into that hero.
 */
export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    { label: "Homes Found", value: summary.count.toLocaleString("en-MY"), icon: Layers },
    {
      label: "Typical Rent",
      value: formatRM(summary.averageMonthlyPrice),
      icon: Banknote,
      tooltip: "The average monthly rent across all listings found.",
    },
    {
      label: "Most Common Rent",
      value: formatRM(summary.medianMonthlyPrice),
      icon: ScanSearch,
      tooltip:
        "The middle price when every listing is sorted cheapest to priciest — half cost more, half cost less.",
    },
    { label: "Lowest Found", value: formatRM(summary.lowestMonthlyPrice), icon: TrendingDown },
    { label: "Highest Found", value: formatRM(summary.highestMonthlyPrice), icon: TrendingUp },
    { label: "Typical Size", value: formatSqft(summary.averageUnitSize), icon: Ruler },
    {
      label: "Price per sqft",
      value:
        summary.pricePerSqft === null
          ? NOT_AVAILABLE_LABEL
          : `RM ${summary.pricePerSqft.toFixed(2)} / sqft`,
      icon: Ruler,
      tooltip: "Monthly rent divided by unit size — handy for comparing homes of different sizes.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tooltip }) => (
        <div
          key={label}
          className="flex flex-col rounded-lg bg-muted/50 px-4 py-3 transition-colors hover:bg-muted"
        >
          <div className="flex min-h-8 items-start gap-1.5 text-muted-foreground">
            <Icon className="mt-0.5 size-3.5 shrink-0" />
            <span className="text-[11px] font-medium uppercase leading-tight tracking-wide">
              {label}
            </span>
            {tooltip && <InfoTooltip text={tooltip} className="shrink-0" />}
          </div>
          <p className="mt-auto pt-1.5 text-lg font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
