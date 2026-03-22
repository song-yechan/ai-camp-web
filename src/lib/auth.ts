import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("ai-camp-session");
  if (!session?.value) return null;
  return verifySession(session.value);
}
