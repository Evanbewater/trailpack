import Link from "next/link";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardTripList } from "@/components/dashboard-trip-list";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      checklists: { orderBy: { version: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="glass flex items-center justify-between rounded-2xl p-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper">我的行程</h1>
          <p className="mt-1 text-sm text-fog">共 {trips.length} 条路线</p>
        </div>
        <div className="flex gap-2">
          <Link href="/gear" className="cursor-pointer">
            <Button variant="secondary">装备库</Button>
          </Link>
          <Link href="/trips/new" className="cursor-pointer">
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              新建
            </Button>
          </Link>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="glass mt-5 rounded-2xl p-10 text-center">
          <p className="text-mist">还没有行程</p>
          <Link
            href="/trips/new"
            className="mt-3 inline-block cursor-pointer text-sm font-semibold text-primary hover:text-dawn-bright"
          >
            创建第一个 →
          </Link>
        </div>
      ) : (
        <DashboardTripList
          trips={trips.map((trip) => ({
            id: trip.id,
            title: trip.title,
            rawDescription: trip.rawDescription,
            demoMode: trip.demoMode,
            checklistVersion: trip.checklists[0]?.version ?? null,
          }))}
        />
      )}
    </div>
  );
}
