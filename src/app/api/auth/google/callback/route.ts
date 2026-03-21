import crypto from "crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";

function generateApiToken(): string {
  return `aicamp_${crypto.randomBytes(32).toString("hex")}`;
}

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  picture: string;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export async function GET(request: NextRequest) {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=${error || "no_code"}`,
    );
  }

  // Exchange code for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: requireEnv("GOOGLE_CLIENT_ID"),
      client_secret: requireEnv("GOOGLE_CLIENT_SECRET"),
      code,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  const tokenData: GoogleTokenResponse = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=token_exchange_failed`,
    );
  }

  // Fetch user info
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    },
  );

  const userInfo: GoogleUserInfo = await userInfoResponse.json();

  if (!userInfo.email) {
    return NextResponse.redirect(`${appUrl}/auth?error=userinfo_failed`);
  }

  // Verify email domain
  if (!userInfo.email.endsWith("@ab180.co")) {
    return NextResponse.redirect(
      `${appUrl}/auth?error=unauthorized_domain`,
    );
  }

  // Check existing user
  const supabase = await createServiceSupabase();

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, role, api_token")
    .eq("google_id", userInfo.id)
    .single();

  const isNewUser = !existingUser;

  // Upsert user in Supabase
  const upsertPayload: Record<string, string> = {
    google_id: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatar_url: userInfo.picture,
    updated_at: new Date().toISOString(),
  };

  // New users get an api_token on first signup
  if (isNewUser) {
    upsertPayload.api_token = generateApiToken();
  }

  const { data: user, error: dbError } = await supabase
    .from("users")
    .upsert(upsertPayload, { onConflict: "google_id" })
    .select("id")
    .single();

  if (dbError || !user) {
    return NextResponse.redirect(`${appUrl}/auth?error=db_error`);
  }

  // Existing users missing api_token get one generated
  if (!isNewUser && existingUser?.api_token == null) {
    await supabase
      .from("users")
      .update({ api_token: generateApiToken(), setup_completed: false })
      .eq("id", user.id);
  }

  // Build redirect response with session cookie attached
  const redirectUrl = isNewUser ? `${appUrl}/onboarding` : appUrl;
  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("ai-camp-session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
