/** Keeps AI poster prompts aligned with `src/constants/partyTypeOptions.ts` (no TS import in functions). */

const PARTY_PRESET_NAMES = {
  "bounce-house": "Bounce house",
  trampoline: "Trampoline",
  "wall-climbing": "Wall climbing",
  "indoor-soccer": "Indoor soccer game",
  basketball: "Basketball game",
  "girls-beauty-day": "Girls beauty day",
  "pool-party": "Pool party",
  "yacht-party": "Yacht party",
};

const LEGACY_PARTY_LABELS = {
  pool: "Pool",
  beach: "Beach",
  garden: "Garden",
  indoor: "Indoor",
  restaurant: "Restaurant",
  rooftop: "Rooftop",
  other: "Other",
};

function titleCaseSlug(slug) {
  return String(slug)
    .trim()
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Human-readable party setting for poster copy (matches app `getPartyTypeDisplayLabel` behavior).
 */
function getPartySettingLabel(partyType, otherPartyType, fallbackFreeformTheme) {
  const pt = typeof partyType === "string" ? partyType.trim() : "";
  const theme = typeof fallbackFreeformTheme === "string" ? fallbackFreeformTheme.trim() : "";
  if (!pt && theme) return theme;
  if (!pt) return "";
  if (pt === "other" && typeof otherPartyType === "string" && otherPartyType.trim()) {
    return otherPartyType.trim();
  }
  if (PARTY_PRESET_NAMES[pt]) return PARTY_PRESET_NAMES[pt];
  if (LEGACY_PARTY_LABELS[pt]) return LEGACY_PARTY_LABELS[pt];
  return titleCaseSlug(pt);
}

const CATERING_PARTNER_LABELS = {
  "glatt-bistro": "Glatt Bistro (catering preset)",
  "sky-high": "Sky High (catering preset)",
  "heritage-kitchen": "Heritage Kitchen (catering preset)",
  later: "Catering TBD (poster first)",
};

function formatVegetarianType(v) {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t || t === "none") return "";
  if (t === "vegetarian") return "Vegetarian options";
  if (t === "vegan") return "Vegan options";
  if (t === "by_request") return "Vegetarian meals on request";
  return titleCaseSlug(t);
}

module.exports = {
  getPartySettingLabel,
  CATERING_PARTNER_LABELS,
  formatVegetarianType,
};
