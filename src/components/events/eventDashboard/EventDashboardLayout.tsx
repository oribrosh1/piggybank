import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  Linking,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  FlatList,
  StatusBar,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Sparkles,
  UserPlus,
  Users,
  Share2,
  BarChart3,
  Puzzle,
  Calendar,
  MapPin,
  Utensils,
  Pencil,
  Gift,
  Search,
  X,
  ChevronRight,
} from "lucide-react-native";
import type { Event } from "@/types/events";
import { honoreeNameFromEvent } from "@/src/lib/eventTitle";
import { formatDate, getKosherLabel, getMealTypeLabel, getVegetarianLabel } from "../utils";
import { colors, fontFamily } from "@/src/theme";

const VIOLET = colors.primary;
/** Page canvas — transparent so root `AppMeshBackground` shows through */
const PAGE_BG = "transparent";
const NAVY = colors.onSurface;

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
      return "Celebration";
  }
}

export function EventPosterIntroLine({ event }: { event: Event }) {
  const childName = extractChildFirstName(event.eventName);
  const typeTitle = getEventTypeTitle(event.eventType);
  const age = event.age?.trim();

  const headline = (() => {
    switch (event.eventType) {
      case "birthday":
        return `${childName}'s Birthday`;
      case "barMitzvah":
        return `${childName}'s Bar Mitzvah`;
      case "batMitzvah":
        return `${childName}'s Bat Mitzvah`;
      default:
        return `${typeTitle} · ${childName}`;
    }
  })();

  return (
    <View style={styles.posterIntroWrap}>
      <Text style={styles.posterIntroHeadline} numberOfLines={2}>
        {headline}
      </Text>
      {age ? <Text style={styles.posterIntroAge}>Turning {age}</Text> : null}
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
  const m = getMealTypeLabel(event.mealType, event.chalavYisrael);
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
        <Bell size={22} color={colors.onSurface} strokeWidth={2} />
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
            <Sparkles size={16} color={colors.onPrimary} strokeWidth={2.2} />
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
        <View style={[styles.pill, { backgroundColor: colors.surfaceContainerLow }]}>
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
              <Pencil size={14} color={colors.onSurfaceVariant} strokeWidth={2} />
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

type GuideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>;

const GUEST_MANAGEMENT_GUIDE_POINTS: {
  title: string;
  body: string;
  Icon: GuideIcon;
  stepTint: string;
  stepTintBorder: string;
  iconColor: string;
}[] = [
  {
    title: "Selecting guests",
    body: "Choose who to invite, filter by status, and send SMS invitations. Use selection mode when you want to message several people at once.",
    Icon: Users,
    stepTint: "#EDE9FE",
    stepTintBorder: "rgba(124, 58, 237, 0.2)",
    iconColor: "#6D28D9",
  },
  {
    title: "Scheduling settings",
    body: "Set reminder schedules so guests get nudges before your RSVP date. You can add new schedules any time as plans change.",
    Icon: Calendar,
    stepTint: "#E0E7FF",
    stepTintBorder: "rgba(79, 70, 229, 0.22)",
    iconColor: "#4338CA",
  },
  {
    title: "Messages & digital gifts",
    body: "After a guest confirms they are coming, they can send a digital gift through the app so your child receives it on CreditKid.",
    Icon: Gift,
    stepTint: "#FCE7F3",
    stepTintBorder: "rgba(219, 39, 119, 0.18)",
    iconColor: "#BE185D",
  },
  {
    title: "Guests, schedules & wording",
    body: "Add new guests whenever you need to. Add or adjust reminder schedules, and edit your invitation message from Edit event on this screen.",
    Icon: Pencil,
    stepTint: "#FEF3C7",
    stepTintBorder: "rgba(217, 119, 6, 0.2)",
    iconColor: "#B45309",
  },
  {
    title: "Analytics & payment reminders",
    body: "See who is coming and who has already paid in the app. Follow up with guests who have not paid yet—you can send them a reminder to pay through CreditKid.",
    Icon: BarChart3,
    stepTint: "#CCFBF1",
    stepTintBorder: "rgba(13, 148, 136, 0.22)",
    iconColor: "#0F766E",
  },
];

type GuestManagementGuideModalProps = {
  visible: boolean;
  onClose: () => void;
  bottomInset?: number;
};

type GuideSlide =
  | { key: "intro"; kind: "intro"; title: string; body: string }
  | {
      key: string;
      kind: "step";
      title: string;
      body: string;
      Icon: GuideIcon;
      stepTint: string;
      iconColor: string;
      stepIndex: number;
    };

function buildGuideSlides(): GuideSlide[] {
  return [
    {
      key: "intro",
      kind: "intro",
      title: "How guest management works",
      body: "Swipe through five beats—invite, automate reminders, gifts, edits, and follow-ups. Built for parents, not spreadsheets.",
    },
    ...GUEST_MANAGEMENT_GUIDE_POINTS.map((p, i) => ({
      key: p.title,
      kind: "step" as const,
      title: p.title,
      body: p.body,
      Icon: p.Icon,
      stepTint: p.stepTint,
      iconColor: p.iconColor,
      stepIndex: i + 1,
    })),
  ];
}

/** Full-bleed gradients per slide — visually distinct from the old “purple header + white cards” pattern */
const GUIDE_INTRO_GRADIENT = ["#020617", "#3730A3", "#7C3AED"] as const;
const GUIDE_STEP_GRADIENTS: readonly (readonly [string, string])[] = [
  ["#5B21B6", "#C4B5FD"],
  ["#1D4ED8", "#93C5FD"],
  ["#9F1239", "#F9A8D4"],
  ["#B45309", "#FCD34D"],
  ["#115E59", "#5EEAD4"],
];

export function GuestManagementGuideModal({ visible, onClose, bottomInset = 0 }: GuestManagementGuideModalProps) {
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, bottomInset);
  const { width: slideW, height: winH } = useWindowDimensions();
  const slides = useMemo(() => buildGuideSlides(), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<GuideSlide>>(null);

  useEffect(() => {
    if (visible) {
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [visible]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / slideW);
      setActiveIndex(Math.min(Math.max(next, 0), slides.length - 1));
    },
    [slideW, slides.length]
  );

  const renderSlide = useCallback(
    ({ item }: { item: GuideSlide }) => {
      const slideFrame = [styles.guideImmersiveSlide, { width: slideW, height: winH }];
      if (item.kind === "intro") {
        return (
          <View style={slideFrame}>
            <LinearGradient colors={[...GUIDE_INTRO_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFillObject} />
            <View style={[styles.guideSlideInner, { paddingTop: insets.top + 72 }]}>
              <View style={styles.guideIntroSparkleWrap}>
                <Sparkles size={38} color="#E9D5FF" strokeWidth={2} />
              </View>
              <Text style={styles.guideImmersiveEyebrow}>Guest toolkit</Text>
              <Text style={styles.guideImmersiveTitle}>{item.title}</Text>
              <Text style={styles.guideImmersiveBody}>{item.body}</Text>
              <View style={styles.guideSwipeHint}>
                <Text style={styles.guideSwipeHintText}>Swipe</Text>
                <ChevronRight size={18} color="rgba(255,255,255,0.75)" strokeWidth={2.5} />
              </View>
            </View>
          </View>
        );
      }
      const StepIcon = item.Icon;
      const g = GUIDE_STEP_GRADIENTS[item.stepIndex - 1] ?? GUIDE_STEP_GRADIENTS[0];
      const num = String(item.stepIndex).padStart(2, "0");
      return (
        <View style={slideFrame}>
          <LinearGradient colors={[g[0], g[1]]} start={{ x: 0.1, y: 0 }} end={{ x: 0.85, y: 1 }} style={StyleSheet.absoluteFillObject} />
          <Text style={styles.guideWatermarkNum} accessibilityElementsHidden>
            {num}
          </Text>
          <View style={[styles.guideSlideInner, { paddingTop: insets.top + 72 }]}>
            <View style={styles.guideIconGlass}>
              <StepIcon size={34} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.guideImmersiveStepTitle}>{item.title}</Text>
            <Text style={styles.guideImmersiveBody}>{item.body}</Text>
          </View>
        </View>
      );
    },
    [insets.top, slideW, winH]
  );

  const progress = (activeIndex + 1) / slides.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.guideImmersiveRoot}>
        <StatusBar barStyle="light-content" />
        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(s) => s.key}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumScrollEnd}
          bounces={false}
          style={{ flex: 1 }}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            length: slideW,
            offset: slideW * index,
            index,
          })}
          extraData={slideW}
        />

        <View style={[styles.guideTopOverlay, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
          <View style={styles.guideProgressTrack}>
            <View style={[styles.guideProgressFill, { width: `${progress * 100}%` }]} />
          </View>
          <View style={styles.guideTopOverlayRow}>
            <View style={{ width: 44 }} />
            <TouchableOpacity
              onPress={onClose}
              hitSlop={14}
              style={styles.guideCloseOnDark}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={22} color="#FFFFFF" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={["transparent", "rgba(2,6,23,0.88)"]}
          style={[styles.guideBottomFade, { paddingBottom: safeBottom + 16 }]}
          pointerEvents="box-none"
        >
          <View style={styles.guideDotsRowLight}>
            {slides.map((_, i) => (
              <View key={String(i)} style={[styles.guideDotLight, i === activeIndex && styles.guideDotLightActive]} />
            ))}
          </View>
          <TouchableOpacity style={styles.guideModalCtaLight} onPress={onClose} activeOpacity={0.92}>
            <Text style={styles.guideModalCtaLightText}>Got it</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

type StartInvitingGuestsCardProps = {
  onInviteGuests: () => void;
  onLearnHowItWorks: () => void;
};

export function StartInvitingGuestsCard({ onInviteGuests, onLearnHowItWorks }: StartInvitingGuestsCardProps) {
  return (
    <View style={styles.startInviteCard}>
      <View style={styles.startInviteIconWrap}>
        <UserPlus size={26} color={VIOLET} strokeWidth={2.2} />
      </View>
      <Text style={styles.startInviteTitle}>Start inviting guests</Text>
      <Text style={styles.startInviteSub}>
        Add people from your contacts, send SMS invitations, and track RSVPs and gifts in one place.
      </Text>
      <TouchableOpacity style={styles.startInvitePrimary} onPress={onInviteGuests} activeOpacity={0.9}>
        <Text style={styles.startInvitePrimaryText}>Invite guests</Text>
        <ChevronRight size={20} color={colors.onPrimary} strokeWidth={2.5} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onLearnHowItWorks} hitSlop={{ top: 8, bottom: 8 }} style={styles.startInviteSecondary}>
        <Text style={styles.startInviteSecondaryText}>How guest management works</Text>
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
        return { text: "ADDED", bg: colors.surfaceContainerLow, color: colors.onSurfaceVariant };
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
        <Search size={18} color={colors.muted} strokeWidth={2} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          placeholderTextColor={colors.muted}
          value={q}
          onChangeText={setQ}
        />
      </View>
      {event.guests.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 16 }}>
          <Text style={{ fontSize: 36, marginBottom: 8 }}>👥</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.onSurfaceVariant }}>No guests yet</Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
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
    backgroundColor: colors.surfaceContainerLowest,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
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
    borderColor: colors.surfaceContainerLowest,
  },
  posterCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: colors.onSurface,
    position: "relative",
  },
  /** Full width; height follows ISO A4 portrait ratio */
  posterA4: {
    width: "100%",
    aspectRatio: A4_ASPECT_RATIO,
    backgroundColor: colors.onSurface,
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
    backgroundColor: colors.onSurface,
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
  placeholderSub: { marginTop: 12, fontSize: 13, color: colors.muted, fontWeight: "600" },
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
  themeTitle: { fontSize: 16, fontWeight: "800", color: colors.onPrimary, marginTop: 4, maxWidth: "70%" },
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
  fabGenerateText: { fontSize: 12, fontWeight: "800", color: colors.onPrimary },
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
    color: colors.onPrimary,
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
  eventTitle: { fontSize: 26, fontWeight: "900", color: colors.onSurface, letterSpacing: -0.5 },
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
    paddingTop: 10,
    paddingBottom: 8,
  },
  posterIntroHeadline: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  posterIntroAge: {
    marginTop: 6,
    fontFamily: fontFamily.label,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  gridWrap: { paddingHorizontal: 20, marginTop: 40 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCell: {
    width: "31%",
    flexGrow: 1,
    minWidth: "28%",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(203, 195, 215, 0.15)",
    shadowColor: colors.onSurface,
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
  gridLabel: { fontSize: 14, fontWeight: "800", color: colors.onSurface, marginTop: 8, textAlign: "center", letterSpacing: 0.2 },
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
    borderColor: "rgba(203, 195, 215, 0.12)",
  },
  involveTitle: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  involveSub: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
  linkAccountBtn: {
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  linkAccountText: { fontSize: 11, fontWeight: "800", color: colors.onPrimary, letterSpacing: 0.5 },
  whiteCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(203, 195, 215, 0.12)",
    shadowColor: colors.onSurface,
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
  detailLabel: { fontSize: 12, fontWeight: "700", color: colors.muted, marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: "800", color: colors.onSurface },
  detailTime: { fontSize: 15, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  detailSub: { fontSize: 13, color: colors.onSurfaceVariant, marginTop: 4 },
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
  sectionTitle: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  editPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  grid2x2: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridCellDetail: {
    width: "47%",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
  },
  miniLabel: { fontSize: 10, fontWeight: "800", color: colors.muted, marginBottom: 6, letterSpacing: 0.5 },
  miniValue: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  glHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  glTitle: { fontSize: 17, fontWeight: "800", color: colors.onSurface },
  viewAll: { fontSize: 13, fontWeight: "800", color: VIOLET },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, fontWeight: "600", color: colors.onSurface },
  guestRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  guestAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
  },
  guestAvatarText: { fontSize: 16, fontWeight: "800", color: VIOLET },
  guestName: { fontSize: 15, fontWeight: "800", color: colors.onSurface },
  guestSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  emptyGuests: { fontSize: 14, color: colors.muted, textAlign: "center", paddingVertical: 8 },
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
  guideImmersiveRoot: {
    flex: 1,
    backgroundColor: "#020617",
  },
  guideImmersiveSlide: {
    overflow: "hidden",
  },
  guideSlideInner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 200,
    justifyContent: "center",
  },
  guideIntroSparkleWrap: {
    alignSelf: "center",
    width: 84,
    height: 84,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  guideWatermarkNum: {
    position: "absolute",
    top: "12%",
    left: -8,
    fontSize: 128,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.11)",
    letterSpacing: -8,
  },
  guideIconGlass: {
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.32)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  guideImmersiveEyebrow: {
    alignSelf: "center",
    fontSize: 11,
    fontWeight: "900",
    color: "rgba(255, 255, 255, 0.65)",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  guideImmersiveTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1.2,
    lineHeight: 38,
    textAlign: "center",
    marginBottom: 16,
    textShadowColor: "rgba(0, 0, 0, 0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  guideImmersiveStepTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 14,
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  guideImmersiveBody: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: -0.15,
  },
  guideSwipeHint: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    marginTop: 32,
    opacity: 0.95,
  },
  guideSwipeHintText: {
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.6)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
  guideTopOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 16,
  },
  guideProgressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    overflow: "hidden",
    width: "100%",
  },
  guideProgressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  guideTopOverlayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  guideCloseOnDark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  guideBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  guideDotsRowLight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  guideDotLight: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  guideDotLightActive: {
    width: 26,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  guideModalCtaLight: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  guideModalCtaLightText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  startInviteCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: "#F5F3FF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(107, 78, 255, 0.12)",
  },
  startInviteIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(107, 56, 212, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  startInviteTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  startInviteSub: {
    marginTop: 8,
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 21,
    fontWeight: "500",
    marginBottom: 16,
  },
  startInvitePrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: VIOLET,
    paddingVertical: 15,
    borderRadius: 16,
  },
  startInvitePrimaryText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.onPrimary,
    letterSpacing: -0.2,
  },
  startInviteSecondary: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 4,
  },
  startInviteSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: VIOLET,
  },
});

export { PAGE_BG, VIOLET };
