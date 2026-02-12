import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Shield,
  Sparkles,
  CreditCard,
  FileCheck,
} from "lucide-react-native";
import { useState, useEffect, useRef } from "react";
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { routes } from "../../../types/routes";
import type { PersonalInfoFormData } from "../../../types/verifications";
import { createCustomConnectAccount, createOnboardingLink, getAccountDetails } from "../../../src/lib/api";
import { useAuth } from "@/src/utils/auth";

const TOTAL_STEPS = 2;

export default function PersonalInfoScreen() {
  const { auth } = useAuth();
  const userEmail = auth?.email ?? "";
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<PersonalInfoFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    ssnLast4: "",
  });
  const [tosAccepted, setTosAccepted] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const googlePlacesRef = useRef(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step / TOTAL_STEPS,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  // Set email from logged-in user (read-only source)
  useEffect(() => {
    if (userEmail) {
      setFormData((prev) => ({ ...prev, email: userEmail }));
    }
  }, [userEmail]);

  // Pre-fill form from connected account when one exists (email stays from user)
  useEffect(() => {
    let cancelled = false;
    getAccountDetails()
      .then((res) => {
        if (cancelled || !res.individual) return;
        const ind = res.individual;
        setFormData((prev) => ({
          ...prev,
          ...(ind.first_name && { firstName: ind.first_name }),
          ...(ind.last_name && { lastName: ind.last_name }),
          ...(ind.phone && { phone: ind.phone }),
          ...(ind.dob && {
            dob: `${String(ind.dob.month).padStart(2, "0")}/${String(ind.dob.day).padStart(2, "0")}/${ind.dob.year}`,
          }),
          ...(ind.address && {
            address: ind.address.line1 || "",
            city: ind.address.city || "",
            state: ind.address.state || "",
            zipCode: ind.address.postal_code || "",
          }),
        }));
      })
      .catch(() => { /* no account yet or error */ });
    return () => { cancelled = true; };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number";
    }

    // DOB validation
    if (!formData.dob.trim()) {
      newErrors.dob = "Date of birth is required";
    } else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) {
      newErrors.dob = "Use MM/DD/YYYY format";
    }

    // Address validation
    if (!formData.address.trim()) newErrors.address = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "ZIP code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = "Invalid ZIP code";
    }

    // SSN last 4 validation
    if (!formData.ssnLast4.trim()) {
      newErrors.ssnLast4 = "Last 4 digits required";
    } else if (!/^\d{4}$/.test(formData.ssnLast4)) {
      newErrors.ssnLast4 = "Must be exactly 4 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    // No in-app validation for step 2; Stripe Hosted Onboarding collects SSN, DOB, address, bank, and TOS
    return true;
  };

  const parseDob = (dob: string): { day: number; month: number; year: number } | null => {
    const match = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    return { month: parseInt(match[1], 10), day: parseInt(match[2], 10), year: parseInt(match[3], 10) };
  };

  const handleNext = async () => {
    setApiError(null);
    if (step === 1) {
      if (!validateForm()) return;
      setStep(2);
      return;
    }
    // Step 2: Stage 1 – create Connect account; Stage 2 – redirect to Stripe Hosted Onboarding (SSN, DOB, Address, Bank collected by Stripe)
    if (step === 2) {
      if (!validateStep2()) return;
      setLoading(true);
      try {
        await createCustomConnectAccount({ country: "US" });
        const { url } = await createOnboardingLink();
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          Alert.alert(
            "Complete verification",
            "Finish identity verification and add your bank account in the browser. When done, you’ll return to the app.",
            [{ text: "OK" }]
          );
        } else {
          setApiError("Could not open verification link");
        }
      } catch (err: any) {
        setApiError(err?.response?.data?.error || err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddressSelect = (data: any, details: any) => {
    if (!details) return;

    // Extract address components
    const addressComponents = details.address_components;
    let streetNumber = '';
    let route = '';
    let city = '';
    let state = '';
    let zipCode = '';

    addressComponents.forEach((component: any) => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
      if (types.includes('route')) {
        route = component.long_name;
      }
      if (types.includes('locality')) {
        city = component.long_name;
      }
      if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      }
      if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });

    const fullAddress = `${streetNumber} ${route}`.trim();

    // Update form data
    setFormData((prev) => ({
      ...prev,
      address: fullAddress,
      city: city,
      state: state,
      zipCode: zipCode,
    }));

    // Clear errors for address fields
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.address;
      delete newErrors.city;
      delete newErrors.state;
      delete newErrors.zipCode;
      return newErrors;
    });
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <View
        style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}
      >
        {/* Header with gradient background */}
        <View
          style={{
            backgroundColor: "#8B5CF6",
            paddingBottom: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Top bar */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => step > 1 ? setStep(1) : router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "rgba(255, 255, 255, 0.9)",
                  letterSpacing: 1,
                }}
              >
                STEP {step} OF {TOTAL_STEPS}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {/* Progress bar */}
          <View
            style={{
              marginHorizontal: 20,
              height: 6,
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <Animated.View
              style={{
                height: "100%",
                backgroundColor: "#FFFFFF",
                width: progressWidth,
                borderRadius: 3,
              }}
            />
          </View>

          {/* Title section */}
          <View style={{ paddingHorizontal: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              {step === 1 && <Shield size={28} color="#FFFFFF" strokeWidth={2.5} />}
              {step === 2 && <CreditCard size={28} color="#FFFFFF" strokeWidth={2.5} />}
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: "#FFFFFF",
                  marginLeft: 12,
                  letterSpacing: -0.5,
                }}
              >
                {step === 1 && "Verify Identity"}
                {step === 2 && "Accept Terms"}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 15,
                color: "rgba(255, 255, 255, 0.95)",
                fontWeight: "500",
                lineHeight: 22,
              }}
            >
              {step === 1 && "We need to verify your identity for secure payments"}
              {step === 2 && "Accept the terms to start receiving money to your balance"}
            </Text>
          </View>
        </View>

        <Animated.ScrollView
          style={{ flex: 1, opacity: fadeAnim }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {apiError && (
            <View style={{ marginBottom: 16, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 12 }}>
              <Text style={{ fontSize: 14, color: "#B91C1C", fontWeight: "600" }}>⚠️ {apiError}</Text>
            </View>
          )}

          {step === 1 && (
          <>
          {/* Personal Info Card */}
          <View
            style={{
              marginBottom: 20,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 2,
              borderColor: "#F3F4F6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <User size={18} color="#8B5CF6" strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#111827",
                  marginLeft: 12,
                  letterSpacing: 0.3,
                }}
              >
                Personal Information
              </Text>
            </View>

            {/* First & Last Name Row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: focusedField === "firstName" ? "#F5F3FF" : "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "firstName" ? "#8B5CF6" : errors.firstName ? "#EF4444" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#6B7280",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ✨ First Name
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      paddingVertical: 2,
                    }}
                    placeholder="John"
                    placeholderTextColor="#9CA3AF"
                    value={formData.firstName}
                    onChangeText={(value) => handleInputChange("firstName", value)}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                  />
                  {errors.firstName && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#EF4444",
                        marginTop: 6,
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ {errors.firstName}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: focusedField === "lastName" ? "#F5F3FF" : "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "lastName" ? "#8B5CF6" : errors.lastName ? "#EF4444" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#6B7280",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    ✨ Last Name
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      paddingVertical: 2,
                    }}
                    placeholder="Smith"
                    placeholderTextColor="#9CA3AF"
                    value={formData.lastName}
                    onChangeText={(value) => handleInputChange("lastName", value)}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="words"
                  />
                  {errors.lastName && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#EF4444",
                        marginTop: 6,
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ {errors.lastName}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Email (from logged-in user, read-only) */}
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#F3F4F6",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: errors.email ? "#EF4444" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                📧 Email Address
              </Text>
              <TextInput
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#6B7280",
                  paddingVertical: 2,
                }}
                placeholder="Sign in to use your account email"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.email}
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View
              style={{
                marginBottom: 16,
                backgroundColor: focusedField === "phone" ? "#F5F3FF" : "#F9FAFB",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: focusedField === "phone" ? "#8B5CF6" : errors.phone ? "#EF4444" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                📱 Phone Number
              </Text>
              <TextInput
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  paddingVertical: 2,
                }}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#9CA3AF"
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {errors.phone && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.phone}
                </Text>
              )}
            </View>

            {/* Date of Birth */}
            <View
              style={{
                backgroundColor: focusedField === "dob" ? "#F5F3FF" : "#F9FAFB",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: focusedField === "dob" ? "#8B5CF6" : errors.dob ? "#EF4444" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                🎂 Date of Birth
              </Text>
              <TextInput
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  paddingVertical: 2,
                }}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#9CA3AF"
                value={formData.dob}
                onChangeText={(value) => handleInputChange("dob", value)}
                onFocus={() => setFocusedField("dob")}
                onBlur={() => setFocusedField(null)}
                keyboardType="numbers-and-punctuation"
              />
              {errors.dob && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.dob}
                </Text>
              )}
            </View>
          </View>

          {/* Address Card */}
          <View
            style={{
              marginBottom: 20,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 2,
              borderColor: "#F3F4F6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={18} color="#8B5CF6" strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#111827",
                  marginLeft: 12,
                  letterSpacing: 0.3,
                }}
              >
                Home Address
              </Text>
            </View>

            {/* Street Address - Google Places Autocomplete (Mobile Only) */}
            <View
              style={{
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 8,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                🏠 Street Address
              </Text>

              {Platform.OS === 'web' ? (
                // Regular TextInput for Web
                <View
                  style={{
                    backgroundColor: focusedField === "address" ? "#F5F3FF" : "#F9FAFB",
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: focusedField === "address" ? "#8B5CF6" : errors.address ? "#EF4444" : "transparent",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                >
                  <TextInput
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      paddingVertical: 2,
                    }}
                    placeholder="123 Main Street, Apt 4B"
                    placeholderTextColor="#9CA3AF"
                    value={formData.address}
                    onChangeText={(value) => handleInputChange("address", value)}
                    onFocus={() => setFocusedField("address")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              ) : (
                // Google Places Autocomplete for iOS/Android
                <GooglePlacesAutocomplete
                  ref={googlePlacesRef}
                  placeholder="Start typing your address..."
                  onPress={(data, details = null) => {
                    handleAddressSelect(data, details);
                  }}
                  query={{
                    key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || 'YOUR_GOOGLE_API_KEY',
                    language: 'en',
                    components: 'country:us',
                  }}
                  fetchDetails={true}
                  enablePoweredByContainer={false}
                  textInputProps={{
                    value: formData.address,
                    onChangeText: (text) => handleInputChange("address", text),
                    onFocus: () => setFocusedField("address"),
                    onBlur: () => setFocusedField(null),
                    placeholderTextColor: "#9CA3AF",
                  }}
                  styles={{
                    container: {
                      flex: 0,
                    },
                    textInputContainer: {
                      backgroundColor: focusedField === "address" ? "#F5F3FF" : "#F9FAFB",
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: focusedField === "address" ? "#8B5CF6" : errors.address ? "#EF4444" : "transparent",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                    },
                    textInput: {
                      backgroundColor: "transparent",
                      height: 38,
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      padding: 0,
                      margin: 0,
                    },
                    listView: {
                      backgroundColor: "#FFFFFF",
                      borderRadius: 12,
                      marginTop: 8,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.1,
                      shadowRadius: 12,
                      elevation: 5,
                    },
                    row: {
                      backgroundColor: "#FFFFFF",
                      padding: 14,
                      minHeight: 58,
                    },
                    separator: {
                      height: 1,
                      backgroundColor: "#F3F4F6",
                    },
                    description: {
                      fontSize: 14,
                      color: "#111827",
                      fontWeight: "500",
                    },
                    predefinedPlacesDescription: {
                      color: "#8B5CF6",
                    },
                  }}
                />
              )}

              {errors.address && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.address}
                </Text>
              )}
            </View>

            {/* City & State Row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
              <View style={{ flex: 1.5 }}>
                <View
                  style={{
                    backgroundColor: focusedField === "city" ? "#F5F3FF" : "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "city" ? "#8B5CF6" : errors.city ? "#EF4444" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#6B7280",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    🏙️ City
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      paddingVertical: 2,
                    }}
                    placeholder="New York"
                    placeholderTextColor="#9CA3AF"
                    value={formData.city}
                    onChangeText={(value) => handleInputChange("city", value)}
                    onFocus={() => setFocusedField("city")}
                    onBlur={() => setFocusedField(null)}
                  />
                  {errors.city && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#EF4444",
                        marginTop: 6,
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ {errors.city}
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View
                  style={{
                    backgroundColor: focusedField === "state" ? "#F5F3FF" : "#F9FAFB",
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1.5,
                    borderColor: focusedField === "state" ? "#8B5CF6" : errors.state ? "#EF4444" : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#6B7280",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    📍 State
                  </Text>
                  <TextInput
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#111827",
                      paddingVertical: 2,
                    }}
                    placeholder="NY"
                    placeholderTextColor="#9CA3AF"
                    value={formData.state}
                    onChangeText={(value) => handleInputChange("state", value.toUpperCase())}
                    onFocus={() => setFocusedField("state")}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="characters"
                    maxLength={2}
                  />
                  {errors.state && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#EF4444",
                        marginTop: 6,
                        fontWeight: "600",
                      }}
                    >
                      ⚠️ {errors.state}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* ZIP Code */}
            <View
              style={{
                backgroundColor: focusedField === "zipCode" ? "#F5F3FF" : "#F9FAFB",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: focusedField === "zipCode" ? "#8B5CF6" : errors.zipCode ? "#EF4444" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                📮 ZIP Code
              </Text>
              <TextInput
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  paddingVertical: 2,
                }}
                placeholder="10001"
                placeholderTextColor="#9CA3AF"
                value={formData.zipCode}
                onChangeText={(value) => handleInputChange("zipCode", value)}
                onFocus={() => setFocusedField("zipCode")}
                onBlur={() => setFocusedField(null)}
                keyboardType="number-pad"
                maxLength={10}
              />
              {errors.zipCode && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.zipCode}
                </Text>
              )}
            </View>
          </View>

          {/* SSN Card */}
          <View
            style={{
              marginBottom: 20,
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              borderWidth: 2,
              borderColor: "#F3F4F6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={18} color="#8B5CF6" strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  color: "#111827",
                  marginLeft: 12,
                  letterSpacing: 0.3,
                }}
              >
                Tax Identification
              </Text>
            </View>

            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginBottom: 16,
                lineHeight: 18,
              }}
            >
              🔒 We only need the last 4 digits of your SSN or Tax ID for verification. Your information is encrypted and secure.
            </Text>

            <View
              style={{
                backgroundColor: focusedField === "ssnLast4" ? "#F5F3FF" : "#F9FAFB",
                borderRadius: 12,
                padding: 14,
                borderWidth: 1.5,
                borderColor: focusedField === "ssnLast4" ? "#8B5CF6" : errors.ssnLast4 ? "#EF4444" : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#6B7280",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                🔢 Last 4 Digits of SSN/Tax ID
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 20,
                    color: "#9CA3AF",
                    marginRight: 8,
                    fontWeight: "600",
                  }}
                >
                  XXX-XX-
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#111827",
                    paddingVertical: 2,
                    letterSpacing: 4,
                  }}
                  placeholder="####"
                  placeholderTextColor="#9CA3AF"
                  value={formData.ssnLast4}
                  onChangeText={(value) => handleInputChange("ssnLast4", value.replace(/\D/g, ""))}
                  onFocus={() => setFocusedField("ssnLast4")}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry={false}
                />
              </View>
              {errors.ssnLast4 && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#EF4444",
                    marginTop: 6,
                    fontWeight: "600",
                  }}
                >
                  ⚠️ {errors.ssnLast4}
                </Text>
              )}
            </View>
          </View>
          </>
          )}

          {step === 2 && (
            <View style={{ marginBottom: 20, backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3, borderWidth: 2, borderColor: "#F3F4F6" }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <FileCheck size={20} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#111827", marginLeft: 12 }}>Stripe Terms of Service</Text>
              </View>
              <TouchableOpacity onPress={() => { setTosAccepted((v) => !v); setErrors((e) => ({ ...e, tos: "" })); }} style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: tosAccepted ? "#8B5CF6" : "#D1D5DB", backgroundColor: tosAccepted ? "#8B5CF6" : "transparent", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                  {tosAccepted && <Text style={{ color: "#FFF", fontSize: 14, fontWeight: "700" }}>✓</Text>}
                </View>
                <Text style={{ flex: 1, fontSize: 14, color: "#374151" }}>I accept the Stripe Connected Account Agreement and Stripe Terms of Service</Text>
              </TouchableOpacity>
              {errors.tos && <Text style={{ fontSize: 11, color: "#EF4444", marginBottom: 12 }}>⚠️ {errors.tos}</Text>}
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}>Money you receive will be stored in your Stripe balance. You can add a bank account later in settings if you want to withdraw.</Text>
            </View>
          )}
        </Animated.ScrollView>

        {/* Floating Action Buttons */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: insets.bottom + 16,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={{
              backgroundColor: "#8B5CF6",
              borderRadius: 16,
              paddingVertical: 18,
              alignItems: "center",
              shadowColor: "#8B5CF6",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 8,
              marginBottom: 12,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "800",
                  color: "#FFFFFF",
                  letterSpacing: 0.5,
                }}
              >
                {step === 2 ? "Complete setup" : "Continue"}
              </Text>
              <View
                style={{
                  marginLeft: 8,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: 4,
                }}
              >
                <Text style={{ fontSize: 16 }}>{step === 2 ? "✓" : "→"}</Text>
              </View>
            </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => step > 1 ? setStep(1) : router.back()}
            disabled={loading}
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: "#6B7280",
                letterSpacing: 0.3,
              }}
            >
              {step > 1 ? "← Back" : "← Cancel Setup"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
