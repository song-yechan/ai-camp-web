import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * usage/submit 후 배지 조건을 체크하고 자동 지급.
 * 이미 보유한 배지는 upsert로 중복 방지.
 */
export async function checkAndAwardBadges(
  supabase: SupabaseClient,
  userId: string
) {
  // 1. 유저의 전체 usage_logs 집계
  const { data: logs } = await supabase
    .from("usage_logs")
    .select("date, total_cost, sessions_count, commits, pull_requests")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (!logs || logs.length === 0) return;

  const totals = logs.reduce(
    (acc, d) => ({
      cost: acc.cost + Number(d.total_cost ?? 0),
      sessions: acc.sessions + (d.sessions_count ?? 0),
      commits: acc.commits + (d.commits ?? 0),
      prs: acc.prs + (d.pull_requests ?? 0),
    }),
    { cost: 0, sessions: 0, commits: 0, prs: 0 }
  );

  // 2. streak 계산
  const dates = logs.map((d) => d.date).sort();
  const dateSet = new Set(dates);
  let maxStreak = 0;
  let currentStreak = 0;

  if (dates.length > 0) {
    currentStreak = 1;
    maxStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diff > 1) {
        currentStreak = 1;
      }
    }
  }

  // 3. 조건 판별
  const earned: string[] = [];

  // first_step: 첫 세션 (sessions >= 1)
  if (totals.sessions >= 1) earned.push("first_step");

  // ten_dollar: 누적 $10+
  if (totals.cost >= 10) earned.push("ten_dollar");

  // hundred_dollar: 누적 $100+
  if (totals.cost >= 100) earned.push("hundred_dollar");

  // week_warrior: 7일 연속
  if (maxStreak >= 7) earned.push("week_warrior");

  // month_master: 30일 연속
  if (maxStreak >= 30) earned.push("month_master");

  // code_pusher: 첫 커밋
  if (totals.commits >= 1) earned.push("code_pusher");

  // pr_hero: 첫 PR
  if (totals.prs >= 1) earned.push("pr_hero");

  // century: 100세션
  if (totals.sessions >= 100) earned.push("century");

  // skill_maker는 자동 감지 불가 (수동 지급 또는 별도 로직)

  // 4. 배지 upsert (이미 있는 건 무시)
  if (earned.length > 0) {
    const rows = earned.map((type) => ({
      user_id: userId,
      badge_type: type,
    }));

    await supabase
      .from("badges")
      .upsert(rows, { onConflict: "user_id,badge_type", ignoreDuplicates: true });
  }

  // 5. max_streak 업데이트
  await supabase
    .from("users")
    .update({ max_streak: maxStreak })
    .eq("id", userId);
}
