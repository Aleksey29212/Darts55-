'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

interface FirebaseServices {
    firebaseApp: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
}

export function initializeFirebase(): FirebaseServices {
  if (getApps().length) {
    const app = getApp();
    return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: getFirestore(app)
    };
  }
  
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        const firebaseApp = initializeApp(firebaseConfig);
        return {
            firebaseApp,
            auth: getAuth(firebaseApp),
            firestore: getFirestore(firebaseApp)
        };
    } catch(e) {
        console.error("CLIENT: Firebase initialization with config failed.", e);
        return { firebaseApp: null, auth: null, firestore: null };
    }
  }

  // Silently return null services if config is missing.
  return { firebaseApp: null, auth: null, firestore: null };
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
export * from '@/hooks/use-mobile';
