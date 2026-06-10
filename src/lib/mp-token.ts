import { createHmac, timingSafeEqual } from "crypto";

const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.AUTH_SECRET ?? "trailpack-dev-secret";
}

export function createMpToken(userId: string): string {
  const payload = JSON.stringify({ sub: userId, exp: Date.now() + EXPIRY_MS });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", secret())
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyMpToken(token: string): string | null {
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = createHmac("sha256", secret())
    .update(payloadB64)
    .digest("base64url");

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const { sub, exp } = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString(),
    ) as { sub?: string; exp?: number };
    if (!sub || !exp || Date.now() > exp) return null;
    return sub;
  } catch {
    return null;
  }
}
