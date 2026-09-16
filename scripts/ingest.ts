import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { extractSlugFromLinkedInUrl, generateSlug } from '../src/lib/slug-heuristics';
import { CompanyRecord } from '../src/types/company';

interface CsvRow {
  [key: string]: string;
}

function findColumn(row: CsvRow, candidates: string[]): string | undefined {
  const keys = Object.keys(row);
  for (const candidate of candidates) {
    const found = keys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
    if (found && row[found]) return row[found].trim();
  }
  return undefined;
}

async function runIngest() {
  let targetArg = process.argv[2];
  if (!targetArg) {
    if (fs.existsSync(path.resolve(process.cwd(), 'Data/fintech_top_100_companies.csv'))) {
      targetArg = 'Data/fintech_top_100_companies.csv';
    } else {
      targetArg = 'fintech_top_100_companies.csv';
    }
  }
  const csvPath = path.isAbsolute(targetArg)
    ? targetArg
    : path.resolve(process.cwd(), targetArg);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, 'utf8');

  const parsed = Papa.parse<CsvRow>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.warn(`⚠️ Parse warnings encountered:`, parsed.errors.slice(0, 3));
  }

  const existingSeedPath = path.resolve(process.cwd(), 'src/data/seed-companies.json');
  let existingMap = new Map<string, CompanyRecord>();
  if (fs.existsSync(existingSeedPath)) {
    try {
      const existingData: CompanyRecord[] = JSON.parse(fs.readFileSync(existingSeedPath, 'utf8'));
      for (const item of existingData) {
        existingMap.set(item.name.toLowerCase(), item);
      }
    } catch {
      // Ignore parse errors from empty/missing seed
    }
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const row of parsed.data) {
    const name = findColumn(row, ['Company', 'Company Name', 'Name', 'Organization']);
    if (!name) continue;

    const rankVal = findColumn(row, ['Rank', 'Ranking', '#']);
    const rank = rankVal && !isNaN(Number(rankVal)) ? Number(rankVal) : undefined;
    const category = findColumn(row, ['Category', 'Industry', 'Sector']) || 'General Fintech';
    const rawLinkedIn = findColumn(row, ['LinkedIn', 'LinkedIn URL', 'LinkedIn Profile', 'Linkedin']);
    const careersUrl = findColumn(row, ['Careers', 'Careers URL', 'Jobs', 'Job Portal']);
    const website = findColumn(row, ['Website', 'Domain', 'Site']);

    let slug = extractSlugFromLinkedInUrl(rawLinkedIn);
    if (!slug) {
      slug = generateSlug(name);
    }

    const key = name.toLowerCase();
    const isNew = !existingMap.has(key);

    const record: CompanyRecord = {
      id: slug || generateSlug(name),
      rank,
      name,
      slug,
      category,
      linkedInUrl: rawLinkedIn || (slug ? `https://www.linkedin.com/company/${slug}/` : undefined),
      careersUrl,
      website,
      verified: true,
      source: path.basename(csvPath),
      updatedAt: new Date().toISOString(),
    };

    existingMap.set(key, record);
    if (isNew) {
      addedCount++;
    } else {
      updatedCount++;
    }
  }

  // Sort by rank if available, otherwise alphabetically
  const finalRecords = Array.from(existingMap.values()).sort((a, b) => {
    if (a.rank && b.rank) return a.rank - b.rank;
    if (a.rank) return -1;
    if (b.rank) return 1;
    return a.name.localeCompare(b.name);
  });

  // Ensure output directory exists
  const outDir = path.dirname(existingSeedPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(existingSeedPath, JSON.stringify(finalRecords, null, 2), 'utf8');

  console.log(`✅ Ingestion Complete!`);
  console.log(`   Total Companies in DB: ${finalRecords.length}`);
  console.log(`   Added: ${addedCount} | Updated: ${updatedCount}`);
  console.log(`   Saved to: ${existingSeedPath}`);

  // Summary of unique categories
  const categories = Array.from(new Set(finalRecords.map(r => r.category))).sort();
  console.log(`   Categories (${categories.length}):`, categories.slice(0, 10).join(', ') + (categories.length > 10 ? '...' : ''));
}

runIngest().catch((err) => {
  console.error(`❌ Ingestion failed:`, err);
  process.exit(1);
});
