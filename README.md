# Link Builder Pro — LinkedIn People & Jobs Intelligence

A modern, production-grade web application built with **Next.js 15, React 19, TypeScript, and Google Cloud Firebase Firestore**, ready for 1-click deployment on **Vercel**.

Turn company names into verified LinkedIn **People** and **Jobs** page links, with role-targeted URL builders, 300-character invitation note generators, personal outreach status tracking (CRM-lite), and an in-app Companion Window explorer.

---

## Key Features

1. **Pre-Verified Database (180 Top Companies)**
   - Pre-loaded with **180 Companies** across Big Tech, Semiconductors, Fintech, E-commerce, Consumer Tech, Cybersecurity, Cloud, SaaS, Healthtech, Mobility, Travel Tech, Logistics Tech, Telecom, Gaming, and Media.
   - **Category & Industry Filters:** Filter by *Big Tech, Fintech, Cybersecurity, SaaS, Healthtech, Mobility*, etc.
   - **Instant Search (<kbd>⌘K</kbd>):** Fast search across company names, categories, and slugs.
   - **Multi-Column Sorting:** Sort table rows by **Rank (#)**, **Company Name (A-Z)**, or **Category**.

2. **Target Role Filters for People Links**
   - Filter all generated People links with 1-click presets:
     - **All People** (`.../people/`)
     - **Recruiters & Talent** (`.../people/?keywords=recruiter`)
     - **Tech & Engineering Leads** (`.../people/?keywords=engineering%20lead`)
     - **Founders & C-Suite** (`.../people/?keywords=founder`)
     - **Product Managers** (`.../people/?keywords=product%20manager`)

3. **LinkedIn Connection Note Generator (300-Char Limit)**
   - Generate tailored invitation messages customized to `{Company}` and `{Category}`.
   - Templates for *Job Referrals*, *Recruiter Inquiries*, and *Founder Networking*.
   - Live character counter with warning when exceeding LinkedIn's 300-character limit.
   - 1-click Copy Note button.

4. **Personal Outreach Status Tracker (CRM-Lite)**
   - Track progress row-by-row: `To Contact` ⚪, `Reviewed` 🔵, `Message Sent` 🟡, `Applied` 🟣, `Connected` 🟢.
   - Automatically persisted in your browser's `localStorage` across sessions.
   - Filter your table by status (e.g. view only uncontacted companies).

5. **In-App Explorer Drawer & Companion Window**
   - **Slide-over Drawer:** Inspect company dossier, People, Jobs, and Careers links without leaving your table.
   - **Companion Window Mode:** Anchored floating window that auto-navigates as you click different companies—browse 50+ companies in seconds without cluttering your browser with 50 tabs!
   - **Embedded Iframe Sandbox:** Live preview of supported company careers pages.

6. **Custom Link Builder Workspace**
   - Paste company names or drag & drop a `.csv` file.
   - Automatic cross-matching against the verified database (🟢 Verified vs 🟡 Guess).
   - Heuristic slug generation stripping corporate suffixes (`Ltd`, `Inc`, `LLC`, `Corp`, `LLP`, `GmbH`, `Co`).
   - Inline editable slugs with real-time URL regeneration.
   - Save custom verified companies to Cloud Firestore or local storage.

7. **Multi-Format Export & Sharing**
   - **Export to CSV**
   - **Copy for Google Sheets (TSV):** Paste directly into Google Sheets with 1 click.
   - **Copy as Markdown Table:** Paste directly into Notion, Obsidian, or GitHub docs.
   - **Open Batch in Tabs:** Open up to 5 People links in background tabs simultaneously.

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI & Language:** React 19, TypeScript, Vanilla CSS Tokens & Glassmorphism Design System
- **Icons:** Lucide React
- **CSV Engine:** PapaParse
- **Database:** Google Cloud Firebase Firestore (with bundled 180-company JSON fallback)
- **Deployment:** Vercel

---

## Getting Started

### 1. Run Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Ingest New Datasets

To ingest any company list (defaults to `Data/fintech_top_100_companies.csv` or pass custom file):

```bash
npm run ingest [path-to-csv]
```

---

## Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Deploy Link Builder Pro to Vercel"
   git push origin main
   ```
2. Go to [Vercel](https://vercel.com) and click **"Add New Project"** $\rightarrow$ Import this repository.
3. (Optional) In Vercel Project Settings $\rightarrow$ **Environment Variables**, add your Firebase keys (from [.env.example](./.env.example)).
4. Click **Deploy**. Your app will be live globally in seconds!

*Note: If you do not configure Firebase environment variables, the app still functions 100% out of the box with the bundled 180-company dataset.*
