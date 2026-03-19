import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.SLACK_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    return NextResponse.json(
      { error: "Missing Slack OAuth configuration" },
      { status: 500 }
    );
  }

  const redirectUri = `${appUrl}/api/auth/slack/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "openid profile email",
    redirect_uri: redirectUri,
  });

  const slackAuthUrl = `https://slack.com/openid/connect/authorize?${params.toString()}`;

  return NextResponse.redirect(slackAuthUrl);
}
