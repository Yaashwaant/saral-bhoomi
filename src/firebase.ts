import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

// Public web config (ok to expose in client)
// Prefer Vite env vars when available, fall back to demo values for local/dev
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCoty-m_MjkXrkWexcosgUUwZ36fwoVhAc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fir-52a77.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fir-52a77',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fir-52a77.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '758330857511',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:758330857511:web:0035e12c8da1973506d602',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FCFCQNQ3K7',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const firestore = getFirestore(app);
export const auth = getAuth(app);

// Ensure we have a client-side auth user for Storage rules
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, (u) => {
    if (!u) {
      signInAnonymously(auth).catch(() => {
        // ignore auth errors for anonymous sign-in during dev
      });
    }
  });
}

// Promise that resolves when an auth user is available
export const authReady: Promise<void> = new Promise((resolve) => {
  if (typeof window === 'undefined') return resolve();
  const unsub = onAuthStateChanged(auth, (u) => {
    if (u) {
      unsub();
      resolve();
    }
  });
});

export const getAnalyticsIfAvailable = async () => {
  if (typeof window === 'undefined') return undefined;
  try {
    if (await analyticsSupported()) {
      return getAnalytics(app);
    }
  } catch {
    // ignore
  }
  return undefined;
};

export default app;


