import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

/**
 * Placeholder page for Milestone 1.
 * This confirms the project scaffold builds and renders correctly.
 * The real dashboard layout (header, search, summary cards, charts,
 * tables, export actions) is built in Milestone 2.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-3xl font-medium text-primary">{APP_NAME}</h1>
      <p className="text-muted-foreground">{APP_TAGLINE}</p>
      <p className="mt-8 text-sm text-muted-foreground">
        Project scaffold complete — dashboard arrives in Milestone 2.
      </p>
    </main>
  );
}
