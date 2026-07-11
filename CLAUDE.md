# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **Vercel Eve** agent that runs daily at 6am ET, researches the web, writes an **AI engineering
intelligence briefing for a Staff/Principal AI Engineer** with **GLM 5.2 (Ollama Cloud)** — upcoming
models, open-weight models, agent techniques, AI SDLC, emerging practices — commits the styled HTML
into `briefings/`, and posts the resulting GitHub Pages link to Slack for review. Topic/term history
persists across runs in Vercel Blob for trend analysis and hype-term lifecycle tracking.

This project uses the **eve** framework (`eve@^0.11.7`). Before writing framework code, read the
relevant guide in `node_modules/eve/docs/`. Eve auto-discovers everything under `agent/` — there is
no manual registration and no `vercel.json`.

## Layout

- `agent/agent.ts` — model wiring (GLM 5.2 via Ollama Cloud, OpenAI-compatible provider).
- `agent/instructions.md` — the analyst persona + operating procedure (**the system prompt**; this is
  where the briefing spec and terminology-lifecycle rules live).
- `agent/lib/topics.ts` — shared Blob helpers: topic-history types, run-context capture (prod runs
  record raw inputs to `runs/<date>-context.json`), and fixture replay (`WEB_SEARCH_FIXTURE`).
- `agent/tools/` — `web_search` (Tavily; replays fixtures in eval mode), `get_topic_history` /
  `record_topics` (Blob-backed trend history in `topic-trends.json`), `save_briefing_to_repo` (wraps
  the model's HTML body in the fixed stylesheet, commits it, returns the Pages URL),
  `post_to_slack` (incoming webhook). Each default-exports `defineTool`; discovered by filename.
- `agent/schedules/daily-briefing.ts` — the daily cron (`0 10 * * *`) + the run prompt.
- `agent/channels/eve.ts` — HTTP channel + auth (enables manual triggering of the deployed agent).
- `evals/` — eve eval suite (`daily-briefing.eval.ts` + `evals.config.ts`); fixtures in `evals/data/`.
- `briefings/` — committed briefing archives. **Do not gitignore.**

## Commands

- `npm run dev` — run locally (`eve dev`); trigger the agent from the REPL to test end-to-end.
- `npm run build` / `npm start` — `eve build` / `eve start`.
- `npm run eval` — run the eval suite in dry-run mode (no GitHub commit, no Slack post).
- `npm test` — unit tests (`node --test`) for pure logic like the landing-page manifest merge.
- `npm run typecheck` — `tsgo` (TypeScript native preview).

## Env vars

See `.env.example`. Local dev reads `.env.local`; production reads Vercel project env vars.
Required: `OLLAMA_API_KEY`, `TAVILY_API_KEY`, `SLACK_WEBHOOK_URL`, `GITHUB_TOKEN`, `GITHUB_REPO`
(`owner/repo`), `BLOB_READ_WRITE_TOKEN` (from the connected Vercel Blob store),
`ROUTE_AUTH_BASIC_PASSWORD`. `GITHUB_BRANCH` defaults to `main`. `VERCEL_OIDC_TOKEN` is
auto-provided by Vercel.

Behavior flags: `BRIEFING_DRY_RUN=1` disables the GitHub commit, Slack post, Blob trend write, and
run-context capture (evals set this via `npm run eval`). `WEB_SEARCH_FIXTURE=<path>` replays a
captured run context instead of calling Tavily/Blob (see README "Evals & tuning").

## Deploy (Vercel)

`vercel link` once, connect a **Blob store** to the project (injects `BLOB_READ_WRITE_TOKEN`), set
the env vars above, then deploy. The daily cron and the HTTP channel routes are generated from the
files in `agent/` at build time — there is **no `vercel.json`**. Manually trigger the deployed agent
with `curl -u $ROUTE_AUTH_BASIC_USER:$ROUTE_AUTH_BASIC_PASSWORD <url>/eve/v1/session`.

## Notes

- To A/B a different Ollama model, set `EVAL_OLLAMA_MODEL` (e.g. `deepseek-v4-flash:cloud`).
- `save_briefing_to_repo` commits directly to `GITHUB_BRANCH` — a serverless run can't `git push`,
  so archival goes through the GitHub Contents API.
- Briefing archives are served via **GitHub Pages** (`main` / root). The per-day Pages URL is what's posted
  to Slack; `index.html` at the repo root is a separate shareable landing page (today's briefing + a
  history archive), regenerated every run from `briefings-index.json` — see `agent/tools/save_briefing_to_repo.ts`.
- Blob files: `topic-trends.json` (cumulative term history; merged tool-side in `record_topics`,
  idempotent per-day) and `runs/<date>-context.json` (raw inputs captured per prod run, used as
  eval replay fixtures).
- The eval judge (`evals/evals.config.ts`) reuses the Ollama key with a different model family than
  the one under test; `OLLAMA_API_KEY` must be set when running `npm run eval`.
