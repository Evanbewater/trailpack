import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { deleteGearImageFile } from "@/lib/gear/upload-image";
import {
  formatGearParseError,
  parseUpdateGearBody,
} from "@/lib/gear/parse-gear-body";
import { getUserIdFromRequest } from "@/lib/request-auth";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return corsOptions();
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const body = parseUpdateGearBody(await req.json());
    const existing = await prisma.personalGear.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      return corsJson({ error: "未找到" }, { status: 404 });
    }

    if (
      body.imageUrl !== undefined &&
      body.imageUrl !== existing.imageUrl &&
      existing.imageUrl
    ) {
      await deleteGearImageFile(existing.imageUrl);
    }

    const gear = await prisma.personalGear.update({
      where: { id },
      data: body,
    });
    return corsJson({ gear });
  } catch (e) {
    return corsJson({ error: formatGearParseError(e) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.personalGear.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return corsJson({ error: "未找到" }, { status: 404 });
  }

  await prisma.personalGear.delete({ where: { id } });
  if (existing.imageUrl) {
    await deleteGearImageFile(existing.imageUrl);
  }
  return corsJson({ ok: true });
}
