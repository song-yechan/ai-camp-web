import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

function getAdminUserIds(): string[] {
  const raw = process.env.ADMIN_USER_IDS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("ai-camp-session");
  return session?.value ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;

  // 인증 확인
  const sessionUserId = await getSessionUserId();
  if (!sessionUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 관리자 권한 확인
  const adminIds = getAdminUserIds();
  if (!adminIds.includes(sessionUserId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 요청 바디 파싱
  const body = await request.json();
  const { role, cohort } = body as { role?: string; cohort?: number | null };

  // 유효성 검사
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (role !== undefined) {
    if (role !== "developer" && role !== "non-developer") {
      return NextResponse.json(
        { error: "role must be 'developer' or 'non-developer'" },
        { status: 400 }
      );
    }
    updateData.role = role;
  }

  if (cohort !== undefined) {
    if (cohort !== null && cohort !== 1 && cohort !== 2) {
      return NextResponse.json(
        { error: "cohort must be 1, 2, or null" },
        { status: 400 }
      );
    }
    updateData.cohort = cohort;
  }

  if (!("role" in updateData) && !("cohort" in updateData)) {
    return NextResponse.json(
      { error: "At least one of 'role' or 'cohort' is required" },
      { status: 400 }
    );
  }

  const supabase = await createServiceSupabase();

  const { data: user, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", targetUserId)
    .select("id, name, role, cohort")
    .single();

  if (error || !user) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }

  return NextResponse.json({ user });
}
