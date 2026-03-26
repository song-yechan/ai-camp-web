export interface UserData {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  cohort?: number | null;
  cli_type?: string | null;
  total_cost: number;
  sessions_count: number;
  commits?: number;
  current_streak: number;
  longest_streak: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
  department?: string;
  total_cost: number;
  sessions_count: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens?: number;
  cache_creation_tokens?: number;
  lines_added?: number;
  lines_removed?: number;
  commits?: number;
  pull_requests?: number;
  current_streak?: number;
  max_streak?: number;
  cohort?: number | null;
  cli_type?: string | null;
  all_time_tokens?: number;
  badges?: { badge_type: string; earned_at: string }[];
}

export interface FallbackDailyUsage {
  date: string;
  cost: number;
  sessions: number;
}

export interface FallbackStreakEntry {
  date: string;
  cost: number;
  sessions: number;
}

export interface FallbackEarnedBadge {
  badge_type: string;
  earned_at: string;
}
