# Daily AI Engineering Intelligence

Most people who want to stay current on AI engineering read more. They subscribe to another newsletter, follow another thread, save another link they will never reopen. The result is not insight. It is volume. An engineer who consumes everything and synthesizes nothing has traded judgment for exposure, and the market rewards judgment.

This project inverts that. It is a daily intelligence agent that scans the noise so a human does not have to, and returns a five-minute briefing built for a **Staff Technical Lead for AI Engineering / Principal AI Engineer**: what to adopt, trial, watch, or skip.

The topical focus: upcoming and newly released frontier models, the best open-weight models (benchmarks, licenses, who is actually running them), agent development techniques, AI SDLC, and emerging AI-engineering practices — Harness Engineering, Loop Engineering, and whatever term appears next.

Two things make it more than a feed:

- **Longitudinal memory.** Every run records its top topics into a Vercel Blob JSON file (`topic-trends.json`) with first-seen/last-seen dates and sighting counts. The briefing uses that history for trend analysis: when a new hype term arises it is defined; as it evolves, the briefing reports how — citing articles that show real-world usage by real teams, not vendor marketing.
- **A grading loop.** Every production run also captures its raw inputs (search results, history snapshot) to Blob, so the agent can be re-run as an eval on frozen inputs and scored — meaning prompt and model changes are compared apples-to-apples. See [Evals](#evals--tuning).

## What's here

- `agent/instructions.md` holds the agent's operating instructions: objective, methodology, terminology-lifecycle tracking, and the HTML output format.
- `agent/` is the Vercel Eve agent — model wiring, tools (web search, topic history, archive, Slack), the daily schedule, and the HTTP channel.
- `evals/` holds the eval suite that grades a full briefing run (structure gates + LLM-judged quality).
- `briefings/` holds dated intelligence briefings, rendered as standalone HTML and published via GitHub Pages.
- `CLAUDE.md` is the developer guide for running and deploying the agent.

## How it runs

The agent is built on the [Vercel Eve](https://vercel.com) framework and runs autonomously on a daily 6am ET cron. Each run it loads its topic history from Vercel Blob, researches the web with Tavily, drafts the briefing with GLM 5.2 (via Ollama Cloud), commits the styled HTML into `briefings/`, records today's topics back into the trend history, and posts the published GitHub Pages link to Slack for review.

## Quickstart

### 0. Prerequisites

- **Node 24** and npm.
- A **Vercel** account and the CLI: `npm i -g vercel`.
- Accounts for the four services below (Ollama, Tavily, Slack, GitHub).

### 1. Install

```bash
git clone https://github.com/mthistle/daily-sentiment-analysis.git
cd daily-sentiment-analysis
npm install
```

### 2. Get your keys

Copy the template, then fill in `.env.local` (it's gitignored — secrets never get committed):

```bash
cp .env.example .env.local
```

| Var | Where to get it |
| --- | --- |
| `OLLAMA_API_KEY` | [ollama.com/settings/keys](https://ollama.com/settings/keys). Needs Ollama Cloud access to the `glm-5.2:cloud` model. |
| `TAVILY_API_KEY` | Sign up at [app.tavily.com](https://app.tavily.com) — the free tier is enough to start. |
| `SLACK_WEBHOOK_URL` | Create a Slack app → **Incoming Webhooks** → *Add New Webhook* for your review channel ([api.slack.com/apps](https://api.slack.com/apps)). Use a test channel first. |
| `GITHUB_TOKEN` | A [fine-grained PAT](https://github.com/settings/tokens?type=beta) with **Contents: Read and write** on your fork of this repo. |
| `GITHUB_REPO` | Your repo as `owner/repo` (e.g. `mthistle/daily-sentiment-analysis`). |
| `BLOB_READ_WRITE_TOKEN` | Connect a **Blob store** to the Vercel project (dashboard → Storage → Blob), then `vercel env pull .env.local`. |
| `ROUTE_AUTH_BASIC_PASSWORD` | Any secret you choose — it protects manual triggers of the deployed agent. |

Then enable **GitHub Pages** on the repo: *Settings → Pages → Source: Deploy from a branch → `main` / `/(root)`*. That's what makes the Slack link resolve.

### 3. Connect to Vercel

```bash
vercel login
vercel link
```

`vercel link` creates the `.vercel/project.json` link between this directory and a Vercel project. Connect a Blob store to the project while you're in the dashboard — that injects `BLOB_READ_WRITE_TOKEN` into the project env.

### 4. Test locally

Start the dev runtime in one terminal:

```bash
npm run dev
```

`eve dev` never fires schedules on their cron cadence, so trigger today's run once, out of band, from a second terminal:

```bash
curl -X POST http://localhost:3000/eve/v1/dev/schedules/daily-briefing
```

Watch the run load its history, search the web, commit `briefings/briefing-<date>.html`, record topics into Blob, and post the Pages link to Slack. Confirm the message lands and the linked page renders.

### 5. Deploy

Add each secret from step 2 to the Vercel project (Production environment), via the dashboard or the CLI:

```bash
vercel env add OLLAMA_API_KEY production
# ...repeat for TAVILY_API_KEY, SLACK_WEBHOOK_URL, GITHUB_TOKEN, GITHUB_REPO, ROUTE_AUTH_BASIC_PASSWORD
# (BLOB_READ_WRITE_TOKEN is injected automatically by the connected Blob store)
```

Then deploy:

```bash
vercel deploy --prod
```

The daily 6am ET cron is generated from `agent/schedules/daily-briefing.ts` automatically — no `vercel.json`. Smoke-test the live app with `curl https://<your-app>/eve/v1/health`, or force a run without waiting for the cron:

```bash
curl -u $ROUTE_AUTH_BASIC_USER:$ROUTE_AUTH_BASIC_PASSWORD \
  -X POST https://<your-app>/eve/v1/session \
  -H 'content-type: application/json' \
  -d '{"message":"Run today'\''s briefing now."}'
```

## Evals & tuning

The whole premise rests on trusting the filter, so the filter grades itself. `evals/daily-briefing.eval.ts` drives a complete briefing run and asserts on it: the tool procedure ran in order, the briefing has every required section, at least ten cited links, no code fences — plus soft LLM-judged scores for audience fit, sourcing discipline, and terminology tracking.

```bash
npm run eval          # full run, dry-run mode: nothing committed, nothing posted to Slack
```

Every **production** run captures its raw inputs to Blob at `runs/<date>-context.json` — each web search's results and the topic-history snapshot. To tune the agent on frozen inputs:

```bash
# 1. Freeze a run as a fixture (URL is the Blob store's public URL for the file)
curl -o evals/data/2026-07-06-context.json "https://<store>.public.blob.vercel-storage.com/runs/2026-07-06-context.json"

# 2. Replay: same inputs, no Tavily calls, no side effects
WEB_SEARCH_FIXTURE=evals/data/2026-07-06-context.json npm run eval

# 3. Change agent/instructions.md — or A/B a model — and re-run
WEB_SEARCH_FIXTURE=evals/data/2026-07-06-context.json EVAL_OLLAMA_MODEL=deepseek-v4-flash:cloud npm run eval
```

Judge scores across runs on the same fixture isolate the effect of the prompt or model change from "the news was different." Full per-run artifacts (event streams, assertion results) land in `.eve/evals/<timestamp>/`.

## How it reads

Each briefing opens with the five highest-signal developments and a practitioner-sentiment read. From there it moves through Model Watch (frontier and open-weight), Agent Engineering & AI SDLC, a Terminology Tracker (new terms defined, evolving terms tracked against their first-seen dates), Trend Deltas against the accumulated history, and Adopt/Trial/Watch calls for the next thirty to ninety days. Every claim carries a source. Where confidence is low, the briefing says so instead of rounding up.

The methodology is documented in `agent/instructions.md` if you want to see exactly how a topic gets classified, or adapt the weighting to a different domain.
