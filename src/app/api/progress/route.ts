import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("ai-camp-session");
  return session?.value ?? null;
}

export async function POST(request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { day, block } = body;

  if (day == null || !block) {
    return NextResponse.json(
      { error: "day and block are required" },
      { status: 400 }
    );
  }

  if (typeof day !== "number" || day < 1 || day > 4) {
    return NextResponse.json(
      { error: "day must be between 1 and 4" },
      { status: 400 }
    );
  }

  const supabase = await createServiceSupabase();

  const { error: upsertError } = await supabase
    .from("progress")
    .upsert(
      {
        user_id: userId,
        day,
        block,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,day,block" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: "Failed to save progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export async function GET(_request: NextRequest) {
  const userId = await getSessionUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createServiceSupabase();

  const { data: progress, error } = await supabase
    .from("progress")
    .select("day, block, completed_at")
    .eq("user_id", userId)
    .order("day", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }

  return NextResponse.json({ progress: progress ?? [] });
}
