import crypto from "crypto";

const SECRET =
  process.env.SESSION_SECRET || "dev-secret-change-in-production";

export function signSession(userId: string): string {
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(userId)
    .digest("hex");
  return `${userId}.${sig}`;
}

export function verifySession(cookie: string): string | null {
  const dotIdx = cookie.indexOf(".");
  if (dotIdx === -1) return null;

  const userId = cookie.substring(0, dotIdx);
  const sig = cookie.substring(dotIdx + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(userId)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ? userId
      : null;
  } catch {
    return null;
  }
}
