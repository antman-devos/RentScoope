import Papa from "papaparse";

import type { Listing } from "@/types/listing";

const COLUMNS: Array<{ key: keyof Listing; header: string }> = [
  { key: "listingTitle", header: "Listing Title" },
  { key: "propertyName", header: "Property Name" },
  { key: "area", header: "Area" },
  { key: "bedroomType", header: "Bedroom" },
  { key: "monthlyPrice", header: "Monthly Price (RM)" },
  { key: "yearlyPrice", header: "Yearly Price (RM)" },
  { key: "dailyPrice", header: "Daily Price (RM)" },
  { key: "unitSize", header: "Unit Size" },
  { key: "sizeUnit", header: "Size Unit" },
  { key: "furnitureStatus", header: "Furniture" },
  { key: "listingUrl", header: "Listing URL" },
];

export function buildCsv(listings: Listing[]): string {
  const rows = listings.map((listing) =>
    Object.fromEntries(
      COLUMNS.map(({ key, header }) => [header, listing[key] ?? ""]),
    ),
  );
  return Papa.unparse(rows, { columns: COLUMNS.map((c) => c.header) });
}

export function downloadCsv(listings: Listing[], filenameWithoutExt: string): void {
  const csv = buildCsv(listings);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filenameWithoutExt}.csv`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export { triggerDownload };
