import { z } from "zod";
import { corsJson, corsOptions } from "@/lib/cors";
import { prisma } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/request-auth";

const patchSchema = z
  .object({
    checked: z.boolean().optional(),
    owned: z.boolean().optional(),
  })
  .refine((d) => d.checked !== undefined || d.owned !== undefined, {
    message: "至少更新一个字段",
  });

type Params = { params: Promise<{ id: string; itemId: string }> };

export function OPTIONS() {
  return corsOptions();
}

export async function PATCH(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id, itemId } = await params;
  const body = patchSchema.parse(await req.json());

  const item = await prisma.checklistItem.findFirst({
    where: {
      id: itemId,
      checklist: { trip: { id, userId } },
    },
  });
  if (!item) {
    return corsJson({ error: "未找到" }, { status: 404 });
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: {
      ...(body.checked !== undefined ? { checked: body.checked } : {}),
      ...(body.owned !== undefined ? { owned: body.owned } : {}),
    },
  });

  return corsJson({ item: updated });
}
