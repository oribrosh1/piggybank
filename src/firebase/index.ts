import firebaseWeb from './firebaseWeb';
import firebaseNative from './firebaseNative';

import { Platform } from 'react-native';

const firebase = Platform.OS === 'web' ? firebaseWeb : firebaseNative;

export default {
    ...firebase,
    firestore: () => {
        const db = firebaseWeb.firestore();
        return db;
    },
    storage: () => {
        const storage = firebaseWeb.storage();
        return storage;
    }
};