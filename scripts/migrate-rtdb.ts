import fs from 'fs';
import path from 'path';

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

async function migrateRTDB() {
  const dbUrl =
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    'https://test-apps-907d4-default-rtdb.firebaseio.com';

  console.log('🚀 Starting Firebase Realtime Database Migration...');
  console.log(`📌 Database URL: ${dbUrl}`);

  const seedPath = path.resolve(process.cwd(), 'src/data/seed-companies.json');
  if (!fs.existsSync(seedPath)) {
    console.error(`❌ Seed file not found at ${seedPath}`);
    process.exit(1);
  }

  const companies: any[] = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`📦 Found ${companies.length} verified companies.`);

  // Build key-value map for RTDB (keys cannot contain ., $, #, [, ], /, or ASCII control characters)
  const rtdbMap: Record<string, any> = {};
  for (const comp of companies) {
    let rawKey = comp.slug || comp.id || comp.name.toLowerCase();
    const key = rawKey.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    rtdbMap[key] = {
      ...comp,
      migratedAt: new Date().toISOString(),
    };
  }

  console.log(`⏳ Uploading companies via REST endpoint to ${dbUrl}/companies.json...`);
  const endpoint = `${dbUrl.replace(/\/+$/, '')}/companies.json`;

  const res = await fetch(endpoint, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(rtdbMap),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  console.log(`\n🎉 Success! All ${companies.length} companies migrated to Realtime Database.`);
  console.log(`🔥 Endpoint: ${dbUrl}/companies.json`);
}

migrateRTDB().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
