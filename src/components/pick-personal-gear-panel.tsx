"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { PersonalGear } from "@/components/gear-manager";
import { formatWeightG } from "@/lib/gear/format-weight";
import { groupGearByCategory } from "@/lib/gear/group-by-category";
import { Button } from "@/components/ui/button";

type Props = {
  tripId: string;
  existingGearIds: string[];
  onClose: () => void;
  onAdded?: () => void;
};

export function PickPersonalGearPanel({
  tripId,
  existingGearIds,
  onClose,
  onAdded,
}: Props) {
  const router = useRouter();
  const [gear, setGear] = useState<PersonalGear[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const existing = useMemo(() => new Set(existingGearIds), [existingGearIds]);

  useEffect(() => {
    fetch("/api/gear")
      .then((r) => r.json())
      .then((data) => setGear(data.gear ?? []))
      .catch(() => setError("加载装备库失败"))
      .finally(() => setLoading(false));
  }, []);

  const available = gear.filter((g) => !existing.has(g.id));

  const grouped = useMemo(
    () => groupGearByCategory(available),
    [available],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addSelected() {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/trips/${tripId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personalGearIds: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "添加失败");
      onAdded?.();
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-canopy/30 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pick-gear-title"
    >
      <div className="glass max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--line-subtle)] px-5 py-4">
          <h2 id="pick-gear-title" className="font-display font-semibold text-paper">
            从个人装备选取
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-fog hover:text-paper"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-5 py-4">
          {loading ? (
            <p className="text-sm text-fog">加载中…</p>
          ) : gear.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-mist">装备库还是空的</p>
              <Link
                href="/gear"
                className="mt-2 inline-block text-sm font-semibold text-primary hover:text-dawn-bright"
              >
                去添加个人装备 →
              </Link>
            </div>
          ) : available.length === 0 ? (
            <p className="py-6 text-center text-sm text-fog">
              个人装备已全部加入此清单
            </p>
          ) : (
            <div className="space-y-4">
              {grouped.map(({ category, items }) => (
                <section key={category}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary">
                      {category}
                    </h3>
                    <span className="text-xs text-fog">{items.length} 件</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {items.map((item) => (
                      <li key={item.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2 hover:bg-white/50">
                          <input
                            type="checkbox"
                            checked={selected.has(item.id)}
                            onChange={() => toggle(item.id)}
                            className="mt-1 h-4 w-4 accent-[var(--cta)]"
                          />
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-meadow/60 text-xs text-fog">
                              —
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-paper">
                              {item.name}
                            </span>
                            {(item.brand ||
                              item.weightG ||
                              item.note) && (
                              <span className="mt-0.5 block text-xs text-fog">
                                {[
                                  item.brand,
                                  formatWeightG(item.weightG),
                                  item.note,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-2 border-t border-[var(--line-subtle)] px-5 py-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            取消
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={selected.size === 0 || submitting}
            onClick={addSelected}
          >
            {submitting
              ? "添加中…"
              : selected.size > 0
                ? `添加 ${selected.size} 项`
                : "选择装备"}
          </Button>
        </div>
      </div>
    </div>
  );
}
