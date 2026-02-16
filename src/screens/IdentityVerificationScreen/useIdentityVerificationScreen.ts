import { useEffect, useRef, useState } from "react";
import { Alert, Animated } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { routes } from "@/types/routes";
import type { DocumentUpload } from "@/types/verifications";

export function useIdentityVerificationScreen() {
  const router = useRouter();
  const [idType, setIdType] = useState("license");
  const [document, setDocument] = useState<DocumentUpload | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1.0,
      duration: 800,
      useNativeDriver: false,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    requestPermissions();
  }, [progressAnim, fadeAnim]);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== "granted" || mediaStatus !== "granted") {
      console.log("Permissions not granted");
    }
  };

  const pickFromCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          type: "image",
          name: `id_document_${Date.now()}.jpg`,
        });
        setErrors({});
      }
    } catch {
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setDocument({
          uri: result.assets[0].uri,
          type: "image",
          name: `id_document_${Date.now()}.jpg`,
        });
        setErrors({});
      }
    } catch {
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setDocument({
          uri: asset.uri,
          type: asset.mimeType?.includes("pdf") ? "pdf" : "image",
          name: asset.name || `id_document_${Date.now()}.pdf`,
        });
        setErrors({});
      }
    } catch {
      Alert.alert("Error", "Failed to pick document. Please try again.");
    }
  };

  const showUploadOptions = () => {
    Alert.alert("Choose Upload Method", "How would you like to upload your ID?", [
      { text: "Take Photo", onPress: pickFromCamera },
      { text: "Choose from Gallery", onPress: pickFromGallery },
      { text: "Upload File", onPress: pickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const validateAndSubmit = () => {
    if (!document) {
      setErrors({ document: "Please upload your ID document" });
      return;
    }
    router.push({ pathname: routes.banking.setup.success });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const goBack = () => router.back();

  return {
    idType,
    setIdType,
    document,
    errors,
    progressWidth,
    fadeAnim,
    showUploadOptions,
    validateAndSubmit,
    goBack,
  };
}
