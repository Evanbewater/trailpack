import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { parseRouteDescription } from "@/lib/parse/route-parser";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { saveParsedRoute } from "@/lib/trips/persistence";

type Params = { params: Promise<{ id: string }> };

/** Vercel Hobby 上限 10s；AI 路线解析建议 Pro 或关闭思考模式 */
export const maxDuration = 60;

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
  });
  if (!trip) {
    return corsJson({ error: "未找到" }, { status: 404 });
  }

  const { route, demoMode, reasoning, aiError } = await parseRouteDescription(
    trip.rawDescription,
  );
  await saveParsedRoute(id, userId, route, demoMode, reasoning);

  return corsJson({
    route,
    demoMode,
    reasoning: reasoning ?? null,
    aiError: aiError ?? null,
  });
}
