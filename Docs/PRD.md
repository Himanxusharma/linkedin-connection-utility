# Product Requirements Document (PRD)

**Product:** Linkedin Utility — Company People & Jobs Page Generator
**Owner:** You
**Status:** MVP built and live (v1)

## 1. Problem

Manually building LinkedIn people-page and jobs-page URLs for a list of target companies is slow and error-prone, because the URL slug LinkedIn assigns a company (e.g. `natwest-group`) frequently doesn't match its common name (`Natwest`). There's no free, public, reliable way to look up the correct slug programmatically.

## 2. Goal

Let a user turn a plain list of company names into correct, clickable LinkedIn people/jobs links, as fast as possible, at **zero cost** — for the builder and for every user of the tool — without violating LinkedIn's Terms of Service.

## 3. Non-goals

- Automated connection-request sending (ToS violation — explicitly out of scope, permanently).
- Automated scraping of LinkedIn's own pages for slug data (ToS risk, blocking risk — out of scope).
- Guaranteeing 100% correct slugs with zero human input (not achievable without a paid data provider).

## 4. Target user

Someone doing outreach or recruiting research across a list of companies (sales, recruiting, BD) who wants to open the right LinkedIn page for each company quickly, without hand-typing 50+ URLs.

## 5. Success criteria

- A user can go from "CSV of 50 company names" to "50 correct people links + 50 correct jobs links" in under 10 minutes, including manual verification.
- Zero infrastructure cost at any usage volume for v1.
- No dependency on a LinkedIn account, LinkedIn API, or paid third-party data provider.

## 6. Alternatives considered (slug resolution)

| Option | Verdict |
|---|---|
| LinkedIn Partner API | Rejected — requires an approved partnership, not self-serve |
| Paid firmographic data (Clearbit, PDL, ZoomInfo) | Rejected — violates the free-of-cost requirement |
| Scrape LinkedIn search directly | Rejected — ToS risk, blocking risk, not worth building even if "free" |
| **Guess + one-click human verify (chosen for v1)** | **Accepted** — free, accurate once verified, no backend needed |
| Crawl company's own website footer for LinkedIn link | Deferred to v2 — free but needs a small backend (see TRD "Future scope") |

## 7. Scope: v1 (shipped)

- Paste or upload a company list (plain list or CSV).
- Auto-generate a best-guess slug per company.
- One-click verification link per company (opens a targeted search, doesn't call any API).
- Inline-editable slug field; links regenerate live.
- Export results as CSV.
- Runs entirely client-side — one HTML file, no server.

## 8. Scope: v2 (future, optional)

- Auto-resolve slugs from the company's own website (removes most manual verification).
- Remember previously-verified slugs across sessions (so repeat companies never need re-checking).
- Shared/crowdsourced slug dictionary.

These are optional and each adds one small piece of infrastructure — see TRD §6 for what that would take and why it's kept separate from v1.

## 9. Risks

- **Slug drift:** companies occasionally rename their LinkedIn slug; verified slugs can go stale over time. Mitigation: the "check" link is always one click away for re-verification.
- **Common names / ambiguity:** companies with generic names may return the wrong top search result. Mitigation: human verifies before use, by design.
- **ToS boundary creep:** any future feature that starts fetching data *from* LinkedIn itself (not just linking to it) needs a fresh ToS review before being added.
