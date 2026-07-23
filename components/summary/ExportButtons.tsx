"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

import type { Listing } from "@/types/listing";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "@/features/export/csv-export";
import { downloadExcel } from "@/features/export/excel-export";
import { buildExportFilename } from "@/features/export/filename";

interface ExportButtonsProps {
  listings: Listing[];
  area: string;
}

/**
 * Exports the currently displayed listings — CSV via PapaParse,
 * Excel via ExcelJS. Disabled automatically when there's nothing to
 * export (empty listings array), so callers never need to compute
 * that themselves.
 */
export function ExportButtons({ listings, area }: ExportButtonsProps) {
  const [busy, setBusy] = useState<"csv" | "excel" | null>(null);
  const disabled = listings.length === 0;
  const filename = buildExportFilename(area);

  async function handleCsv() {
    setBusy("csv");
    try {
      downloadCsv(listings, filename);
    } finally {
      setBusy(null);
    }
  }

  async function handleExcel() {
    setBusy("excel");
    try {
      await downloadExcel(listings, area, filename);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={disabled || busy !== null} onClick={handleCsv}>
        {busy === "csv" ? <Loader2 className="animate-spin" /> : <FileText />}
        Export CSV
      </Button>
      <Button variant="outline" size="sm" disabled={disabled || busy !== null} onClick={handleExcel}>
        {busy === "excel" ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />}
        Export Excel
      </Button>
    </div>
  );
}
