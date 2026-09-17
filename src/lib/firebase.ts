import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  Firestore,
} from 'firebase/firestore';
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
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  );
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    db = getFirestore(app);
  } catch (err) {
    console.warn('Could not initialize Firebase:', err);
  }
}

/**
 * Loads all companies.
 * Tries Firestore if configured; falls back to seed dataset.
 */
export async function getCompanies(): Promise<{
  companies: CompanyRecord[];
  fromCloud: boolean;
}> {
  if (db && isFirebaseConfigured()) {
    try {
      const colRef = collection(db, 'companies');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const cloudData: CompanyRecord[] = [];
        snapshot.forEach((d) => cloudData.push(d.data() as CompanyRecord));
        // Merge cloud with seed to avoid missing records
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

  return { companies: seedCompanies, fromCloud: false };
}

/**
 * Saves a company record to Firestore (if configured) or updates local memory/storage.
 */
export async function saveCompany(
  company: CompanyRecord
): Promise<{ success: boolean; cloudSaved: boolean }> {
  if (db && isFirebaseConfigured()) {
    try {
      const docId = company.slug || company.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const docRef = doc(db, 'companies', docId);
      await setDoc(docRef, {
        ...company,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { success: true, cloudSaved: true };
    } catch (err) {
      console.error('Failed to save to Firestore:', err);
      return { success: false, cloudSaved: false };
    }
  }

  // If Firebase is not configured, save to localStorage
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
 * from Cloud Firestore `users/{userId}`.
 */
export async function getUserData(userId: string): Promise<UserOutreachData | null> {
  if (!db || !isFirebaseConfigured() || !userId) {
    return null;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as UserOutreachData;
    }
    return null;
  } catch (err) {
    console.warn('Could not fetch user data from Firestore:', err);
    return null;
  }
}

/**
 * Persists a user's outreach state, personal notes, starred companies, and custom additions
 * directly to Cloud Firestore `users/{userId}`.
 */
export async function saveUserData(
  userId: string,
  data: Partial<UserOutreachData>
): Promise<{ success: boolean; cloudSaved: boolean }> {
  if (!userId) {
    return { success: false, cloudSaved: false };
  }

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
      return { success: true, cloudSaved: true };
    } catch (err) {
      console.error('Failed to persist user data to Firestore:', err);
      return { success: false, cloudSaved: false };
    }
  }

  return { success: true, cloudSaved: false };
}

