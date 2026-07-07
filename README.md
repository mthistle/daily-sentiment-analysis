# Daily Sentiment Analysis

Most people who want to stay current on product and AI read more. They subscribe to another newsletter, follow another thread, save another link they will never reopen. The result is not insight. It is volume. A product leader who consumes everything and synthesizes nothing has traded judgment for exposure, and the market rewards judgment.

This project inverts that. It is a daily strategic intelligence agent that scans the noise so a human does not have to, and returns a five-minute executive briefing built around signal rather than coverage.

The hard part was never gathering the news. Aggregation is a solved problem. The hard part is discrimination, separating an early structural shift from a viral LinkedIn post that will be forgotten by Thursday, and doing it consistently enough that the reader learns to trust the filter. A briefing that surfaces everything relevant is a briefing that surfaces nothing useful.

So the agent operates like an analyst rather than a feed. It runs across Reddit, Hacker News, X, GitHub, Product Hunt, research papers, funding news, and earnings calls, then classifies what it finds. It reads momentum on a scale from rapidly emerging through declining, it reads sentiment alongside the reason the sentiment exists, and it reads enterprise relevance and hype risk. It weights an enterprise case study above a thousand reposts on purpose. Good intelligence is mostly a discipline of what you refuse to include.

The topical focus sits where product management and AI are actually reshaping how teams work, meaning AI for PM, agentic and autonomous workflows, product-led growth, and the operating-model changes underneath them. It watches the companies driving that conversation, from OpenAI and Anthropic to Linear, Figma, Cursor, and Notion, and adds new entrants as their momentum earns the attention.

## What's here

- `agent/instructions.md` holds the agent's operating instructions: objective, methodology, source weighting, and the HTML output format.
- `agent/` is the Vercel Eve agent — model wiring, tools (web search, archive, Slack), the daily schedule, and the HTTP channel.
- `briefings/` holds dated intelligence briefings, rendered as standalone HTML and published via GitHub Pages.
- `CLAUDE.md` is the developer guide for running and deploying the agent.
- The root-level `.md` and `.html` files are an early briefing kept for longitudinal comparison.

## How it runs

The agent is built on the [Vercel Eve](https://vercel.com) framework and runs autonomously on a daily 6am ET cron. Each run it researches the web with Tavily, drafts the briefing with GLM 5.2 (via Ollama Cloud), commits the styled HTML into `briefings/`, and posts the published GitHub Pages link to Slack for review. Setup and deploy steps are in `CLAUDE.md`.

## How it reads

Each briefing opens with a short executive summary covering the three-to-five highest-signal developments, what is accelerating, and what is weakening. From there it moves through emerging trends, contrarian debates, fatiguing narratives, a tools-to-watch list, and the strategic implications for the next thirty to ninety days. Every claim carries a source. Where confidence is low, the briefing says so instead of rounding up.

## Naming the obvious gap

The automation is now in place — a deployed daily pipeline rather than a person running a prompt. What it still does not do is grade its own longitudinal accuracy: it does not yet measure how often a "rapidly emerging" call held up a month later. I am naming that because the whole premise rests on trusting the filter, and a filter that never grades itself is asking for faith it has not earned. That measurement layer is the next thing worth building.

The methodology is documented in `agent/instructions.md` if you want to see exactly how a topic gets classified, or adapt the weighting to a different domain.
