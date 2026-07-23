"use client";

import { useMemo, useState, useId } from "react";
import { Loader2, Search } from "lucide-react";

import type { AreaSuggestion } from "@/types/search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAreaSuggestions, detectSearchMode } from "@/lib/collection-service";
import { AutocompleteList } from "@/components/search/AutocompleteList";

interface SearchBarProps {
  onSearch: (rawInput: string) => void;
  isBusy: boolean;
}

/**
 * Search input supporting both an Area Name and a pasted Speedhome
 * URL, with a mock autocomplete dropdown for area names.
 */
export function SearchBar({ onSearch, isBusy }: SearchBarProps) {
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();

  const mode = useMemo(() => detectSearchMode(value), [value]);
  const suggestions: AreaSuggestion[] = useMemo(
    () => (mode === "AREA" ? getAreaSuggestions(value) : []),
    [value, mode],
  );

  function submit(input: string) {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    setShowSuggestions(false);
    setActiveIndex(-1);
    onSearch(trimmed);
  }

  function handleSelect(suggestion: AreaSuggestion) {
    setValue(suggestion.label);
    setShowSuggestions(false);
    submit(suggestion.label);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") submit(value);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = suggestions[activeIndex];
      if (active) {
        handleSelect(active);
      } else {
        submit(value);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div className="relative">
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setShowSuggestions(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
            onKeyDown={handleKeyDown}
            placeholder="Area name (e.g. Mont Kiara) or a Speedhome URL"
            className="pl-9"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            disabled={isBusy}
          />
          {showSuggestions && (
            <AutocompleteList
              id={listboxId}
              suggestions={suggestions}
              activeIndex={activeIndex}
              onSelect={handleSelect}
            />
          )}
        </div>
        <Button type="submit" disabled={isBusy || !value.trim()} className="sm:w-40">
          {isBusy ? <Loader2 className="animate-spin" /> : <Search />}
          {isBusy ? "Working" : "Check Fair Price"}
        </Button>
      </form>
      {mode === "URL" && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Reading this as a Speedhome link
        </p>
      )}
    </div>
  );
}
