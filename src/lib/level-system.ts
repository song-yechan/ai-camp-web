// 포켓몬 도감 여정 — 잉어킹에서 뮤까지
// 아이콘은 /public/levels/lv{01-20}.png 생성 후 경로로 교체 예정
export const LEVELS = [
  { level: 1, name: "잉어킹", icon: "/levels/lv01.png", requiredXP: 0 },
  { level: 2, name: "이상해씨", icon: "/levels/lv02.png", requiredXP: 100_000 },
  { level: 3, name: "꼬부기", icon: "/levels/lv03.png", requiredXP: 500_000 },
  { level: 4, name: "파이리", icon: "/levels/lv04.png", requiredXP: 1_000_000 },
  { level: 5, name: "피카츄", icon: "/levels/lv05.png", requiredXP: 2_000_000 },
  { level: 6, name: "도감 50종", icon: "/levels/lv06.png", requiredXP: 4_000_000 },
  { level: 7, name: "이브이", icon: "/levels/lv07.png", requiredXP: 7_000_000 },
  { level: 8, name: "푸린", icon: "/levels/lv08.png", requiredXP: 11_000_000 },
  { level: 9, name: "메타몽", icon: "/levels/lv09.png", requiredXP: 16_000_000 },
  { level: 10, name: "잠만보", icon: "/levels/lv10.png", requiredXP: 22_000_000 },
  { level: 11, name: "갸라도스", icon: "/levels/lv11.png", requiredXP: 29_000_000 },
  { level: 12, name: "도감 100종", icon: "/levels/lv12.png", requiredXP: 37_000_000 },
  { level: 13, name: "망나뇽", icon: "/levels/lv13.png", requiredXP: 46_000_000 },
  { level: 14, name: "루카리오", icon: "/levels/lv14.png", requiredXP: 57_000_000 },
  { level: 15, name: "파이어", icon: "/levels/lv15.png", requiredXP: 70_000_000 },
  { level: 16, name: "썬더", icon: "/levels/lv16.png", requiredXP: 85_000_000 },
  { level: 17, name: "프리저", icon: "/levels/lv17.png", requiredXP: 105_000_000 },
  { level: 18, name: "도감 140종+", icon: "/levels/lv18.png", requiredXP: 130_000_000 },
  { level: 19, name: "레쿠자", icon: "/levels/lv19.png", requiredXP: 170_000_000 },
  { level: 20, name: "뮤", icon: "/levels/lv20.png", requiredXP: 220_000_000 },
] as const;

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
