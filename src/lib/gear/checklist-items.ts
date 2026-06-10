import { prisma } from "@/lib/db";
import { formatWeightG } from "@/lib/gear/format-weight";

function buildGearReason(gear: {
  brand: string | null;
  note: string | null;
  weightG: number | null;
}) {
  const parts = ["来自个人装备库"];
  if (gear.brand) parts.push(gear.brand);
  const weight = formatWeightG(gear.weightG);
  if (weight) parts.push(weight);
  if (gear.note) parts.push(gear.note);
  return parts.join(" · ");
}

export async function getLatestChecklistForTrip(tripId: string, userId: string) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      checklists: {
        orderBy: { version: "desc" },
        take: 1,
        include: { items: true },
      },
    },
  });
  return trip?.checklists[0] ?? null;
}

export async function addPersonalGearToChecklist(
  tripId: string,
  userId: string,
  personalGearId: string,
) {
  const gear = await prisma.personalGear.findFirst({
    where: { id: personalGearId, userId },
  });
  if (!gear) return { error: "个人装备不存在" as const };

  const checklist = await getLatestChecklistForTrip(tripId, userId);
  if (!checklist) return { error: "请先生成装备清单" as const };

  const duplicate = checklist.items.some(
    (i) => i.personalGearId === personalGearId,
  );
  if (duplicate) return { error: "该装备已在清单中" as const };

  const maxOrder = checklist.items.reduce(
    (max, i) => Math.max(max, i.sortOrder),
    -1,
  );

  const item = await prisma.checklistItem.create({
    data: {
      checklistId: checklist.id,
      name: gear.name,
      category: gear.category,
      priority: "建议",
      reason: buildGearReason(gear),
      owned: true,
      personalGearId: gear.id,
      sortOrder: maxOrder + 1,
    },
  });

  return { item, checklistId: checklist.id };
}

export async function addPersonalGearBatchToChecklist(
  tripId: string,
  userId: string,
  personalGearIds: string[],
) {
  const items = [];
  const errors: string[] = [];

  for (const personalGearId of personalGearIds) {
    const result = await addPersonalGearToChecklist(
      tripId,
      userId,
      personalGearId,
    );
    if ("error" in result) {
      errors.push(result.error ?? "添加失败");
    } else {
      items.push(result.item);
    }
  }

  if (items.length === 0) {
    return { error: errors[0] ?? "添加失败" as const };
  }

  return { items, errors };
}
