// Document upload screen for identity verification
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  Linking
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes } from 'firebase/storage';
import { uploadVerificationFile } from '../../src/lib/api';
import firebase from '../../src/firebase';

export default function DocumentUploadScreen({ route, navigation }: { route: any, navigation: any }) {
  const { accountId, accountLink } = route.params;
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const auth = firebase.auth();
  const storage = firebase.storage();

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFileInfo(result.assets[0]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick document');
    }
  }

  async function takePhoto() {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setFileInfo(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  }

  async function uploadToStorageAndVerify() {
    if (!fileInfo) {
      Alert.alert('Error', 'Please select a document first');
      return;
    }

    setUploading(true);
    try {
      const user = auth.currentUser;
      const fileName = fileInfo.name || `document_${Date.now()}.jpg`;
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        return;
      }
      const storagePath = `verification/${user.uid}/${Date.now()}_${fileName}`;

      // Fetch file as blob
      const response = await fetch(fileInfo.uri);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, blob);

      // Call Cloud Function to send to Stripe
      const result = await uploadVerificationFile({
        accountId,
        storagePath,
        purpose: 'identity_document'
      });

      Alert.alert(
        'Success',
        'Document uploaded successfully!',
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('ReviewAndSubmit', { accountId })
          }
        ]
      );

    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function openStripeOnboarding() {
    if (accountLink) {
      try {
        const supported = await Linking.canOpenURL(accountLink);
        if (supported) {
          await Linking.openURL(accountLink);
        }
      } catch (error: any) {
        Alert.alert('Error', 'Failed to open onboarding link');
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.description}>
          Please upload a government-issued ID (driver's license, passport, or national ID card)
        </Text>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={takePhoto}
          >
            <Text style={styles.optionIcon}>📷</Text>
            <Text style={styles.optionText}>Take Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={pickDocument}
          >
            <Text style={styles.optionIcon}>📄</Text>
            <Text style={styles.optionText}>Choose File</Text>
          </TouchableOpacity>
        </View>

        {fileInfo && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileInfoTitle}>Selected File:</Text>
            <Text style={styles.fileName}>{fileInfo.name || 'Photo'}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, (!fileInfo || uploading) && styles.buttonDisabled]}
          onPress={uploadToStorageAndVerify}
          disabled={!fileInfo || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.uploadButtonText}>Upload & Verify</Text>
          )}
        </TouchableOpacity>

        {accountLink && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.stripeButton}
              onPress={openStripeOnboarding}
            >
              <Text style={styles.stripeButtonText}>
                Complete Onboarding with Stripe
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#2c3e50',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#7f8c8d',
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  fileInfo: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  fileInfoTitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5,
  },
  fileName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
  },
  uploadButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#7f8c8d',
    fontSize: 14,
  },
  stripeButton: {
    backgroundColor: '#635BFF',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
  },
  stripeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 10,
  },
  backText: {
    color: '#3498db',
    textAlign: 'center',
    fontSize: 16,
  },
});

