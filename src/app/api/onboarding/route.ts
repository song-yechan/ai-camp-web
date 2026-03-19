import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getCategoryById } from "@/lib/job-categories";

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
  const { department } = body as { department?: string };

  if (!department) {
    return NextResponse.json(
      { error: "department is required" },
      { status: 400 },
    );
  }

  const category = getCategoryById(department);

  if (!category) {
    return NextResponse.json(
      { error: "Invalid department" },
      { status: 400 },
    );
  }

  const role = category.group;

  const supabase = await createServiceSupabase();

  const { error } = await supabase
    .from("users")
    .update({
      role,
      department,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
