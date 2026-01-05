// Main app navigation structure
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import firebase from '../src/firebase';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';
// Import screens
import AuthScreen from '../app/screens/AuthScreen';
import ProfileScreen from '../app/screens/ProfileScreen';
import CreateBankIntroScreen from '../app/screens/CreateBankIntroScreen';
import DocumentUploadScreen from '../app/screens/DocumentUploadScreen';
import ReviewAndSubmitScreen from '../app/screens/ReviewAndSubmitScreen';
import BankAccountSuccessScreen from '../app/screens/BankAccountSuccessScreen';
// import PaymentScreen from '../app/screens/PaymentScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = firebase.auth();
    const unsubscribe = auth.onAuthStateChanged((currentUser: any) => {
      setUser(currentUser as FirebaseAuthTypes.User | null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        {!user ? (
          // Auth stack
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ title: 'Sign In' }}
          />
        ) : (
          // Main app stack
          <>
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ headerShown: true, title: 'Profile' }}
            />
            <Stack.Screen
              name="CreateBankIntro"
              component={CreateBankIntroScreen}
              options={{ headerShown: true, title: 'Create Account' }}
            />
            <Stack.Screen
              name="DocumentUpload"
              component={DocumentUploadScreen}
              options={{ headerShown: true, title: 'Verify Identity' }}
            />
            <Stack.Screen
              name="ReviewAndSubmit"
              component={ReviewAndSubmitScreen}
              options={{ headerShown: true, title: 'Review' }}
            />
            <Stack.Screen
              name="BankAccountSuccess"
              component={BankAccountSuccessScreen}
              options={{ headerShown: true, title: 'Success' }}
            />
            {/* <Stack.Screen
              name="Payment"
              component={PaymentScreen}
              options={{ headerShown: true, title: 'Payment' }}
            /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

