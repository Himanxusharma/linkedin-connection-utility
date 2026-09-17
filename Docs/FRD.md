# Functional Requirements Document (FRD)

**Product:** Linkedin Utility — Company People & Jobs Page Generator
**Scope:** v1 (client-side, single-page tool)

## 1. Input

### 1.1 Paste input
- A textarea accepts either:
  - One company name per line, or
  - Raw CSV text (with or without a header row).
- Empty lines are ignored.

### 1.2 File upload
- Accepts a `.csv` file via file picker.
- File content is read client-side (`FileReader`) — never uploaded anywhere.
- On successful read, the file's content populates the paste textarea and is parsed immediately.

### 1.3 Column detection
- If a header row is present, a column named (case-insensitive) `company`, `company name`, or `name` is used.
- If no matching header is found, the first column is used.
- If no header row is detected at all, every non-empty line is treated as a company name.

## 2. Slug generation (per row)

- Input: raw company name string.
- Processing:
  1. Trim whitespace.
  2. Strip a trailing legal suffix if present (`Ltd`, `Inc`, `Corp`, `PLC`, `LLC`, `LLP`, `GmbH`, `SA`, `NV`, `AG`, `Co`, and punctuation variants).
  3. Replace `&` with `and`.
  4. Lowercase.
  5. Remove any character that isn't a-z, 0-9, space, or hyphen.
  6. Collapse whitespace to single hyphens; collapse repeated hyphens.
- Output: a best-guess slug. This is a **starting point**, not a guaranteed-correct value — see §4.

## 3. Link generation (per row, live)

- People link: `https://www.linkedin.com/company/<slug>/people/`
- Jobs link: `https://www.linkedin.com/company/<slug>/jobs/`
- Both links regenerate immediately whenever the slug field for that row changes — no separate "regenerate" action needed.
- If the slug field is empty, the link cells show a placeholder (`—`) instead of a broken URL.

## 4. Verification step

- Each row has a "check" link that opens, in a new tab, a search of the form:
  `site:linkedin.com/company "<company name>"`
- This link never fires an automated request — it's a normal outbound link the user clicks themselves.
- Each row's slug field is directly editable. Editing it:
  - Updates the row's slug value immediately.
  - Marks the row as **verified** (visually distinguished from an unconfirmed **guess**).
- A checkbox per row lets the user mark a row verified/unverified independently of editing the slug (for cases where the guess was already correct).
- A running count at the top of the results shows `<total rows> companies · <n> verified`.

## 5. Per-row actions

- Each generated link (people, jobs) is directly clickable and opens in a new tab.
- Each generated link has a "copy" action that copies the full URL to the clipboard, with brief inline confirmation ("copied").

## 6. Export

- A single "Export CSV" action downloads a CSV with columns:
  `Company, Slug, Status, People Link, Jobs Link`
- `Status` is `verified` or `guess`, reflecting the current state of each row at export time.
- Export includes every row currently in the table, regardless of verification state.

## 7. Empty / edge states

- Before any data is loaded, the results area shows a single prompt instructing the user to paste or upload a list.
- Duplicate company names in the input are not deduplicated in v1 — they appear as separate rows (see PRD v2 scope for dedup).
- Rows with an empty company name (after trim) are skipped during parsing.

## 8. Explicit exclusions

- No feature in this tool sends a LinkedIn connection request, follows a company, or performs any authenticated action against linkedin.com.
- No feature fetches or scrapes data from linkedin.com directly; the only outbound link to a LinkedIn-adjacent destination is the user-initiated "check" search and the final people/jobs links themselves, both of which open in the user's own browser tab under the user's own action.
