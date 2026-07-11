import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";

// End-to-end eval of the daily briefing schedule. Run with `npm run eval`
// (sets BRIEFING_DRY_RUN=1 so nothing is committed or posted). To replay a
// captured production run instead of live Tavily, set
// WEB_SEARCH_FIXTURE=evals/data/<date>-context.json — see README.
//
// Loose event shape: we only need to fish the bodyHtml out of the
// save_briefing_to_repo tool-call request.
type AnyEvent = {
  type: string;
  data?: { actions?: readonly { kind?: string; name?: string; input?: Record<string, unknown> }[] };
};

function findToolInput(events: readonly unknown[], name: string): Record<string, unknown> | undefined {
  for (const e of events as readonly AnyEvent[]) {
    if (e.type !== "actions.requested") continue;
    for (const a of e.data?.actions ?? []) {
      if (a.kind === "tool-call" && a.name === name) return a.input;
    }
  }
  return undefined;
}

export default defineEval({
  description: "Full daily-briefing run: tool procedure, briefing structure, and judged content quality.",
  timeoutMs: 900_000, // a real run does many searches + a long generation
  async test(t) {
    const { sessionIds } = await t.target.dispatchSchedule("daily-briefing");
    await t.target.attachSession(sessionIds[0]!);

    t.completed();
    t.toolOrder([
      "get_topic_history",
      "web_search",
      "save_briefing_to_repo",
      "record_topics",
      "post_to_slack",
    ]);

    const bodyHtml = findToolInput(t.events, "save_briefing_to_repo")?.bodyHtml;
    if (typeof bodyHtml !== "string") throw new Error("save_briefing_to_repo was never called with a bodyHtml string");

    for (const cls of ["exec-summary", "trend-card", "watchlist-item", "implication-block", "sources-section"]) {
      t.check(bodyHtml, includes(cls));
    }
    if (bodyHtml.includes("```")) throw new Error("briefing contains code fences");
    if (bodyHtml.includes("<style")) throw new Error("briefing contains a <style> tag");
    const links = bodyHtml.match(/href="https?:\/\//g)?.length ?? 0;
    if (links < 10) throw new Error(`briefing cites only ${links} links; expected at least 10`);

    // Content quality: soft judge scores, fatal only under `eve eval --strict`.
    t.judge.autoevals
      .closedQA(
        "The briefing targets a Staff/Principal AI engineer — models, benchmarks, agent techniques, AI SDLC — not a product manager",
        { on: bodyHtml },
      )
      .atLeast(0.7);
    t.judge.autoevals
      .closedQA("Nearly every nontrivial claim carries an inline linked source", { on: bodyHtml })
      .atLeast(0.6);
    t.judge.autoevals
      .closedQA(
        "The Terminology Tracker defines terms marked NEW and describes how EVOLVING terms changed, with links showing real teams using them",
        { on: bodyHtml },
      )
      .atLeast(0.6);
  },
});
