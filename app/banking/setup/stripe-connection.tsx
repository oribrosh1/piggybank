import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, AlertCircle } from "lucide-react-native";
import { useState } from "react";
import { routes } from "@/types/routes";

export default function StripeConnectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [formData, setFormData] = useState<{
    bankAccountName: string;
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
    accountType: string;
  }>({
    bankAccountName: "",
    accountHolderName: "",
    routingNumber: "",
    accountNumber: "",
    accountType: "checking",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.bankAccountName.trim())
      newErrors.bankAccountName = "Bank account name is required";
    if (!formData.accountHolderName.trim())
      newErrors.accountHolderName = "Account holder name is required";
    if (!formData.routingNumber.trim())
      newErrors.routingNumber = "Routing number is required";
    if (!formData.accountNumber.trim())
      newErrors.accountNumber = "Account number is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      router.push(routes.banking.setup.applePaySetup);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: "#FFF8F0", paddingTop: insets.top }}
    >
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#6B21A8" />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#6B21A8",
            marginLeft: 12,
          }}
        >
          Connect Your Bank
        </Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: "#EC4899",
              borderRadius: 3,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: "#EC4899",
              borderRadius: 3,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: "#EC4899",
              borderRadius: 3,
            }}
          />
          <View
            style={{
              flex: 1,
              height: 6,
              backgroundColor: "#FCD34D",
              borderRadius: 3,
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 13,
            color: "#9333EA",
            marginTop: 8,
            fontWeight: "600",
          }}
        >
          Step 3 of 4 - Your Bank 🏦
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            color: "#6B21A8",
            marginBottom: 8,
          }}
        >
          Your Bank Account 🏧
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: "#7C3AED",
            marginBottom: 24,
            fontWeight: "500",
          }}
        >
          Connect your real bank so you can receive money! 💳
        </Text>

        <View
          style={{
            backgroundColor: "#FEF3C7",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            flexDirection: "row",
            gap: 12,
          }}
        >
          <AlertCircle size={20} color="#D97706" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#000000" }}>
              Your data is safe! 🔐
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
              We use super strong security to protect your info
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Account Name 💰
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: errors.bankAccountName ? "#EF4444" : "#C084FC",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="My Awesome Bank"
            placeholderTextColor="#C084FC"
            value={formData.bankAccountName}
            onChangeText={(value) =>
              handleInputChange("bankAccountName", value)
            }
          />
          {errors.bankAccountName && (
            <Text
              style={{
                fontSize: 12,
                color: "#EF4444",
                marginTop: 6,
                fontWeight: "600",
              }}
            >
              {errors.bankAccountName}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Account Holder Name 👤
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: errors.accountHolderName ? "#EF4444" : "#C084FC",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="Your Name"
            placeholderTextColor="#C084FC"
            value={formData.accountHolderName}
            onChangeText={(value) =>
              handleInputChange("accountHolderName", value)
            }
          />
          {errors.accountHolderName && (
            <Text
              style={{
                fontSize: 12,
                color: "#EF4444",
                marginTop: 6,
                fontWeight: "600",
              }}
            >
              {errors.accountHolderName}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Type of Account 🏛️
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {["checking", "savings"].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => handleInputChange("accountType", type)}
                style={{
                  flex: 1,
                  borderWidth: 2,
                  borderColor:
                    formData.accountType === type ? "#EC4899" : "#C084FC",
                  backgroundColor:
                    formData.accountType === type ? "#FCE7F3" : "#FFFFFF",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color:
                      formData.accountType === type ? "#EC4899" : "#9333EA",
                    textTransform: "capitalize",
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Routing Number 🔢
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: errors.routingNumber ? "#EF4444" : "#C084FC",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="021000021"
            placeholderTextColor="#C084FC"
            value={formData.routingNumber}
            onChangeText={(value) => handleInputChange("routingNumber", value)}
            keyboardType="numeric"
          />
          <Text
            style={{
              fontSize: 11,
              color: "#9333EA",
              marginTop: 6,
              fontWeight: "500",
            }}
          >
            📝 Look at the bottom left of your check
          </Text>
          {errors.routingNumber && (
            <Text
              style={{
                fontSize: 12,
                color: "#EF4444",
                marginTop: 6,
                fontWeight: "600",
              }}
            >
              {errors.routingNumber}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: "#000000",
              marginBottom: 8,
            }}
          >
            Account Number 🔐
          </Text>
          <TextInput
            style={{
              borderWidth: 2,
              borderColor: errors.accountNumber ? "#EF4444" : "#C084FC",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: "#000000",
              backgroundColor: "#FFFFFF",
            }}
            placeholder="Your account number"
            placeholderTextColor="#C084FC"
            value={formData.accountNumber}
            onChangeText={(value) => handleInputChange("accountNumber", value)}
            keyboardType="numeric"
            secureTextEntry
          />
          <Text
            style={{
              fontSize: 11,
              color: "#9333EA",
              marginTop: 6,
              fontWeight: "500",
            }}
          >
            📝 Usually 8-12 numbers
          </Text>
          {errors.accountNumber && (
            <Text
              style={{
                fontSize: 12,
                color: "#EF4444",
                marginTop: 6,
                fontWeight: "600",
              }}
            >
              {errors.accountNumber}
            </Text>
          )}
        </View>

        <View
          style={{
            backgroundColor: "#FCE7F3",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#FBCFE8",
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#BE185D",
              marginBottom: 8,
            }}
          >
            🛡️ Super Secure!
          </Text>
          <Text style={{ fontSize: 12, color: "#9F1239" }}>
            Your bank info is totally safe with us. We never share it with
            anyone else!
          </Text>
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 16,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={handleNext}
          style={{
            backgroundColor: "#EC4899",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>
            Next Step 🚀
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            borderWidth: 2,
            borderColor: "#C084FC",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#6B21A8" }}>
            Back
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
