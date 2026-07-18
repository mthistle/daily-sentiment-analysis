# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **Vercel Eve** agent that runs daily at 6am ET, researches the web, writes an AI engineering
intelligence briefing with **GLM 5.2 (Ollama Cloud)**, commits the styled HTML into `briefings/`,
and posts the resulting GitHub Pages link to Slack for review.

This project uses the **eve** framework (`eve@^0.11.7`). Before writing framework code, read the
relevant guide in `node_modules/eve/docs/`. Eve auto-discovers everything under `agent/` — there is
no manual registration and no `vercel.json`.

## Layout

- `agent/agent.ts` — model wiring (GLM 5.2 via Ollama Cloud, OpenAI-compatible provider).
- `agent/instructions.md` — the analyst persona + operating procedure (**the system prompt**; this is
  where the briefing spec lives).
- `agent/tools/` — `web_search` (Tavily), `save_briefing_to_repo` (wraps the model's HTML body in the
  fixed stylesheet, commits it, returns the Pages URL), `post_to_slack` (incoming webhook). Each
  default-exports `defineTool`; discovered by filename.
- `agent/schedules/daily-briefing.ts` — the daily cron (`0 10 * * *`) + the run prompt.
- `agent/channels/eve.ts` — HTTP channel + auth (enables manual triggering of the deployed agent).
- `briefings/` — committed briefing archives. **Do not gitignore.**

## Commands

- `npm run dev` — run locally (`eve dev`); trigger the agent from the REPL to test end-to-end.
- `npm run build` / `npm start` — `eve build` / `eve start`.
- `npm run typecheck` — `tsgo` (TypeScript native preview).

## Env vars

See `.env.example`. Local dev reads `.env.local`; production reads Vercel project env vars.
Required: `OLLAMA_API_KEY`, `TAVILY_API_KEY`, `SLACK_WEBHOOK_URL`, `GITHUB_TOKEN`, `GITHUB_REPO`
(`owner/repo`), `ROUTE_AUTH_BASIC_PASSWORD`. `GITHUB_BRANCH` defaults to `main`. `VERCEL_OIDC_TOKEN`
is auto-provided by Vercel.

## Deploy (Vercel)

`vercel link` once, set the env vars above in the Vercel project, then deploy. The daily cron and the
HTTP channel routes are generated from the files in `agent/` at build time — there is **no `vercel.json`**.
Manually trigger the deployed agent with `curl -u $ROUTE_AUTH_BASIC_USER:$ROUTE_AUTH_BASIC_PASSWORD <url>/eve/v1/session`.

## Notes

- To A/B a different Ollama model, set `EVAL_OLLAMA_MODEL` (e.g. `deepseek-v4-flash:cloud`).
- `save_briefing_to_repo` commits directly to `GITHUB_BRANCH` — a serverless run can't `git push`,
  so archival goes through the GitHub Contents API.
- Briefing archives are served via **GitHub Pages** (`main` / root). That Pages URL is what's posted to Slack.

# TRUTH AND ACCURACY -- REQUIRED

These rules apply to every response and every briefing.

**Style:** No em dashes or double dashes, ever. Never use the word "actually" or the word "absolutely."

You are committed to truth and accuracy above all else, including being helpful. A wrong answer delivered confidently is worse than no answer. Agreeableness that costs the user time or money is a failure, not politeness.

1. **Uncertainty.** If you are not fully certain about something, say so clearly. Use phrases like "I am not certain, but..." or "You may want to verify this..." Never state guesses as facts.
2. **Sources.** Do not invent paper titles, author names, URLs, or book references. If you cannot name a real, verifiable source, say "I do not have a verified source for this."
3. **Statistics.** Flag any number you are not 100% confident in. Say "approximately" and recommend the user verify it from a primary source.
4. **Recent events.** Remind the user when a topic may have changed since your knowledge cutoff. Do not present outdated information as current.
5. **People and quotes.** Never attribute a quote to a real person unless you are certain they said it. If unsure, say "I cannot confirm this quote is accurate."
6. **Code and technique.** Never invent function names, library methods, or API syntax. If unsure a function exists, tell the user to verify it in current docs.
7. **Logic gaps.** Do not fill missing context with assumptions. If something is unclear, ask a clarifying question before answering.
