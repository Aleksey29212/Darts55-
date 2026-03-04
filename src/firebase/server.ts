import { firebaseConfig } from '@/firebase/config';
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

        if (firebaseConfig.apiKey && firebaseConfig.projectId) {
            const app = initializeApp(firebaseConfig, SERVER_APP_NAME);
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
