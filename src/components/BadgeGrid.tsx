interface Badge {
  type: string;
  icon: string;
  label: string;
  description: string;
}

interface EarnedBadge {
  badge_type: string;
  earned_at: string;
}

interface BadgeGridProps {
  allBadges: Badge[];
  earnedBadges: EarnedBadge[];
}

const BADGE_CATEGORIES: { key: string; label: string; types: string[] }[] = [
  { key: "start", label: "시작", types: ["first_step", "hello_world", "setup_done"] },
  { key: "session", label: "세션", types: ["session_10", "session_50", "century", "session_500", "session_1000"] },
  { key: "cost", label: "비용", types: ["one_dollar", "ten_dollar", "fifty_dollar", "hundred_dollar", "five_hundred_dollar", "thousand_dollar"] },
  { key: "streak", label: "스트릭", types: ["streak_3", "week_warrior", "streak_14", "streak_21", "month_master", "streak_60", "streak_90"] },
  { key: "code", label: "코드", types: ["code_pusher", "commit_10", "commit_50", "commit_100", "pr_hero", "pr_10"] },
  { key: "time", label: "시간대", types: ["early_bird", "night_owl", "weekend_warrior"] },
  { key: "special", label: "특별", types: ["skill_maker", "big_session", "mega_session", "multi_model", "speed_demon"] },
  { key: "social", label: "소셜", types: ["top_3", "top_10", "first_compare"] },
  { key: "camp", label: "캠프", types: ["camp_day1", "camp_graduate"] },
];

function BadgeItem({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div
      className={`group relative flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all duration-200 ${
        earned
          ? "border-camp-accent/20 bg-camp-accent/5"
          : "border-white/[0.04] bg-white/[0.02] opacity-40 grayscale"
      }`}
    >
      <span className={`text-xl ${earned ? "" : "grayscale"}`}>
        {badge.icon}
      </span>
      <span
        className={`text-center text-[10px] font-medium leading-tight ${
          earned ? "text-camp-text" : "text-camp-text-muted"
        }`}
      >
        {badge.label}
      </span>

      {/* Tooltip */}
      <div className="pointer-events-none absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/90 px-3 py-1.5 text-[10px] text-camp-text shadow-lg group-hover:block">
        {badge.description}
        {earned && (
          <span className="ml-1.5 text-camp-accent">획득!</span>
        )}
      </div>
    </div>
  );
}

export default function BadgeGrid({ allBadges, earnedBadges }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadges.map((b) => b.badge_type));
  const badgeMap = new Map(allBadges.map((b) => [b.type, b]));

  const earnedCount = allBadges.filter((b) => earnedSet.has(b.type)).length;

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-camp-text">업적 뱃지</h2>
        <span className="text-xs tabular-nums text-camp-text-muted">
          {earnedCount} / {allBadges.length}
        </span>
      </div>

      <div className="flex flex-col gap-5">
        {BADGE_CATEGORIES.map((cat) => {
          const badges = cat.types
            .map((t) => badgeMap.get(t))
            .filter((b): b is Badge => b !== undefined);
          if (badges.length === 0) return null;

          const catEarned = badges.filter((b) => earnedSet.has(b.type)).length;

          return (
            <div key={cat.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-camp-text-secondary">
                  {cat.label}
                </span>
                <span className="text-[10px] tabular-nums text-camp-text-muted">
                  {catEarned}/{badges.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {badges.map((badge) => (
                  <BadgeItem
                    key={badge.type}
                    badge={badge}
                    earned={earnedSet.has(badge.type)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
