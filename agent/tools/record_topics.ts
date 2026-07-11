import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  dryRun,
  readJsonBlob,
  today,
  TRENDS_PATH,
  writeJsonBlob,
  type TopicHistory,
} from "../lib/topics.ts";

// Tool-side merge into topic-trends.json: the model only names today's topics;
// firstSeen/lastSeen/seenCount bookkeeping happens here so it can't drift.
export default defineTool({
  description:
    "Record today's top topics/terms/models into the persistent trend history after the briefing is " +
    "saved. For a term NOT already in the history, include a `definition`. For a known term, include a " +
    "`note` describing how it is evolving plus `sources` showing real-world usage by real teams. " +
    "Returns which terms were new vs updated.",
  inputSchema: z.object({
    topics: z
      .array(
        z.object({
          term: z.string().min(1).describe("Canonical lowercase name, e.g. 'harness engineering' or 'qwen4-coder'"),
          type: z.enum(["model", "open-weight-model", "technique", "term", "tool"]),
          definition: z.string().optional().describe("Required the first time a term is seen"),
          note: z.string().optional().describe("Evolution note for this run"),
          sources: z.array(z.string()).optional().describe("URLs showing real teams using it"),
        }),
      )
      .min(1),
  }),
  async execute({ topics }) {
    const day = today();
    const history = (await readJsonBlob<TopicHistory>(TRENDS_PATH)) ?? { terms: {} };

    const newTerms: string[] = [];
    const updatedTerms: string[] = [];

    for (const t of topics) {
      const key = t.term.trim().toLowerCase();
      const existing = history.terms[key];
      if (!existing) {
        history.terms[key] = {
          type: t.type,
          firstSeen: day,
          lastSeen: day,
          seenCount: 1,
          definition: t.definition,
          notes: t.note ? [{ date: day, note: t.note, sources: t.sources }] : [],
        };
        newTerms.push(key);
        continue;
      }
      // Idempotent per-day: interrupted eve steps re-run, so a same-day replay
      // must not double-count or duplicate notes.
      if (existing.lastSeen !== day) {
        existing.lastSeen = day;
        existing.seenCount += 1;
      }
      if (!existing.definition && t.definition) existing.definition = t.definition;
      if (t.note && !existing.notes.some((n) => n.date === day && n.note === t.note)) {
        existing.notes.push({ date: day, note: t.note, sources: t.sources });
      }
      updatedTerms.push(key);
    }

    if (!dryRun()) await writeJsonBlob(TRENDS_PATH, history);
    return { newTerms, updatedTerms, totalTracked: Object.keys(history.terms).length };
  },
});
