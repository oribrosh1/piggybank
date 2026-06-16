import React, { useMemo, type ComponentType } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Users,
  Check,
  Gift,
  Clock,
  Send,
  Plus,
  UserX,
  ChevronRight,
  AlertTriangle,
  Info,
  Heart,
} from "lucide-react-native";
import type { Event, Guest } from "@/types/events";

const PAGE_BG = "#F7F4FF";
const PURPLE = "#5F2EEA";
const PURPLE_DARK = "#4C1D95";
const PURPLE_SOFT = "#F1EAFF";
const BORDER = "rgba(95, 46, 234, 0.1)";

export interface GuestStatsModalProps {
  visible: boolean;
  onClose: () => void;
  bottomInset: number;
  event: Event | null;
  onViewFullGuestList: () => void;
  onAddGuests: () => void;
  /** Invalid numbers — opens guest list filtered to fix */
  onFixInvalidPhones: () => void;
  /** Pending = added + invited */
  onSendRemindersToPending: () => void;
  /** Opens reminder scheduler preselected for attending guests without gifts */
  onScheduleGiftReminders: () => void;
}

function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function timeAgo(date?: Date) {
  if (!date) return "";
  const ms = Date.now() - date.getTime();
  if (!Number.isFinite(ms) || ms < 0) return "Just now";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function guestActivityDate(guest: Guest) {
  return guest.paidAt ?? guest.confirmedAt ?? guest.invitedAt ?? guest.addedAt;
}

function centsLabel(cents?: number) {
  if (!cents || cents <= 0) return "Gift Sent";
  return `${(cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  })} Gift Sent`;
}

function StatCell({
  Icon,
  value,
  label,
  withDivider,
}: {
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  value: number;
  label: string;
  withDivider?: boolean;
}) {
  return (
    <View style={[styles.statCell, withDivider && styles.statDivider]}>
      <View style={styles.statValueRow}>
        <View style={styles.statIcon}>
          <Icon size={21} color={PURPLE} strokeWidth={2.3} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function FilterChip({
  Icon,
  label,
  count,
  active,
}: {
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <View style={[styles.filterChip, active && styles.activeFilterChip]}>
      <Icon
        size={14}
        color={active ? "#FFFFFF" : PURPLE_DARK}
        strokeWidth={2.4}
      />
      <Text style={[styles.filterChipText, active && styles.activeFilterChipText]}>
        {label} ({count})
      </Text>
    </View>
  );
}

function GuestRow({
  guest,
  isLast,
  onPress,
}: {
  guest: Guest;
  isLast: boolean;
  onPress: () => void;
}) {
  const activityDate = guestActivityDate(guest);
  const rsvpMeta =
    guest.status === "paid"
      ? {
          label: "Attending",
          Icon: Check,
          style: styles.filledChip,
          tone: "filled" as const,
        }
      : guest.status === "confirmed"
        ? {
            label: guest.blessing ? "Blessing Added" : "Attending",
            Icon: guest.blessing ? Heart : Check,
            style: styles.filledChip,
            tone: "filled" as const,
          }
        : guest.status === "declined"
          ? {
              label: "Not Attending",
              Icon: UserX,
              style: styles.neutralChip,
              tone: "neutral" as const,
            }
          : guest.status === "invalid_phone"
            ? {
                label: "Invalid Number",
                Icon: AlertTriangle,
                style: styles.warningChip,
                tone: "warning" as const,
              }
            : {
                label: "Awaiting Response",
                Icon: Clock,
                style: styles.neutralChip,
                tone: "neutral" as const,
              };
  const giftMeta =
    guest.status === "paid"
      ? {
          label: guest.blessing ? "Blessing Sent" : centsLabel(guest.paymentAmount),
          Icon: Gift,
          style: styles.filledChip,
          tone: "filled" as const,
        }
      : guest.blessing
        ? {
            label: "Blessing Added",
            Icon: Heart,
            style: styles.outlinePurpleChip,
            tone: "purple" as const,
          }
        : {
            label: "No Gift",
            Icon: guest.status === "declined" ? Heart : Gift,
            style: styles.outlinePurpleChip,
            tone: "purple" as const,
          };
  const RsvpIcon = rsvpMeta.Icon;
  const GiftIcon = giftMeta.Icon;

  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={[styles.guestRow, !isLast && styles.guestRowBorder]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initialsForName(guest.name)}</Text>
      </View>
      <View style={styles.guestInfo}>
        <Text style={styles.guestName} numberOfLines={1}>
          {guest.name}
        </Text>
        <View style={styles.chipWrap}>
          <View style={[styles.statusChip, rsvpMeta.style]}>
            <RsvpIcon
              size={12}
              color={rsvpMeta.tone === "filled" ? "#FFFFFF" : "#6B7280"}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.chipText,
                rsvpMeta.tone === "filled" && styles.filledChipText,
                rsvpMeta.tone === "warning" && styles.warningChipText,
              ]}
              numberOfLines={1}
            >
              {rsvpMeta.label}
            </Text>
          </View>
          <View style={[styles.statusChip, giftMeta.style]}>
            <GiftIcon
              size={12}
              color={giftMeta.tone === "filled" ? "#FFFFFF" : PURPLE_DARK}
              strokeWidth={2.4}
            />
            <Text
              style={[
                styles.chipText,
                styles.purpleChipText,
                giftMeta.tone === "filled" && styles.filledChipText,
              ]}
              numberOfLines={1}
            >
              {giftMeta.label}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.timeText}>{timeAgo(activityDate)}</Text>
      <ChevronRight size={20} color="#9CA3AF" strokeWidth={2.2} />
    </TouchableOpacity>
  );
}

export default function GuestStatsModal({
  visible,
  onClose,
  bottomInset,
  event,
  onViewFullGuestList,
  onAddGuests,
  onFixInvalidPhones,
  onSendRemindersToPending,
  onScheduleGiftReminders,
}: GuestStatsModalProps) {
  const { stats, recentGuests } = useMemo(() => {
    const g = event?.guestStats;
    const total = g?.total ?? 0;
    const confirmed = g?.confirmed ?? 0;
    const paid = g?.paid ?? 0;
    const invited = g?.invited ?? 0;
    const added = g?.added ?? 0;
    const invalidNumber = g?.invalidNumber ?? 0;
    const notComing = g?.notComing ?? 0;

    const attending = confirmed + paid;
    const responded = attending + notComing;
    const rsvpRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    const pendingReminders = added + invited;
    const blessings = event?.guests?.filter((guest) => guest.blessing?.trim()).length ?? 0;
    const guests =
      event?.guests
        ?.slice()
        .sort((a, b) => {
          const aTime = guestActivityDate(a)?.getTime() ?? 0;
          const bTime = guestActivityDate(b)?.getTime() ?? 0;
          return bTime - aTime;
        })
        .slice(0, 5) ?? [];

    return {
      stats: {
        total,
        rsvpRate,
        attending,
        sentGift: paid,
        blessings,
        attendingWithoutGift: confirmed,
        awaitingResponse: pendingReminders,
        notComing,
        invalidNumber,
        pendingReminders,
      },
      recentGuests: guests,
    };
  }, [event?.guestStats, event?.guests]);

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(24, bottomInset + 24) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.heroIcon}>
                <Users size={25} color={PURPLE} strokeWidth={2.1} />
                <View style={styles.heroBadge}>
                  <Gift size={14} color={PURPLE} strokeWidth={2.5} />
                </View>
              </View>
              <View style={styles.headerCopy}>
                <Text style={styles.title}>RSVP &amp; Gifts</Text>
                <Text style={styles.subtitle}>
                  Track attendance, gifts in one place.
                </Text>
              </View>
              <TouchableOpacity
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={onClose}
                style={styles.closeButton}
              >
                <X size={18} color="#6B7280" strokeWidth={2.3} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsPanel}>
              <StatCell Icon={Users} value={stats.total} label="Invited" />
              <StatCell
                Icon={Check}
                value={stats.attending}
                label="Attending"
                withDivider
              />
              <StatCell
                Icon={Gift}
                value={stats.sentGift}
                label="Gifts Sent"
                withDivider
              />
              <StatCell
                Icon={Clock}
                value={stats.awaitingResponse}
                label="Awaiting Response"
                withDivider
              />
            </View>

            <View style={styles.responseCard}>
              <View style={styles.responseTop}>
                <View style={styles.respondedLabelRow}>
                  <Text style={styles.responsePercent}>{stats.rsvpRate}%</Text>
                  <Text style={styles.responseLabel}>Responded</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onViewFullGuestList}
                  style={styles.viewDetailsRow}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <ChevronRight size={18} color={PURPLE_DARK} strokeWidth={2.4} />
                </TouchableOpacity>
              </View>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={["#7C3AED", "#4F46E5"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, Math.max(0, stats.rsvpRate))}%` },
                  ]}
                />
              </View>
              <TouchableOpacity
                activeOpacity={stats.invalidNumber > 0 ? 0.8 : 1}
                onPress={stats.invalidNumber > 0 ? onFixInvalidPhones : undefined}
                style={styles.declinedRow}
              >
                <Text style={styles.declinedText}>
                  {stats.notComing} Declined
                  {stats.invalidNumber > 0
                    ? ` · ${stats.invalidNumber} invalid number${stats.invalidNumber === 1 ? "" : "s"}`
                    : ""}
                </Text>
                <Info size={14} color="#9CA3AF" strokeWidth={2.3} />
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Guest List</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onViewFullGuestList}
                style={styles.viewAllButton}
              >
                <Text style={styles.viewAllText}>View All Guests</Text>
                <Text style={styles.viewAllCount}>{stats.total}</Text>
                <ChevronRight size={17} color={PURPLE_DARK} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterWrap}>
              <FilterChip Icon={Users} label="All" count={stats.total} active />
              <FilterChip Icon={Check} label="Attending" count={stats.attending} />
              <FilterChip Icon={Gift} label="Gifts" count={stats.sentGift} />
              <FilterChip Icon={Heart} label="Blessings" count={stats.blessings} />
              <FilterChip Icon={Clock} label="Pending" count={stats.awaitingResponse} />
              <FilterChip Icon={UserX} label="Declined" count={stats.notComing} />
            </View>

            <View style={styles.guestsList}>
              {recentGuests.length > 0 ? (
                recentGuests.map((guest, index) => (
                  <GuestRow
                    key={guest.id}
                    guest={guest}
                    isLast={index === recentGuests.length - 1}
                    onPress={onViewFullGuestList}
                  />
                ))
              ) : (
                <View style={styles.emptyGuests}>
                  <Text style={styles.emptyTitle}>No guests yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add guests to start tracking attendance and gifts.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.reminderCard}>
              <LinearGradient
                colors={["#7C3AED", "#4F21C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendIcon}
              >
                <Send size={24} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
              <View style={styles.reminderCopy}>
                <Text style={styles.reminderTitle}>Send Reminder</Text>
                <Text style={styles.reminderSubtitle}>
                  {"Send a friendly reminder to guests who haven't responded yet."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onSendRemindersToPending}
                activeOpacity={0.82}
                style={styles.reminderButton}
              >
                <Text style={styles.reminderButtonText}>Send Reminder</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.giftReminderCard}>
              <View style={styles.giftReminderIcon}>
                <Gift size={20} color={PURPLE_DARK} strokeWidth={2.3} />
              </View>
              <View style={styles.reminderCopy}>
                <Text style={styles.reminderTitle}>Gift Reminder</Text>
                <Text style={styles.reminderSubtitle}>
                  {stats.attendingWithoutGift > 0
                    ? `${stats.attendingWithoutGift} attending guest${
                        stats.attendingWithoutGift === 1 ? "" : "s"
                      } haven't sent a gift yet.`
                    : "Schedule reminders for attending guests who have not sent a gift yet."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onScheduleGiftReminders}
                activeOpacity={0.82}
                style={styles.scheduleGiftButton}
              >
                <Text style={styles.scheduleGiftButtonText}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onAddGuests} activeOpacity={0.92}>
              <LinearGradient
                colors={["#7C3AED", "#4F21C9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Plus size={23} color="#FFFFFF" strokeWidth={2.1} />
                <Text style={styles.primaryButtonText}>Add Guests</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 14,
    shadowColor: "#2E1065",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PURPLE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  heroBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 5,
    lineHeight: 18,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  statsPanel: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    paddingVertical: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 6,
  },
  statDivider: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "#E7E0F6",
  },
  statValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PURPLE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "900",
    color: PURPLE_DARK,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },
  responseCard: {
    backgroundColor: "#FBF9FF",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(95, 46, 234, 0.06)",
    marginBottom: 22,
  },
  responseTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  respondedLabelRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  responsePercent: {
    fontSize: 20,
    fontWeight: "900",
    color: PURPLE_DARK,
    marginRight: 6,
  },
  responseLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6B7280",
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "900",
    color: PURPLE_DARK,
    marginRight: 4,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E9DCF8",
    overflow: "hidden",
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  declinedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
  },
  declinedText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginRight: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
    letterSpacing: -0.4,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "900",
    color: PURPLE_DARK,
    marginRight: 10,
  },
  viewAllCount: {
    fontSize: 13,
    fontWeight: "900",
    color: PURPLE_DARK,
    marginRight: 8,
  },
  filterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  filterChip: {
    minHeight: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(76, 29, 149, 0.22)",
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
  },
  activeFilterChip: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "900",
    color: PURPLE_DARK,
  },
  activeFilterChipText: {
    color: "#FFFFFF",
  },
  guestsList: {
    borderWidth: 1,
    borderColor: "rgba(17, 24, 39, 0.08)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  guestRow: {
    minHeight: 73,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
  guestRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PURPLE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "900",
    color: PURPLE_DARK,
  },
  guestInfo: {
    flex: 1,
    minWidth: 0,
  },
  guestName: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 5,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusChip: {
    maxWidth: "100%",
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filledChip: {
    backgroundColor: PURPLE,
  },
  neutralChip: {
    backgroundColor: "#F9FAFB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D1D5DB",
  },
  warningChip: {
    backgroundColor: "#FFFBEB",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#FDE68A",
  },
  outlinePurpleChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(76, 29, 149, 0.42)",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6B7280",
  },
  filledChipText: {
    color: "#FFFFFF",
  },
  warningChipText: {
    color: "#B45309",
  },
  purpleChipText: {
    color: PURPLE_DARK,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
    marginHorizontal: 8,
  },
  emptyGuests: {
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    textAlign: "center",
  },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBF9FF",
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 12,
  },
  giftReminderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(76, 29, 149, 0.16)",
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginBottom: 12,
  },
  sendIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  giftReminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE_SOFT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reminderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  reminderSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 16,
  },
  reminderButton: {
    borderWidth: 1,
    borderColor: "#8B7BA8",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 11,
    backgroundColor: "#FFFFFF",
  },
  reminderButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: PURPLE_DARK,
  },
  scheduleGiftButton: {
    borderWidth: 1,
    borderColor: PURPLE,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: PURPLE_SOFT,
  },
  scheduleGiftButtonText: {
    fontSize: 12,
    fontWeight: "900",
    color: PURPLE_DARK,
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
