import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import {
  formatGearParseError,
  parseCreateGearBody,
} from "@/lib/gear/parse-gear-body";
import { getUserIdFromRequest } from "@/lib/request-auth";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const gear = await prisma.personalGear.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return corsJson({ gear });
}

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = parseCreateGearBody(await req.json());
    const gear = await prisma.personalGear.create({
      data: { userId, ...body },
    });
    return corsJson({ gear }, { status: 201 });
  } catch (e) {
    return corsJson({ error: formatGearParseError(e) }, { status: 400 });
  }
}
