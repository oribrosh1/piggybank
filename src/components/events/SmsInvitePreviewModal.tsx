import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Plus, Mic, Pencil, CalendarClock, MapPin } from "lucide-react-native";
import type { Event } from "@/types/events";
import { honoreeNameFromEvent } from "@/src/lib/eventTitle";
import { updateEvent } from "@/src/lib/eventService";
import { colors, fontFamily, spacing, radius } from "@/src/theme";

const ACCENT = colors.primary;
const EVENT_WEB_BASE = process.env.EXPO_PUBLIC_WEBSITE_URL || "https://credit-kid.com";
const IPHONE_BEZEL = "#121c2a";
const IPHONE_BORDER = "#27313f";
const CREDITKID_LOGO = require("@/assets/images/logo/logo.png");
const IMESSAGE_BUBBLE = "#E9E9EB";
const IMESSAGE_INPUT_BORDER = "#C7C7CC";

function IncomingSmsBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.smsBubbleWrap}>
      <View style={styles.smsBubble}>
        {children}
      </View>
      <View style={styles.smsBubbleTail} />
    </View>
  );
}

export function defaultInviteLink(event: Event): string {
  return `${EVENT_WEB_BASE}/event/${event.id}`;
}

export function buildDefaultGuestInviteSmsIntro(event: Event): string {
  const honoree = honoreeNameFromEvent(event);
  return `Hey! You're invited to ${honoree}'s celebration — ${event.eventName}. Tap to RSVP and see details:`;
}

export function buildDefaultGuestInviteSmsBody(event: Event): string {
  return `${buildDefaultGuestInviteSmsIntro(event)} ${defaultInviteLink(event)}`;
}

export function splitGuestInviteSmsBody(
  body: string,
  defaultLink: string,
): { message: string; link: string } {
  const trimmed = body.trim();
  const urlMatch = trimmed.match(/(https?:\/\/\S+)$/);
  if (urlMatch?.index != null) {
    return {
      message: trimmed.slice(0, urlMatch.index).trimEnd(),
      link: urlMatch[1],
    };
  }
  return { message: trimmed, link: defaultLink };
}

export function composeGuestInviteSmsBody(message: string, link: string): string {
  const msg = message.trimEnd();
  const url = link.trim();
  if (!msg) return url;
  if (!url) return msg;
  if (msg.includes(url)) return msg;
  if (msg.endsWith(":")) return `${msg} ${url}`;
  return `${msg} ${url}`;
}

export function buildGuestInviteSmsBody(event: Event): string {
  const custom = event.customInviteSmsBody?.trim();
  if (custom) return custom;
  return buildDefaultGuestInviteSmsBody(event);
}

function formatEventDateCompact(dateStr: string): string {
  const trimmed = dateStr.trim();
  const parts = trimmed.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map((p) => parseInt(p, 10));
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return trimmed;
}

function parseEventTimeString(
  timeStr: string,
): { hours24: number; minutes: number } | null {
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  const twelveHour = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const period = twelveHour[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return { hours24: hours, minutes };
  }

  const twentyFour = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return {
      hours24: parseInt(twentyFour[1], 10),
      minutes: parseInt(twentyFour[2], 10),
    };
  }

  return null;
}

/** 12-hour time for SMS, e.g. `6 pm` or `6:12 pm`. */
export function formatEventTime12h(timeStr: string): string {
  const parsed = parseEventTimeString(timeStr);
  if (!parsed) return timeStr.trim();

  const period = parsed.hours24 >= 12 ? "PM" : "AM";
  const hour12 = parsed.hours24 % 12 || 12;
  if (parsed.minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

export function buildSmsDateTimeSnippet(event: Event): string | null {
  const date = event.date?.trim();
  const time = event.time?.trim();
  if (!date && !time) return null;

  const datePart = date ? formatEventDateCompact(date) : "";
  const timePart = time ? formatEventTime12h(time) : "";
  if (datePart && timePart) return `When: ${datePart} @ ${timePart}`;
  if (datePart) return `When: ${datePart}`;
  return `When: ${timePart}`;
}

export function buildSmsAddressSnippet(event: Event): string | null {
  const parts: string[] = [];
  const addressLine = [event.address1, event.address2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");

  if (addressLine) parts.push(`Where: ${addressLine}`);

  const notes = event.locationNotes?.trim();
  if (notes) parts.push(notes);

  const parking = event.parking?.trim();
  if (parking) parts.push(`Parking: ${parking}`);

  if (parts.length === 0) return null;
  return parts.join(". ");
}

function appendSnippetToMessage(current: string, snippet: string): string {
  const trimmed = current.trimEnd();
  if (!trimmed) return snippet;
  if (trimmed.includes(snippet)) return trimmed;
  return `${trimmed}\n${snippet}`;
}

export interface SmsInvitePreviewModalRef {
  open: () => void;
}

type Props = {
  event: Event;
  onSmsSaved?: () => void;
};

const SmsInvitePreviewModal = forwardRef<SmsInvitePreviewModalRef, Props>(
  function SmsInvitePreviewModal({ event, onSmsSaved }, ref) {
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();
    const [visible, setVisible] = useState(false);
    const [editing, setEditing] = useState(false);
    const [draftMessage, setDraftMessage] = useState("");
    const [draftLink, setDraftLink] = useState("");
    const [saving, setSaving] = useState(false);

    useImperativeHandle(ref, () => ({ open: () => setVisible(true) }), []);

    const defaultLink = useMemo(() => defaultInviteLink(event), [event]);
    const defaultSmsIntro = useMemo(() => buildDefaultGuestInviteSmsIntro(event), [event]);
    const defaultSmsBody = useMemo(() => buildDefaultGuestInviteSmsBody(event), [event]);
    const smsBody = useMemo(() => buildGuestInviteSmsBody(event), [event]);
    const previewBody = useMemo(
      () => (editing ? composeGuestInviteSmsBody(draftMessage, draftLink) : smsBody),
      [draftLink, draftMessage, editing, smsBody],
    );
    const phoneWidth = Math.min(320, screenWidth - spacing[5] * 2);
    const hasCustomSms = Boolean(event.customInviteSmsBody?.trim());
    const dateTimeSnippet = useMemo(() => buildSmsDateTimeSnippet(event), [event]);
    const addressSnippet = useMemo(() => buildSmsAddressSnippet(event), [event]);
    const hasDateTimeInMessage = Boolean(
      dateTimeSnippet && draftMessage.includes(dateTimeSnippet),
    );
    const hasAddressInMessage = Boolean(
      addressSnippet && draftMessage.includes(addressSnippet),
    );

    useEffect(() => {
      if (!visible) {
        setEditing(false);
        setDraftMessage("");
        setDraftLink("");
        setSaving(false);
      }
    }, [visible]);

    const startEditing = useCallback(() => {
      const { message, link } = splitGuestInviteSmsBody(smsBody, defaultLink);
      setDraftMessage(message);
      setDraftLink(link);
      setEditing(true);
    }, [defaultLink, smsBody]);

    const cancelEditing = useCallback(() => {
      setDraftMessage("");
      setDraftLink("");
      setEditing(false);
    }, []);

    const resetToDefault = useCallback(() => {
      setDraftMessage(defaultSmsIntro);
      setDraftLink(defaultLink);
    }, [defaultLink, defaultSmsIntro]);

    const insertDateTime = useCallback(() => {
      if (!dateTimeSnippet) {
        Alert.alert(
          "No date or time",
          "Add your event date and time in event details first.",
        );
        return;
      }
      if (hasDateTimeInMessage) {
        Alert.alert("Already added", "Date and time are already in your message.");
        return;
      }
      setDraftMessage((current) => appendSnippetToMessage(current, dateTimeSnippet));
    }, [dateTimeSnippet, hasDateTimeInMessage]);

    const insertAddress = useCallback(() => {
      if (!addressSnippet) {
        Alert.alert(
          "No address or instructions",
          "Add your event location or instructions in event details first.",
        );
        return;
      }
      if (hasAddressInMessage) {
        Alert.alert("Already added", "Address and instructions are already in your message.");
        return;
      }
      setDraftMessage((current) => appendSnippetToMessage(current, addressSnippet));
    }, [addressSnippet, hasAddressInMessage]);

    const handleSave = useCallback(async () => {
      const message = draftMessage.trim();
      const link = draftLink.trim();

      if (!message) {
        Alert.alert("Message required", "Your SMS invite needs at least a short message.");
        return;
      }
      if (!link) {
        Alert.alert("Link required", "Add the invite link guests should tap.");
        return;
      }
      if (!/^https?:\/\/.+/i.test(link)) {
        Alert.alert("Invalid link", "Invite link must start with http:// or https://");
        return;
      }

      const composed = composeGuestInviteSmsBody(message, link).trim();
      const nextCustom = composed === defaultSmsBody ? null : composed;

      setSaving(true);
      const result = await updateEvent(event.id, {
        customInviteSmsBody: nextCustom,
      });
      setSaving(false);

      if (!result.success) {
        Alert.alert("Couldn't save", result.error || "Please try again.");
        return;
      }

      setEditing(false);
      onSmsSaved?.();
    }, [defaultSmsBody, draftLink, draftMessage, event.id, onSmsSaved]);

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editing ? "Edit SMS Message" : "SMS Invite Preview"}
            </Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <X size={20} color={colors.onSurfaceVariant} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.topSection}>
            <Text style={styles.subtitle}>
              {editing
                ? "Edit your message and invite link. The preview updates as you type."
                : "This is what guests receive when you send an SMS invitation."}
            </Text>

            {editing ? (
              <View style={styles.editPanel}>
                <Text style={styles.editLabel}>Your message</Text>
                <TextInput
                  style={styles.editInput}
                  value={draftMessage}
                  onChangeText={setDraftMessage}
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                  autoFocus
                  placeholder="Write your SMS invite..."
                  placeholderTextColor={colors.onSurfaceVariant}
                />
                <View style={styles.insertOptionsRow}>
                  <TouchableOpacity
                    onPress={insertDateTime}
                    style={[
                      styles.insertOptionBtn,
                      (!dateTimeSnippet || hasDateTimeInMessage) && styles.insertOptionBtnMuted,
                    ]}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Add date and time to SMS message"
                  >
                    <CalendarClock
                      size={14}
                      color={!dateTimeSnippet || hasDateTimeInMessage ? colors.onSurfaceVariant : ACCENT}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.insertOptionText,
                        (!dateTimeSnippet || hasDateTimeInMessage) && styles.insertOptionTextMuted,
                      ]}
                    >
                      Add date & time
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={insertAddress}
                    style={[
                      styles.insertOptionBtn,
                      (!addressSnippet || hasAddressInMessage) && styles.insertOptionBtnMuted,
                    ]}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Add address and instructions to SMS message"
                  >
                    <MapPin
                      size={14}
                      color={!addressSnippet || hasAddressInMessage ? colors.onSurfaceVariant : ACCENT}
                      strokeWidth={2.2}
                    />
                    <Text
                      style={[
                        styles.insertOptionText,
                        (!addressSnippet || hasAddressInMessage) && styles.insertOptionTextMuted,
                      ]}
                    >
                      Add address & instructions
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.editLabel}>Invite link</Text>
                <TextInput
                  style={styles.linkInput}
                  value={draftLink}
                  onChangeText={setDraftLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  textContentType="URL"
                  placeholder="https://credit-kid.com/event/..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  selectTextOnFocus
                />
                <Text style={styles.editHint}>
                  Guests tap this link to RSVP and see event details.
                </Text>
                <View style={styles.editActions}>
                  <TouchableOpacity
                    onPress={cancelEditing}
                    style={styles.editCancelBtn}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel editing SMS message"
                  >
                    <Text style={styles.editCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    style={[styles.editSaveBtn, saving && styles.editSaveBtnDisabled]}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Save SMS message"
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.editSaveText}>Save message</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {hasCustomSms ? (
                  <TouchableOpacity
                    onPress={resetToDefault}
                    style={styles.resetLink}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Reset to default SMS message"
                  >
                    <Text style={styles.resetLinkText}>Reset to default message</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity
                onPress={startEditing}
                style={styles.editSmsBtn}
                accessibilityRole="button"
                accessibilityLabel="Edit SMS message yourself"
              >
                <Pencil size={16} color={ACCENT} strokeWidth={2.2} />
                <Text style={styles.editSmsBtnText}>Edit SMS message yourself</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing[6] }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.iphoneMockupWrap}>
              <View style={styles.iphoneGlow} pointerEvents="none" />
              <View style={[styles.iphoneBezel, { width: phoneWidth }]}>
                <View style={styles.iphoneScreen}>
                  <View style={styles.iphoneNotch} />

                  <View style={styles.phoneHeader}>
                    <View style={styles.phoneAvatar}>
                      <Image
                        source={CREDITKID_LOGO}
                        style={styles.phoneAvatarImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.phoneContactWrap}>
                      <Text style={styles.phoneContact} numberOfLines={2}>
                        Birthday RSVP by CreditKid
                      </Text>
                      <Text style={styles.phoneMeta}>Text Message • SMS</Text>
                    </View>
                  </View>

                  <ScrollView
                    style={styles.iphoneScreenScroll}
                    contentContainerStyle={styles.iphoneScreenContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                  >
                    <View style={styles.smsThread}>
                      <View style={styles.smsPosterWrap}>
                        {event.posterUrl ? (
                          <Image
                            source={{ uri: event.posterUrl }}
                            style={styles.smsPoster}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.smsPoster, styles.smsPosterPlaceholder]}>
                            <Text style={styles.smsPosterEmoji}>🎈</Text>
                            <Text style={styles.smsPosterTitle} numberOfLines={2}>
                              {event.eventName}
                            </Text>
                          </View>
                        )}
                      </View>

                      <IncomingSmsBubble>
                        <Text style={styles.smsBody}>{previewBody}</Text>
                      </IncomingSmsBubble>
                    </View>
                  </ScrollView>

                  <View style={styles.imessageComposer}>
                    <View style={styles.imessagePlusBtn}>
                      <Plus size={22} color="#8E8E93" strokeWidth={2.2} />
                    </View>
                    <View style={styles.imessageInput}>
                      <Text style={styles.imessagePlaceholder}>iMessage</Text>
                      <Mic size={20} color="#8E8E93" strokeWidth={2} />
                    </View>
                  </View>

                  <View style={styles.homeIndicator} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  },
);

export default SmsInvitePreviewModal;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontFamily: fontFamily.headline,
    fontSize: 18,
    fontWeight: "800",
    color: colors.onSurface,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
  },
  topSection: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  previewScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    alignItems: "center",
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    marginBottom: spacing[3],
    textAlign: "center",
  },
  iphoneMockupWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: spacing[4],
  },
  iphoneGlow: {
    position: "absolute",
    width: "88%",
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: "rgba(107, 56, 212, 0.08)",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 48,
      },
      android: {},
    }),
  },
  iphoneBezel: {
    aspectRatio: 0.5,
    backgroundColor: IPHONE_BEZEL,
    borderRadius: 48,
    padding: 12,
    borderWidth: 6,
    borderColor: IPHONE_BORDER,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  iphoneScreen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    overflow: "hidden",
  },
  iphoneNotch: {
    position: "absolute",
    top: 0,
    alignSelf: "center",
    width: 96,
    height: 24,
    backgroundColor: IPHONE_BEZEL,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 20,
  },
  iphoneScreenScroll: {
    flex: 1,
  },
  iphoneScreenContent: {
    paddingTop: spacing[2],
    paddingHorizontal: spacing[2],
    paddingBottom: spacing[3],
  },
  phoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingTop: 36,
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  phoneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.12)",
  },
  phoneAvatarImage: {
    width: 40,
    height: 40,
  },
  phoneContactWrap: {
    flex: 1,
    minWidth: 0,
  },
  phoneContact: {
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "700",
    color: colors.onSurface,
    lineHeight: 18,
  },
  phoneMeta: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  smsThread: {
    alignSelf: "stretch",
    gap: spacing[2],
  },
  smsPosterWrap: {
    alignSelf: "flex-start",
    width: "72%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    marginLeft: spacing[1],
    backgroundColor: "#FFFFFF",
  },
  smsBubbleWrap: {
    alignSelf: "flex-start",
    maxWidth: "88%",
    marginLeft: spacing[1],
    position: "relative",
  },
  smsBubble: {
    backgroundColor: IMESSAGE_BUBBLE,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smsBubbleTail: {
    position: "absolute",
    bottom: 0,
    left: -5,
    width: 11,
    height: 11,
    backgroundColor: IMESSAGE_BUBBLE,
    borderBottomLeftRadius: 10,
    transform: [{ rotate: "45deg" }],
  },
  smsPoster: {
    width: "100%",
    height: "100%",
  },
  smsPosterPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[4],
  },
  smsPosterEmoji: {
    fontSize: 28,
  },
  smsPosterTitle: {
    marginTop: 6,
    fontFamily: fontFamily.headline,
    fontSize: 14,
    fontWeight: "800",
    color: "#4C1D95",
    textAlign: "center",
  },
  smsBody: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
    lineHeight: 20,
  },
  imessageComposer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5EA",
    backgroundColor: "#FFFFFF",
  },
  imessagePlusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
    justifyContent: "center",
  },
  imessageInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: IMESSAGE_INPUT_BORDER,
    backgroundColor: "#FFFFFF",
  },
  imessagePlaceholder: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    color: "#C7C7CC",
  },
  homeIndicator: {
    alignSelf: "center",
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000000",
    marginTop: 6,
    marginBottom: 6,
  },
  editSmsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingVertical: 14,
    paddingHorizontal: spacing[5],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: "rgba(107, 56, 212, 0.28)",
    backgroundColor: "#F8F9FB",
    width: "100%",
    maxWidth: 320,
  },
  editSmsBtnText: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "700",
    color: ACCENT,
  },
  editPanel: {
    width: "100%",
    maxWidth: 320,
    gap: spacing[3],
  },
  editLabel: {
    fontFamily: fontFamily.headline,
    fontSize: 13,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: 0.3,
  },
  editInput: {
    minHeight: 96,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: "#FFFFFF",
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
    color: colors.onSurface,
  },
  insertOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  insertOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(107, 56, 212, 0.24)",
    backgroundColor: "rgba(107, 56, 212, 0.06)",
  },
  insertOptionBtnMuted: {
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLow,
  },
  insertOptionText: {
    fontFamily: fontFamily.headline,
    fontSize: 12,
    fontWeight: "700",
    color: ACCENT,
  },
  insertOptionTextMuted: {
    color: colors.onSurfaceVariant,
  },
  linkInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: "#FFFFFF",
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 21,
    color: ACCENT,
  },
  editHint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceVariant,
    marginTop: -spacing[1],
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  editCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLow,
  },
  editCancelText: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
  },
  editSaveBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },
  editSaveBtnDisabled: {
    opacity: 0.7,
  },
  editSaveText: {
    fontFamily: fontFamily.headline,
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resetLink: {
    alignSelf: "center",
    paddingVertical: spacing[2],
  },
  resetLinkText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    fontWeight: "600",
    color: colors.onSurfaceVariant,
    textDecorationLine: "underline",
  },
});
