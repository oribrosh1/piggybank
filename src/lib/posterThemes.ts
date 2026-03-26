import type { PosterThemeId } from "@/types/events";

export const POSTER_THEME_OPTIONS: {
  id: PosterThemeId;
  title: string;
  description: string;
  /** Preview gradient colors for card background */
  gradient: [string, string, string];
  emoji: string;
}[] = [
  {
    id: "space_explorer",
    title: "Space Explorer",
    description: "A cosmic adventure for the stars",
    gradient: ["#1e1b4b", "#4c1d95", "#312e81"],
    emoji: "🚀",
  },
  {
    id: "neon_disco",
    title: "Neon Disco",
    description: "Glow in the dark birthday bash",
    gradient: ["#831843", "#be185d", "#4c1d95"],
    emoji: "🪩",
  },
  {
    id: "magical_forest",
    title: "Magical Forest",
    description: "A mystical forest celebration",
    gradient: ["#14532d", "#166534", "#422006"],
    emoji: "🦄",
  },
];
