/**
 * Minimal robots.txt parser — just enough to answer "can our bot
 * request this path?" for a single host. Not a full spec
 * implementation (no wildcard/$ pattern matching, no crawl-delay
 * parsing beyond what we already configure ourselves), which is a
 * deliberate simplification: Speedhome's robots.txt could not be
 * inspected from this environment (see README), so a hand-rolled
 * heavyweight parser would be validated against nothing. This
 * covers the common case (plain path-prefix Disallow/Allow rules)
 * correctly and fails safe (see below).
 */

export interface RobotsRules {
  disallowedPaths: string[];
  allowedPaths: string[];
}

function parseRobotsTxt(text: string, userAgent: string): RobotsRules {
  const lines = text.split("\n").map((l) => l.trim());
  const disallowedPaths: string[] = [];
  const allowedPaths: string[] = [];

  let currentGroupApplies = false;
  let sawSpecificGroup = false;

  for (const rawLine of lines) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;

    const [fieldRaw, ...rest] = line.split(":");
    const field = fieldRaw?.trim().toLowerCase();
    const value = rest.join(":").trim();

    if (field === "user-agent") {
      const matchesUs = value === "*" || userAgent.toLowerCase().includes(value.toLowerCase());
      if (value !== "*") sawSpecificGroup = true;
      currentGroupApplies = matchesUs;
      continue;
    }
    if (!currentGroupApplies) continue;

    if (field === "disallow" && value) disallowedPaths.push(value);
    if (field === "allow" && value) allowedPaths.push(value);
  }

  // If a robots.txt only ever defines rules for specific named bots
  // and none matched ours, treat "*" (implicit allow-all) as having
  // applied — this loop already does that via currentGroupApplies,
  // sawSpecificGroup is kept only for future diagnostics.
  void sawSpecificGroup;

  return { disallowedPaths, allowedPaths };
}

/**
 * Fetches and parses /robots.txt for the given origin. Fails open
 * with an empty ruleset (nothing disallowed) if robots.txt can't be
 * fetched at all — a missing robots.txt conventionally means
 * "crawl everything," per the Robots Exclusion Standard.
 */
export async function fetchRobotsRules(
  origin: string,
  userAgent: string,
  timeoutMs: number,
): Promise<RobotsRules> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(new URL("/robots.txt", origin).toString(), {
      headers: { "User-Agent": userAgent },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return { disallowedPaths: [], allowedPaths: [] };
    const text = await res.text();
    return parseRobotsTxt(text, userAgent);
  } catch {
    return { disallowedPaths: [], allowedPaths: [] };
  }
}

/** Longest matching rule wins, per the standard's precedence rule. */
export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  const longestDisallow = rules.disallowedPaths
    .filter((p) => path.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  const longestAllow = rules.allowedPaths
    .filter((p) => path.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];

  if (!longestDisallow) return true;
  if (longestAllow && longestAllow.length >= longestDisallow.length) return true;
  return false;
}
