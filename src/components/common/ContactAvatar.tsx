import { View, Text, Image, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  name: string;
  imageUri?: string;
  size?: number;
  backgroundColor?: string;
  textColor?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Contact thumbnail from device `imageUri`, or first-character fallback (supports non-Latin names).
 */
export function ContactAvatar({
  name,
  imageUri,
  size = 44,
  backgroundColor = "#EDE9FE",
  textColor = "#8B5CF6",
  style,
}: Props) {
  const half = size / 2;
  const trimmed = name.trim();
  const initial = trimmed.charAt(0) || "?";

  const baseSize = { width: size, height: size, borderRadius: half };

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={baseSize} resizeMode="cover" />;
  }

  return (
    <View
      style={[
        baseSize,
        {
          backgroundColor,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: Math.max(14, size * 0.38), fontWeight: "700", color: textColor }}>{initial}</Text>
    </View>
  );
}
