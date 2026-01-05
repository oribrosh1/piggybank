import { getApp } from '@react-native-firebase/app';
import { getAuth, getIdToken } from '@react-native-firebase/auth';

const app = getApp();

export default {
  getDevicePushToken: async (): Promise<string | null> => {
    return null;
  },
  getIdToken: async (forceRefresh = false): Promise<string> => {
    const user = getAuth(app).currentUser;
    if (!user) {
      throw new Error('No user is signed in');
    }
    return getIdToken(user, forceRefresh);
  },
  onTokenRefresh: (callback: (token: string) => void) => { },
  auth: () => getAuth(app),
};
