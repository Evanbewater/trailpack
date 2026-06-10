import { corsJson, corsOptions } from "@/lib/cors";
import { generateChecklist } from "@/lib/gear/generate-checklist";
import { prisma } from "@/lib/db";
import { parsedRouteSchema } from "@/lib/schemas/route";
import { parseRouteDescription } from "@/lib/parse/route-parser";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { saveChecklist, saveParsedRoute } from "@/lib/trips/persistence";
import { fetchWeather } from "@/lib/weather/open-meteo";

type Params = { params: Promise<{ id: string }> };

/** Vercel Hobby 上限 10s；AI 清单生成建议 Pro 或关闭思考模式 */
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

  let route;
  if (trip.parsedRoute) {
    route = parsedRouteSchema.parse(JSON.parse(trip.parsedRoute));
  } else {
    const parsed = await parseRouteDescription(trip.rawDescription);
    route = parsed.route;
    await saveParsedRoute(
      id,
      userId,
      parsed.route,
      parsed.demoMode,
      parsed.reasoning,
    );
  }

  const weather = await fetchWeather(route.region, route.days ?? 3);
  const { data, demoMode: genDemo, reasoning, aiError } =
    await generateChecklist(route, trip.rawDescription, weather?.summary);

  const checklist = await saveChecklist(
    id,
    userId,
    data,
    weather,
    reasoning,
    genDemo,
  );

  if (!checklist) {
    return corsJson({ error: "保存清单失败" }, { status: 500 });
  }

  return corsJson({
    checklist,
    demoMode: genDemo,
    reasoning: reasoning ?? null,
    aiError: aiError ?? null,
    weather,
  });
}
