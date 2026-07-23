"use client";

import { HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  text: string;
  className?: string;
}

/** Lightweight, dependency-free hover/focus tooltip for explaining a
 * technical term inline next to a label. CSS-only reveal (no JS
 * state) — keyboard-accessible via focus-within. */
export function InfoTooltip({ text, className }: InfoTooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      <span
        tabIndex={0}
        className="inline-flex rounded-full text-muted-foreground/70 outline-none transition-colors hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={text}
      >
        <HelpCircle className="size-3.5 cursor-help" />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-48 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-normal normal-case leading-snug text-background opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
