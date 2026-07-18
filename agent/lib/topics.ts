import { head, put } from "@vercel/blob";
import { readFileSync } from "node:fs";

export const today = () => new Date().toISOString().slice(0, 10);

export interface TopicNote {
  date: string;
  note: string;
  sources?: string[];
}

export interface TopicEntry {
  type: string;
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
  definition?: string;
  notes: TopicNote[];
}

export interface TopicHistory {
  terms: Record<string, TopicEntry>;
}

export const TRENDS_PATH = "topic-trends.json";

// --- covered-story ledger -----------------------------------------------------
// Separate from topic history and with the opposite intent: topic history exists
// to RESURFACE recurring terms (Kimi K3 as an entity), the covered-story ledger
// exists to SUPPRESS re-reporting a specific development already briefed (the
// "Kimi K3 benchmark results" story). Keyed by canonical (normalized) source URL.

export interface CoveredStoryEntry {
  url: string; // normalized key, echoed for convenience
  headline: string; // most recent headline used for this story
  firstCovered: string;
  lastCovered: string;
  dates: string[]; // every date this story appeared in a briefing
}

export interface CoveredStories {
  stories: Record<string, CoveredStoryEntry>;
}

export const COVERED_PATH = "covered-stories.json";

// Canonicalize a URL so trivial variants (protocol, www., trailing slash,
// tracking query params, fragments) collapse to one key. Same story from the
// same page won't be recorded twice just because the link string differs.
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    let path = u.pathname.replace(/\/+$/, ""); // drop trailing slashes
    if (path === "") path = "/";
    return `${host}${path}`.toLowerCase();
  } catch {
    // Not a parseable absolute URL — normalize as best we can so it still dedupes.
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split(/[?#]/)[0]!
      .replace(/\/+$/, "")
      .toLowerCase();
  }
}

// A story the model reported today: a headline and its primary source URL.
export interface CoveredStoryInput {
  headline: string;
  url: string;
}

// Tool-side merge: bookkeeping (firstCovered/lastCovered/dates) lives here so it
// can't drift, and same-day re-runs are idempotent (interrupted eve steps re-run).
export function mergeCoveredStories(
  history: CoveredStories,
  day: string,
  stories: CoveredStoryInput[],
): { history: CoveredStories; newStories: string[]; updatedStories: string[] } {
  const newStories: string[] = [];
  const updatedStories: string[] = [];
  for (const s of stories) {
    const key = normalizeUrl(s.url);
    if (!key) continue;
    const existing = history.stories[key];
    if (!existing) {
      history.stories[key] = {
        url: key,
        headline: s.headline,
        firstCovered: day,
        lastCovered: day,
        dates: [day],
      };
      newStories.push(key);
      continue;
    }
    existing.headline = s.headline; // keep the most recent phrasing
    if (!existing.dates.includes(day)) {
      existing.dates.push(day);
      existing.lastCovered = day;
    }
    updatedStories.push(key);
  }
  return { history, newStories, updatedStories };
}

// Bounded, recency-ordered slice of the ledger for the agent to dedupe against.
// A rolling window keeps the context small while still catching stories that
// recur across a week or two. Newest last-covered first.
export function recentCoveredStories(
  history: CoveredStories,
  { asOf = today(), days = 45, limit = 80 }: { asOf?: string; days?: number; limit?: number } = {},
): CoveredStoryEntry[] {
  const cutoff = new Date(`${asOf}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return Object.values(history.stories)
    .filter((s) => s.lastCovered >= cutoffKey)
    .sort((a, b) => b.lastCovered.localeCompare(a.lastCovered))
    .slice(0, limit);
}

export async function readJsonBlob<T>(path: string): Promise<T | null> {
  try {
    const { url } = await head(path);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // BlobNotFoundError → treat as empty
  }
}

export async function writeJsonBlob(path: string, data: unknown): Promise<void> {
  await put(path, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

// --- run-context capture & replay --------------------------------------------
// Every production run records its raw inputs (topic-history snapshot + each
// web_search result) to runs/<date>-context.json in Blob, so evals can replay
// the agent on frozen inputs and compare prompt/model variants apples-to-apples.

export interface RunContext {
  date: string;
  topicHistory?: TopicHistory;
  coveredStories?: CoveredStories;
  searches: { query: string; results: unknown }[];
}

export const dryRun = () => process.env.BRIEFING_DRY_RUN === "1";

let fixtureCache: RunContext | null | undefined;
export function fixture(): RunContext | null {
  if (fixtureCache === undefined) {
    const p = process.env.WEB_SEARCH_FIXTURE;
    fixtureCache = p ? (JSON.parse(readFileSync(p, "utf8")) as RunContext) : null;
  }
  return fixtureCache;
}

const runContextPath = () => `runs/${today()}-context.json`;

// Best-effort: capture is observability, not product — it must never fail the
// run. Tool calls within a run are sequential, so read-modify-write is safe.
export async function capture(patch: (ctx: RunContext) => void): Promise<void> {
  if (fixture() || dryRun()) return; // replaying or eval dry-run — don't record
  try {
    const ctx =
      (await readJsonBlob<RunContext>(runContextPath())) ?? { date: today(), searches: [] };
    patch(ctx);
    await writeJsonBlob(runContextPath(), ctx);
  } catch {
    // ponytail: swallowed by design; a lost capture costs a fixture, not a briefing
  }
}
