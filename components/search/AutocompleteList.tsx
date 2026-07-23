import type { AreaSuggestion } from "@/types/search";
import { cn } from "@/lib/utils";

interface AutocompleteListProps {
  suggestions: AreaSuggestion[];
  activeIndex: number;
  onSelect: (suggestion: AreaSuggestion) => void;
  /** id of the input this list is associated with, for aria-controls */
  id: string;
}

/**
 * Mock autocomplete dropdown (Milestone 2 requirement). Suggestions
 * are sourced from data/areas.json via getAreaSuggestions() — a
 * static local list stands in until Milestone 5 investigates whether
 * Speedhome exposes a public search endpoint.
 */
export function AutocompleteList({
  suggestions,
  activeIndex,
  onSelect,
  id,
}: AutocompleteListProps) {
  if (suggestions.length === 0) return null;

  return (
    <ul
      id={id}
      role="listbox"
      className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-64 overflow-auto rounded-md border border-border bg-popover py-1 shadow-md"
    >
      {suggestions.map((suggestion, index) => (
        <li key={suggestion.value} role="option" aria-selected={index === activeIndex}>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(suggestion)}
            className={cn(
              "flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
              index === activeIndex && "bg-accent text-accent-foreground",
            )}
          >
            {suggestion.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
