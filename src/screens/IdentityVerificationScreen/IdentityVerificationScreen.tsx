import { View, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  IdentityVerificationHeader,
  IdTypeSelector,
  DocumentUploadCard,
  SecurityNotice,
  IdentityVerificationFooter,
} from "@/src/components/banking";
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
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      <IdentityVerificationHeader progressWidth={progressWidth} onBack={goBack} />

      <Animated.ScrollView
        style={{ flex: 1, opacity: fadeAnim }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <IdTypeSelector value={idType} onChange={setIdType} />
        <DocumentUploadCard
          document={document}
          error={errors.document}
          onUploadPress={showUploadOptions}
        />
        <SecurityNotice />
      </Animated.ScrollView>

      <IdentityVerificationFooter
        hasDocument={!!document}
        onSubmit={validateAndSubmit}
        onBack={goBack}
      />
    </View>
  );
}
