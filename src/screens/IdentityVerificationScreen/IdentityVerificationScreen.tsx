import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Upload,
  Check,
  FileText,
  Camera,
  Shield,
} from "lucide-react-native";
import { useIdentityVerificationScreen } from "./useIdentityVerificationScreen";

export default function IdentityVerificationScreen() {
  const insets = useSafeAreaInsets();
  const {
    idType,
    setIdType,
    document,
    errors,
    progressWidth,
    fadeAnim,
    showUploadOptions,
    validateAndSubmit,
    goBack,
  } = useIdentityVerificationScreen();

  return (
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
            onPress={goBack}
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
              STEP 2 OF 2
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
            <FileText size={28} color="#FFFFFF" strokeWidth={2.5} />
            <Text
              style={{
                fontSize: 28,
                fontWeight: "900",
                color: "#FFFFFF",
                marginLeft: 12,
                letterSpacing: -0.5,
              }}
            >
              ID Verification
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
            Upload a photo of your government-issued ID 🪪
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ID Type Selection */}
        <View
          style={{
            marginBottom: 24,
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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
              <FileText size={18} color="#8B5CF6" strokeWidth={2.5} />
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
              Document Type
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
            Select the type of ID you'll be uploading
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            {[
              { value: "license", label: "Driver's License", icon: "🚗" },
              { value: "passport", label: "Passport", icon: "🛂" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => setIdType(option.value)}
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor: idType === option.value ? "#8B5CF6" : "#E5E7EB",
                  backgroundColor: idType === option.value ? "#F5F3FF" : "#FFFFFF",
                  borderRadius: 12,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 28, marginBottom: 8 }}>
                  {option.icon}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: idType === option.value ? "#8B5CF6" : "#6B7280",
                    textAlign: "center",
                  }}
                >
                  {option.label}
                </Text>
                {idType === option.value && (
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: "#8B5CF6",
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Upload */}
        <View
          style={{
            marginBottom: 24,
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 2,
            borderColor: errors.document ? "#EF4444" : "#F3F4F6",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
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
              <Camera size={18} color="#8B5CF6" strokeWidth={2.5} />
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
              Upload Document
            </Text>
          </View>

          <Text
            style={{
              fontSize: 12,
              color: "#6B7280",
              marginBottom: 20,
              lineHeight: 18,
            }}
          >
            📸 Take a clear photo or upload an existing file. Make sure all text is readable and the photo is not blurry.
          </Text>

          {document ? (
            <View
              style={{
                borderRadius: 16,
                overflow: "hidden",
                borderWidth: 2,
                borderColor: "#8B5CF6",
                backgroundColor: "#F5F3FF",
              }}
            >
              {document.type === 'image' ? (
                <Image
                  source={{ uri: document.uri }}
                  style={{
                    width: "100%",
                    height: 200,
                    resizeMode: "contain",
                  }}
                />
              ) : (
                <View
                  style={{
                    height: 200,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText size={48} color="#8B5CF6" strokeWidth={1.5} />
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#8B5CF6",
                      marginTop: 12,
                    }}
                  >
                    {document.name}
                  </Text>
                </View>
              )}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 16,
                  backgroundColor: "#8B5CF6",
                }}
              >
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "800",
                    color: "#FFFFFF",
                    marginLeft: 8,
                  }}
                >
                  Document Uploaded Successfully!
                </Text>
              </View>

              <TouchableOpacity
                onPress={showUploadOptions}
                style={{
                  padding: 12,
                  alignItems: "center",
                  backgroundColor: "#F5F3FF",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: "#8B5CF6",
                  }}
                >
                  Upload Different Document
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={showUploadOptions}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: errors.document ? "#EF4444" : "#D1D5DB",
                borderRadius: 16,
                paddingVertical: 48,
                alignItems: "center",
                backgroundColor: "#F9FAFB",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#EDE9FE",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Upload size={28} color="#8B5CF6" strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                Upload Your ID
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#6B7280",
                  textAlign: "center",
                  paddingHorizontal: 20,
                }}
              >
                Tap to take a photo or choose a file
              </Text>
            </TouchableOpacity>
          )}

          {errors.document && (
            <Text
              style={{
                fontSize: 12,
                color: "#EF4444",
                marginTop: 12,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              ⚠️ {errors.document}
            </Text>
          )}
        </View>

        {/* Security Notice */}
        <View
          style={{
            backgroundColor: "#F0F9FF",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#BFDBFE",
            flexDirection: "row",
            alignItems: "flex-start",
          }}
        >
          <Shield size={20} color="#3B82F6" strokeWidth={2.5} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#1E40AF",
                marginBottom: 4,
              }}
            >
              Your Privacy Matters
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#3B82F6",
                lineHeight: 18,
              }}
            >
              Your document is encrypted and securely stored. We use bank-level security to protect your information.
            </Text>
          </View>
        </View>
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
          onPress={validateAndSubmit}
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
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontSize: 17,
                fontWeight: "800",
                color: "#FFFFFF",
                letterSpacing: 0.5,
              }}
            >
              {document ? "Submit & Continue" : "Complete Setup"}
            </Text>
            <View
              style={{
                marginLeft: 8,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 12,
                padding: 4,
              }}
            >
              <Text style={{ fontSize: 16 }}>→</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goBack}
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
            ← Go Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
