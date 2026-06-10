import { corsJson, corsOptions } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { getChecklistVersions } from "@/lib/trips/persistence";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const trip = await prisma.trip.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!trip) {
    return corsJson({ error: "未找到" }, { status: 404 });
  }

  const versions = await getChecklistVersions(id, userId);
  return corsJson({ versions });
}
