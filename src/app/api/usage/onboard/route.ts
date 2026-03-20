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

  try {
    const supabase = await createServiceSupabase();

    // 2. Look up user by api_token
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
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });

    // 3. Check if usage_logs row already exists for today
    const { data: existing, error: fetchError } = await supabase
      .from("usage_logs")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Database error", details: fetchError.message },
        { status: 500 }
      );
    }

    // 4. Insert empty row only if none exists
    if (!existing) {
      const { error: insertError } = await supabase
        .from("usage_logs")
        .insert({
          user_id: userId,
          date: today,
          input_tokens: 0,
          output_tokens: 0,
          cache_creation_tokens: 0,
          cache_read_tokens: 0,
          total_cost: 0,
          sessions_count: 0,
        });

      if (insertError) {
        return NextResponse.json(
          { error: "Failed to insert usage log", details: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
