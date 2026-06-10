import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { parsedRouteSchema } from "@/lib/schemas/route";
import { getUserIdFromRequest } from "@/lib/request-auth";
import { getTripForUser } from "@/lib/trips/persistence";

const patchRouteSchema = z.object({
  parsedRoute: parsedRouteSchema,
});

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
  const { searchParams } = new URL(req.url);
  const versionParam = searchParams.get("version");
  const checklistVersion = versionParam
    ? parseInt(versionParam, 10)
    : undefined;
  const trip = await getTripForUser(
    id,
    userId,
    checklistVersion && !Number.isNaN(checklistVersion)
      ? checklistVersion
      : undefined,
  );
  if (!trip) {
    return corsJson({ error: "未找到" }, { status: 404 });
  }

  return corsJson({ trip });
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = patchRouteSchema.parse(await req.json());
    const updated = await prisma.trip.updateMany({
      where: { id, userId },
      data: {
        parsedRoute: JSON.stringify(body.parsedRoute),
        title: body.parsedRoute.title,
      },
    });
    if (updated.count === 0) {
      return corsJson({ error: "未找到" }, { status: 404 });
    }
    return corsJson({ ok: true, route: body.parsedRoute });
  } catch {
    return corsJson({ error: "更新失败" }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.trip.deleteMany({
    where: { id, userId },
  });
  return corsJson({ ok: true });
}
