import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceSupabase } from "@/lib/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("ai-camp-session")?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const supabase = await createServiceSupabase();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, avatar_url, role, department, cohort, api_token, setup_completed")
      .eq("id", sessionId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 },
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    console.error("GET /api/me failed:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
