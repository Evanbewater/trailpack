import { auth } from "@/lib/auth";
import { verifyMpToken } from "@/lib/mp-token";

export async function getUserIdFromRequest(
  req: Request,
): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const userId = verifyMpToken(token);
    if (userId) return userId;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}
