import { test } from "node:test";
import assert from "node:assert/strict";
import { upsertBriefingEntry, type BriefingEntry } from "../agent/tools/save_briefing_to_repo.ts";

const entry = (date: string): BriefingEntry => ({ date, title: date, summary: date, url: date });

test("upsertBriefingEntry inserts newest first", () => {
  const result = upsertBriefingEntry([entry("2026-07-09")], entry("2026-07-11"));
  assert.deepEqual(result.map((e) => e.date), ["2026-07-11", "2026-07-09"]);
});

test("upsertBriefingEntry replaces a same-day entry instead of duplicating", () => {
  const stale = { date: "2026-07-11", title: "old", summary: "old", url: "old" };
  const result = upsertBriefingEntry([stale, entry("2026-07-09")], entry("2026-07-11"));
  assert.equal(result.length, 2);
  assert.equal(result[0]!.title, "2026-07-11");
});
