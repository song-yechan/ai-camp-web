import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

// Vercel Cron에서 호출 (매일 자정)
// vercel.json의 crons 설정 필요

// TODO: Teams API 응답 형태 확인 후 수정
interface TeamsUsageMember {
  user_id: string;
  email: string;
  name: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_tokens?: number;
    cache_read_tokens?: number;
    total_cost?: number;
    sessions_count?: number;
  };
}

interface TeamsUsageResponse {
  members: TeamsUsageMember[];
  period: {
    start: string;
    end: string;
  };
}

async function fetchTeamsUsage(date: string): Promise<TeamsUsageResponse | null> {
  const apiKey = process.env.CLAUDE_TEAMS_API_KEY;
  if (!apiKey) {
    console.error("CLAUDE_TEAMS_API_KEY not set");
    return null;
  }

  // TODO: 실제 Teams API 엔드포인트 확인 후 수정
  // 현재는 placeholder — 키 받은 후 실제 엔드포인트로 교체
  const res = await fetch("https://api.anthropic.com/v1/organizations/usage", {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2024-01-01",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    console.error("Teams API error:", res.status, await res.text());
    return null;
  }

  return res.json();
}

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const teamsData = await fetchTeamsUsage(today);

  if (!teamsData) {
    return NextResponse.json(
      { error: "Failed to fetch Teams usage" },
      { status: 500 }
    );
  }

  const supabase = await createServiceSupabase();

  let synced = 0;
  let skipped = 0;

  for (const member of teamsData.members) {
    // Slack 이메일로 우리 DB 유저 매칭
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("slack_id", member.email) // TODO: 매칭 기준 확인 (email vs slack_id vs name)
      .single();

    if (!user) {
      skipped++;
      continue;
    }

    const { error } = await supabase.from("usage_logs").upsert(
      {
        user_id: user.id,
        date: today,
        input_tokens: member.usage.input_tokens,
        output_tokens: member.usage.output_tokens,
        cache_creation_tokens: member.usage.cache_creation_tokens ?? 0,
        cache_read_tokens: member.usage.cache_read_tokens ?? 0,
        total_cost: member.usage.total_cost ?? 0,
        sessions_count: member.usage.sessions_count ?? 0,
      },
      { onConflict: "user_id,date" }
    );

    if (error) {
      console.error(`Failed to upsert usage for ${member.name}:`, error);
    } else {
      synced++;
    }
  }

  return NextResponse.json({
    date: today,
    synced,
    skipped,
    total: teamsData.members.length,
  });
}
