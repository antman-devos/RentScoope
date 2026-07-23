import type { BedroomType, FurnitureStatus, Listing } from "@/types/listing";
import areas from "@/data/areas.json";

/** Deterministic string hash -> seed, so the same area always
 * produces the same-looking mock dataset (stable demos, easy to
 * screenshot, no flicker between renders). */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** mulberry32 PRNG — tiny, dependency-free, good enough for mock data. */
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PROPERTY_WORDS = [
  "Residence",
  "Suites",
  "Tower",
  "Heights",
  "Court",
  "Park",
  "Vista",
  "Garden",
  "Place",
];

const FURNITURE_OPTIONS: FurnitureStatus[] = [
  "Fully Furnished",
  "Partially Furnished",
  "Unfurnished",
];

const BEDROOM_WEIGHTS: Array<{ type: BedroomType; weight: number; baseSize: number }> = [
  { type: "Studio", weight: 0.1, baseSize: 450 },
  { type: "1 Bedroom", weight: 0.25, baseSize: 650 },
  { type: "2 Bedroom", weight: 0.3, baseSize: 950 },
  { type: "3 Bedroom", weight: 0.22, baseSize: 1300 },
  { type: "4 Bedroom", weight: 0.09, baseSize: 1750 },
  { type: "5+ Bedroom", weight: 0.04, baseSize: 2200 },
];

function pickBedroom(rand: () => number): (typeof BEDROOM_WEIGHTS)[number] {
  const roll = rand();
  let cumulative = 0;
  for (const entry of BEDROOM_WEIGHTS) {
    cumulative += entry.weight;
    if (roll <= cumulative) return entry;
  }
  return BEDROOM_WEIGHTS[BEDROOM_WEIGHTS.length - 1] as (typeof BEDROOM_WEIGHTS)[number];
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function labelFromSlug(slug: string): string {
  const match = (areas as Array<{ label: string; value: string }>).find(
    (a) => a.value === slug,
  );
  if (match) return match.label;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generates a deterministic, plausible mock listing set for an area.
 * Prices scale off a per-area base rate (derived from the area's hash,
 * not a real dataset) so different areas visibly differ in the
 * dashboard without hand-maintaining a lookup table for every area.
 */
export function generateMockListings(areaSlug: string, count = 48): Listing[] {
  const areaLabel = labelFromSlug(areaSlug);
  const seed = hashString(areaSlug);
  const rand = mulberry32(seed);

  // Base RM/sqft rate for the area, kept in a realistic KL rental band.
  const baseRatePerSqft = 1.4 + (seed % 100) / 100; // ~1.4 - 2.4
  const now = new Date().toISOString();

  return Array.from({ length: count }, (_, i) => {
    const { type: bedroomType, baseSize } = pickBedroom(rand);
    const sizeJitter = 0.8 + rand() * 0.4; // +/-20%
    const unitSize = Math.round(baseSize * sizeJitter);

    const priceJitter = 0.85 + rand() * 0.3; // +/-15%
    const monthlyPrice = Math.round(
      (unitSize * baseRatePerSqft * priceJitter) / 10,
    ) * 10;

    const furnitureStatus =
      FURNITURE_OPTIONS[Math.floor(rand() * FURNITURE_OPTIONS.length)] ??
      "Unfurnished";

    const propertyWord =
      PROPERTY_WORDS[Math.floor(rand() * PROPERTY_WORDS.length)] ?? "Residence";
    const propertyName = `${areaLabel} ${propertyWord}`;

    // ~8% chance of a missing yearly/daily price and unit size, to
    // exercise the "Not Available" paths the same way real listings do.
    const hasYearly = rand() > 0.5;
    const hasDaily = rand() > 0.85;
    const hasSize = rand() > 0.08;

    return {
      listingId: `mock-${areaSlug}-${i}`,
      listingTitle: `${bedroomType === "Studio" ? "Studio" : bedroomType} Unit at ${propertyName}`,
      propertyName,
      area: areaLabel,
      bedroomType,
      monthlyPrice,
      yearlyPrice: hasYearly ? monthlyPrice * 12 : null,
      dailyPrice: hasDaily ? Math.round((monthlyPrice / 30) * 100) / 100 : null,
      unitSize: hasSize ? unitSize : null,
      sizeUnit: hasSize ? "sqft" : null,
      furnitureStatus,
      location: `${areaLabel}, Kuala Lumpur`,
      listingUrl: `https://speedhome.com/mock-listing/${areaSlug}-${i}`,
      collectedAt: now,
      rawSourceUrl: `https://speedhome.com/${areaSlug}/rent?page=${1 + Math.floor(i / 20)}`,
    };
  });
}

export { toSlug, labelFromSlug };
