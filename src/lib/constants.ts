export const BADGE_TYPES = [
  { type: "first_step", icon: "\uD83D\uDC63", label: "First Step", description: "\uCCAB \uC138\uC158 \uC644\uB8CC" },
  { type: "skill_maker", icon: "\uD83D\uDEE0\uFE0F", label: "Skill Maker", description: "\uCCAB \uC2A4\uD0AC \uC81C\uC791" },
  { type: "ten_dollar", icon: "\uD83D\uDCB0", label: "$10 Club", description: "\uB204\uC801 $10 \uB3CC\uD30C" },
  { type: "hundred_dollar", icon: "\uD83D\uDC8E", label: "$100 Club", description: "\uB204\uC801 $100 \uB3CC\uD30C" },
  { type: "week_warrior", icon: "\u2694\uFE0F", label: "Week Warrior", description: "7\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "month_master", icon: "\uD83D\uDC51", label: "Month Master", description: "30\uC77C \uC5F0\uC18D \uC2A4\uD2B8\uB9AD" },
  { type: "code_pusher", icon: "\uD83D\uDCE6", label: "Code Pusher", description: "\uCCAB \uCEE4\uBC0B" },
  { type: "pr_hero", icon: "\uD83E\uDDB8", label: "PR Hero", description: "\uCCAB PR" },
  { type: "century", icon: "\uD83D\uDCAF", label: "Century", description: "100\uC138\uC158 \uB2EC\uC131" },
] as const;

export type BadgeType = (typeof BADGE_TYPES)[number];

export const COHORTS: Record<string, number> = {
  "1": 1, "2": 1, "3": 1, "4": 2, "5": 2, "6": 1, "7": 2, "8": 2,
};
