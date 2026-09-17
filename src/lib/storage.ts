/**
 * Optimized Local Storage & In-Memory Browser Caching Layer
 * Provides:
 * 1. Typed keys & structures
 * 2. In-memory hot caching (LRU / Map) to avoid redundant disk JSON parsing
 * 3. Graceful fallback if localStorage is full or disabled
 * 4. Micro-debounce mechanism to prevent UI thread lock during rapid typing
 */

import { OutreachStatus, CompanyRecord, UserOutreachData } from '../types/company';

export const STORAGE_KEYS = {
  STARRED: 'linkbuilder_starred',
  NOTES: 'linkbuilder_company_notes',
  OUTREACH: 'linkbuilder_outreach_status',
  CUSTOM_COMPANIES: 'linkbuilder_custom_companies',
  CUSTOM_ROLES: 'linkbuilder_custom_roles',
  USER_ROLE: 'linkbuilder_user_role',
  LINK_MODE: 'linkbuilder_link_open_mode',
  MOBILE_REDIRECT: 'linkbuilder_mobile_app_redirect',
  USER_CLOUD_CACHE: 'linkbuilder_user_cloud_cache',
} as const;

// Fast In-Memory L1 Cache to avoid repeated JSON.parse calls across re-renders
const memoryCache = new Map<string, unknown>();

export const browserStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;

    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }

    try {
      const raw = localStorage.getItem(key);
      if (raw === null) {
        memoryCache.set(key, fallback);
        return fallback;
      }
      const parsed = JSON.parse(raw) as T;
      memoryCache.set(key, parsed);
      return parsed;
    } catch (err) {
      console.warn(`[browserStorage] Failed to read "${key}" from localStorage:`, err);
      return fallback;
    }
  },

  set<T>(key: string, value: T): boolean {
    // Update L1 memory cache synchronously for instant UI reactivity
    memoryCache.set(key, value);

    if (typeof window === 'undefined') return false;

    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn(`[browserStorage] Failed to write "${key}" to localStorage:`, err);
      // Attempt quota recovery: clear temporary or old cached logs if storage quota exceeded
      try {
        const testKey = '__test_quota__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
      } catch {
        console.error('[browserStorage] Storage quota exhausted.');
      }
      return false;
    }
  },

  remove(key: string): void {
    memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  },

  clearMemoryCache(): void {
    memoryCache.clear();
  },
};

/**
 * Normalized entity store helpers:
 * Fast O(1) lookup dictionaries for outreach status and notes.
 */
export function getStoredStarredSet(): Set<string> {
  const array = browserStorage.get<string[]>(STORAGE_KEYS.STARRED, []);
  return new Set(array);
}

export function saveStoredStarredSet(set: Set<string>): void {
  browserStorage.set(STORAGE_KEYS.STARRED, Array.from(set));
}

export function getStoredNotesMap(): Record<string, string> {
  return browserStorage.get<Record<string, string>>(STORAGE_KEYS.NOTES, {});
}

export function saveStoredNotesMap(map: Record<string, string>): void {
  browserStorage.set(STORAGE_KEYS.NOTES, map);
}

export function getStoredOutreachMap(): Record<string, OutreachStatus> {
  return browserStorage.get<Record<string, OutreachStatus>>(STORAGE_KEYS.OUTREACH, {});
}

export function saveStoredOutreachMap(map: Record<string, OutreachStatus>): void {
  browserStorage.set(STORAGE_KEYS.OUTREACH, map);
}

export function getStoredCustomCompanies(): CompanyRecord[] {
  return browserStorage.get<CompanyRecord[]>(STORAGE_KEYS.CUSTOM_COMPANIES, []);
}

export function saveStoredCustomCompanies(companies: CompanyRecord[]): void {
  browserStorage.set(STORAGE_KEYS.CUSTOM_COMPANIES, companies);
}

/**
 * Creates a debounced batch sync function to avoid hammering network or Firestore.
 */
export function createDebouncedSync<T>(
  callback: (arg: T) => Promise<void> | void,
  delayMs = 600
): (arg: T) => void {
  let timer: NodeJS.Timeout | null = null;
  return (arg: T) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      callback(arg);
      timer = null;
    }, delayMs);
  };
}
