import type { ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Calendar,
  PartyPopper,
  Pencil,
  Sparkles,
  type LucideIcon,
} from "lucide-react-native";
import { GlassCardDark } from "@/src/components/common/GlassCardDark";
import EventDetailsLocationCard from "@/src/components/create-event/EventDetailsLocationCard";
import { POSTER_THEME_OPTIONS } from "@/src/lib/posterThemes";
import { getPartyTypeDisplayLabel } from "@/src/constants/partyTypeOptions";
import type { CelebrationPickerType, EventFormData } from "@/types/events";
import { colors, spacing, radius, fontFamily } from "@/src/theme";

function celebrationTypeDisplay(
  type: CelebrationPickerType | undefined,
): string {
  switch (type) {
    case "barMitzvah":
      return "Bar Mitzvah";
    case "batMitzvah":
      return "Bat Mitzvah";
    default:
      return "Birthday";
  }
}

function honoreeGenderDisplay(gender?: EventFormData["honoreeGender"]): string {
  if (gender === "boy") return "Boy";
  if (gender === "girl") return "Girl";
  return "—";
}

function parseTimeString(
  timeStr: string,
): { hours24: number; minutes: number } | null {
  if (!timeStr) return null;
  const twelveHour = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const period = twelveHour[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;
    return { hours24: hours, minutes };
  }
  const twentyFour = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return {
      hours24: parseInt(twentyFour[1], 10),
      minutes: parseInt(twentyFour[2], 10),
    };
  }
  return null;
}

function formatTimeTo12h(timeStr: string): string {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return timeStr;
  const period = parsed.hours24 >= 12 ? "PM" : "AM";
  const hour12 = parsed.hours24 % 12 || 12;
  return `${hour12}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}

function formatDateDisplay(dateString: string): string {
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts.map((p) => parseInt(p, 10));
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return dateString;
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function themeTitle(themeId?: string): string | null {
  const id = themeId?.trim();
  if (!id) return null;
  return POSTER_THEME_OPTIONS.find((t) => t.id === id)?.title ?? null;
}

type CreateEventReviewDetailsSectionProps = {
  formData: EventFormData;
  isQuickPoster: boolean;
  onEdit: () => void;
};

function ReviewDetailCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassCardDark
      style={styles.card}
      padding={0}
      borderRadius={radius.md}
      borderColor="rgba(107, 56, 212, 0.1)"
      contentStyle={styles.cardInner}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Icon size={17} color={colors.primary} strokeWidth={2.1} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.cardBody}>{children}</View>
    </GlassCardDark>
  );
}

function DetailRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.detailRowLast]}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function CreateEventReviewDetailsSection({
  formData,
  isQuickPoster,
  onEdit,
}: CreateEventReviewDetailsSectionProps) {
  const name = formData.childName.trim() || "—";
  const age = formData.age.trim() || "—";
  const datePretty = formData.date.trim()
    ? formatDateDisplay(formData.date.trim())
    : "—";
  const timePretty = formData.time.trim()
    ? formatTimeTo12h(formData.time.trim())
    : "—";

  const partyTypeLabel = getPartyTypeDisplayLabel(
    formData.partyType,
    formData.otherPartyType,
    formData.theme,
  );
  const themeLabel = themeTitle(formData.theme);
  const partyVibe = formData.partyVibe?.trim() ?? "";
  const dressCode = formData.dressCode?.trim() ?? "";

  const showPartyStyle =
    !isQuickPoster &&
    !formData.optionalDetailsLater &&
    (partyTypeLabel !== "—" || themeLabel || partyVibe || dressCode);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionIntro}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Your details</Text>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Edit event details"
          >
            <Pencil size={14} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.sectionHint}>
          Everything guests will see on the invitation.
        </Text>
      </View>

      <ReviewDetailCard icon={PartyPopper} title="Celebration">
        <DetailRow label="Honoree" value={name} />
        <DetailRow label="Turning" value={age} />
        <DetailRow
          label="Occasion"
          value={celebrationTypeDisplay(formData.celebrationType)}
        />
        <DetailRow
          label="Poster for"
          value={honoreeGenderDisplay(formData.honoreeGender)}
          isLast
        />
      </ReviewDetailCard>

      <ReviewDetailCard icon={Calendar} title="When">
        <DetailRow label="Date" value={datePretty} />
        <DetailRow label="Time" value={timePretty} isLast />
      </ReviewDetailCard>

      <EventDetailsLocationCard
        address1={formData.address1}
        address2={formData.address2}
        locationNotes={formData.locationNotes}
        parking={formData.parking}
        reviewMode
      />

      {showPartyStyle ? (
        <ReviewDetailCard icon={Sparkles} title="Party style">
          {[
            partyTypeLabel !== "—"
              ? { label: "Party type", value: partyTypeLabel }
              : null,
            themeLabel ? { label: "Theme", value: themeLabel } : null,
            partyVibe ? { label: "Vibe", value: partyVibe } : null,
            dressCode ? { label: "Dress code", value: dressCode } : null,
          ]
            .filter((row): row is { label: string; value: string } => !!row)
            .map((row, index, rows) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                isLast={index === rows.length - 1}
              />
            ))}
        </ReviewDetailCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing[3],
  },
  sectionIntro: {
    marginBottom: spacing[1],
    gap: spacing[1],
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: spacing[3],
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.28)",
    backgroundColor: "rgba(107, 56, 212, 0.08)",
  },
  editButtonText: {
    fontFamily: fontFamily.label,
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.1,
  },
  sectionTitle: {
    fontFamily: fontFamily.title,
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
    marginBottom: spacing[1],
  },
  sectionHint: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.onSurfaceVariant,
  },
  card: {
    marginBottom: 0,
  },
  cardInner: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  cardHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(107, 56, 212, 0.11)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: fontFamily.title,
    fontSize: 15,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.28,
  },
  cardBody: {
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(107, 56, 212, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(107, 56, 212, 0.08)",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.onSurfaceVariant,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    flexShrink: 0,
  },
  detailValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: fontFamily.body,
    fontSize: 15,
    fontWeight: "600",
    color: colors.onSurface,
    lineHeight: 21,
    textAlign: "right",
    letterSpacing: -0.15,
  },
});
