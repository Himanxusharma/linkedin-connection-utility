# Technical Requirements Document (TRD)

**Product:** Linkedin Utility — Company People & Jobs Page Generator
**Architecture:** Single static HTML file, fully client-side. No backend, no database, no API keys, no build step.

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Markup/logic | Plain HTML + vanilla JS, one file | Zero build tooling, zero dependency management, deploys anywhere that serves static files |
| CSV parsing/export | [PapaParse](https://www.papaparse.com/) via CDN (`cdnjs.cloudflare.com`) | Handles quoted fields, header detection, and CSV re-export reliably; avoids hand-rolled parsing bugs |
| Fonts | Google Fonts (`fonts.googleapis.com`) | Display + UI typefaces, loaded at request time |
| Storage | None (v1) | All state lives in the browser tab's memory for the session; nothing persisted, nothing transmitted |

No other external calls are made. The only network requests the page issues are the two CDN assets above (script + font) — nothing else, ever, including no calls to LinkedIn.

## 2. Data flow

```
User (paste / file upload)
        │
        ▼
 Client-side CSV parser (PapaParse)
        │
        ▼
 Slug guesser (pure JS string function)
        │
        ▼
 Link generator (pure JS string templates)
        │
        ▼
 Rendered table (DOM) ──► user edits slug inline ──► re-render
        │
        ▼
 CSV export (PapaParse, Blob download) — stays in-browser, never uploaded anywhere
```

Nothing the user types or uploads ever leaves their browser. There is no server-side component in v1, so there is nothing to secure, rate-limit, or pay for.

## 3. Why zero backend was chosen

The core operations — parsing a CSV, string manipulation for slugs, template-building URLs, exporting a CSV — need no server. Keeping it client-side-only:

- Removes hosting cost entirely (static files are free on every major platform's free tier, with no realistic way to exceed the free tier from this use case).
- Removes privacy/liability concerns (no company list data ever touches a server you operate).
- Removes deployment complexity — the explicit ask was **one platform, minimal steps**, and a static file is the simplest thing that can be deployed.

## 4. Deployment

**Recommended: GitHub Pages.** One platform, one file, free indefinitely, no config beyond a repo setting.

1. Create a GitHub repo (or use an existing one).
2. Add the HTML file to the repo root as `index.html`.
3. Repo → Settings → Pages → Source: deploy from the `main` branch, root folder.
4. Your tool is live at `https://<username>.github.io/<repo>/` within a minute or two.
5. To update: commit a new version of the file — Pages redeploys automatically.

That's the entire deployment process — no CLI, no account beyond GitHub, no build step, no environment variables.

**Alternatives (equally valid, pick only one, not both):**
- **Cloudflare Pages** or **Netlify** — drag-and-drop the HTML file in their dashboard, get a URL immediately. Marginally faster global edge delivery than GitHub Pages; not necessary at this scale.
- **Claude Artifact link** (already live) — zero setup, already deployed, good enough if you don't need a custom domain.

Do not deploy to more than one platform unless you have a specific reason to (e.g. a custom domain). One static host is sufficient for this tool's entire lifecycle.

## 5. Cost model

| Item | Cost |
|---|---|
| Hosting (static file, any platform above) | $0, any traffic volume realistic for this tool |
| CDN assets (PapaParse, Google Fonts) | $0, third-party free CDNs |
| Slug verification (Google search link) | $0, standard outbound link, no API call |
| Ongoing maintenance | $0 — no server to patch, no dependency versions to bump except the two pinned CDN URLs |

There is no scenario in v1's design where cost scales with number of users or number of companies processed, because all processing happens in each user's own browser.

## 6. Future scope (v2, optional — not required for v1 to be complete)

If auto-resolving slugs from a company's own website is added later, that single feature would need a small backend, because browsers block cross-origin fetches to arbitrary company websites (CORS). The minimal-footprint way to add this without breaking the "one platform" constraint:

- **Cloudflare Workers** (free tier: 100,000 requests/day) — a single Worker function that fetches a company's homepage server-side and extracts a `linkedin.com/company/...` link if present, returning it to the page.
- This keeps the entire product on effectively one platform family (Cloudflare Pages for the static file + a Worker in the same account), rather than introducing a separate backend host.
- This is explicitly **not required** for v1 — the manual-verify flow already meets the free-of-cost, functional requirement on its own.

## 7. Browser support

Vanilla JS + standard DOM APIs (`FileReader`, `Blob`, `navigator.clipboard`). Works in all current evergreen browsers (Chrome, Firefox, Safari, Edge). No polyfills included or required.

## 8. Testing notes

- No automated test suite in v1 (appropriate for a single-file static tool with no backend logic to regress silently).
- Manual test checklist before any redeploy: paste input parses correctly with and without header row; file upload parses correctly; slug edits update links live; export CSV opens correctly in a spreadsheet app; verify links open the correct search query.
