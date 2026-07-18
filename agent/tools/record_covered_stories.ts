import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  COVERED_PATH,
  type CoveredStories,
  dryRun,
  mergeCoveredStories,
  readJsonBlob,
  today,
  writeJsonBlob,
} from "../lib/topics.ts";

// Called after archiving, next to record_topics. Records the specific stories
// (headline + primary source URL) reported today so future runs can suppress
// duplicates. Tool-side merge keeps firstCovered/lastCovered/dates from drifting
// and makes same-day re-runs idempotent.
export default defineTool({
  description:
    "Record the stories you reported today (each headline plus its primary source URL) into the covered-" +
    "story ledger, so future runs do not re-report the same development. Call this after save_briefing_to_repo, " +
    "with one entry per distinct story you covered (executive-summary signals and each model/technique card).",
  inputSchema: z.object({
    stories: z
      .array(
        z.object({
          headline: z.string().min(1).describe("The story headline as briefed, e.g. 'Kimi K3 open-weight coding release'"),
          url: z.string().min(1).describe("Primary source URL for the story (the main link, not every citation)"),
        }),
      )
      .min(1),
  }),
  async execute({ stories }) {
    const day = today();
    const history = (await readJsonBlob<CoveredStories>(COVERED_PATH)) ?? { stories: {} };
    const { history: merged, newStories, updatedStories } = mergeCoveredStories(history, day, stories);

    if (!dryRun()) await writeJsonBlob(COVERED_PATH, merged);
    return { newStories, updatedStories, totalTracked: Object.keys(merged.stories).length };
  },
});
