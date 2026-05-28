import type { ImageSourcePropType } from "react-native";

export type PartyTypeOption = {
  value: string;
  label: string;
  name: string;
  /** When set, shown in chip UI instead of `label` emoji */
  iconImage?: ImageSourcePropType;
};

export const PARTY_TYPE_OPTIONS: PartyTypeOption[] = [
  { value: "bounce-house", label: "🏰", name: "Bounce house" },
  {
    value: "trampoline",
    label: "🤸",
    name: "Trampoline",
    iconImage: require("../../assets/images/trampoline-jumping.png"),
  },
  { value: "wall-climbing", label: "🧗", name: "Wall climbing" },
  { value: "indoor-soccer", label: "⚽", name: "Indoor soccer" },
  { value: "basketball", label: "🏀", name: "Basketball game" },
  { value: "girls-beauty-day", label: "💄", name: "Girls beauty day" },
  { value: "pool-party", label: "🏊", name: "Pool party" },
  { value: "yacht-party", label: "⛵", name: "Yacht party" },
];

const LEGACY_PARTY_LABELS: Record<string, string> = {
  pool: "Pool",
  beach: "Beach",
  garden: "Garden",
  indoor: "Indoor",
  restaurant: "Restaurant",
  rooftop: "Rooftop",
  other: "Other",
};

/**
 * Human-readable party type for UI (chips, dashboard, party details).
 */
export function getPartyTypeDisplayLabel(
  partyType?: string,
  otherPartyType?: string,
  /** When no preset slug is set, show custom poster theme (e.g. “Princess party”). */
  fallbackFreeformTheme?: string,
): string {
  const pt = partyType?.trim();
  if (!pt && fallbackFreeformTheme?.trim()) {
    return fallbackFreeformTheme.trim();
  }
  if (!pt) return "—";
  if (pt === "other" && otherPartyType?.trim()) {
    return otherPartyType.trim();
  }
  const match = PARTY_TYPE_OPTIONS.find((o) => o.value === pt);
  if (match) return match.name;
  const legacy = LEGACY_PARTY_LABELS[pt];
  if (legacy) return legacy;
  return pt
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
