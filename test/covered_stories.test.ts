import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mergeCoveredStories,
  normalizeUrl,
  recentCoveredStories,
  type CoveredStories,
} from "../agent/lib/topics.ts";

test("normalizeUrl collapses protocol, www, trailing slash, query, and fragment", () => {
  const canonical = "example.com/blog/kimi-k3";
  for (const variant of [
    "https://example.com/blog/kimi-k3",
    "http://www.example.com/blog/kimi-k3/",
    "https://EXAMPLE.com/blog/kimi-k3?utm_source=x#section",
    "www.example.com/blog/kimi-k3",
  ]) {
    assert.equal(normalizeUrl(variant), canonical);
  }
});

test("mergeCoveredStories records a new story with first/last covered set", () => {
  const history: CoveredStories = { stories: {} };
  const { newStories, updatedStories } = mergeCoveredStories(history, "2026-07-16", [
    { headline: "Kimi K3 released", url: "https://moonshot.ai/kimi-k3" },
  ]);
  assert.deepEqual(newStories, ["moonshot.ai/kimi-k3"]);
  assert.deepEqual(updatedStories, []);
  const entry = history.stories["moonshot.ai/kimi-k3"]!;
  assert.equal(entry.firstCovered, "2026-07-16");
  assert.equal(entry.lastCovered, "2026-07-16");
  assert.deepEqual(entry.dates, ["2026-07-16"]);
});

test("mergeCoveredStories dedupes the same story across days and is idempotent same-day", () => {
  const history: CoveredStories = { stories: {} };
  mergeCoveredStories(history, "2026-07-16", [{ headline: "Kimi K3", url: "https://moonshot.ai/kimi-k3" }]);
  // different link string, same page → same key, treated as an update
  const r2 = mergeCoveredStories(history, "2026-07-17", [
    { headline: "Kimi K3 benchmarks", url: "http://www.moonshot.ai/kimi-k3/" },
  ]);
  assert.deepEqual(r2.updatedStories, ["moonshot.ai/kimi-k3"]);
  // same-day replay must not double-count the date
  mergeCoveredStories(history, "2026-07-17", [{ headline: "Kimi K3 benchmarks", url: "https://moonshot.ai/kimi-k3" }]);
  const entry = history.stories["moonshot.ai/kimi-k3"]!;
  assert.deepEqual(entry.dates, ["2026-07-16", "2026-07-17"]);
  assert.equal(entry.lastCovered, "2026-07-17");
  assert.equal(entry.headline, "Kimi K3 benchmarks"); // keeps most recent phrasing
});

test("recentCoveredStories windows by lastCovered and orders newest first", () => {
  const history: CoveredStories = { stories: {} };
  mergeCoveredStories(history, "2026-05-01", [{ headline: "old", url: "https://a.com/old" }]);
  mergeCoveredStories(history, "2026-07-10", [{ headline: "mid", url: "https://b.com/mid" }]);
  mergeCoveredStories(history, "2026-07-17", [{ headline: "fresh", url: "https://c.com/fresh" }]);

  const recent = recentCoveredStories(history, { asOf: "2026-07-18", days: 45 });
  assert.deepEqual(recent.map((s) => s.headline), ["fresh", "mid"]); // "old" is outside the window
});
