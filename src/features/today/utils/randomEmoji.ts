const FALLBACK = [
  "✅",
  "💧",
  "🏃",
  "📚",
  "🧘",
  "🍎",
  "🛏️",
  "📝",
  "🎯",
  "💪",
] as const;

export function getRandomHabitEmoji(): string {
  const idx = Math.floor(Math.random() * FALLBACK.length);
  return FALLBACK[idx] ?? "✅";
}
