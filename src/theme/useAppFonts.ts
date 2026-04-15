import { useFonts } from "expo-font";
import {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

const fontMap = {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export function useAppFonts(): ReturnType<typeof useFonts> {
  return useFonts(fontMap);
}
