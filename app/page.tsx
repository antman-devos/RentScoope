"use client";

import { Header } from "@/components/layout/Header";
import { SearchBar } from "@/components/search/SearchBar";
import { PopularAreas } from "@/components/search/PopularAreas";
import { CollectionProgressCard } from "@/components/progress/CollectionProgress";
import { SummaryCards } from "@/components/summary/SummaryCards";
import { MarketInsight } from "@/components/summary/MarketInsight";
import { ExportButtons } from "@/components/summary/ExportButtons";
import { PriceDistributionChart } from "@/components/charts/PriceDistributionChart";
import { BedroomDistributionChart } from "@/components/charts/BedroomDistributionChart";
import { PriceSummaryTable } from "@/components/tables/PriceSummaryTable";
import { ListingsTable } from "@/components/tables/ListingsTable";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { LoadingState } from "@/components/states/LoadingState";
import { useCollection } from "@/hooks/useCollection";

const BUSY_STATUSES = [
  "SEARCHING",
  "COLLECTING",
  "PARSING",
  "NORMALIZING",
  "ANALYZING",
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}

export default function Home() {
  const { progress, dashboard, listings, error, isDemo, search, reset, showDemoData } =
    useCollection();
  const isBusy = BUSY_STATUSES.includes(progress.status);
  const referencePrice = dashboard
    ? (dashboard.summary.fairPriceEstimate ?? dashboard.summary.medianMonthlyPrice)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="border-b border-border bg-gradient-to-b from-primary/[0.06] to-transparent">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 sm:py-14">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Search any area to instantly understand{" "}
            <span className="text-primary">how much homes really cost</span>.
          </h2>
          <div className="mx-auto w-full max-w-2xl">
            <SearchBar onSearch={search} isBusy={isBusy} />
          </div>
          <div className="flex justify-center">
            <PopularAreas onSelect={search} isBusy={isBusy} />
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        {isBusy && <CollectionProgressCard progress={progress} />}

        {error && (
          <ErrorState error={error} onRetry={reset} onShowDemoData={showDemoData} />
        )}

        {!error && isBusy && !dashboard && <LoadingState />}

        {!error && !isBusy && !dashboard && <EmptyState />}

        {!error && dashboard && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">
                    Results for {dashboard.summary.area}
                  </h2>
                  {isDemo && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                      Demo data
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboard.summary.totalListingsCollected} homes found
                  {isDemo ? " (simulated)" : ""} · updated{" "}
                  {new Date(dashboard.summary.collectedAt).toLocaleString("en-MY")}
                </p>
              </div>
              <ExportButtons listings={listings} area={dashboard.summary.area} />
            </div>

            <MarketInsight dashboard={dashboard} />

            <div className="flex flex-col gap-3">
              <SectionLabel>At a glance</SectionLabel>
              <SummaryCards summary={dashboard.summary} />
            </div>

            <div className="flex flex-col gap-3">
              <SectionLabel>Price breakdown</SectionLabel>
              <div className="grid gap-4 lg:grid-cols-2">
                <PriceDistributionChart data={dashboard.priceDistribution} />
                <BedroomDistributionChart data={dashboard.bedroomDistribution} />
              </div>
              <PriceSummaryTable rows={dashboard.bedroomBreakdown} />
            </div>

            <div className="flex flex-col gap-3">
              <SectionLabel>Browse homes</SectionLabel>
              <ListingsTable listings={listings} referencePrice={referencePrice} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
