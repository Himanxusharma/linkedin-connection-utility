import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, writeBatch } from 'firebase/firestore';

// Load environment variables from .env or .env.local
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function migrate() {
  console.log('🚀 Starting Firebase Firestore Migration...');
  console.log(`📌 Target Project: ${firebaseConfig.projectId || 'NOT SET'}`);

  if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error('❌ Error: Missing Firebase credentials in .env / .env.local');
    console.error('   Please ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY are configured.');
    process.exit(1);
  }

  const seedPath = path.resolve(process.cwd(), 'src/data/seed-companies.json');
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Error: Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const companies = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`📦 Found ${companies.length} verified companies to upload.`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Firestore allows up to 500 writes per batch
  const BATCH_SIZE = 400;
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalSaved = 0;

  for (let i = 0; i < companies.length; i++) {
    const comp = companies[i];
    const docId = comp.slug || comp.id || comp.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const docRef = doc(db, 'companies', docId);

    batch.set(docRef, {
      ...comp,
      migratedAt: new Date().toISOString(),
    }, { merge: true });

    batchCount++;

    if (batchCount >= BATCH_SIZE || i === companies.length - 1) {
      console.log(`⏳ Committing batch (${totalSaved + 1} to ${totalSaved + batchCount})...`);
      await batch.commit();
      totalSaved += batchCount;
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  console.log(`\n🎉 Success! Migrated ${totalSaved} companies to Firestore collection "companies".`);
  console.log(`🔥 Database setup and synchronization are complete.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration failed with error:', err);
  process.exit(1);
});
