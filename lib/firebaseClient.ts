'use client';

import { FirebaseApp, FirebaseOptions, getApps, initializeApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

type RequiredFirebaseKeys = Pick<FirebaseOptions, 'apiKey' | 'authDomain' | 'projectId' | 'appId'>;

function ensureConfig(config: FirebaseOptions): asserts config is FirebaseOptions & RequiredFirebaseKeys {
  const requiredKeys: (keyof RequiredFirebaseKeys)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter((key) => !config[key]);

  if (missingKeys.length) {
    throw new Error(`Missing Firebase environment variables: ${missingKeys.join(', ')}`);
  }
}

export function getFirebaseAuth(): Auth {
  ensureConfig(firebaseConfig);
  const app: FirebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}
