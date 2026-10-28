import type { Level } from "@/models/user";

export type BadgeStats = {
  delivered: number;
  totalSpent: number;
  level: Level;
  wardrobe: number;
  brands: number;
  votes: number;
  inCrew: boolean;
  onWall: boolean;
};

type Badge = { key: string; icon: string; ar: string; en: string; hintAr: string; hintEn: string; earned: (s: BadgeStats) => boolean };

const BADGES: Badge[] = [
  { key: "first-drop", icon: "I", ar: "أول دروب", en: "First drop", hintAr: "استلم أول أوردر", hintEn: "Get your first order delivered", earned: (s) => s.delivered >= 1 },
  { key: "regular", icon: "V", ar: "زبون ثابت", en: "Regular", hintAr: "٥ أوردرات متسلّمة", hintEn: "5 delivered orders", earned: (s) => s.delivered >= 5 },
  { key: "og", icon: "OG", ar: "OG", en: "OG", hintAr: "وصّل لمستوى OG", hintEn: "Reach OG level", earned: (s) => s.level !== "rookie" },
  { key: "legend", icon: "★", ar: "أسطورة", en: "Legend", hintAr: "وصّل لمستوى Legend", hintEn: "Reach Legend level", earned: (s) => s.level === "legend" },
  { key: "collector", icon: "10", ar: "جامع قطع", en: "Collector", hintAr: "١٠ قطع في الدولاب", hintEn: "10 pieces in the wardrobe", earned: (s) => s.wardrobe >= 10 },
  { key: "range", icon: "5B", ar: "ذوق واسع", en: "Range", hintAr: "٥ براندات مختلفة", hintEn: "5 different brands", earned: (s) => s.brands >= 5 },
  { key: "judge", icon: "⚖", ar: "حكم الفيت", en: "Fit judge", hintAr: "صوّت في ٢٠ دويل", hintEn: "Vote in 20 duels", earned: (s) => s.votes >= 20 },
  { key: "crew", icon: "+", ar: "ابن كرو", en: "Crew member", hintAr: "انضم لكرو", hintEn: "Join a crew", earned: (s) => s.inCrew },
  { key: "wall", icon: "▲", ar: "فنان الحيطة", en: "Wall artist", hintAr: "سيب تاج على حيطة الجرافيتي", hintEn: "Leave a tag on the wall", earned: (s) => s.onWall },
];

export type BadgeView = { key: string; icon: string; label: string; hint: string; earned: boolean };

export function badgesFor(stats: BadgeStats, lang: "ar" | "en"): BadgeView[] {
  return BADGES.map((b) => ({ key: b.key, icon: b.icon, label: lang === "ar" ? b.ar : b.en, hint: lang === "ar" ? b.hintAr : b.hintEn, earned: b.earned(stats) }));
}
