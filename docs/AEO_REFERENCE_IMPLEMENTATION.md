# AEO Reference Implementation Notes

Mentha incorporates the safest ideas from the reviewed AEO repositories without copying whole products into the codebase.

## AEOrank-Inspired Files And Scoring

Mentha now exposes an expanded AI-readable artifact set at `/llms.txt/artifacts`:

- `llms.txt`
- `llms-full.txt`
- `ai.txt`
- `CLAUDE.md`
- `schema.json`
- `robots-patch.txt`
- `faq-blocks.html`
- `citation-anchors.html`
- `sitemap-ai.xml`

Each artifact can be downloaded individually at `/llms.txt/artifacts/:name`, and all files can be downloaded as a ZIP from `/llms.txt/artifacts.zip`.

The same surface is available from the CLI through `mentha optimization files`, `mentha optimization files --zip`, and from MCP through `generate_ai_readable_files`.

Technical scoring is available at `/llms.txt/score?url=...` and now breaks the score into answer readiness, content structure, trust authority, technical foundation, and AI discovery. It uses local heuristics by default, not an LLM call.

Framework adapter templates are exposed at `/llms.txt/adapters` and cover Next, Astro, Nuxt, Remix, SvelteKit, Gatsby, Docusaurus, VitePress, WordPress, Shopify, Webflow, Squarespace, and 11ty.

The web Optimization page surfaces score, pillars, operational events, artifact downloads, the ZIP bundle, and the adapter list.

## GitHub Integration

Mentha includes a minimal GitHub webhook endpoint at `/api/v1/webhooks/github`.
It accepts installation/repository/push-style events, verifies `GITHUB_WEBHOOK_SECRET` when configured, records the incoming event through structured logs, and returns no-cost audit next steps.

The repo also includes `.github/actions/mentha-aeo-audit/action.yml` plus `.github/workflows/mentha-aeo-audit.yml` as a first-party GitHub Action for external repositories. The action downloads the ZIP artifact bundle and a JSON readiness score without spending model tokens.

## Canonry-Inspired Operating Rules

Agent-facing guidance is generated in `CLAUDE.md` and exposed in operational reports with these rules:

- Treat persisted Knowledge Graph data as the source of truth.
- Prefer verified claims over generated assumptions.
- Ask for confirmation before spending scan credits or changing live optimization settings.
- Avoid promising immediate citation recovery; optimization is iterative.
- Separate evidence from inference in recommendations.

Operational reports are exposed at `/llms.txt/report?url=...` and include score, artifact readiness, operating rules, and actionable events such as incomplete artifacts, visibility loss risk, citation gaps, or competitor overtake risk.

The CLI exposes the same area through `mentha optimization report <url>` and MCP exposes it through `generate_aeo_operational_report`.

## OneGlanse-Inspired UI Capture

UI-first capture is represented as an experimental contract in `apps/api/src/core/ui-capture/types.ts`.
It is intentionally disabled unless `MENTHA_UI_CAPTURE_ENABLED=true` is set and runs in an isolated `ui-capture` worker.

The implementation should describe the feature as browser-session stability and UI fidelity work, not as undetectable browsing.

The implementation has two modes:

- `MENTHA_UI_CAPTURE_PROVIDER=mock` returns deterministic data and is the default.
- `MENTHA_UI_CAPTURE_PROVIDER=playwright` launches a real Playwright browser session, navigates to a target URL or provider URL, extracts visible text and links, and can save a screenshot.
- `MENTHA_UI_CAPTURE_PROVIDER=camoufox` launches Camoufox through Python, using the same capture contract. Install it separately with `pip install camoufox` and `python -m camoufox fetch`; keep it disabled unless you are running an explicit UI-first experiment.

No proxies or residential sessions are enabled by default. ChatGPT, Gemini, and Claude captures are treated as browser-session experiments and may require a separately authenticated browser context before they can capture useful answer content.

## QA Mode

`MENTHA_QA_MODE=true` forces deterministic mock behavior in project analysis, scan trigger, evaluation, search providers, CLI/MCP scan tools, and operational testing paths. It is designed for browser QA and demos without OpenRouter spend.

On the web app, `NEXT_PUBLIC_MENTHA_QA_MODE=true` displays a visible QA banner inside the platform so mock data is not confused with live scans.
