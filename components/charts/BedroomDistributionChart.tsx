"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";

import type { BedroomDistributionEntry } from "@/types/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BedroomDistributionChartProps {
  data: BedroomDistributionEntry[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
  "var(--secondary)",
];

/**
 * A horizontal bar, sorted by count, replaces the original pie chart:
 * with up to 7 bedroom categories a pie produces several thin,
 * similarly-sized, hard-to-compare slices, while a sorted bar reads
 * top-to-bottom as "most to least common" at a glance and labels
 * each value directly instead of requiring a separate legend. Same
 * underlying data either way.
 */
export function BedroomDistributionChart({ data }: BedroomDistributionChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const rowHeight = 36;
  const chartHeight = Math.max(180, sorted.length * rowHeight);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Bedroom Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0" style={{ height: chartHeight + 24 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 4, right: 28, left: 4, bottom: 4 }}
            barCategoryGap={10}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="bedroomType"
              width={92}
              tick={{ fontSize: 12, fill: "var(--foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {sorted.map((entry, index) => (
                <Cell key={entry.bedroomType} fill={COLORS[index % COLORS.length]} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 500 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
