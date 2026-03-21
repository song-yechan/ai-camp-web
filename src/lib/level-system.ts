// 포켓몬 도감 여정 — 잉어킹에서 뮤까지
// 아이콘은 /public/levels/lv{01-20}.png 생성 후 경로로 교체 예정
export const LEVELS = [
  { level: 1, name: "잉어킹", icon: "/levels/Lv.01.png", requiredXP: 0 },
  { level: 2, name: "이브이", icon: "/levels/Lv.02.png", requiredXP: 500_000 },
  { level: 3, name: "푸린", icon: "/levels/Lv.03.png", requiredXP: 1_500_000 },
  { level: 4, name: "메타몽", icon: "/levels/Lv.04.png", requiredXP: 3_000_000 },
  { level: 5, name: "도감 50종", icon: "/levels/Lv.05.png", requiredXP: 6_000_000 },
  { level: 6, name: "피카츄", icon: "/levels/Lv.06.png", requiredXP: 12_000_000 },
  { level: 7, name: "이상해씨", icon: "/levels/Lv.07.png", requiredXP: 25_000_000 },
  { level: 8, name: "꼬부기", icon: "/levels/Lv.08.png", requiredXP: 45_000_000 },
  { level: 9, name: "파이리", icon: "/levels/Lv.09.png", requiredXP: 75_000_000 },
  { level: 10, name: "잠만보", icon: "/levels/Lv.10.png", requiredXP: 120_000_000 },
  { level: 11, name: "갸라도스", icon: "/levels/Lv.11.png", requiredXP: 200_000_000 },
  { level: 12, name: "도감 100종", icon: "/levels/Lv.12.png", requiredXP: 320_000_000 },
  { level: 13, name: "망나뇽", icon: "/levels/Lv.13.png", requiredXP: 500_000_000 },
  { level: 14, name: "루카리오", icon: "/levels/Lv.14.png", requiredXP: 750_000_000 },
  { level: 15, name: "파이어", icon: "/levels/Lv.15.png", requiredXP: 1_000_000_000 },
  { level: 16, name: "썬더", icon: "/levels/Lv.16.png", requiredXP: 1_500_000_000 },
  { level: 17, name: "프리저", icon: "/levels/Lv.17.png", requiredXP: 2_000_000_000 },
  { level: 18, name: "도감 140종", icon: "/levels/Lv.18.png", requiredXP: 3_000_000_000 },
  { level: 19, name: "레쿠자", icon: "/levels/Lv.19.png", requiredXP: 5_000_000_000 },
  { level: 20, name: "뮤", icon: "/levels/Lv.20.png", requiredXP: 10_000_000_000 },
] as const;

export function calculateTotalTokens(entry: {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
}): number {
  return (
    (entry.input_tokens ?? 0) +
    (entry.output_tokens ?? 0) +
    (entry.cache_read_tokens ?? 0) +
    (entry.cache_creation_tokens ?? 0)
  );
}

export function calculateXP(totalTokens: number, role: string): number {
  const multiplier = role === "developer" ? 0.7 : 1.0;
  return Math.floor(totalTokens * multiplier);
}

export type LevelEntry = (typeof LEVELS)[number];

export function getLevel(xp: number) {
  let current: LevelEntry = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.requiredXP) current = level;
    else break;
  }
  const currentIndex = LEVELS.indexOf(current);
  const next: LevelEntry | null =
    currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
  const progress = next
    ? (xp - current.requiredXP) / (next.requiredXP - current.requiredXP)
    : 1;
  return { ...current, xp, progress, next };
}
