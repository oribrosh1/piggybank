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
import { CaveatBrush_400Regular } from "@expo-google-fonts/caveat-brush";

const fontMap = {
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  /** Handwritten brush script used for hero accents (e.g. "invitation"). */
  CaveatBrush_400Regular,
};

export function useAppFonts(): ReturnType<typeof useFonts> {
  return useFonts(fontMap);
}
