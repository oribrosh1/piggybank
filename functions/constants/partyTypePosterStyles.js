/**
 * Invitation poster visuals derived from preset `partyType` slugs.
 * Mirrors `src/constants/partyTypeOptions.ts` (+ legacy UI slugs).
 * Stage-A styling uses only event fields — no separate palette theme id on the API.
 */

/** Appended to party-derived styles so Stage-A image briefs don’t drift into sci‑fi “default epic kid invite”. */
const ANTI_SPACE_DRIFT =
  " HARD RULE: The final image brief must NOT use outer space, astronauts, space suits, rockets, nebulae, galaxies, starfields, or the phrase “cosmic adventure” unless this exact Style paragraph explicitly names them. Stay grounded in the real-world party setting described above and in Party setting / Party vibe.";

const PARTY_TYPE_STYLE = {
  "bounce-house": `Visual style: bounce-house / inflatable play party — upbeat primary palette, soft bounce-castle silhouettes or balloon clusters at the sides, cheerful confetti energy. Typography stays huge and readable; inflatable motifs frame the hero text without clutter.`,
  trampoline: `Visual style: trampoline / jump park energy — dynamic motion lines, springy geometry, bright athletic colors. Playful but safe; no outer-space metaphor unless the copy says so. Text remains the clear focal point.`,
  "wall-climbing": `Visual style: indoor climbing / bouldering — textured wall holds suggested subtly, sporty modern gradient, ropes or carabiners as tiny framing accents only. Bold legible typography; avoid generic “adventure climbing” clichés dominated by astronauts.`,
  "indoor-soccer": `Visual style: indoor soccer celebration — turf-green accents, faint stadium lights, sporty geometric patterns framing the headline. Vibrant athletic party vibe; crisp text over a clean heroic panel.`,
  basketball: `Visual style: basketball / hoops celebration — real court or gym: hardwood or painted key, hoop and net, motion lines or ball texture, arena or clubhouse lighting (daytime, golden hour, or gym floods — never a starfield). If the parent’s vibe mentions a pool or courtside near water, show outdoor/resort court beside pool or palm-lined club lighting — still earthbound, never outer space. Sports-poster typography hierarchy; honoree accent color for title glow.`,
  "girls-beauty-day": `Visual style: spa / glamour girls’ celebration — chic pastels, soft glow, lipstick or sparkle touches as accents (tasteful, age-appropriate). Elegant script-friendly headline area plus clean sans subtitle; no nightclub adult tone.`,
  "pool-party": `Visual style: pool / swim party — shimmering water gradients, sunshine sparkles, floaties or palm motifs at the periphery ONLY if subtle; chlorine-blue and tropical warmth acceptable. Celebrate water and club/pool vibes from the parent’s copy; absolutely avoid astronauts, rockets, or deep-space starfields unless the parent text explicitly asks.`,
  "yacht-party": `Visual style: marina / yacht deck party — navy, white, gold rope-line accents, gentle ocean horizon (daytime premium). Nautical chic, not cartoon pirates; refined headline typography with sun highlights.`,
};

const LEGACY_PARTY_STYLE = {
  pool: PARTY_TYPE_STYLE["pool-party"],
  beach: `Visual style: beach / shore celebration — soft sand tones, ocean breeze palette, tasteful starfish or shell shapes as edge accents. Bright sunny mood; text stays high-contrast and central.`,
  garden: `Visual style: garden party — florals, greenery, dappled sunlight, outdoor freshness. Soft botanical frame; invitation wording remains crystal clear.`,
  indoor: `Visual style: refined indoor venue party — warm ambient lighting, subtle architectural depth, modern celebration polish. Abstract pattern or soft bokeh; no forced outdoor metaphor.`,
  restaurant: `Visual style: dinner / restaurant celebration — elegant table lighting bokeh, tasteful menu-card layout inspiration, rich warm tones. Typography like a premium printed invite.`,
  rooftop: `Visual style: rooftop / skyline party — city golden hour, soft horizon glow, chic urban minimalism. Keep skyline detail secondary to name and date readability.`,
  other: null,
};

/**
 * @param {object} event Firestore event fields used for poster
 * @returns {string} Style paragraph for Stage-A prompt
 */
function getPartyDerivedStyleInstructions(event) {
  const slugRaw = typeof event.partyType === "string" ? event.partyType.trim() : "";
  const slug = slugRaw.toLowerCase();
  const other = typeof event.otherPartyType === "string" ? event.otherPartyType.trim() : "";

  if (slug === "other" && other) {
    return `Visual style: match the parent’s custom party setting: "${other}". Motifs, palette, and atmosphere must align with that description; keep invitation typography dominant and legible; do not add unrelated themes (for example no space or astronauts unless "${other}" clearly implies it).${ANTI_SPACE_DRIFT}`;
  }

  if (slug && PARTY_TYPE_STYLE[slug]) {
    return `${PARTY_TYPE_STYLE[slug]}${ANTI_SPACE_DRIFT}`;
  }
  if (slug && LEGACY_PARTY_STYLE[slug]) {
    const s = LEGACY_PARTY_STYLE[slug];
    if (s) return `${s}${ANTI_SPACE_DRIFT}`;
  }

  const themeLine = event.theme?.trim();
  if (themeLine) {
    return `Visual style: follow the parent’s free-text theme closely: "${themeLine}". Cohesive palette and motifs that match that phrase; hero typography for the honoree and date; decorative elements stay secondary and on-theme only.${ANTI_SPACE_DRIFT}`;
  }

  return `Visual style: modern celebration poster — warm festive lighting, soft premium gradients or tasteful abstract pattern that harmonizes with the honoree’s favorite color accent if provided. No forced metaphor (no space, astronauts, or unrelated fantasy unless the event copy above clearly calls for it). The name, age, and date must be the visual hero with maximum legibility.${ANTI_SPACE_DRIFT}`;
}

module.exports = {
  getPartyDerivedStyleInstructions,
  PARTY_TYPE_STYLE,
};
