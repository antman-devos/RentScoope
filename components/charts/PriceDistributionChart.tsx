"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PriceDistributionBucket } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { priceRangeProse } from "@/lib/insights";

interface PriceDistributionChartProps {
  data: PriceDistributionBucket[];
}

export function PriceDistributionChart({ data }: PriceDistributionChartProps) {
  const topBucket =
    data.length > 0 ? data.reduce((max, b) => (b.count > max.count ? b : max), data[0] as PriceDistributionBucket) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Price Distribution
        </CardTitle>
        {topBucket && (
          <p className="text-sm text-muted-foreground">
            Most homes fall {priceRangeProse(topBucket.bucketLabel)} a month.
          </p>
        )}
      </CardHeader>
      <CardContent className="h-72 pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="bucketLabel"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" name="Listings" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
