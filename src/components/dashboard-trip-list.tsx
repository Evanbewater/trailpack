"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TripDeleteButton } from "@/components/trip-delete-button";

type Trip = {
  id: string;
  title: string;
  rawDescription: string;
  demoMode: boolean;
  checklistVersion: number | null;
};

type Props = {
  trips: Trip[];
};

export function DashboardTripList({ trips }: Props) {
  return (
    <ul className="mt-5 space-y-3">
      {trips.map((trip) => (
        <li key={trip.id}>
          <div className="glass group flex items-stretch gap-1 rounded-2xl transition-colors duration-200 hover:border-white/80">
            <Link
              href={`/trips/${trip.id}`}
              className="flex min-w-0 flex-1 cursor-pointer items-start justify-between gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-paper">{trip.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-fog">
                  {trip.rawDescription}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-right text-xs text-fog">
                <div>
                  {trip.checklistVersion != null
                    ? `清单 v${trip.checklistVersion}`
                    : "未生成清单"}
                  {trip.demoMode && (
                    <span className="mt-1 block font-medium text-amber-600">
                      演示
                    </span>
                  )}
                </div>
                <ChevronRight
                  className="h-4 w-4 text-fog transition-colors group-hover:text-primary"
                  aria-hidden
                />
              </div>
            </Link>
            <div className="flex items-center pr-2">
              <TripDeleteButton
                tripId={trip.id}
                tripTitle={trip.title}
                variant="icon"
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
