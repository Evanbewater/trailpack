import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/request-auth";

const createSchema = z.object({
  rawDescription: z.string().min(4).max(2000),
  title: z.string().max(100).optional(),
});

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const trips = await prisma.trip.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      checklists: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  return corsJson({ trips });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const trip = await prisma.trip.create({
      data: {
        userId,
        title: body.title ?? "新行程",
        rawDescription: body.rawDescription,
      },
    });
    return corsJson({ trip });
  } catch {
    return corsJson({ error: "创建失败" }, { status: 400 });
  }
}
