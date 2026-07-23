import type { BedroomGroupStatistics } from "@/types/analytics";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NOT_AVAILABLE_LABEL } from "@/lib/constants";

function formatRM(value: number | null): string {
  if (value === null) return NOT_AVAILABLE_LABEL;
  return `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

interface PriceSummaryTableProps {
  rows: BedroomGroupStatistics[];
}

/** Per-bedroom-type price breakdown, driven by the Analytics Engine. */
export function PriceSummaryTable({ rows }: PriceSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Price Summary by Bedroom Type
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bedroom</TableHead>
              <TableHead>Listings</TableHead>
              <TableHead>Average</TableHead>
              <TableHead>Median</TableHead>
              <TableHead>Fair Price</TableHead>
              <TableHead>Lowest</TableHead>
              <TableHead>Highest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {NOT_AVAILABLE_LABEL}
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.bedroomType}>
                <TableCell className="font-medium text-foreground">
                  {row.bedroomType}
                </TableCell>
                <TableCell>{row.count}</TableCell>
                <TableCell>{formatRM(row.averageMonthlyPrice)}</TableCell>
                <TableCell>{formatRM(row.medianMonthlyPrice)}</TableCell>
                <TableCell>{formatRM(row.fairPriceEstimate)}</TableCell>
                <TableCell>{formatRM(row.lowestMonthlyPrice)}</TableCell>
                <TableCell>{formatRM(row.highestMonthlyPrice)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
