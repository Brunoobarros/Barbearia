import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
};

const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app;
let auth: ReturnType<typeof getAuth> | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Enable persistent offline cache to dramatically reduce Firebase Document Reads
    const dbSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };

    // Use custom database ID when using a custom project in environment variables;
    // otherwise fallback to the sandboxed database ID from appletConfig.
    const isCustomProject = env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_PROJECT_ID !== appletConfig.projectId;
    const dbId = isCustomProject
      ? (env.VITE_FIREBASE_DATABASE_ID || '')
      : (env.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId);
      
    if (dbId && dbId !== '(default)' && dbId !== '') {
      db = initializeFirestore(app, dbSettings, dbId);
    } else {
      db = initializeFirestore(app, dbSettings);
    }
    console.log('Firebase initialized successfully with persistent local cache!');
  } catch (err) {
    console.error('Failed to initialize Firebase with configured keys:', err);
  }
} else {
  console.log('Firebase environment variables are not fully set. Falling back to Local Storage.');
}

export { auth, db, isFirebaseConfigured };
