import { prisma } from "@/lib/db";
import type { ChecklistGeneration, ParsedRoute } from "@/lib/schemas/route";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";

export async function saveParsedRoute(
  tripId: string,
  userId: string,
  route: ParsedRoute,
  demoMode: boolean,
  reasoning?: string,
) {
  return prisma.trip.updateMany({
    where: { id: tripId, userId },
    data: {
      title: route.title,
      parsedRoute: JSON.stringify(route),
      parseReasoning: reasoning ?? null,
      demoMode,
    },
  });
}

export async function saveChecklist(
  tripId: string,
  userId: string,
  data: ChecklistGeneration,
  weather: WeatherSnapshot | null,
  reasoning?: string,
  demoMode = false,
) {
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: { checklists: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!trip) return null;

  const nextVersion = (trip.checklists[0]?.version ?? 0) + 1;

  await prisma.trip.update({
    where: { id: tripId },
    data: {
      analysisNotes: data.analysisNotes,
      riskNotes: data.riskNotes,
      generateReasoning: reasoning ?? null,
      weatherSnapshot: weather ? JSON.stringify(weather) : trip.weatherSnapshot,
      demoMode,
    },
  });

  return prisma.checklist.create({
    data: {
      tripId,
      version: nextVersion,
      items: {
        create: data.items.map((item, index) => ({
          name: item.name,
          category: item.category,
          priority: item.priority,
          reason: item.reason,
          isShared: item.isShared,
          sortOrder: index,
        })),
      },
      assignments: {
        create: data.assignments.map((a) => ({
          roleLabel: a.roleLabel,
          memberName: a.memberName,
          itemIds: JSON.stringify(a.itemNames),
        })),
      },
    },
    include: { items: true, assignments: true },
  });
}

export async function getTripForUser(
  tripId: string,
  userId: string,
  checklistVersion?: number,
) {
  return prisma.trip.findFirst({
    where: { id: tripId, userId },
    include: {
      checklists: {
        where: checklistVersion ? { version: checklistVersion } : undefined,
        orderBy: { version: "desc" },
        take: 1,
        include: { items: { orderBy: { sortOrder: "asc" } }, assignments: true },
      },
    },
  });
}

export async function getChecklistVersions(tripId: string, userId: string) {
  return prisma.checklist.findMany({
    where: { trip: { id: tripId, userId } },
    select: {
      id: true,
      version: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { version: "desc" },
  });
}
