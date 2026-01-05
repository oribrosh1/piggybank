import { getApps, initializeApp } from 'firebase/app';
import { getIdToken, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { FirebaseClient } from './types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * If Firebase is initialized multiple times, it throws an error.
 * To prevent this, check for existing apps before initializing
 */
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage for React Native persistence

const auth: FirebaseClient['auth'] = () => {
  const fbAuth = initializeAuth(app);
  return fbAuth as unknown as ReturnType<FirebaseClient['auth']>;
};

const firestore: FirebaseClient['firestore'] = () => {
  const db = getFirestore(app);
  return db
};

const storage: FirebaseClient['storage'] = () => {
  const storage = getStorage(app);
  return storage;
};

export default {
  onTokenRefresh: (callback: (token: string) => void) => { },
  auth,
  firestore,
  storage,
  getIdToken: async (forceRefresh = false): Promise<string> => {
    const user = auth().currentUser;
    if (!user) {
      throw new Error('No user is signed in');
    }
    return getIdToken(user as any, forceRefresh);
  },
} as unknown as FirebaseClient;
