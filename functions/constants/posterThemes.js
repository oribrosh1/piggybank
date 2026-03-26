/**
 * Visual style presets for AI invitation posters.
 * IDs must match app types PosterThemeId.
 */
const POSTER_THEMES = {
  space_explorer: {
    id: "space_explorer",
    title: "Space Explorer",
    description: "A cosmic adventure for the stars",
    styleInstructions: `Visual style: cosmic space adventure — deep starfield, nebulae, planets, playful astronaut or space-explorer motifs (family-friendly). Rich purples, blues, and soft glows. The invitation text must remain the hero — crisp, readable typography; decorative space elements frame the text without covering it.`,
  },
  neon_disco: {
    id: "neon_disco",
    title: "Neon Disco",
    description: "Glow in the dark birthday bash",
    styleInstructions: `Visual style: neon disco / nightclub energy — hot pink, electric cyan, and magenta glow, subtle music notes or disco-ball highlights. High contrast so text pops. The event title and details must be razor-sharp and legible; neon accents surround but never obscure the wording.`,
  },
  magical_forest: {
    id: "magical_forest",
    title: "Magical Forest",
    description: "A mystical forest celebration",
    styleInstructions: `Visual style: enchanted forest — soft golden sunlight through trees, whimsical flora, optional gentle magical creatures or a unicorn silhouette in the distance (tasteful, not cluttered). Warm greens, golds, and cream tones. Typography for the event must read clearly as the focal point.`,
  },
};

const DEFAULT_THEME_KEY = "space_explorer";

function getTheme(posterThemeId) {
  if (!posterThemeId || typeof posterThemeId !== "string") {
    return POSTER_THEMES[DEFAULT_THEME_KEY];
  }
  return POSTER_THEMES[posterThemeId] || POSTER_THEMES[DEFAULT_THEME_KEY];
}

function getStyleInstructions(posterThemeId) {
  return getTheme(posterThemeId).styleInstructions;
}

module.exports = {
  POSTER_THEMES,
  getTheme,
  getStyleInstructions,
};
