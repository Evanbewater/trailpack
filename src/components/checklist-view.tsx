"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PickPersonalGearPanel } from "@/components/pick-personal-gear-panel";

type Item = {
  id: string;
  name: string;
  category: string;
  priority: string;
  reason: string | null;
  isShared: boolean;
  checked: boolean;
  owned: boolean;
  personalGearId: string | null;
};

type Assignment = {
  id: string;
  roleLabel: string;
  memberName: string | null;
  itemIds: string;
};

type Filter = "all" | "required" | "todo";

type Props = {
  tripId: string;
  tripTitle: string;
  rawDescription: string;
  items: Item[];
  assignments: Assignment[];
};

function applyFilter(items: Item[], filter: Filter) {
  if (filter === "required") return items.filter((i) => i.priority === "必需");
  if (filter === "todo") return items.filter((i) => !i.checked && !i.owned);
  return items;
}

function buildStats(items: Item[], filter: Filter) {
  const filtered = applyFilter(items, filter);
  const total = items.length;
  const checked = items.filter((i) => i.checked).length;
  const owned = items.filter((i) => i.owned).length;
  const needCount = items.filter((i) => !i.owned && !i.checked).length;
  const progress = total ? Math.round((checked / total) * 100) : 0;
  const byCategory = filtered.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
  return { filtered, byCategory, checked, owned, needCount, progress, total };
}

export function ChecklistView({
  tripId,
  tripTitle,
  rawDescription,
  items: initial,
  assignments,
}: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initial);

  useEffect(() => {
    setItems(initial);
  }, [initial]);
  const [tab, setTab] = useState<"list" | "team">("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [copied, setCopied] = useState(false);
  const [showPickGear, setShowPickGear] = useState(false);

  const existingGearIds = useMemo(
    () =>
      items
        .map((i) => i.personalGearId)
        .filter((id): id is string => Boolean(id)),
    [items],
  );

  const stats = useMemo(() => buildStats(items, filter), [items, filter]);

  async function patchItem(
    itemId: string,
    patch: { checked?: boolean; owned?: boolean },
  ) {
    await fetch(`/api/trips/${tripId}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function toggleChecked(itemId: string, checked: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, checked } : i)),
    );
    await patchItem(itemId, { checked });
  }

  async function toggleOwned(itemId: string, owned: boolean) {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, owned } : i)),
    );
    await patchItem(itemId, { owned });
  }

  async function copyChecklist() {
    const { byCategory } = buildStats(items, "all");
    const lines = [
      `# ${tripTitle}`,
      "",
      rawDescription,
      "",
      "## 装备清单",
      "",
    ];
    Object.entries(byCategory).forEach(([category, catItems]) => {
      lines.push(`### ${category}`);
      catItems.forEach((i) => {
        lines.push(
          `- [${i.checked ? "x" : " "}] ${i.name} (${i.priority})${i.owned ? " ·已有" : ""}`,
        );
      });
      lines.push("");
    });
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const priorityColor: Record<string, string> = {
    必需: "text-red-600",
    建议: "text-amber-600",
    可选: "text-fog",
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "required", label: "必需" },
    { key: "todo", label: "待准备" },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-sm text-fog">
          <span>
            打包进度 {stats.progress}% · 待准备 {stats.needCount} 项 · 已有{" "}
            {stats.owned} 项
          </span>
          <span>
            已勾选 {stats.checked} / {stats.total}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-white/50"
          role="progressbar"
          aria-valuenow={stats.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-forest transition-all duration-300"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-white/40 p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`cursor-pointer rounded-md px-3 py-1 text-sm transition-colors ${
                filter === f.key
                  ? "bg-forest font-medium text-white"
                  : "text-fog hover:text-paper"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => setShowPickGear(true)}
          >
            <PackagePlus className="h-3.5 w-3.5" aria-hidden />
            个人装备
          </Button>
          <Button
            variant={tab === "list" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTab("list")}
          >
            装备清单
          </Button>
          <Button
            variant={tab === "team" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTab("team")}
          >
            分工
          </Button>
          <Button variant="secondary" size="sm" onClick={copyChecklist}>
            {copied ? "已复制" : "复制清单"}
          </Button>
          <Link href={`/trips/${tripId}/export`} className="cursor-pointer">
            <Button variant="secondary" size="sm">
              导出
            </Button>
          </Link>
        </div>
      </div>

      {tab === "list" ? (
        <div className="space-y-6">
          {Object.keys(stats.byCategory).length === 0 ? (
            <p className="text-center text-sm text-fog">当前筛选无匹配项</p>
          ) : (
            Object.entries(stats.byCategory).map(([category, catItems]) => (
              <section key={category}>
                <h3 className="mb-2 text-sm font-semibold text-primary">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {catItems.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-start gap-3 rounded-xl border border-[var(--line-subtle)] bg-white/50 px-3 py-2 backdrop-blur-sm ${item.owned ? "opacity-75" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) =>
                          toggleChecked(item.id, e.target.checked)
                        }
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-[var(--line-subtle)] accent-[var(--cta)]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              item.checked
                                ? "text-fog line-through"
                                : "text-paper"
                            }
                          >
                            {item.name}
                          </span>
                          <span
                            className={`text-xs ${priorityColor[item.priority] ?? ""}`}
                          >
                            {item.priority}
                          </span>
                          {item.isShared && (
                            <span className="text-xs text-primary">公共</span>
                          )}
                          {item.personalGearId && (
                            <span className="text-xs text-sky-700">库</span>
                          )}
                          {item.owned && (
                            <span className="text-xs text-forest">已有</span>
                          )}
                        </div>
                        {item.reason && (
                          <p className="mt-0.5 text-xs text-fog">
                            {item.reason}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleOwned(item.id, !item.owned)}
                        className={`shrink-0 cursor-pointer rounded-lg border px-2 py-1 text-xs transition-colors ${
                          item.owned
                            ? "border-forest bg-meadow/80 text-forest"
                            : "border-[var(--line-subtle)] text-fog hover:border-forest hover:text-forest"
                        }`}
                      >
                        {item.owned ? "已有" : "标记已有"}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const names: string[] = JSON.parse(a.itemIds);
            return (
              <div
                key={a.id}
                className="rounded-xl border border-[var(--line-subtle)] bg-white/50 p-4 backdrop-blur-sm"
              >
                <h3 className="font-medium text-paper">
                  {a.roleLabel}
                  {a.memberName ? ` · ${a.memberName}` : ""}
                </h3>
                <ul className="mt-2 list-inside list-disc text-sm text-mist">
                  {names.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {showPickGear && (
        <PickPersonalGearPanel
          tripId={tripId}
          existingGearIds={existingGearIds}
          onClose={() => setShowPickGear(false)}
          onAdded={() => router.refresh()}
        />
      )}
    </div>
  );
}
