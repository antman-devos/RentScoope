"use client";

import { useCallback, useRef, useState } from "react";

import type { CollectionError, CollectionProgress } from "@/types/collection";
import type { DashboardModel } from "@/types/analytics";
import type { Listing } from "@/types/listing";
import { runCollection, getDemoDashboard, detectSearchMode } from "@/lib/collection-service";
import { toSlug } from "@/lib/mock-data";

const IDLE_PROGRESS: CollectionProgress = {
  status: "IDLE",
  currentPage: null,
  totalPages: null,
  listingsFound: 0,
  elapsedMs: 0,
  message: "",
};

interface UseCollectionState {
  progress: CollectionProgress;
  dashboard: DashboardModel | null;
  listings: Listing[];
  error: CollectionError | null;
  /** True when the currently-displayed dashboard is local demo data
   * shown after an explicit user choice, not a live Speedhome result. */
  isDemo: boolean;
}

/**
 * Owns the full search -> collect -> parse -> normalize -> analyze
 * state machine for the dashboard. The UI only needs `search()` and
 * the returned state — it doesn't know or care that the data behind
 * it comes from a live API route rather than being mocked in-browser.
 */
export function useCollection() {
  const [state, setState] = useState<UseCollectionState>({
    progress: IDLE_PROGRESS,
    dashboard: null,
    listings: [],
    error: null,
    isDemo: false,
  });

  const requestId = useRef(0);
  const lastQuery = useRef("");

  const search = useCallback(async (rawInput: string) => {
    const thisRequest = ++requestId.current;
    lastQuery.current = rawInput;
    setState({
      progress: {
        ...IDLE_PROGRESS,
        status: "SEARCHING",
        message: "Starting search...",
      },
      dashboard: null,
      listings: [],
      error: null,
      isDemo: false,
    });

    const result = await runCollection({
      rawInput,
      onProgress: (progress) => {
        if (requestId.current !== thisRequest) return;
        setState((prev) => ({ ...prev, progress }));
      },
    });

    if (requestId.current !== thisRequest) return;

    if (!result.ok) {
      setState((prev) => ({
        ...prev,
        progress: { ...prev.progress, status: "FAILED", message: result.error.message },
        error: result.error,
      }));
      return;
    }

    setState({
      progress: {
        status: "COMPLETED",
        currentPage: null,
        totalPages: null,
        listingsFound: result.listings.length,
        elapsedMs: 0,
        message: "Done.",
      },
      dashboard: result.dashboard,
      listings: result.listings,
      error: null,
      isDemo: false,
    });
  }, []);

  /** Explicit fallback after a failure — see getDemoDashboard's docstring. */
  const showDemoData = useCallback(() => {
    const query = lastQuery.current;
    const areaSlug =
      detectSearchMode(query) === "AREA" && query ? toSlug(query) : "kuala-lumpur";
    const { dashboard, listings } = getDemoDashboard(areaSlug || "kuala-lumpur");
    requestId.current++;
    setState({
      progress: {
        status: "COMPLETED",
        currentPage: null,
        totalPages: null,
        listingsFound: listings.length,
        elapsedMs: 0,
        message: "Done.",
      },
      dashboard,
      listings,
      error: null,
      isDemo: true,
    });
  }, []);

  const reset = useCallback(() => {
    requestId.current++;
    setState({
      progress: IDLE_PROGRESS,
      dashboard: null,
      listings: [],
      error: null,
      isDemo: false,
    });
  }, []);

  return { ...state, search, reset, showDemoData };
}
