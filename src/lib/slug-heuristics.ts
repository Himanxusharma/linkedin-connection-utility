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
 * Dictionary of pre-verified non-standard company slugs where simple
 * transliteration does not match LinkedIn's registered URL.
 * e.g. "CRED" -> "credapp" (NOT "cred"), "OneCard" -> "fpl-technologies"
 */
export const KNOWN_COMPANY_SLUGS: Record<string, string> = {
  cred: 'credapp',
  'cred app': 'credapp',
  'cred club': 'credapp',
  onecard: 'fpl-technologies',
  'one card': 'fpl-technologies',
  'fpl technologies': 'fpl-technologies',
  phonepe: 'phonepe-internet',
  'phone pe': 'phonepe-internet',
  groww: 'groww.in',
  zepto: 'zeptonow',
  swiggy: 'swiggy-in',
  lenskart: 'lenskart-com',
  ola: 'ola-cabs',
  'ola electric': 'ola-electric',
  uber: 'uber-com',
  urbancompany: 'urban-company',
  'urban company': 'urban-company',
  policybazaar: 'policybazaar.com',
  'policy bazaar': 'policybazaar.com',
  paisabazaar: 'paisabazaar-com',
  'paisa bazaar': 'paisabazaar-com',
  postman: 'postman-platform',
  razorpay: 'razorpay',
  stripe: 'stripe',
  coinbase: 'coinbase',
  zerodha: 'zerodha',
  mobikwik: 'mobikwik',
  incred: 'incred',
  jupiter: 'jupiter-money',
  'jupiter money': 'jupiter-money',
  'fi money': 'fi-money',
  fi: 'fi-money',
  bharatpe: 'bharatpe',
  paytm: 'paytm',
  slice: 'slice',
  dream11: 'dream11',
  meesho: 'meesho',
  nykaa: 'nykaa-com',
  zomato: 'zomato',
  flipkart: 'flipkart',
  myntra: 'myntra',
  credgenics: 'credgenics',
  kreditbee: 'kreditbee',
  perfios: 'perfios',
  signzy: 'signzy',
  finbox: 'finbox-in',
  setu: 'setu-in',
  open: 'openfinancialtechnologies',
  'open financial technologies': 'openfinancialtechnologies',
  decentro: 'decentro',
  dhan: 'dhanhq',
  kuvera: 'kuvera-in',
  smallcase: 'smallcase',
  univest: 'univest-in',
  indmoney: 'indmoney',
  'ind money': 'indmoney',
  jar: 'jarapp',
  'jar app': 'jarapp',
  scripbox: 'scripbox',
  dezerv: 'dezerv-in',
  stablemoney: 'stablemoney',
  'stable money': 'stablemoney',
  plum: 'plum-benefits',
  ditto: 'joinditto',
  'ditto insurance': 'joinditto',
  turtlefin: 'turtlefin',
  acko: 'acko',
  navi: 'navi-technologies',
  'navi technologies': 'navi-technologies',
  rupeek: 'rupeek',
  progcap: 'progcap',
  fintree: 'fintree-finance',
  vivriti: 'vivriti-capital',
  'vivriti capital': 'vivriti-capital',
  kredx: 'kredx',
  lendingkart: 'lendingkart',
  axio: 'axio-co',
  moneyview: 'money-view',
  'money view': 'money-view',
  earlysalary: 'earlysalary',
  fibe: 'fibe-india',
  'fibe india': 'fibe-india',
  freo: 'freo-money',
  privo: 'privo-in',
  stashfin: 'stashfin',
  loantap: 'loantap',
  cashe: 'cashe-official',
  ring: 'ring-app',
  kissht: 'kissht',
  faircent: 'faircent-com',
};

/**
 * Generates a verified or best-guess slug from a raw company name.
 * Automatically resolves known companies like CRED -> credapp.
 */
export function generateSlug(rawName: string): string {
  if (!rawName) return '';

  let cleaned = rawName.trim();

  // If input is a full LinkedIn URL, extract slug directly
  if (cleaned.includes('linkedin.com/company/')) {
    const extracted = extractSlugFromLinkedInUrl(cleaned);
    if (extracted) return extracted;
  }

  // Check known company registry first
  const normalizedKey = cleaned.toLowerCase();
  if (KNOWN_COMPANY_SLUGS[normalizedKey]) {
    return KNOWN_COMPANY_SLUGS[normalizedKey];
  }

  // Strip trailing legal suffix (run twice to catch compounds like Co., Ltd.)
  cleaned = cleaned.replace(SUFFIX_REGEX, '').trim();
  cleaned = cleaned.replace(SUFFIX_REGEX, '').trim();

  const strippedKey = cleaned.toLowerCase();
  if (KNOWN_COMPANY_SLUGS[strippedKey]) {
    return KNOWN_COMPANY_SLUGS[strippedKey];
  }

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

  // Second check on final cleaned name
  if (KNOWN_COMPANY_SLUGS[cleaned]) {
    return KNOWN_COMPANY_SLUGS[cleaned];
  }

  return cleaned;
}

/**
 * Extracts a pure company slug from a full LinkedIn URL.
 * Automatically removes tracking parameters such as `?utm_source=chatgpt.com`,
 * query strings, trailing slashes, and hash anchors.
 * e.g. "https://www.linkedin.com/company/credapp/?utm_source=chatgpt.com" -> "credapp"
 */
export function extractSlugFromLinkedInUrl(url?: string): string | null {
  if (!url) return null;
  let trimmed = url.trim();

  // Strip query parameters (?utm_source=... etc.) and hash fragments
  trimmed = trimmed.split('?')[0].split('#')[0];

  const match = trimmed.match(/linkedin\.com\/company\/([a-zA-Z0-9-._]+)/i);
  if (match && match[1]) {
    const slug = match[1].replace(/\/+$/, '').toLowerCase();
    // Resolve alias if known
    return KNOWN_COMPANY_SLUGS[slug] || slug;
  }
  return null;
}

/**
 * Returns a pristine, canonical LinkedIn Company URL without any
 * tracking query parameters (e.g. no ?utm_source=chatgpt.com).
 */
export function buildCleanCompanyUrl(slugOrUrl: string): string {
  if (!slugOrUrl) return '';
  const slug = extractSlugFromLinkedInUrl(slugOrUrl) || generateSlug(slugOrUrl);
  return `https://www.linkedin.com/company/${slug}/`;
}

export function buildPeopleUrl(slugOrUrl: string, roleKeyword?: string): string {
  if (!slugOrUrl) return '';
  const slug = extractSlugFromLinkedInUrl(slugOrUrl) || slugOrUrl.trim().toLowerCase();
  const base = `https://www.linkedin.com/company/${slug}/people/`;
  if (roleKeyword && roleKeyword.trim()) {
    return `${base}?keywords=${encodeURIComponent(roleKeyword.trim())}`;
  }
  return base;
}

export function buildJobsUrl(slugOrUrl: string, jobKeyword?: string): string {
  if (!slugOrUrl) return '';
  const slug = extractSlugFromLinkedInUrl(slugOrUrl) || slugOrUrl.trim().toLowerCase();
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
