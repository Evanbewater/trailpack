import { corsJson, corsOptions } from "@/lib/cors";
import { addPersonalGearBatchToChecklist } from "@/lib/gear/checklist-items";
import { addChecklistItemsSchema } from "@/lib/schemas/gear";
import { getUserIdFromRequest } from "@/lib/request-auth";

type Params = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return corsOptions();
}

export async function POST(req: Request, { params }: Params) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return corsJson({ error: "未登录" }, { status: 401 });
  }

  const { id: tripId } = await params;

  try {
    const body = addChecklistItemsSchema.parse(await req.json());
    const result = await addPersonalGearBatchToChecklist(
      tripId,
      userId,
      body.personalGearIds,
    );

    if ("error" in result) {
      const status = result.error === "个人装备不存在" ? 404 : 400;
      return corsJson({ error: result.error }, { status });
    }

    return corsJson(
      { items: result.items, warnings: result.errors },
      { status: 201 },
    );
  } catch {
    return corsJson({ error: "添加失败" }, { status: 400 });
  }
}
