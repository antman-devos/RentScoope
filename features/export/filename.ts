import { EXPORT_CONFIG } from "@/lib/config";

/** e.g. "speedhome_mont-kiara_20260722" (no extension — callers append it). */
export function buildExportFilename(area: string): string {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const areaSlug = area
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${EXPORT_CONFIG.filenamePrefix}_${areaSlug}_${yyyy}${mm}${dd}`;
}
