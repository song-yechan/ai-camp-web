import { NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

// Vercel Cron에서 호출 (매일 자정)
// 엔드포인트: https://api.anthropic.com/v1/organizations/usage_report/claude_code
// 문서: https://platform.claude.com/docs/en/build-with-claude/claude-code-analytics-api

interface ClaudeCodeAnalyticsRecord {
  date: string;
  actor:
    | { type: "user_actor"; email_address: string }
    | { type: "api_actor"; api_key_name: string };
  organization_id: string;
  customer_type: string;
  terminal_type: string;
  core_metrics: {
    num_sessions: number;
    lines_of_code: {
      added: number;
      removed: number;
    };
    commits_by_claude_code: number;
    pull_requests_by_claude_code: number;
  };
  tool_actions: {
    edit_tool: { accepted: number; rejected: number };
    multi_edit_tool?: { accepted: number; rejected: number };
    write_tool: { accepted: number; rejected: number };
    notebook_edit_tool: { accepted: number; rejected: number };
  };
  model_breakdown: Array<{
    model: string;
    tokens: {
      input: number;
      output: number;
      cache_read: number;
      cache_creation: number;
    };
    estimated_cost: {
      currency: string;
      amount: number; // cents USD
    };
  }>;
}

interface AnalyticsResponse {
  data: ClaudeCodeAnalyticsRecord[];
  has_more: boolean;
  next_page: string | null;
}

async function fetchAllPages(date: string): Promise<ClaudeCodeAnalyticsRecord[]> {
  const apiKey = process.env.CLAUDE_ADMIN_API_KEY;
  if (!apiKey) {
    throw new Error("CLAUDE_ADMIN_API_KEY not set");
  }

  const allRecords: ClaudeCodeAnalyticsRecord[] = [];
  let page: string | null = null;

  do {
    const params = new URLSearchParams({
      starting_at: date,
      limit: "1000",
    });
    if (page) {
      params.set("page", page);
    }

    const res = await fetch(
      `https://api.anthropic.com/v1/organizations/usage_report/claude_code?${params}`,
      {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "User-Agent": "AB180-AI-Camp/1.0.0",
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Analytics API error ${res.status}: ${body}`);
    }

    const data: AnalyticsResponse = await res.json();
    allRecords.push(...data.data);
    page = data.has_more ? data.next_page : null;
  } while (page);

  return allRecords;
}

export async function GET(request: Request) {
  // Vercel Cron 인증
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 오늘 + 어제 둘 다 sync (어제 데이터가 자정 이후에 완성될 수 있으며, 6시간마다 오늘 데이터 점진 반영)
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const dates = [yesterday, today];

  const supabase = await createServiceSupabase();

  // 이메일로 우리 DB 유저 매칭하기 위해 전체 유저 조회
  const { data: users } = await supabase
    .from("users")
    .select("id, email");

  const emailToUserId = new Map(
    (users ?? []).map((u) => [u.email, u.id])
  );

  let totalSynced = 0;
  let totalSkipped = 0;
  let totalRecords = 0;

  for (const date of dates) {
    let records: ClaudeCodeAnalyticsRecord[];
    try {
      records = await fetchAllPages(date);
    } catch (error) {
      console.error(`Failed to fetch analytics for ${date}:`, error);
      continue;
    }

    totalRecords += records.length;

    for (const record of records) {
      // user_actor만 처리 (api_actor는 스킵)
      if (record.actor.type !== "user_actor") {
        totalSkipped++;
        continue;
      }

      const email = record.actor.email_address;
      const userId = emailToUserId.get(email);

      if (!userId) {
        totalSkipped++;
        continue;
      }

      // 모델별 토큰/비용 합산
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheReadTokens = 0;
      let cacheCreationTokens = 0;
      let totalCostCents = 0;

      for (const model of record.model_breakdown) {
        inputTokens += model.tokens.input;
        outputTokens += model.tokens.output;
        cacheReadTokens += model.tokens.cache_read;
        cacheCreationTokens += model.tokens.cache_creation;
        totalCostCents += model.estimated_cost.amount;
      }

      const { error } = await supabase.from("usage_logs").upsert(
        {
          user_id: userId,
          date: record.date,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_creation_tokens: cacheCreationTokens,
          cache_read_tokens: cacheReadTokens,
          total_cost: totalCostCents / 100, // cents → dollars
          sessions_count: record.core_metrics.num_sessions,
          lines_added: record.core_metrics.lines_of_code.added,
          lines_removed: record.core_metrics.lines_of_code.removed,
          commits: record.core_metrics.commits_by_claude_code,
          pull_requests: record.core_metrics.pull_requests_by_claude_code,
        },
        { onConflict: "user_id,date" }
      );

      if (error) {
        console.error(`Failed to upsert for ${email} on ${date}:`, error);
      } else {
        totalSynced++;
      }
    }
  }

  return NextResponse.json({
    dates,
    synced: totalSynced,
    skipped: totalSkipped,
    total: totalRecords,
  });
}
