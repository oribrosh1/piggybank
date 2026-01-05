import {
  getAuth,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  AppleAuthProvider,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';

export default function AppleAuth() {
  const [initializing, setInitializing] = useState(true);

  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);

  // Handle user state changes
  function handleAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  const logout = async () => {
    signOut(getAuth()).then(() => console.log('User signed out!'));
  };

  const appleSignIn = async () => {
    try {
      const appleAuthRequestResponse = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log(appleAuthRequestResponse, 'appleAuthRequestResponse');

      const { identityToken } = appleAuthRequestResponse;

      const appleCredentials = AppleAuthProvider.credential(identityToken);

      await signInWithCredential(getAuth(), appleCredentials);
    } catch (e) {
      console.log(e, 'e');
    }
  };

  return (
    <View style={styles.container}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={5}
        style={styles.button}
        onPress={appleSignIn}
      />

      {user && <Text>{user?.email}</Text>}
      {user && <Text>{user?.uid}</Text>}

      {user && (
        <Pressable
          onPress={logout}
          style={{ marginTop: 20 }}>
          <Text>Sign out</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 44,
  },
});
