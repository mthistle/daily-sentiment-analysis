import { defineSchedule } from "eve/schedules";

export default defineSchedule({
  cron: "0 10 * * *", // 6am EDT / 5am EST — 10:00 UTC daily (Vercel cron is fixed-UTC)
  markdown:
    "Produce today's Daily AI Engineering Intelligence Briefing following your instructions. " +
    "First call get_topic_history to load the persistent trend history and get_covered_stories to load " +
    "the stories already briefed recently. Then research with the " +
    "web_search tool, running many focused queries across upcoming/frontier models, open-weight " +
    "models, agent development techniques, AI SDLC, and emerging AI-engineering practices, so every " +
    "claim is backed by a real source you retrieved this run. Then write the full briefing as <body> " +
    "HTML per the OUTPUT FORMAT (component classes and badge levels), using the history for the " +
    "Terminology Tracker and Trend Deltas sections. Only include NEW stories: exclude any development " +
    "already in get_covered_stories unless there is a genuinely new, material update, framed as one. " +
    "Then call save_briefing_to_repo with that " +
    "bodyHtml plus a 1-2 sentence plain-text summary of today's top signal to archive it, update the " +
    "landing page, and get the link. Then call record_topics with today's top topics " +
    "(definitions for new terms, evolution notes + real-team sources for known ones). Then call " +
    "record_covered_stories with each story you briefed today (headline + primary URL). Finally call " +
    "post_to_slack once with just that archive URL as the text.",
});
