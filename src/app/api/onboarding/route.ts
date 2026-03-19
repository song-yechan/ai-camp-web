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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { role } = body as { role?: string };

  if (role !== "developer" && role !== "non-developer") {
    return NextResponse.json(
      { error: "role must be 'developer' or 'non-developer'" },
      { status: 400 }
    );
  }

  const supabase = await createServiceSupabase();

  const { error } = await supabase
    .from("users")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
