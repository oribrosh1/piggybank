import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

export type FirebaseClient = {
  auth: () => FirebaseAuthTypes.Module;
  firestore: () => Firestore;
  storage: () => FirebaseStorage;
  onTokenRefresh: (callback: (token: string) => void) => void;
  getIdToken: (forceRefresh: boolean) => Promise<string>;
};
