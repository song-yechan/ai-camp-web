import { describe, it, expect } from "vitest";
import { LEVELS, calculateXP, getLevel } from "@/lib/level-system";

describe("LEVELS", () => {
  it("has exactly 20 levels", () => {
    expect(LEVELS).toHaveLength(20);
  });

  it("starts at level 1 with 0 XP", () => {
    expect(LEVELS[0].level).toBe(1);
    expect(LEVELS[0].requiredXP).toBe(0);
  });

  it("ends at level 20", () => {
    expect(LEVELS[19].level).toBe(20);
    expect(LEVELS[19].name).toBe("뮤");
  });

  it("has strictly increasing requiredXP", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].requiredXP).toBeGreaterThan(LEVELS[i - 1].requiredXP);
    }
  });

  it("has unique level numbers", () => {
    const numbers = LEVELS.map((l) => l.level);
    expect(new Set(numbers).size).toBe(20);
  });

  it("has icon paths for all levels", () => {
    for (const level of LEVELS) {
      expect(level.icon).toMatch(/^\/levels\/Lv\.\d{2}\.png$/);
    }
  });
});

describe("calculateXP", () => {
  it("applies 1.0x multiplier for non-developer", () => {
    expect(calculateXP(1_000_000, "non-developer")).toBe(1_000_000);
  });

  it("applies 0.7x multiplier for developer", () => {
    expect(calculateXP(1_000_000, "developer")).toBe(700_000);
  });

  it("floors the result", () => {
    expect(calculateXP(1_000_001, "developer")).toBe(700_000);
  });

  it("returns 0 for 0 tokens", () => {
    expect(calculateXP(0, "developer")).toBe(0);
    expect(calculateXP(0, "non-developer")).toBe(0);
  });
});

describe("getLevel", () => {
  it("returns level 1 for 0 XP", () => {
    const result = getLevel(0);
    expect(result.level).toBe(1);
    expect(result.name).toBe("잉어킹");
    expect(result.progress).toBeCloseTo(0);
  });

  it("returns level 20 for max XP", () => {
    const result = getLevel(200_000_000_000);
    expect(result.level).toBe(20);
    expect(result.name).toBe("뮤");
    expect(result.progress).toBe(1);
    expect(result.next).toBeNull();
  });

  it("calculates progress correctly between levels", () => {
    // Lv.2 starts at 5M, Lv.3 at 15M, midpoint = 10M
    const result = getLevel(10_000_000);
    expect(result.level).toBe(2);
    expect(result.progress).toBeCloseTo(0.5, 1);
  });

  it("returns correct next level", () => {
    const result = getLevel(5_000_000);
    expect(result.level).toBe(2);
    expect(result.next?.level).toBe(3);
    expect(result.next?.name).toBe("푸린");
  });

  it("handles XP between levels correctly", () => {
    // Just below Lv.5 threshold (70M)
    const result = getLevel(69_999_999);
    expect(result.level).toBe(4);
    expect(result.name).toBe("메타몽");
  });

  it("handles very large XP beyond max", () => {
    const result = getLevel(999_999_999_999);
    expect(result.level).toBe(20);
    expect(result.progress).toBe(1);
  });
});
