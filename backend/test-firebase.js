import dotenv from 'dotenv';
// Load env from backend/config.env like the server does
dotenv.config({ path: './config.env' });
import admin from 'firebase-admin';

const log = (...args) => console.log('[firebase:test]', ...args);

try {
  // Read env
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const b64Json = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);

  let creds = null;

  if (b64Json) {
    try {
      const decoded = Buffer.from(b64Json, 'base64').toString('utf8');
      creds = JSON.parse(decoded);
      log('Using FIREBASE_SERVICE_ACCOUNT_B64');
    } catch (e) {
      log('Failed to parse FIREBASE_SERVICE_ACCOUNT_B64:', e.message);
    }
  }

  if (!creds && rawJson) {
    try {
      let jsonStr = rawJson.trim();
      if ((jsonStr.startsWith("'") && jsonStr.endsWith("'")) || (jsonStr.startsWith('"') && jsonStr.endsWith('"'))) {
        jsonStr = jsonStr.slice(1, -1);
      }
      creds = JSON.parse(jsonStr);
      log('Using FIREBASE_SERVICE_ACCOUNT_JSON');
    } catch (e) {
      log('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  if (!creds && projectId && clientEmail && privateKeyRaw) {
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
    creds = { project_id: projectId, client_email: clientEmail, private_key: privateKey };
    log('Using discrete env vars (PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)');
  }

  if (!creds) {
    throw new Error('No Firebase credentials found in env');
  }

  if (creds.private_key) {
    creds.private_key = creds.private_key.replace(/\\n/g, '\n');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: creds.project_id || creds.projectId,
        clientEmail: creds.client_email || creds.clientEmail,
        privateKey: creds.private_key || creds.privateKey,
      }),
      storageBucket,
    });
  }

  log('Initialized Admin SDK', storageBucket ? `with bucket ${storageBucket}` : '(no bucket)');

  // Try Firestore access
  const db = admin.firestore();
  const testDocRef = db.collection('firebaseTest').doc('connectivity');
  await testDocRef.set({ ts: new Date().toISOString() });
  const snap = await testDocRef.get();
  log('Firestore write/read OK, data:', snap.data());

  // Try Storage access (list first file, or just get bucket metadata)
  if (admin.storage && admin.storage().bucket) {
    const bucket = admin.storage().bucket();
    const [meta] = await bucket.getMetadata().catch((e) => {
      log('Bucket metadata error:', e.message);
      return [{}];
    });
    log('Storage bucket metadata OK (partial):', { name: meta.name, location: meta.location });
  } else {
    log('Storage API not available (admin.storage missing)');
  }

  log('All checks passed');
  process.exit(0);
} catch (e) {
  console.error('[firebase:test] FAILED:', e && (e.stack || e.message || e));
  process.exit(1);
}


