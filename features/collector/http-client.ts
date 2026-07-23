import { chromium, type Browser, type BrowserContext } from "playwright";

export class HttpTimeoutError extends Error {}
export class HttpStatusError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Speedhome sits behind Cloudflare's bot challenge. Confirmed by
 * direct inspection of a blocked request: HTTP 403, `server:
 * cloudflare`, `cf-mitigated: challenge`, HTML title "Just a
 * moment...". Plain fetch() cannot get past this — no header or
 * retry-logic change fixes it, since Cloudflare's challenge requires
 * a real browser to execute its JS and pass. This file now drives
 * headless Chromium via Playwright instead. Nothing outside this
 * file changes: fetchHtml() still returns a plain HTML string, and
 * still throws HttpTimeoutError / HttpStatusError — the same two
 * types features/collector/collector.ts already maps to
 * CollectionError, so the rest of the pipeline needed zero changes.
 */

// Cloudflare's challenge plus a full page render needs more headroom
// than the old plain-fetch 15s timeout gave it.
const NAVIGATION_TIMEOUT_MS = 30_000;
const CHALLENGE_WAIT_TIMEOUT_MS = 20_000;

const LISTING_SELECTOR = 'a[href*="/details/"]';
const DESKTOP_VIEWPORT = { width: 1920, height: 1080 };
const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/**
 * One browser + one context are kept warm and reused across calls
 * (module-level singleton) rather than launched fresh per page, for
 * two reasons: (1) a fresh launch-per-page means re-solving
 * Cloudflare's challenge on every single page of a paginated
 * collection — slow, and a much more bot-like traffic pattern than
 * one session browsing multiple pages, which is what a real user
 * does; (2) the challenge-passed cookie only helps subsequent
 * requests if the context (and its cookies) persists between them.
 * The browser is intentionally never explicitly closed — there's no
 * "collection finished" hook to call it from without changing
 * collector.ts, and leaving a warm browser for the process's
 * lifetime is the standard pattern for Playwright inside a
 * long-lived Node server anyway.
 */
let browserPromise: Promise<Browser> | null = null;
let contextPromise: Promise<BrowserContext> | null = null;

async function getContext(): Promise<BrowserContext> {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        // Required to run headless Chromium as root in this kind of
        // containerized environment.
        "--no-sandbox",
        // The next several flags reduce Chromium's memory footprint —
        // important on memory-constrained hosts (e.g. Render's free
        // tier, 512MB RAM total for the whole Node process + browser).
        // --disable-dev-shm-usage in particular matters most: many
        // containers give /dev/shm only 64MB by default, and Chromium
        // uses shared memory heavily; too little of it causes crashes
        // independent of how much total RAM is free.
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
      ],
    });
  }
  const browser = await browserPromise;

  if (!contextPromise) {
    contextPromise = browser.newContext({
      viewport: DESKTOP_VIEWPORT,
      userAgent: DESKTOP_USER_AGENT,
      locale: "en-US",
      timezoneId: "Asia/Kuala_Lumpur",
    });
  }
  return contextPromise;
}

function isCloudflareChallengeTitle(title: string): boolean {
  return /just a moment/i.test(title);
}

/**
 * Loads a page with headless Chromium and returns its rendered HTML.
 * Waits for DOM content, then for a listing card selector to appear
 * (covers the time Cloudflare's challenge takes to resolve) rather
 * than a fixed sleep. If the selector never appears, checks whether
 * we're still stuck on Cloudflare's challenge page (a real failure)
 * versus a legitimately empty/last page (not a failure — the parser
 * finds zero cards and the collector's existing pagination-stop
 * logic handles that correctly on its own).
 */
export async function fetchHtml(url: string): Promise<string> {
  let page;
  try {
    const context = await getContext();
    page = await context.newPage();

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    try {
      await page.waitForSelector(LISTING_SELECTOR, { timeout: CHALLENGE_WAIT_TIMEOUT_MS });
    } catch {
      const title = await page.title();
      if (isCloudflareChallengeTitle(title)) {
        throw new HttpTimeoutError(
          `Cloudflare challenge did not resolve for ${url} within ${CHALLENGE_WAIT_TIMEOUT_MS}ms`,
        );
      }
      // Not a challenge — just no listing cards on this page (e.g. a
      // genuinely empty area, or past the last page of pagination).
      // Fall through and return whatever content is there; the
      // parser will correctly find zero cards.
    }

    return await page.content();
  } catch (err) {
    if (err instanceof HttpTimeoutError) throw err;
    if (err && typeof err === "object" && "name" in err && err.name === "TimeoutError") {
      throw new HttpTimeoutError(`Navigation to ${url} timed out after ${NAVIGATION_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    await page?.close().catch(() => undefined);
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
