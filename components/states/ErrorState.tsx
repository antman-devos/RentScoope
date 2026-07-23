import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { CollectionError } from "@/types/collection";

interface ErrorStateProps {
  error: CollectionError;
  onRetry?: () => void;
  onShowDemoData?: () => void;
}

export function ErrorState({ error, onRetry, onShowDemoData }: ErrorStateProps) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertTitle>Couldn&apos;t complete this search</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <span>{error.message}</span>
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="w-fit">
              Try again
            </Button>
          )}
          {onShowDemoData && (
            <Button variant="ghost" size="sm" onClick={onShowDemoData} className="w-fit">
              View demo data instead
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
