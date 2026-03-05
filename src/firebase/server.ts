
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

// This is a server-only module.
const SERVER_APP_NAME = 'server-app';

let db: Firestore | null = null;
let isInitialized = false;

// This function attempts to initialize Firebase on the server and returns a Firestore instance or null.
function initializeDbOnServer(): Firestore | null {
    try {
        const serverApp = getApps().find(app => app.name === SERVER_APP_NAME);
        if (serverApp) {
            return getFirestore(serverApp);
        }

        // Construct config on the server, preferring non-public env vars if available.
        const serverFirebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        
        if (serverFirebaseConfig.apiKey && serverFirebaseConfig.projectId) {
            const app = initializeApp(serverFirebaseConfig, SERVER_APP_NAME);
            return getFirestore(app);
        }
        
        // Silently return null if config is missing.
        return null;
    } catch (e) {
        console.error("SERVER: An exception occurred during Firebase initialization.", e);
        return null;
    }
}

export function getDb(): Firestore | null {
  if (!isInitialized) {
    db = initializeDbOnServer();
    isInitialized = true;
  }
  return db;
}
