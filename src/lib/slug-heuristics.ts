/**
 * Slug generation heuristics and LinkedIn URL builders as specified in FRD.md
 */

const LEGAL_SUFFIXES = [
  'ltd\\.?',
  'limited',
  'inc\\.?',
  'incorporated',
  'corp\\.?',
  'corporation',
  'plc\\.?',
  'llc\\.?',
  'llp\\.?',
  'gmbh\\.?',
  's\\.?a\\.?',
  'n\\.?v\\.?',
  'a\\.?g\\.?',
  'co\\.?',
  'company',
  'pvt\\.?\\s*ltd\\.?',
  'private\\s*limited'
];

const SUFFIX_REGEX = new RegExp(
  `[,\\s]+(?:${LEGAL_SUFFIXES.join('|')})\\s*$`,
  'i'
);

/**
 * Generates a best-guess slug from a raw company name.
 */
export function generateSlug(rawName: string): string {
  if (!rawName) return '';

  let cleaned = rawName.trim();

  // Strip trailing legal suffix (run twice to catch compounds like Co., Ltd.)
  cleaned = cleaned.replace(SUFFIX_REGEX, '').trim();
  cleaned = cleaned.replace(SUFFIX_REGEX, '').trim();

  // Replace & with and
  cleaned = cleaned.replace(/&/g, ' and ');

  // Lowercase
  cleaned = cleaned.toLowerCase();

  // Remove any character that isn't a-z, 0-9, space, or hyphen
  cleaned = cleaned.replace(/[^a-z0-9\s-]/g, '');

  // Collapse whitespace and hyphens to single hyphen
  cleaned = cleaned.replace(/[\s_]+/g, '-');
  cleaned = cleaned.replace(/-+/g, '-');

  // Strip leading or trailing hyphens
  cleaned = cleaned.replace(/^-+|-+$/g, '');

  return cleaned;
}

/**
 * Extracts a company slug from a full LinkedIn URL if provided.
 * e.g. "https://www.linkedin.com/company/phonepe-internet/" -> "phonepe-internet"
 */
export function extractSlugFromLinkedInUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/linkedin\.com\/company\/([a-zA-Z0-9-._]+)/i);
  if (match && match[1]) {
    return match[1].replace(/\/+$/, '').toLowerCase();
  }
  return null;
}

export function buildPeopleUrl(slug: string, roleKeyword?: string): string {
  if (!slug) return '';
  const base = `https://www.linkedin.com/company/${slug}/people/`;
  if (roleKeyword && roleKeyword.trim()) {
    return `${base}?keywords=${encodeURIComponent(roleKeyword.trim())}`;
  }
  return base;
}

export function buildJobsUrl(slug: string, jobKeyword?: string): string {
  if (!slug) return '';
  const base = `https://www.linkedin.com/company/${slug}/jobs/`;
  if (jobKeyword && jobKeyword.trim()) {
    return `${base}?keywords=${encodeURIComponent(jobKeyword.trim())}`;
  }
  return base;
}

export function buildGoogleSearchUrl(companyName: string): string {
  if (!companyName) return '';
  const query = `site:linkedin.com/company "${companyName.trim()}"`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export const TARGET_ROLE_OPTIONS = [
  { id: 'all', label: 'All People', keyword: '' },
  { id: 'recruiter', label: 'Recruiters & Talent', keyword: 'recruiter' },
  { id: 'engineering', label: 'Tech & Engineering Leads', keyword: 'engineering lead' },
  { id: 'founder', label: 'Founders & C-Suite', keyword: 'founder' },
  { id: 'product', label: 'Product Managers', keyword: 'product manager' },
];
