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
