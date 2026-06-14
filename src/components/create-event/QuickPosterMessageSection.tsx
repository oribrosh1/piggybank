import { useMemo, useState, type RefObject } from "react";
import type { TextInput as TextInputType } from "react-native";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MessageSquare, Sparkles } from "lucide-react-native";
import { colors, spacing, fontFamily, radius } from "@/src/theme";

const MESSAGE_CHAR_LIMIT = 80;

const QUICK_IDEAS = [
  "🏰 Bounce house, pizza & games!",
  "⚽ Soccer tournament & prizes!",
  "🎵 Music, friends & good vibes!",
] as const;

const MORE_IDEAS = [
  "🎂 Cake, crafts & celebration!",
  "🏊 Pool party & summer fun!",
  "🎮 Gaming, snacks & squad goals!",
] as const;

type QuickPosterMessageSectionProps = {
  showMessage: boolean;
  message: string;
  onShowMessageChange: (show: boolean) => void;
  onMessageChange: (text: string) => void;
  inputRef?: RefObject<TextInputType | null>;
};

export default function QuickPosterMessageSection({
  showMessage,
  message,
  onShowMessageChange,
  onMessageChange,
  inputRef,
}: QuickPosterMessageSectionProps) {
  const [showMoreIdeas, setShowMoreIdeas] = useState(false);

  const ideas = useMemo(
    () => (showMoreIdeas ? [...QUICK_IDEAS, ...MORE_IDEAS] : [...QUICK_IDEAS]),
    [showMoreIdeas],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <MessageSquare size={17} color={colors.primary} strokeWidth={2.1} />
          <Sparkles
            size={11}
            color={colors.primary}
            strokeWidth={2.4}
            style={styles.headerSparkle}
          />
        </View>
        <Text style={styles.headerTitle}>Add a message to your poster</Text>
        <View style={styles.optionalPill}>
          <Text style={styles.optionalPillText}>Optional</Text>
        </View>
      </View>

      <View style={styles.choicesRow}>
        <TouchableOpacity
          style={[
            styles.choiceCard,
            showMessage && styles.choiceCardSelected,
          ]}
          onPress={() => onShowMessageChange(true)}
          activeOpacity={0.9}
          accessibilityRole="radio"
          accessibilityState={{ selected: showMessage }}
        >
          <View style={[styles.radio, showMessage && styles.radioSelected]}>
            {showMessage ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>Add a message</Text>
            <Text style={styles.choiceSubtitle}>
              Show a message in the center of the poster
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.choiceCard,
            !showMessage && styles.choiceCardSelected,
          ]}
          onPress={() => onShowMessageChange(false)}
          activeOpacity={0.9}
          accessibilityRole="radio"
          accessibilityState={{ selected: !showMessage }}
        >
          <View style={[styles.radio, !showMessage && styles.radioSelected]}>
            {!showMessage ? <View style={styles.radioDot} /> : null}
          </View>
          <View style={styles.choiceCopy}>
            <Text style={styles.choiceTitle}>No thanks</Text>
            <Text style={styles.choiceSubtitle}>
              I don't want to add any message to the poster
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {showMessage ? (
        <>
          <View style={styles.inputShell}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={message}
              onChangeText={onMessageChange}
              placeholder="Bounce house, pizza, and games!"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={MESSAGE_CHAR_LIMIT}
              textAlignVertical="top"
              underlineColorAndroid="transparent"
              selectionColor={colors.primary}
              accessibilityLabel="Message for poster center"
            />
            <Text style={styles.charCount}>
              {message.length} / {MESSAGE_CHAR_LIMIT}
            </Text>
          </View>

          <View style={styles.chipsRow}>
            {ideas.map((idea) => (
              <TouchableOpacity
                key={idea}
                style={styles.chip}
                onPress={() => onMessageChange(idea)}
                activeOpacity={0.88}
              >
                <Text style={styles.chipText}>{idea}</Text>
              </TouchableOpacity>
            ))}
            {!showMoreIdeas ? (
              <TouchableOpacity
                style={styles.moreIdeasButton}
                onPress={() => setShowMoreIdeas(true)}
                activeOpacity={0.88}
              >
                <Text style={styles.moreIdeasText}>+ More ideas</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

export { MESSAGE_CHAR_LIMIT };

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[3],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    flexWrap: "wrap",
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSparkle: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.title,
    fontSize: 17,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.35,
  },
  optionalPill: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(107, 56, 212, 0.1)",
  },
  optionalPillText: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.2,
  },
  choicesRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing[2],
  },
  choiceCard: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.14)",
    backgroundColor: colors.surfaceContainerLow,
  },
  choiceCardSelected: {
    borderColor: "rgba(107, 56, 212, 0.45)",
    backgroundColor: "rgba(107, 56, 212, 0.05)",
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(107, 56, 212, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  choiceTitle: {
    fontFamily: fontFamily.title,
    fontSize: 14,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.25,
    lineHeight: 18,
  },
  choiceSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  inputShell: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.18)",
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
    minHeight: 96,
  },
  input: {
    minHeight: 56,
    padding: 0,
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: "500",
    color: colors.onSurface,
    lineHeight: 22,
  },
  charCount: {
    alignSelf: "flex-end",
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    marginTop: spacing[1],
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.18)",
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  chipText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    fontWeight: "600",
    color: colors.onSurface,
    letterSpacing: -0.1,
  },
  moreIdeasButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    justifyContent: "center",
  },
  moreIdeasText: {
    fontFamily: fontFamily.title,
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.1,
  },
});
