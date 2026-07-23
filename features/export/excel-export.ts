import ExcelJS from "exceljs";

import type { Listing } from "@/types/listing";
import { DATA_SOURCE_LABEL, NOT_AVAILABLE_LABEL } from "@/lib/constants";
import { triggerDownload } from "@/features/export/csv-export";

const COLUMNS: Array<{ key: keyof Listing; header: string; width: number }> = [
  { key: "listingTitle", header: "Listing Title", width: 32 },
  { key: "propertyName", header: "Property Name", width: 24 },
  { key: "area", header: "Area", width: 18 },
  { key: "bedroomType", header: "Bedroom", width: 14 },
  { key: "monthlyPrice", header: "Monthly Price (RM)", width: 18 },
  { key: "yearlyPrice", header: "Yearly Price (RM)", width: 16 },
  { key: "dailyPrice", header: "Daily Price (RM)", width: 16 },
  { key: "unitSize", header: "Unit Size", width: 12 },
  { key: "sizeUnit", header: "Size Unit", width: 10 },
  { key: "furnitureStatus", header: "Furniture", width: 18 },
  { key: "listingUrl", header: "Listing URL", width: 42 },
];

export async function buildExcelBuffer(listings: Listing[], area: string): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "RentScoope";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`${area} Listings`.slice(0, 31));
  sheet.columns = COLUMNS.map(({ header, width }) => ({ header, width }));
  sheet.getRow(1).font = { bold: true };

  for (const listing of listings) {
    sheet.addRow(COLUMNS.map(({ key }) => listing[key] ?? NOT_AVAILABLE_LABEL));
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const infoSheet = workbook.addWorksheet("Summary");
  infoSheet.columns = [{ width: 22 }, { width: 40 }];
  infoSheet.addRows([
    ["Area", area],
    ["Total Listings", listings.length],
    ["Data Source", DATA_SOURCE_LABEL],
    ["Exported At", new Date().toLocaleString("en-MY")],
  ]);

  return workbook.xlsx.writeBuffer();
}

export async function downloadExcel(
  listings: Listing[],
  area: string,
  filenameWithoutExt: string,
): Promise<void> {
  const buffer = await buildExcelBuffer(listings, area);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerDownload(blob, `${filenameWithoutExt}.xlsx`);
}
