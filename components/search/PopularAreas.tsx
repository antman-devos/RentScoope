"use client";

const POPULAR_AREAS = ["Mont'Kiara", "KLCC", "Petaling Jaya", "Cyberjaya"];

interface PopularAreasProps {
  onSelect: (area: string) => void;
  isBusy: boolean;
}

/** One-tap shortcuts into the exact same search flow as typing —
 * calls the same onSearch the search box uses, nothing new to wire. */
export function PopularAreas({ onSelect, isBusy }: PopularAreasProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Popular:</span>
      {POPULAR_AREAS.map((area) => (
        <button
          key={area}
          type="button"
          disabled={isBusy}
          onClick={() => onSelect(area)}
          className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {area}
        </button>
      ))}
    </div>
  );
}
