import { Building2, CheckCircle2 } from "lucide-react";

import { APP_NAME, APP_TAGLINE, DATA_SOURCE_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

/** Top-of-page identity bar. Pure presentation — no state. */
export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight text-foreground">
              {APP_NAME}
            </h1>
            <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
          </div>
        </div>
        <Badge variant="outline" className="w-fit gap-1 text-muted-foreground">
          <CheckCircle2 className="size-3" />
          Live data from {DATA_SOURCE_LABEL.toUpperCase()}
        </Badge>
      </div>
    </header>
  );
}
