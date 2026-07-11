import { defineTool } from "eve/tools";
import { z } from "zod";
import { capture, fixture } from "../lib/topics.ts";

type SearchResults = { results: { title: string; url: string; content: string }[] };

// Replay bookkeeping: match a fixture entry by exact query, else fall back to
// the first not-yet-served entry so replayed runs still get real content even
// when the model phrases queries differently than the captured run.
const served = new Set<number>();
function replay(query: string): SearchResults {
  const searches = fixture()!.searches;
  let idx = searches.findIndex((s, i) => s.query === query && !served.has(i));
  if (idx === -1) idx = searches.findIndex((_, i) => !served.has(i));
  if (idx === -1) return { results: [] }; // fixture exhausted
  served.add(idx);
  return searches[idx].results as SearchResults;
}

// Tavily web search — grounds the briefing in real, citable sources.
// GLM 5.2 has no internet on its own; the agent calls this many times per run.
export default defineTool({
  description:
    "Search the web for fresh, citable sources. Returns ranked results with title, URL, and a content excerpt. " +
    "Call repeatedly with focused queries to gather evidence across topics before writing the briefing.",
  inputSchema: z.object({
    query: z.string().min(1),
    max_results: z.number().int().min(1).max(20).default(8),
  }),
  async execute({ query, max_results }) {
    // Eval replay mode: serve results captured from a real run instead of Tavily.
    if (fixture()) return replay(query);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.TAVILY_API_KEY!}`,
      },
      body: JSON.stringify({
        query,
        max_results,
        search_depth: "advanced",
        include_raw_content: true,
        topic: "news",
        days: 7, // ponytail: fixed recency window; widen if a topic needs deeper history
      }),
    });
    if (!res.ok) throw new Error(`Tavily search failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as {
      results?: { title: string; url: string; content: string; raw_content?: string | null }[];
    };
    const out: SearchResults = {
      results: (data.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        // raw_content is fuller but can be huge; cap it so we don't blow the context window.
        content: (r.raw_content ?? r.content ?? "").slice(0, 4000),
      })),
    };
    // Record raw inputs so this run can be replayed as an eval fixture.
    await capture((ctx) => {
      ctx.searches.push({ query, results: out });
    });
    return out;
  },
});
