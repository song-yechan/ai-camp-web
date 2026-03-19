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

export default function BadgeGrid({ allBadges, earnedBadges }: BadgeGridProps) {
  const earnedSet = new Set(earnedBadges.map((b) => b.badge_type));

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-camp-text">
        업적 뱃지
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {allBadges.map((badge) => {
          const earned = earnedSet.has(badge.type);
          return (
            <div
              key={badge.type}
              className={`group relative flex flex-col items-center gap-2 rounded-xl border px-3 py-4 transition-all duration-200 ${
                earned
                  ? "border-camp-accent/20 bg-camp-accent/5"
                  : "border-white/[0.04] bg-white/[0.02] opacity-40 grayscale"
              }`}
            >
              <span className={`text-2xl ${earned ? "" : "grayscale"}`}>
                {badge.icon}
              </span>
              <span
                className={`text-xs font-medium ${
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
        })}
      </div>
    </div>
  );
}
