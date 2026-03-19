import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

interface SlackTokenResponse {
  ok: boolean;
  access_token: string;
  id_token: string;
  error?: string;
}

interface SlackUserInfo {
  ok: boolean;
  sub: string;
  name: string;
  picture: string;
  email: string;
  "https://slack.com/team_id": string;
  error?: string;
}

export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=${error || "no_code"}`
    );
  }

  // Exchange code for access token
  const tokenResponse = await fetch(
    "https://slack.com/api/openid.connect.token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.SLACK_CLIENT_ID!,
        client_secret: process.env.SLACK_CLIENT_SECRET!,
        code,
        redirect_uri: `${appUrl}/api/auth/slack/callback`,
      }),
    }
  );

  const tokenData: SlackTokenResponse = await tokenResponse.json();

  if (!tokenData.ok || !tokenData.access_token) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=token_exchange_failed`
    );
  }

  // Fetch user info
  const userInfoResponse = await fetch(
    "https://slack.com/api/openid.connect.userInfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    }
  );

  const userInfo: SlackUserInfo = await userInfoResponse.json();

  if (!userInfo.ok) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=userinfo_failed`
    );
  }

  // Verify team_id
  const teamId = userInfo["https://slack.com/team_id"];
  if (teamId !== process.env.SLACK_TEAM_ID) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=unauthorized_team`
    );
  }

  // 기존 사용자 확인
  const supabase = await createServiceSupabase();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, role")
    .eq("slack_id", userInfo.sub)
    .single();

  const isNewUser = !existingUser;

  // Upsert user in Supabase
  const { data: user, error: dbError } = await supabase
    .from("users")
    .upsert(
      {
        slack_id: userInfo.sub,
        slack_team_id: teamId,
        name: userInfo.name,
        avatar_url: userInfo.picture,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slack_id" }
    )
    .select("id")
    .single();

  if (dbError || !user) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=db_error`
    );
  }

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("ai-camp-session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // 신규 사용자 → 온보딩, 기존 사용자 → 홈
  if (isNewUser) {
    return NextResponse.redirect(`${appUrl}/onboarding`);
  }

  return NextResponse.redirect(appUrl);
}
