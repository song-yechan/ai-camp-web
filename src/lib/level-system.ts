// 포켓몬 도감 여정 — 잉어킹에서 뮤까지 (40레벨)
export const LEVELS = [
  { level: 1, name: "잉어킹", icon: "/levels/Lv.01.png", requiredXP: 0 },
  { level: 2, name: "메타몽", icon: "/levels/Lv.02.png", requiredXP: 3_000_000 },
  { level: 3, name: "이브이", icon: "/levels/Lv.03.png", requiredXP: 8_000_000 },
  { level: 4, name: "푸린", icon: "/levels/Lv.04.png", requiredXP: 15_000_000 },
  { level: 5, name: "토게피", icon: "/levels/Lv.05.png", requiredXP: 25_000_000 },
  { level: 6, name: "피카츄", icon: "/levels/Lv.06.png", requiredXP: 40_000_000 },
  { level: 7, name: "라이츄", icon: "/levels/Lv.07.png", requiredXP: 60_000_000 },
  { level: 8, name: "도감 50종", icon: "/levels/Lv.08.png", requiredXP: 90_000_000 },
  { level: 9, name: "이상해씨", icon: "/levels/Lv.09.png", requiredXP: 130_000_000 },
  { level: 10, name: "이상해풀", icon: "/levels/Lv.10.png", requiredXP: 180_000_000 },
  { level: 11, name: "이상해꽃", icon: "/levels/Lv.11.png", requiredXP: 250_000_000 },
  { level: 12, name: "꼬부기", icon: "/levels/Lv.12.png", requiredXP: 350_000_000 },
  { level: 13, name: "어니부기", icon: "/levels/Lv.13.png", requiredXP: 480_000_000 },
  { level: 14, name: "거북왕", icon: "/levels/Lv.14.png", requiredXP: 650_000_000 },
  { level: 15, name: "도감 100종", icon: "/levels/Lv.15.png", requiredXP: 850_000_000 },
  { level: 16, name: "파이리", icon: "/levels/Lv.16.png", requiredXP: 1_100_000_000 },
  { level: 17, name: "리자드", icon: "/levels/Lv.17.png", requiredXP: 1_400_000_000 },
  { level: 18, name: "리자몽", icon: "/levels/Lv.18.png", requiredXP: 1_800_000_000 },
  { level: 19, name: "가디", icon: "/levels/Lv.19.png", requiredXP: 2_300_000_000 },
  { level: 20, name: "윈디", icon: "/levels/Lv.20.png", requiredXP: 3_000_000_000 },
  { level: 21, name: "잠만보", icon: "/levels/Lv.21.png", requiredXP: 4_000_000_000 },
  { level: 22, name: "도감 200종", icon: "/levels/Lv.22.png", requiredXP: 5_500_000_000 },
  { level: 23, name: "미뇽", icon: "/levels/Lv.23.png", requiredXP: 7_500_000_000 },
  { level: 24, name: "신뇽", icon: "/levels/Lv.24.png", requiredXP: 10_000_000_000 },
  { level: 25, name: "망나뇽", icon: "/levels/Lv.25.png", requiredXP: 13_000_000_000 },
  { level: 26, name: "갸라도스", icon: "/levels/Lv.26.png", requiredXP: 17_000_000_000 },
  { level: 27, name: "루카리오", icon: "/levels/Lv.27.png", requiredXP: 22_000_000_000 },
  { level: 28, name: "한카리아스", icon: "/levels/Lv.28.png", requiredXP: 28_000_000_000 },
  { level: 29, name: "메타그로스", icon: "/levels/Lv.29.png", requiredXP: 36_000_000_000 },
  { level: 30, name: "에이스번", icon: "/levels/Lv.30.png", requiredXP: 46_000_000_000 },
  { level: 31, name: "엠페르트", icon: "/levels/Lv.31.png", requiredXP: 58_000_000_000 },
  { level: 32, name: "도감 300종", icon: "/levels/Lv.32.png", requiredXP: 72_000_000_000 },
  { level: 33, name: "파이어", icon: "/levels/Lv.33.png", requiredXP: 90_000_000_000 },
  { level: 34, name: "썬더", icon: "/levels/Lv.34.png", requiredXP: 110_000_000_000 },
  { level: 35, name: "프리저", icon: "/levels/Lv.35.png", requiredXP: 135_000_000_000 },
  { level: 36, name: "레쿠자", icon: "/levels/Lv.36.png", requiredXP: 165_000_000_000 },
  { level: 37, name: "아르세우스", icon: "/levels/Lv.37.png", requiredXP: 200_000_000_000 },
  { level: 38, name: "뮤츠", icon: "/levels/Lv.38.png", requiredXP: 250_000_000_000 },
  { level: 39, name: "도감 마스터", icon: "/levels/Lv.39.png", requiredXP: 320_000_000_000 },
  { level: 40, name: "뮤", icon: "/levels/Lv.40.png", requiredXP: 400_000_000_000 },
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
