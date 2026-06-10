"use client";

import { useRouter } from "next/navigation";

type Version = {
  version: number;
  _count: { items: number };
};

type Props = {
  tripId: string;
  versions: Version[];
  currentVersion: number;
};

export function ChecklistVersionSelect({
  tripId,
  versions,
  currentVersion,
}: Props) {
  const router = useRouter();

  if (versions.length <= 1) return null;

  return (
    <select
      value={currentVersion}
      onChange={(e) => {
        const v = e.target.value;
        router.push(`/trips/${tripId}?version=${v}`);
      }}
      className="cursor-pointer rounded-lg border border-[var(--line-subtle)] bg-white/60 px-2 py-1 text-sm text-paper backdrop-blur-sm"
    >
      {versions.map((v) => (
        <option key={v.version} value={v.version}>
          v{v.version}（{v._count.items} 项）
        </option>
      ))}
    </select>
  );
}
