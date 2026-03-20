import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }
  const token = authHeader.slice(7);

  // 2. Parse request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const inputTokens = Number(body.input_tokens ?? 0);
  const outputTokens = Number(body.output_tokens ?? 0);
  const cacheCreationTokens = Number(body.cache_creation_tokens ?? 0);
  const cacheReadTokens = Number(body.cache_read_tokens ?? 0);
  const totalCost = Number(body.total_cost ?? 0);
  const date = body.date as string | undefined;

  if (!date) {
    return NextResponse.json(
      { error: "Missing required field: date" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createServiceSupabase();

    // 3. Look up user by api_token
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("api_token", token)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // 4. Check for existing usage_log row for this user + date
    const { data: existing, error: fetchError } = await supabase
      .from("usage_logs")
      .select("id, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, total_cost, sessions_count")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Database error", details: fetchError.message },
        { status: 500 }
      );
    }

    if (existing) {
      // 5. UPDATE: add delta values to existing row
      const { error: updateError } = await supabase
        .from("usage_logs")
        .update({
          input_tokens: (existing.input_tokens ?? 0) + inputTokens,
          output_tokens: (existing.output_tokens ?? 0) + outputTokens,
          cache_creation_tokens: (existing.cache_creation_tokens ?? 0) + cacheCreationTokens,
          cache_read_tokens: (existing.cache_read_tokens ?? 0) + cacheReadTokens,
          total_cost: Number(existing.total_cost ?? 0) + totalCost,
          sessions_count: (existing.sessions_count ?? 0) + 1,
          synced_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update usage log", details: updateError.message },
          { status: 500 }
        );
      }
    } else {
      // 6. INSERT: create new row with sessions_count = 1
      const { error: insertError } = await supabase
        .from("usage_logs")
        .insert({
          user_id: userId,
          date,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_creation_tokens: cacheCreationTokens,
          cache_read_tokens: cacheReadTokens,
          total_cost: totalCost,
          sessions_count: 1,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to insert usage log", details: insertError.message },
          { status: 500 }
        );
      }
    }

    // 7. Success
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
