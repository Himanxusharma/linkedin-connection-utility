import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import {
  getDatabase,
  ref as rtdbRef,
  get as rtdbGet,
  set as rtdbSet,
  Database,
} from 'firebase/database';
import { CompanyRecord, UserOutreachData } from '../types/company';
import seedCompaniesRaw from '../data/seed-companies.json';

const seedCompanies: CompanyRecord[] = seedCompaniesRaw as CompanyRecord[];

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      ? `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      : undefined),
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    // Initialize Realtime Database
    try {
      rtdb = getDatabase(app);
    } catch (err) {
      console.warn('Realtime Database init note:', err);
    }
    // Initialize Firestore with Multi-Tab IndexedDB offline persistent caching
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Could not initialize Firebase:', err);
  }
}

/**
 * Loads all companies.
 * Tries Realtime Database & Firestore if configured; falls back to seed dataset.
 */
export async function getCompanies(): Promise<{
  companies: CompanyRecord[];
  fromCloud: boolean;
}> {
  if (isFirebaseConfigured()) {
    // 1. Try Realtime Database
    if (rtdb) {
      try {
        const compRef = rtdbRef(rtdb, 'companies');
        const snapshot = await rtdbGet(compRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          const cloudData: CompanyRecord[] = Object.values(val);
          if (cloudData.length > 0) {
            const map = new Map<string, CompanyRecord>();
            seedCompanies.forEach((c) => map.set(c.name.toLowerCase(), c));
            cloudData.forEach((c) => map.set(c.name.toLowerCase(), c));
            const merged = Array.from(map.values()).sort((a, b) => {
              if (a.rank && b.rank) return a.rank - b.rank;
              if (a.rank) return -1;
              if (b.rank) return 1;
              return a.name.localeCompare(b.name);
            });
            return { companies: merged, fromCloud: true };
          }
        }
      } catch (err) {
        console.warn('Realtime Database fetch note:', err);
      }
    }

    // 2. Try Firestore
    if (db) {
      try {
        const colRef = collection(db, 'companies');
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          const cloudData: CompanyRecord[] = [];
          snapshot.forEach((d) => cloudData.push(d.data() as CompanyRecord));
          const map = new Map<string, CompanyRecord>();
          seedCompanies.forEach((c) => map.set(c.name.toLowerCase(), c));
          cloudData.forEach((c) => map.set(c.name.toLowerCase(), c));
          const merged = Array.from(map.values()).sort((a, b) => {
            if (a.rank && b.rank) return a.rank - b.rank;
            if (a.rank) return -1;
            if (b.rank) return 1;
            return a.name.localeCompare(b.name);
          });
          return { companies: merged, fromCloud: true };
        }
      } catch (err) {
        console.warn('Firestore fetch failed, falling back to local seed:', err);
      }
    }
  }

  return { companies: seedCompanies, fromCloud: false };
}

/**
 * Saves a company record to Realtime Database / Firestore or updates local memory/storage.
 */
export async function saveCompany(
  company: CompanyRecord
): Promise<{ success: boolean; cloudSaved: boolean }> {
  let savedCloud = false;
  const rawKey = company.slug || company.id || company.name.toLowerCase();
  const safeKey = rawKey.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  if (rtdb && isFirebaseConfigured()) {
    try {
      const compRef = rtdbRef(rtdb, `companies/${safeKey}`);
      await rtdbSet(compRef, {
        ...company,
        updatedAt: new Date().toISOString(),
      });
      savedCloud = true;
    } catch (err) {
      console.warn('RTDB save company note:', err);
    }
  }

  if (db && isFirebaseConfigured()) {
    try {
      const docRef = doc(db, 'companies', safeKey);
      await setDoc(docRef, {
        ...company,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      savedCloud = true;
    } catch {
      // ignore
    }
  }

  // If cloud write succeeded, return early
  if (savedCloud) {
    return { success: true, cloudSaved: true };
  }

  // If Firebase is not configured or offline, save to localStorage
  if (typeof window !== 'undefined') {
    try {
      const localCustom = JSON.parse(localStorage.getItem('custom_companies') || '{}');
      localCustom[company.name.toLowerCase()] = company;
      localStorage.setItem('custom_companies', JSON.stringify(localCustom));
      return { success: true, cloudSaved: false };
    } catch {
      // LocalStorage error fallback
    }
  }

  return { success: true, cloudSaved: false };
}

export function getSeedCompanies(): CompanyRecord[] {
  return seedCompanies;
}

export const isClerkConfigured = (): boolean => {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
};

/**
 * Loads a user's persistent profile data (outreach statuses, notes, starred companies, custom additions)
 * Supports both Cloud Firestore and Firebase Realtime Database.
 */
export async function getUserData(userId: string): Promise<UserOutreachData | null> {
  if (!isFirebaseConfigured() || !userId) {
    return null;
  }

  // 1. Try Realtime Database first if configured
  if (rtdb) {
    try {
      const userRef = rtdbRef(rtdb, `users/${userId}`);
      const snap = await rtdbGet(userRef);
      if (snap.exists()) {
        return snap.val() as UserOutreachData;
      }
    } catch (err) {
      console.warn('Realtime Database read attempt:', err);
    }
  }

  // 2. Fallback to Cloud Firestore
  if (db) {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserOutreachData;
      }
    } catch (err) {
      console.warn('Firestore read attempt:', err);
    }
  }

  return null;
}

/**
 * Persists a user's outreach state, personal notes, starred companies, and custom additions
 * directly to Firebase Realtime Database and Cloud Firestore.
 */
export async function saveUserData(
  userId: string,
  data: Partial<UserOutreachData>
): Promise<{ success: boolean; cloudSaved: boolean }> {
  if (!userId) {
    return { success: false, cloudSaved: false };
  }

  let saved = false;

  // 1. Save to Realtime Database
  if (rtdb && isFirebaseConfigured()) {
    try {
      const userRef = rtdbRef(rtdb, `users/${userId}`);
      await rtdbSet(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      saved = true;
    } catch (err) {
      console.warn('Failed to save to Realtime Database:', err);
    }
  }

  // 2. Also save to Firestore if active
  if (db && isFirebaseConfigured()) {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          ...data,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      saved = true;
    } catch (err) {
      // ignore if only RTDB enabled
    }
  }

  return { success: saved, cloudSaved: saved };
}

