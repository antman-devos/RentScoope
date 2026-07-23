"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import type { Listing } from "@/types/listing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NOT_AVAILABLE_LABEL } from "@/lib/constants";
import { derivePriceLabel, type PriceLabel } from "@/lib/price-label";

function formatRM(value: number | null): string {
  if (value === null) return NOT_AVAILABLE_LABEL;
  return `RM ${value.toLocaleString("en-MY", { maximumFractionDigits: 0 })}`;
}

const PAGE_SIZE = 10;

interface ListingsTableProps {
  listings: Listing[];
  /** Area-level fair price (or median, as a fallback), used only to
   * label each row Great Deal / Fair / Above Market. Nothing new is
   * calculated — this is a comparison against a number the Analytics
   * Engine already produced. */
  referencePrice: number | null;
}

const PRICE_LABEL_VARIANT: Record<PriceLabel, "success" | "secondary" | "warning"> = {
  "Great Deal": "success",
  Fair: "secondary",
  "Above Market": "warning",
};

function openListing(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Raw normalized listings, paginated client-side for the MVP.
 * Every row opens the original Speedhome listing on click — the
 * external-link icon is a visual cue, not the only way in.
 *
 * No property images are shown: the current data model
 * (types/listing.ts) doesn't carry an image URL, and per this
 * sprint's scope the scraper/parser aren't being touched to add one. */
export function ListingsTable({ listings, referencePrice }: ListingsTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(listings.length / PAGE_SIZE));
  const pageItems = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-foreground">
          Listings ({listings.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Property</TableHead>
              <TableHead>Bedroom</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Furniture</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Monthly</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {NOT_AVAILABLE_LABEL}
                </TableCell>
              </TableRow>
            )}
            {pageItems.map((listing, i) => {
              const priceLabel = derivePriceLabel(listing.monthlyPrice, referencePrice);
              return (
                <TableRow
                  key={listing.listingId ?? `${listing.listingUrl}-${i}`}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open listing: ${listing.propertyName}`}
                  onClick={() => openListing(listing.listingUrl)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openListing(listing.listingUrl);
                    }
                  }}
                  className="group cursor-pointer outline-none transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.04]"
                >
                  <TableCell className="max-w-48 truncate py-4 text-base font-semibold text-foreground">
                    {listing.propertyName}
                  </TableCell>
                  <TableCell className="py-4">{listing.bedroomType}</TableCell>
                  <TableCell className="py-4">
                    {listing.unitSize ? `${listing.unitSize} ${listing.sizeUnit}` : NOT_AVAILABLE_LABEL}
                  </TableCell>
                  <TableCell className="py-4">{listing.furnitureStatus}</TableCell>
                  <TableCell className="py-4">
                    {priceLabel ? (
                      <Badge variant={PRICE_LABEL_VARIANT[priceLabel]}>{priceLabel}</Badge>
                    ) : (
                      <span className="text-muted-foreground">{NOT_AVAILABLE_LABEL}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-4 text-right text-lg font-bold tabular-nums text-primary">
                    {formatRM(listing.monthlyPrice)}
                  </TableCell>
                  <TableCell className="py-4">
                    <ExternalLink className="size-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
