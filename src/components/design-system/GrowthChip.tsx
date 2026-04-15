import { Text, View, StyleSheet } from "react-native";
import { colors, radius, typography, growthChipShadow } from "@/src/theme";

type Props = {
  label: string;
};

/** Growth / positive movement — secondary_container + subtle glow */
export function GrowthChip({ label }: Props) {
  return (
    <View style={[styles.wrap, growthChipShadow]}>
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  text: {
    ...typography.labelMd,
    color: colors.secondary,
    letterSpacing: 0.5,
  },
});
