import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  capture,
  fixture,
  readJsonBlob,
  TRENDS_PATH,
  type TopicHistory,
} from "../lib/topics.ts";

// First call of every run: the longitudinal memory. The model compares today's
// findings against firstSeen/lastSeen dates to decide what's NEW vs EVOLVING
// and to write the Trend Deltas section.
export default defineTool({
  description:
    "Load the persistent topic-trend history (terms, models, and techniques tracked across runs, with " +
    "first-seen/last-seen dates, sighting counts, definitions, and evolution notes). Call this FIRST, " +
    "before researching, so you know which terms are new today and which are evolving.",
  inputSchema: z.object({}),
  async execute() {
    const fx = fixture();
    if (fx) return fx.topicHistory ?? { terms: {} };

    const history = (await readJsonBlob<TopicHistory>(TRENDS_PATH)) ?? { terms: {} };
    await capture((ctx) => {
      ctx.topicHistory = history;
    });
    return history;
  },
});
