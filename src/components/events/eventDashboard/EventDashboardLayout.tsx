import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Image, TextInput, Linking, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Sparkles,
  UserPlus,
  Share2,
  BarChart3,
  Puzzle,
  Calendar,
  MapPin,
  Utensils,
  Pencil,
  Search,
} from "lucide-react-native";
import type { Event } from "@/types/events";
import { honoreeNameFromEvent } from "@/src/lib/eventTitle";
import { formatDate, getKosherLabel, getMealTypeLabel, getVegetarianLabel } from "../utils";

const VIOLET = "#6B4EFF";
const PAGE_BG = "#FAFAFA";
const NAVY = "#0F172A";

/** ISO 216 A4 portrait: 210mm × 250mm → width / height */
const A4_ASPECT_RATIO = 210 / 250;

function getEventTypeTitle(eventType: Event["eventType"]): string {
  switch (eventType) {
    case "birthday":
      return "Birthday";
    case "barMitzvah":
      return "Bar Mitzvah";
    case "batMitzvah":
      return "Bat Mitzvah";
    default:
      return "Event";
  }
}

export function EventPosterIntroLine({ event }: { event: Event }) {
  const childName = extractChildFirstName(event.eventName);
  const typeTitle = getEventTypeTitle(event.eventType);
  const age = event.age?.trim();
  const celebrating = age ? ` – celebrating ${age}` : "";
  return (
    <View style={styles.posterIntroWrap}>
      <Text style={styles.posterIntroText}>
        Event – {typeTitle} of {childName}
        {celebrating}
      </Text>
    </View>
  );
}

export function extractChildFirstName(eventName: string): string {
  const apos = eventName.match(/^([A-Za-z]+)'/);
  if (apos) return apos[1] ?? "Your child";
  const first = eventName.trim().split(/\s+/)[0];
  if (!first) return "Your child";
  return first.replace(/[^A-Za-z]/g, "") || "Your child";
}

function formatDateOrdinal(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = d.getDate();
  const y = d.getFullYear();
  const suf =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${month} ${day}${suf}, ${y}`;
}

function formatPartyTypeLabel(type?: string, other?: string): string {
  if (!type) return "—";
  if (type === "other" && other?.trim()) return other.trim();
  return type
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatAttireLabel(v?: string): string {
  if (!v) return "—";
  return v.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildCateringSummary(event: Event): string {
  const parts: string[] = [];
  const k = getKosherLabel(event.kosherType);
  if (k) parts.push(k.replace(/^.\s*/, "").trim());
  const m = getMealTypeLabel(event.mealType);
  if (m) parts.push(m.replace(/^.\s*/, "").trim());
  const v = getVegetarianLabel(event.vegetarianType);
  if (v) parts.push(v.replace(/^.\s*/, "").trim());
  if (parts.length === 0) return "Add dietary preferences when editing your event.";
  return parts.join(" · ");
}

type DashboardTopBarProps = {
  topInset: number;
  event: Event;
  onBell: () => void;
  hasNotificationDot?: boolean;
};

export function DashboardTopBar({ topInset, event, onBell, hasNotificationDot }: DashboardTopBarProps) {
  const initial = honoreeNameFromEvent(event).charAt(0).toUpperCase() || "?";
  return (
    <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.brandTitle}>CreditKid</Text>
      <TouchableOpacity onPress={onBell} style={styles.bellWrap} hitSlop={12}>
        <Bell size={22} color="#374151" strokeWidth={2} />
        {hasNotificationDot ? <View style={styles.notifDot} /> : null}
      </TouchableOpacity>
    </View>
  );
}

type PosterHeroCardProps = {
  event: Event;
  onGeneratePoster: () => void;
};

export function PosterHeroCard({ event, onGeneratePoster }: PosterHeroCardProps) {
  const basicTemplateOnly = event.optionalDetailsLater === true && !event.posterUrl;
  const themeLabel = basicTemplateOnly
    ? "Standard invitation"
    : event.theme?.trim() || "Custom design";
  const overlayLabel = basicTemplateOnly ? "BASIC TEMPLATE" : "ACTIVE DESIGN";

  return (
    <View style={styles.posterCard}>
      <View style={styles.posterA4} accessibilityLabel="Event poster, A4 size preview">
        {event.posterUrl ? (
          <Image source={{ uri: event.posterUrl }} style={styles.posterImageFill} resizeMode="cover" />
        ) : basicTemplateOnly ? (
          <LinearGradient
            colors={["#F9A8D4", "#C084FC", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          >
            <View style={styles.basicInviteInner}>
              <Text style={styles.basicInviteEmoji}>🎂</Text>
              <Text style={styles.basicInviteTitle} numberOfLines={2}>
                {event.eventName}
              </Text>
              <Text style={styles.basicInviteName}>{honoreeNameFromEvent(event)}</Text>
              <Text style={styles.basicInviteMeta}>
                {formatDate(event.date)} · {event.time}
              </Text>
              {event.address1 ? (
                <Text style={styles.basicInviteAddr} numberOfLines={2}>
                  {event.address1}
                </Text>
              ) : null}
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.placeholderGlow}>YOUR EVENT</Text>
            <Text style={styles.placeholderSub}>Tap Generate to create your poster</Text>
            <Text style={styles.a4Hint}>A4 (210 × 250 mm)</Text>
          </View>
        )}
      </View>
      <View style={styles.posterOverlayBottom} pointerEvents="box-none">
        <View>
          <Text style={styles.activeLabel}>{overlayLabel}</Text>
          <Text style={styles.themeTitle} numberOfLines={2}>
            {themeLabel}
          </Text>
        </View>
        {!basicTemplateOnly ? (
          <TouchableOpacity style={styles.fabGenerate} onPress={onGeneratePoster} activeOpacity={0.9}>
            <Sparkles size={16} color="#FFFFFF" strokeWidth={2.2} />
            <Text style={styles.fabGenerateText}>Generate Poster</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fabMuted}>
            <Text style={styles.fabMutedText}>AI poster after you add details</Text>
          </View>
        )}
      </View>
    </View>
  );
}

type EventSummaryHeaderProps = {
  event: Event;
};

export function EventSummaryHeader({ event }: EventSummaryHeaderProps) {
  const typePill =
    event.eventType === "birthday"
      ? "BIRTHDAY"
      : event.eventType === "barMitzvah"
        ? "BAR MITZVAH"
        : event.eventType === "batMitzvah"
          ? "BAT MITZVAH"
          : "EVENT";
  return (
    <View style={styles.summaryBlock}>
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: "#EDE9FE" }]}>
          <Text style={[styles.pillText, { color: VIOLET }]}>{typePill}</Text>
        </View>
        {event.age ? (
          <View style={[styles.pill, { backgroundColor: "#CCFBF1" }]}>
            <Text style={[styles.pillText, { color: "#0F766E" }]}>TURNING {event.age}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.eventTitle}>{event.eventName}</Text>
      <Text style={styles.celebrationSub}>Celebration</Text>
    </View>
  );
}

export function LiveStatusBanner() {
  return (
    <View style={styles.liveBanner}>
      <Text style={styles.liveBannerCheck}>✓</Text>
      <Text style={styles.liveBannerText}>
        Your event is live! Invites are being delivered to your guests.
      </Text>
    </View>
  );
}

type QuickGridProps = {
  onSetReminderSchedule: () => void;
  onAddGuests: () => void;
  onShare: () => void;
  onStats: () => void;
  onFeatures: () => void;
  onAlerts: () => void;
  showAlertDot?: boolean;
};

export function QuickActionsGrid({
  onSetReminderSchedule,
  onAddGuests,
  onShare,
  onStats,
  onFeatures,
  onAlerts,
  showAlertDot,
}: QuickGridProps) {
  const cells: Array<{
    key: string;
    label: string;
    Icon: typeof Bell;
    onPress: () => void;
    dot?: boolean;
  }> = [
    { key: "rem", label: "REMINDERS", Icon: Bell, onPress: onSetReminderSchedule },
    { key: "add", label: "ADD GUESTS", Icon: UserPlus, onPress: onAddGuests },
    { key: "share", label: "SHARE LINK", Icon: Share2, onPress: onShare },
    { key: "stats", label: "STATS", Icon: BarChart3, onPress: onStats },
    { key: "feat", label: "FEATURES", Icon: Puzzle, onPress: onFeatures },
    { key: "alert", label: "ALERTS", Icon: Bell, onPress: onAlerts, dot: showAlertDot },
  ];
  return (
    <View style={styles.gridWrap} >
      <View style={styles.grid}>
        {cells.map(({ key, label, Icon, onPress, dot }) => (
          <TouchableOpacity key={key} style={styles.gridCell} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.gridIconWrap}>
              <Icon size={22} color={VIOLET} strokeWidth={2} />
              {dot ? <View style={styles.gridNotifDot} /> : null}
            </View>
            <Text style={styles.gridLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

type InvolveChildCardProps = {
  name: string;
  onLinkAccount: () => void;
  loading?: boolean;
};

export function InvolveChildCard({ name, onLinkAccount, loading }: InvolveChildCardProps) {
  return (
    <View style={styles.involveCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.involveTitle}>Involve {name}</Text>
        <Text style={styles.involveSub}>Let {name} track gifts & RSVPs</Text>
      </View>
      <TouchableOpacity style={styles.linkAccountBtn} onPress={onLinkAccount} disabled={loading}>
        <Text style={styles.linkAccountText}>LINK ACCOUNT</Text>
      </TouchableOpacity>
    </View>
  );
}

type DetailsStackProps = {
  event: Event;
  onEditEvent: () => void;
};

export function DetailsStack({ event, onEditEvent }: DetailsStackProps) {
  const address = [event.address1, event.address2].filter(Boolean).join(", ");
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : "";

  const partyType = formatPartyTypeLabel(event.partyType, event.otherPartyType);
  const attire = formatAttireLabel(event.attireType);
  const footwear = formatAttireLabel(event.footwearType);
  const theme = event.theme?.trim() || "—";

  const hasPartyGrid =
    event.partyType || event.attireType || event.footwearType || event.theme;

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.whiteCard}>
        <View style={styles.rowIcon}>
          <View style={[styles.iconCircle, { backgroundColor: "#E0F2FE" }]}>
            <Calendar size={20} color="#0284C7" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Date & time</Text>
            <Text style={styles.detailValue}>{formatDateOrdinal(event.date)}</Text>
            <Text style={styles.detailTime}>{event.time}</Text>
          </View>
        </View>
      </View>

      <View style={styles.whiteCard}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={[styles.iconCircle, { backgroundColor: "#EDE9FE" }]}>
            <MapPin size={20} color={VIOLET} strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Location</Text>
            <Text style={styles.detailValue}>{event.address1 || "—"}</Text>
            {event.address2 ? <Text style={styles.detailSub}>{event.address2}</Text> : null}
            {mapsUrl ? (
              <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)}>
                <Text style={styles.directionsLink}>Get Directions</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={styles.mapThumb}>
            <MapPin size={20} color="#14B8A6" />
          </View>
        </View>
      </View>

      {hasPartyGrid ? (
        <View style={styles.whiteCard}>
          <View style={styles.partyHeader}>
            <Text style={styles.sectionTitle}>Party Details</Text>
            <TouchableOpacity onPress={onEditEvent} style={styles.editPill}>
              <Pencil size={14} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid2x2}>
            <View style={styles.gridCellDetail}>
              <Text style={styles.miniLabel}>TYPE</Text>
              <Text style={styles.miniValue}>{partyType}</Text>
            </View>
            <View style={styles.gridCellDetail}>
              <Text style={styles.miniLabel}>ATTIRE</Text>
              <Text style={styles.miniValue}>{attire}</Text>
            </View>
            <View style={styles.gridCellDetail}>
              <Text style={styles.miniLabel}>FOOTWEAR</Text>
              <Text style={styles.miniValue}>{footwear}</Text>
            </View>
            <View style={styles.gridCellDetail}>
              <Text style={styles.miniLabel}>THEME</Text>
              <Text style={styles.miniValue}>✨ {theme}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <TouchableOpacity style={styles.whiteCard} onPress={onEditEvent} activeOpacity={0.9}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={[styles.iconCircle, { backgroundColor: "#FEF3C7" }]}>
            <Utensils size={20} color="#D97706" strokeWidth={2} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Catering & Menu</Text>
            <Text style={styles.detailSub}>{buildCateringSummary(event)}</Text>
          </View>
          <Text style={{ color: VIOLET, fontSize: 18, fontWeight: "700" }}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

type GuestListSectionProps = {
  event: Event;
  onViewAll: () => void;
};

export function GuestListSection({ event, onViewAll }: GuestListSectionProps) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qv = q.trim().toLowerCase();
    if (!qv) return event.guests;
    return event.guests.filter(
      (g) => g.name.toLowerCase().includes(qv) || g.phone.replace(/\D/g, "").includes(qv.replace(/\D/g, ""))
    );
  }, [event.guests, q]);

  const statusLabel = (s: string) => {
    switch (s) {
      case "confirmed":
        return { text: "CONFIRMED", bg: "#D1FAE5", color: "#047857" };
      case "invited":
        return { text: "INVITED", bg: "#DBEAFE", color: "#1D4ED8" };
      case "paid":
        return { text: "GIFTED", bg: "#CCFBF1", color: "#0F766E" };
      case "declined":
        return { text: "DECLINED", bg: "#F1F5F9", color: "#475569" };
      case "invalid_phone":
        return { text: "INVALID", bg: "#FEF3C7", color: "#B45309" };
      default:
        return { text: "ADDED", bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  return (
    <View style={styles.whiteCard}>
      <View style={styles.glHeader}>
        <Text style={styles.glTitle}>
          Guest List ({event.totalGuests ?? event.guests.length})
        </Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchBar}>
        <Search size={18} color="#9CA3AF" strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          placeholderTextColor="#9CA3AF"
          value={q}
          onChangeText={setQ}
        />
      </View>
      {event.guests.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#6B7280" }}>No guests yet</Text>
          <Text style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>
            Add guests to start sending invites
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyGuests}>No guests match your search.</Text>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.slice(0, 8).map((guest) => {
            const st = statusLabel(guest.status);
            return (
              <View key={guest.id} style={styles.guestRow}>
                <View style={styles.guestAvatar}>
                  <Text style={styles.guestAvatarText}>{guest.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.guestName}>{guest.name}</Text>
                  <Text style={styles.guestSub} numberOfLines={1}>
                    {guest.phone}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: st.color }]}>{st.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function WhatsNextTip() {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipIcon}>ⓘ</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.tipText}>
          Most parents finalize the guest list 2 weeks before. Use the <Text style={{ fontWeight: "800" }}>Share Link</Text>{" "}
          to get quick RSVPs via WhatsApp or Text.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "800", color: VIOLET },
  brandTitle: { fontSize: 18, fontWeight: "800", color: VIOLET, letterSpacing: -0.3 },
  bellWrap: { position: "relative", padding: 4 },
  notifDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  posterCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#111827",
    position: "relative",
  },
  /** Full width; height follows ISO A4 portrait ratio */
  posterA4: {
    width: "100%",
    aspectRatio: A4_ASPECT_RATIO,
    backgroundColor: "#0D0D12",
  },
  posterImageFill: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  posterPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D0D12",
    paddingHorizontal: 16,
  },
  a4Hint: {
    marginTop: 16,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
    letterSpacing: 0.5,
  },
  placeholderGlow: {
    fontSize: 22,
    fontWeight: "900",
    color: "#F87171",
    letterSpacing: 4,
  },
  placeholderSub: { marginTop: 12, fontSize: 13, color: "#9CA3AF", fontWeight: "600" },
  posterOverlayBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  activeLabel: { fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.7)", letterSpacing: 1 },
  themeTitle: { fontSize: 16, fontWeight: "800", color: "#FFFFFF", marginTop: 4, maxWidth: "70%" },
  fabGenerate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  fabGenerateText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  fabMuted: {
    maxWidth: "48%",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  fabMutedText: { fontSize: 11, fontWeight: "700", color: "rgba(255,255,255,0.85)", lineHeight: 15 },
  basicInviteInner: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  basicInviteEmoji: { fontSize: 40, marginBottom: 8 },
  basicInviteTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  basicInviteName: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(255,255,255,0.95)",
  },
  basicInviteMeta: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },
  basicInviteAddr: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  summaryBlock: { paddingHorizontal: 20, paddingTop: 16 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.3 },
  eventTitle: { fontSize: 26, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  celebrationSub: { fontSize: 16, fontWeight: "700", color: VIOLET, marginTop: 4 },
  liveBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
  },
  liveBannerCheck: { fontSize: 16, color: "#059669", fontWeight: "900" },
  liveBannerText: { flex: 1, fontSize: 14, fontWeight: "600", color: "#065F46", lineHeight: 20 },
  posterIntroWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
  },
  posterIntroText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    lineHeight: 22,
  },
  gridWrap: { paddingHorizontal: 20, marginTop: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: {
    width: "31%",
    flexGrow: 1,
    minWidth: "28%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIconWrap: { position: "relative" },
  gridNotifDot: {
    position: "absolute",
    top: -4,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
  },
  gridLabel: { fontSize: 14, fontWeight: "800", color: "#374151", marginTop: 8, textAlign: "center", letterSpacing: 0.2 },
  involveCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
  },
  involveTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  involveSub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  linkAccountBtn: {
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  linkAccountText: { fontSize: 11, fontWeight: "800", color: "#FFFFFF", letterSpacing: 0.5 },
  whiteCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rowIcon: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailLabel: { fontSize: 12, fontWeight: "700", color: "#9CA3AF", marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  detailTime: { fontSize: 15, fontWeight: "700", color: "#374151", marginTop: 4 },
  detailSub: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  directionsLink: { fontSize: 14, fontWeight: "800", color: VIOLET, marginTop: 8 },
  mapThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#CCFBF1",
    alignItems: "center",
    justifyContent: "center",
  },
  partyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  editPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  grid2x2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCellDetail: {
    width: "47%",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
  },
  miniLabel: { fontSize: 10, fontWeight: "800", color: "#9CA3AF", marginBottom: 6, letterSpacing: 0.5 },
  miniValue: { fontSize: 14, fontWeight: "700", color: "#111827" },
  glHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  glTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  viewAll: { fontSize: 13, fontWeight: "800", color: VIOLET },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontWeight: "600", color: "#111827" },
  guestRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarText: { fontSize: 16, fontWeight: "800", color: VIOLET },
  guestName: { fontSize: 15, fontWeight: "800", color: "#111827" },
  guestSub: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  emptyGuests: { fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingVertical: 8 },
  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  tipIcon: { fontSize: 18, color: "#D97706", fontWeight: "900" },
  tipText: { fontSize: 14, color: "#92400E", lineHeight: 20, fontWeight: "500" },
});

export { PAGE_BG, VIOLET };
