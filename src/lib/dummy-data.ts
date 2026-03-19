export const BADGE_TYPES = {
  FIRST_STEP: { id: 'first_step', name: 'First Step', icon: '\u{1F463}', description: '첫 세션 완료' },
  SKILL_MAKER: { id: 'skill_maker', name: 'Skill Maker', icon: '\u{1F6E0}\u{FE0F}', description: '첫 스킬 제작' },
  TEN_DOLLAR: { id: 'ten_dollar', name: '$10 Club', icon: '\u{1F4B0}', description: '누적 $10 돌파' },
  HUNDRED_DOLLAR: { id: 'hundred_dollar', name: '$100 Club', icon: '\u{1F48E}', description: '누적 $100 돌파' },
  WEEK_WARRIOR: { id: 'week_warrior', name: 'Week Warrior', icon: '\u{2694}\u{FE0F}', description: '7일 연속 스트릭' },
  MONTH_MASTER: { id: 'month_master', name: 'Month Master', icon: '\u{1F451}', description: '30일 연속 스트릭' },
  CODE_PUSHER: { id: 'code_pusher', name: 'Code Pusher', icon: '\u{1F4E6}', description: '첫 커밋' },
  PR_HERO: { id: 'pr_hero', name: 'PR Hero', icon: '\u{1F9B8}', description: '첫 PR' },
  CENTURY: { id: 'century', name: 'Century', icon: '\u{1F4AF}', description: '100세션 달성' },
} as const;

export type BadgeTypeId = (typeof BADGE_TYPES)[keyof typeof BADGE_TYPES]['id'];

export interface Badge {
  badge_type: BadgeTypeId;
  earned_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  total_cost: number;
  sessions_count: number;
  input_tokens: number;
  output_tokens: number;
  lines_added: number;
  lines_removed: number;
  commits: number;
  pull_requests: number;
  current_streak: number;
  max_streak: number;
  cohort: number | null;
  badges: Badge[];
}

export interface DailyUsage {
  user_id: string;
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  sessions_count: number;
}

export const DUMMY_LEADERBOARD: LeaderboardEntry[] = [
  {
    user_id: "1",
    name: "\uC1A1\uC608\uCC2C",
    avatar_url: null,
    role: "developer",
    total_cost: 1554.48,
    sessions_count: 247,
    input_tokens: 45000000,
    output_tokens: 12000000,
    lines_added: 15420,
    lines_removed: 3200,
    commits: 89,
    pull_requests: 12,
    current_streak: 23,
    max_streak: 23,
    cohort: 1,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-01-15T09:00:00Z' },
      { badge_type: 'skill_maker', earned_at: '2026-01-18T14:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-01-20T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-02-10T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-01-22T09:00:00Z' },
      { badge_type: 'month_master', earned_at: '2026-02-14T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-01-16T15:00:00Z' },
      { badge_type: 'pr_hero', earned_at: '2026-01-17T16:00:00Z' },
      { badge_type: 'century', earned_at: '2026-02-20T10:00:00Z' },
    ],
  },
  {
    user_id: "2",
    name: "\uC624\uB2F4\uC778",
    avatar_url: null,
    role: "non-developer",
    total_cost: 295.2,
    sessions_count: 142,
    input_tokens: 8500000,
    output_tokens: 2100000,
    lines_added: 3200,
    lines_removed: 890,
    commits: 23,
    pull_requests: 5,
    current_streak: 12,
    max_streak: 15,
    cohort: 1,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-01-15T09:30:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-02-01T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-03-05T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-02-05T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-01-20T15:00:00Z' },
      { badge_type: 'century', earned_at: '2026-03-10T10:00:00Z' },
    ],
  },
  {
    user_id: "3",
    name: "\uC11C\uD55C\uC194",
    avatar_url: null,
    role: "non-developer",
    total_cost: 175.8,
    sessions_count: 98,
    input_tokens: 5200000,
    output_tokens: 1400000,
    lines_added: 1800,
    lines_removed: 420,
    commits: 15,
    pull_requests: 3,
    current_streak: 5,
    max_streak: 10,
    cohort: 2,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-02-15T09:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-03-01T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-03-12T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-03-05T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-02-20T15:00:00Z' },
    ],
  },
  {
    user_id: "4",
    name: "\uC624\uC601\uC8FC",
    avatar_url: null,
    role: "non-developer",
    total_cost: 156.4,
    sessions_count: 85,
    input_tokens: 4600000,
    output_tokens: 1200000,
    lines_added: 2100,
    lines_removed: 560,
    commits: 18,
    pull_requests: 4,
    current_streak: 0,
    max_streak: 8,
    cohort: 2,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-02-15T09:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-03-02T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-03-14T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-03-08T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-02-22T15:00:00Z' },
      { badge_type: 'pr_hero', earned_at: '2026-02-25T16:00:00Z' },
    ],
  },
  {
    user_id: "5",
    name: "David Kim",
    avatar_url: null,
    role: "developer",
    total_cost: 142.9,
    sessions_count: 76,
    input_tokens: 4200000,
    output_tokens: 1100000,
    lines_added: 4500,
    lines_removed: 1200,
    commits: 34,
    pull_requests: 8,
    current_streak: 7,
    max_streak: 14,
    cohort: 1,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-01-16T09:00:00Z' },
      { badge_type: 'skill_maker', earned_at: '2026-01-19T14:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-02-10T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-03-10T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-02-15T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-01-17T15:00:00Z' },
      { badge_type: 'pr_hero', earned_at: '2026-01-18T16:00:00Z' },
    ],
  },
  {
    user_id: "6",
    name: "\uC815\uC6B4\uCC44",
    avatar_url: null,
    role: "non-developer",
    total_cost: 128.5,
    sessions_count: 68,
    input_tokens: 3800000,
    output_tokens: 950000,
    lines_added: 1200,
    lines_removed: 310,
    commits: 12,
    pull_requests: 2,
    current_streak: 3,
    max_streak: 7,
    cohort: 2,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-02-16T09:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-03-05T10:00:00Z' },
      { badge_type: 'hundred_dollar', earned_at: '2026-03-15T11:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-03-10T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-02-25T15:00:00Z' },
    ],
  },
  {
    user_id: "7",
    name: "\uACE0\uC9C4\uD615",
    avatar_url: null,
    role: "non-developer",
    total_cost: 98.3,
    sessions_count: 52,
    input_tokens: 2900000,
    output_tokens: 720000,
    lines_added: 800,
    lines_removed: 200,
    commits: 8,
    pull_requests: 1,
    current_streak: 1,
    max_streak: 5,
    cohort: null,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-02-20T09:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-03-10T10:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-03-01T15:00:00Z' },
    ],
  },
  {
    user_id: "8",
    name: "\uCD5C\uD604\uC885",
    avatar_url: null,
    role: "developer",
    total_cost: 87.6,
    sessions_count: 45,
    input_tokens: 2500000,
    output_tokens: 680000,
    lines_added: 3100,
    lines_removed: 850,
    commits: 22,
    pull_requests: 6,
    current_streak: 4,
    max_streak: 11,
    cohort: 1,
    badges: [
      { badge_type: 'first_step', earned_at: '2026-01-16T09:00:00Z' },
      { badge_type: 'ten_dollar', earned_at: '2026-02-15T10:00:00Z' },
      { badge_type: 'week_warrior', earned_at: '2026-02-20T09:00:00Z' },
      { badge_type: 'code_pusher', earned_at: '2026-01-18T15:00:00Z' },
      { badge_type: 'pr_hero', earned_at: '2026-01-20T16:00:00Z' },
    ],
  },
];

export const DUMMY_STATS = {
  totalParticipants: 8,
  totalCost: 2639,
  totalSessions: 813,
};

// 일별 사용 데이터 생성 (최근 30일)
function generateDailyUsage(
  userId: string,
  avgCost: number,
  avgSessions: number,
  gapDays: number[],
): DailyUsage[] {
  const result: DailyUsage[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 주말 자동 면제 (토/일)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // gapDays: 스트릭 끊김 표현용 (0-indexed, 0=29일전, 29=오늘)
    if (gapDays.includes(29 - i)) continue;

    const costVariance = 0.5 + Math.random();
    const dayCost = +(avgCost * costVariance).toFixed(4);
    const daySessions = Math.max(1, Math.round(avgSessions * costVariance));
    const inputTokens = Math.round(dayCost * 30000);
    const outputTokens = Math.round(dayCost * 8000);

    result.push({
      user_id: userId,
      date: date.toISOString().split('T')[0],
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_cost: dayCost,
      sessions_count: daySessions,
    });
  }

  return result;
}

export const DUMMY_DAILY_USAGE: DailyUsage[] = [
  // 송예찬 - 23일 연속 (갭 없음)
  ...generateDailyUsage('1', 52, 8, []),
  // 오담인 - 12일 연속, 15일 전에 끊김
  ...generateDailyUsage('2', 10, 5, [14, 15]),
  // 서한솔 - 5일 연속, 중간에 몇 번 끊김
  ...generateDailyUsage('3', 6, 3, [5, 6, 12, 13]),
  // 오영주 - 현재 0 (최근 사용 안 함)
  ...generateDailyUsage('4', 5, 3, [0, 1, 2, 3]),
  // David Kim - 7일 연속
  ...generateDailyUsage('5', 5, 3, [8, 9]),
  // 정운채 - 3일 연속
  ...generateDailyUsage('6', 4, 2, [3, 4, 5, 10, 11]),
  // 고진형 - 1일 (어제만)
  ...generateDailyUsage('7', 3, 2, [0, 2, 3, 4, 5, 8, 9, 12, 13, 16, 17]),
  // 최현종 - 4일 연속
  ...generateDailyUsage('8', 3, 2, [4, 5, 10, 11, 15]),
];
