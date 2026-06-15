import React, { useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { colors, spacing } from "@/src/theme";

const COMMON_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "icloud.com",
  "aol.com",
  "live.com",
  "me.com",
  "proton.me",
] as const;

function getEmailDomainSuggestions(email: string): string[] {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return [];

  const local = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);

  if (!local) return [];

  const filtered = COMMON_EMAIL_DOMAINS.filter((domain) =>
    domain.toLowerCase().startsWith(domainPart.toLowerCase())
  );

  if (filtered.length === 1 && filtered[0].toLowerCase() === domainPart.toLowerCase()) {
    return [];
  }

  return filtered.slice(0, 5).map((domain) => `${local}@${domain}`);
}

export interface EmailDomainAutocompleteInputProps extends Omit<TextInputProps, "style" | "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  style?: TextStyle;
}

export default function EmailDomainAutocompleteInput({
  value,
  onChangeText,
  style,
  ...rest
}: EmailDomainAutocompleteInputProps) {
  const suggestions = useMemo(() => getEmailDomainSuggestions(value), [value]);

  const atIndex = value.lastIndexOf("@");
  const localPart = atIndex === -1 ? value : value.slice(0, atIndex);

  return (
    <View style={{ position: "relative", zIndex: 10, marginBottom: spacing[4] }}>
      <TextInput
        style={style}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        autoCorrect={false}
        {...rest}
      />
      {suggestions.length > 0 ? (
        <View
          style={{
            marginTop: 4,
            backgroundColor: "rgba(255,255,255,0.98)",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(203, 195, 215, 0.35)",
            overflow: "hidden",
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          {suggestions.map((suggestion, index) => {
            const domain = suggestion.slice(atIndex + 1);
            return (
              <TouchableOpacity
                key={suggestion}
                onPress={() => onChangeText(suggestion)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: spacing[4],
                  paddingVertical: 12,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: "rgba(203, 195, 215, 0.25)",
                }}
              >
                <Text style={{ fontSize: 16, color: colors.onSurface }}>
                  <Text>{localPart}@</Text>
                  <Text style={{ fontWeight: "600", color: colors.primary }}>{domain}</Text>
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
