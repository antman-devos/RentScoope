import { Loader2 } from "lucide-react";

import type { CollectionProgress as CollectionProgressType } from "@/types/collection";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const STAGE_ORDER = [
  "SEARCHING",
  "COLLECTING",
  "PARSING",
  "NORMALIZING",
  "ANALYZING",
] as const;

function stagePercent(status: CollectionProgressType["status"]): number {
  if (status === "COMPLETED") return 100;
  const index = STAGE_ORDER.indexOf(status as (typeof STAGE_ORDER)[number]);
  if (index === -1) return 0;
  return Math.round(((index + 1) / (STAGE_ORDER.length + 1)) * 100);
}

interface CollectionProgressProps {
  progress: CollectionProgressType;
}

/** Live status of the collect -> parse -> normalize -> analyze pipeline. */
export function CollectionProgressCard({ progress }: CollectionProgressProps) {
  if (progress.status === "IDLE") return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            {progress.message}
          </div>
          {progress.currentPage !== null && progress.totalPages !== null && (
            <span className="text-xs text-muted-foreground">
              Page {progress.currentPage} / {progress.totalPages}
            </span>
          )}
        </div>
        <Progress value={stagePercent(progress.status)} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.listingsFound} listings found so far</span>
          <span>{(progress.elapsedMs / 1000).toFixed(1)}s elapsed</span>
        </div>
      </CardContent>
    </Card>
  );
}
