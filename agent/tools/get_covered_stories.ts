import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  capture,
  COVERED_PATH,
  type CoveredStories,
  fixture,
  readJsonBlob,
  recentCoveredStories,
} from "../lib/topics.ts";

// Called at the start of every run, alongside get_topic_history. This is the
// suppression memory: the stories (headline + source URL) already briefed in
// recent days, so the model does not re-report the same development. Unlike the
// topic history (which exists to resurface recurring terms), anything returned
// here should be EXCLUDED from today's briefing unless there is a genuinely new,
// material development on it.
export default defineTool({
  description:
    "Load the recently-briefed stories (headline + source URL, last ~45 days). Call this FIRST, " +
    "next to get_topic_history, so you can DEDUPLICATE: do not re-report a story already covered here. " +
    "Only resurface one if there is a genuinely new, material development since it was last covered, and " +
    "then frame it explicitly as an update, not a fresh story.",
  inputSchema: z.object({}),
  async execute() {
    const fx = fixture();
    const history = fx
      ? (fx.coveredStories ?? { stories: {} })
      : (await readJsonBlob<CoveredStories>(COVERED_PATH)) ?? { stories: {} };

    if (!fx) {
      await capture((ctx) => {
        ctx.coveredStories = history;
      });
    }

    const recent = recentCoveredStories(history);
    return {
      recentlyCovered: recent.map((s) => ({
        headline: s.headline,
        url: s.url,
        firstCovered: s.firstCovered,
        lastCovered: s.lastCovered,
        timesCovered: s.dates.length,
      })),
      totalRecent: recent.length,
    };
  },
});
