/**
 * Matches website `SAMPLE_TEMPLATES` in piggybank-website/components/RSVPSection.tsx
 * for consistent “generated” gift card appearance in the app.
 */
export const GIFT_CARD_TEMPLATE_BY_ID: Record<
  string,
  { name: string; emoji: string; colors: [string, string] }
> = {
  "1": { name: "Balloons", emoji: "🎈", colors: ["#F472B6", "#A855F7"] },
  "2": { name: "Confetti", emoji: "🎊", colors: ["#FBBF24", "#F97316"] },
  "3": { name: "Stars", emoji: "⭐", colors: ["#60A5FA", "#6366F1"] },
  "4": { name: "Hearts", emoji: "💖", colors: ["#F87171", "#EC4899"] },
  "5": { name: "Cake", emoji: "🎂", colors: ["#FBBF24", "#EAB308"] },
  "6": { name: "Party", emoji: "🎉", colors: ["#4ADE80", "#14B8A6"] },
  "7": { name: "Rainbow", emoji: "🌈", colors: ["#F87171", "#60A5FA"] },
  "8": { name: "Sparkles", emoji: "✨", colors: ["#C084FC", "#F472B6"] },
  "9": { name: "Crown", emoji: "👑", colors: ["#EAB308", "#D97706"] },
  "10": { name: "Rocket", emoji: "🚀", colors: ["#475569", "#1E293B"] },
  "11": { name: "Unicorn", emoji: "🦄", colors: ["#F9A8D4", "#C084FC"] },
  "12": { name: "Gaming", emoji: "🎮", colors: ["#6366F1", "#7C3AED"] },
};

export function getGiftTemplate(templateId?: string) {
  const id = templateId && GIFT_CARD_TEMPLATE_BY_ID[templateId] ? templateId : "1";
  return GIFT_CARD_TEMPLATE_BY_ID[id] ?? GIFT_CARD_TEMPLATE_BY_ID["1"];
}
