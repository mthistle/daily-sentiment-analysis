import { defineTool } from "eve/tools";
import { z } from "zod";

// Fixed dark-theme shell (stylesheet lifted verbatim from briefings/briefing-2026-06-11.html,
// plus the missing badge-level variants). The CSS never drifts — the model only emits the
// <body> content using these component classes (see agent/instructions.md for the vocabulary).
function renderHtml(title: string, bodyHtml: string, day: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  :root {
    --bg: #0f1117; --surface: #1a1d27; --surface2: #222536; --border: #2e3148;
    --accent: #6c63ff; --accent2: #00c2a8; --accent3: #f59e0b; --accent4: #ef4444;
    --text: #e8eaf0; --text-muted: #8b8fa8; --text-dim: #5a5d75;
    --green: #22c55e; --yellow: #eab308; --red: #ef4444; --orange: #f97316; --blue: #3b82f6; --purple: #a855f7;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; max-width: 900px; margin: 0 auto; padding: 40px 24px 80px; }
  a { color: var(--accent2); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
  a:hover { border-bottom-color: var(--accent2); }
  .header { border-bottom: 1px solid var(--border); padding-bottom: 28px; margin-bottom: 36px; }
  .header-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 10px; }
  .header h1 { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin-bottom: 6px; }
  .header-meta { color: var(--text-muted); font-size: 13px; }
  .section-title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin: 44px 0 18px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .exec-summary { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; padding: 24px 26px; margin-bottom: 8px; }
  .exec-summary h2 { font-size: 15px; font-weight: 700; margin-bottom: 14px; color: var(--text); }
  .signal-row { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
  .signal-num { background: var(--accent); color: white; font-size: 11px; font-weight: 700; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .signal-text { color: var(--text); line-height: 1.6; }
  .sentiment-bar-container { margin-top: 18px; }
  .sentiment-label { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
  .sentiment-bar { height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .sentiment-fill { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #ef4444 0%, #eab308 40%, #22c55e 75%); width: 64%; }
  .sentiment-caption { font-size: 11px; color: var(--text-muted); margin-top: 5px; }
  .trend-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 22px 24px; margin-bottom: 18px; }
  .trend-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; white-space: nowrap; }
  .badge-label { color: var(--text-muted); font-weight: 400; margin-right: 4px; font-size: 9px; }
  .m-explosive { background: rgba(239,68,68,0.18); color: #f87171; }
  .m-high { background: rgba(245,158,11,0.18); color: #fbbf24; }
  .m-medium { background: rgba(59,130,246,0.18); color: #60a5fa; }
  .m-low { background: rgba(139,143,168,0.18); color: #b6bad0; }
  .s-positive { background: rgba(34,197,94,0.15); color: #4ade80; }
  .s-mixed { background: rgba(234,179,8,0.15); color: #fde047; }
  .s-polarizing { background: rgba(168,85,247,0.15); color: #c084fc; }
  .s-negative { background: rgba(239,68,68,0.15); color: #f87171; }
  .er-high { background: rgba(34,197,94,0.12); color: #4ade80; }
  .er-medium { background: rgba(59,130,246,0.12); color: #60a5fa; }
  .er-low { background: rgba(139,143,168,0.12); color: #b6bad0; }
  .hr-high { background: rgba(239,68,68,0.12); color: #f87171; }
  .hr-medium { background: rgba(245,158,11,0.12); color: #fbbf24; }
  .hr-low { background: rgba(34,197,94,0.12); color: #4ade80; }
  .cl-high { background: rgba(34,197,94,0.12); color: #4ade80; }
  .cl-medium { background: rgba(59,130,246,0.12); color: #60a5fa; }
  .cl-low { background: rgba(245,158,11,0.12); color: #fbbf24; }
  .trend-body p { margin-bottom: 10px; }
  .trend-body strong { font-weight: 600; }
  .field-label { color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 14px; margin-bottom: 4px; display: block; }
  .contrarian-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid #a855f7; border-radius: 8px; padding: 18px 22px; margin-bottom: 16px; }
  .contrarian-card h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .declining-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid #f97316; border-radius: 8px; padding: 18px 22px; margin-bottom: 16px; }
  .declining-card h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .watchlist-item { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
  .watchlist-name { font-size: 14px; font-weight: 700; color: var(--accent2); margin-bottom: 6px; }
  .implication-block { border-left: 2px solid var(--accent3); padding: 10px 0 10px 16px; margin-bottom: 12px; }
  .implication-type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--accent3); font-weight: 700; margin-bottom: 4px; }
  .long-row { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; }
  .long-icon { font-size: 13px; margin-top: 2px; width: 24px; flex-shrink: 0; color: var(--accent2); font-weight: 700; }
  .sources-section { margin-top: 52px; border-top: 1px solid var(--border); padding-top: 24px; }
  .sources-section h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); font-weight: 700; margin-bottom: 14px; }
  .sources-list { list-style: none; }
  .sources-list li { font-size: 12px; color: var(--text-muted); margin-bottom: 7px; display: flex; gap: 8px; }
  .sources-list li .src-num { color: var(--text-dim); flex-shrink: 0; width: 24px; }
  .sources-list li a { font-size: 12px; color: var(--text-muted); }
  .sources-list li a:hover { color: var(--accent2); }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 11px; color: var(--text-dim); text-align: center; }
</style>
</head>
<body>
${bodyHtml}
<div class="footer">AI Engineering Intelligence &nbsp;&middot;&nbsp; ${day} &nbsp;&middot;&nbsp; Automated daily run &nbsp;&middot;&nbsp; Signal over noise</div>
</body>
</html>
`;
}

export interface BriefingEntry {
  date: string;
  title: string;
  summary: string;
  url: string;
}

// Idempotent upsert: same-day re-runs replace rather than duplicate; newest first.
export function upsertBriefingEntry(entries: BriefingEntry[], entry: BriefingEntry): BriefingEntry[] {
  return [entry, ...entries.filter((e) => e.date !== entry.date)].sort((a, b) => b.date.localeCompare(a.date));
}

// Landing page (repo root -> served at the GitHub Pages base URL): today's
// briefing featured up top, older ones listed below. Regenerated from the
// manifest on every run, so it never drifts from what's actually archived.
export function renderIndexHtml(entries: BriefingEntry[]): string {
  const [latest, ...history] = entries;
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

  const historyRows = history
    .map((e) => `<li class="history-row"><span class="history-date">${fmt(e.date)}</span><a href="${e.url}">${e.title}</a></li>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Engineering Intelligence</title>
<style>
  :root {
    --bg: #0f1117; --surface: #1a1d27; --border: #2e3148;
    --accent: #6c63ff; --accent2: #00c2a8;
    --text: #e8eaf0; --text-muted: #8b8fa8; --text-dim: #5a5d75;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 48px 24px 80px; }
  a { color: var(--accent2); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 0.15s; }
  a:hover { border-bottom-color: var(--accent2); }
  .page-label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 600; margin-bottom: 10px; }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 10px; }
  .tagline { color: var(--text-muted); font-size: 14px; margin-bottom: 44px; max-width: 46em; }
  .latest-card { background: var(--surface); border: 1px solid var(--border); border-left: 3px solid var(--accent); border-radius: 8px; padding: 28px 30px; margin-bottom: 52px; }
  .latest-label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 10px; }
  .latest-card h2 { font-size: 19px; font-weight: 700; margin-bottom: 6px; }
  .latest-date { color: var(--text-muted); font-size: 12px; margin-bottom: 16px; }
  .latest-summary { color: var(--text); margin-bottom: 20px; }
  .read-link { display: inline-block; font-size: 13px; font-weight: 600; }
  .section-title { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); font-weight: 700; margin-bottom: 18px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
  .history-list { list-style: none; }
  .history-row { display: flex; gap: 16px; align-items: baseline; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .history-date { color: var(--text-dim); font-size: 12px; width: 200px; flex-shrink: 0; }
  .history-row a { color: var(--text); font-size: 13px; }
  .history-row a:hover { color: var(--accent2); }
  .empty { color: var(--text-dim); font-size: 13px; }
</style>
</head>
<body>
<div class="page-label">Daily Intelligence</div>
<h1>AI Engineering Intelligence</h1>
<p class="tagline">A daily briefing for AI engineering leads: upcoming and open-weight models, agent development techniques, AI SDLC, and emerging practices — tracked over time, signal over noise.</p>

${
  latest
    ? `<div class="latest-card">
  <div class="latest-label">Latest Briefing</div>
  <h2><a href="${latest.url}">${latest.title}</a></h2>
  <div class="latest-date">${fmt(latest.date)}</div>
  <p class="latest-summary">${latest.summary}</p>
  <a class="read-link" href="${latest.url}">Read the full briefing &rarr;</a>
</div>`
    : `<p class="empty">No briefings archived yet.</p>`
}

<div class="section-title">Archive</div>
${history.length ? `<ul class="history-list">\n${historyRows}\n</ul>` : `<p class="empty">Nothing here yet — check back tomorrow.</p>`}
</body>
</html>
`;
}

// The model sometimes wraps its output in ```html fences or a full <html> doc.
// Strip that down to just the body content the shell wraps.
export function extractBody(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const bodyMatch = s.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) s = bodyMatch[1].trim();
  return s;
}

// GitHub Contents API: create or update one file on the target branch.
async function commitFile(path: string, content: string, message: string): Promise<void> {
  const repo = process.env.GITHUB_REPO!; // owner/repo
  const branch = process.env.GITHUB_BRANCH ?? "main";
  const token = process.env.GITHUB_TOKEN!;
  const api = `https://api.github.com/repos/${repo}/contents/${path}`;
  const headers = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "daily-sentiment-analysis-agent",
  };

  // Need the existing blob SHA to update a file that already exists (e.g. same-day re-run).
  let sha: string | undefined;
  const existing = await fetch(`${api}?ref=${branch}`, { headers });
  if (existing.ok) sha = ((await existing.json()) as { sha?: string }).sha;
  else if (existing.status !== 404) throw new Error(`GitHub GET failed: ${existing.status} ${await existing.text()}`);

  const res = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub PUT failed: ${res.status} ${await res.text()}`);
}

// GitHub Contents API: read and JSON-parse one file; null when it doesn't exist yet.
async function readJsonFile<T>(path: string): Promise<T | null> {
  const repo = process.env.GITHUB_REPO!;
  const branch = process.env.GITHUB_BRANCH ?? "main";
  const token = process.env.GITHUB_TOKEN!;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
    headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "user-agent": "daily-sentiment-analysis-agent" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status} ${await res.text()}`);
  const { content } = (await res.json()) as { content: string };
  return JSON.parse(Buffer.from(content, "base64").toString("utf8")) as T;
}

export default defineTool({
  description:
    "Archive the finished briefing to the repo. Wraps the HTML <body> content you produced (using the " +
    "briefing component classes) in the fixed stylesheet, commits briefings/briefing-<date>.html, updates " +
    "the shareable landing page (index.html) with your one-line summary, and returns the GitHub Pages URL " +
    "to link in Slack.",
  inputSchema: z.object({
    // The <body> content only — header, section blocks, and sources — using the component classes.
    bodyHtml: z.string().min(1),
    title: z.string().optional(),
    // 1-2 plain-text sentences (no HTML/markdown) — today's headline signal, shown on the landing page.
    summary: z.string().min(1),
    // ponytail: defaults to today's UTC date (run fires ~10:00 UTC = same ET calendar day)
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  async execute({ bodyHtml, title, summary, date }) {
    const day = date ?? new Date().toISOString().slice(0, 10);
    const body = extractBody(bodyHtml);
    const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1].replace(/<[^>]+>/g, "").trim();
    const docTitle = title ?? h1 ?? `AI Engineering Intelligence — ${day}`;

    const html = renderHtml(docTitle, body, day);
    const htmlPath = `briefings/briefing-${day}.html`;

    // Eval dry-run: render but don't commit, so eval runs don't spam the repo.
    if (process.env.BRIEFING_DRY_RUN === "1") {
      return { htmlUrl: `dry-run://${htmlPath}`, date: day, dryRun: true };
    }

    // GitHub Pages (main /root): https://<owner>.github.io/<repo>/<path>
    const [owner, name] = process.env.GITHUB_REPO!.split("/");
    const htmlUrl = `https://${owner}.github.io/${name}/${htmlPath}`;

    await commitFile(htmlPath, html, `Add briefing ${day}`);

    // Upsert today's entry into the manifest (idempotent on same-day re-runs), then
    // regenerate the landing page from it so it never drifts from the archive.
    const manifestPath = "briefings-index.json";
    const entries = (await readJsonFile<BriefingEntry[]>(manifestPath)) ?? [];
    const updated = upsertBriefingEntry(entries, { date: day, title: docTitle, summary, url: htmlPath });
    await commitFile(manifestPath, JSON.stringify(updated, null, 2), `Update briefing index ${day}`);

    const indexEntries = updated.map((e) => ({ ...e, url: `https://${owner}.github.io/${name}/${e.url}` }));
    await commitFile("index.html", renderIndexHtml(indexEntries), `Update landing page ${day}`);

    // ponytail: Pages redeploys after the commit, so links may 404 for ~1 min.
    return { htmlUrl, date: day };
  },
});
