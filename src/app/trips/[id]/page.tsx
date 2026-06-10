import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { parsedRouteSchema } from "@/lib/schemas/route";
import {
  getChecklistVersions,
  getTripForUser,
} from "@/lib/trips/persistence";
import type { WeatherSnapshot } from "@/lib/weather/open-meteo";
import { ChecklistView } from "@/components/checklist-view";
import { ChecklistVersionSelect } from "@/components/checklist-version-select";
import { TripDeleteButton } from "@/components/trip-delete-button";
import { TripInteractiveSection } from "@/components/trip-interactive-section";
import { TripRouteSection } from "@/components/trip-route-section";
import { TripShareLink } from "@/components/trip-share-link";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
};

export default async function TripPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const versionParam = sp.version ? parseInt(sp.version, 10) : undefined;
  const checklistVersion =
    versionParam && !Number.isNaN(versionParam) ? versionParam : undefined;

  const [trip, versions] = await Promise.all([
    getTripForUser(id, session.user.id, checklistVersion),
    getChecklistVersions(id, session.user.id),
  ]);
  if (!trip) notFound();

  const checklist = trip.checklists[0];
  let parsed = null;
  if (trip.parsedRoute) {
    try {
      parsed = parsedRouteSchema.parse(JSON.parse(trip.parsedRoute));
    } catch {
      parsed = null;
    }
  }

  let weather: WeatherSnapshot | null = null;
  if (trip.weatherSnapshot) {
    try {
      weather = JSON.parse(trip.weatherSnapshot) as WeatherSnapshot;
    } catch {
      weather = null;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex cursor-pointer items-center gap-1 text-sm text-fog transition-colors hover:text-paper"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        返回列表
      </Link>

      <div className="glass mt-4 rounded-2xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-paper">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <TripShareLink tripId={trip.id} />
            <TripDeleteButton tripId={trip.id} tripTitle={trip.title} />
          </div>
        </div>
        <p className="mt-3 rounded-xl bg-white/50 p-3 text-sm text-mist">{trip.rawDescription}</p>
      </div>

      <div className="glass mt-5 rounded-2xl p-5">
        <TripInteractiveSection
          tripId={trip.id}
          initialDemoMode={trip.demoMode}
          initialParseReasoning={trip.parseReasoning}
          initialGenerateReasoning={trip.generateReasoning}
        />
      </div>

      {parsed && (
        <TripRouteSection tripId={trip.id} initialParsed={parsed} />
      )}

      {trip.analysisNotes && (
        <section className="glass mt-5 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-primary">装备策略</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-mist">{trip.analysisNotes}</p>
        </section>
      )}

      {(weather?.summary || trip.riskNotes) && (
        <section className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-amber-800">风险与天气</h2>
          {weather?.summary && (
            <p className="mt-2 text-sm text-amber-900/90">{weather.summary}</p>
          )}
          {trip.riskNotes && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-amber-800/90">{trip.riskNotes}</p>
          )}
        </section>
      )}

      {checklist ? (
        <section className="glass mt-8 rounded-2xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-paper">
              装备清单
            </h2>
            <ChecklistVersionSelect
              tripId={trip.id}
              versions={versions}
              currentVersion={checklist.version}
            />
          </div>
          <ChecklistView
            tripId={trip.id}
            tripTitle={trip.title}
            rawDescription={trip.rawDescription}
            items={checklist.items}
            assignments={checklist.assignments}
          />
        </section>
      ) : (
        <p className="mt-10 text-center text-fog">点击上方「解析路线」与「生成装备清单」开始</p>
      )}
    </div>
  );
}
