"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Trash2, X } from "lucide-react";
import { GEAR_CATEGORIES } from "@/lib/schemas/route";
import {
  getCategoryStats,
  groupGearByCategory,
} from "@/lib/gear/group-by-category";
import { formatWeightG, parseWeightGInput } from "@/lib/gear/format-weight";
import { GearImageField } from "@/components/gear-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type PersonalGear = {
  id: string;
  name: string;
  category: string;
  note: string | null;
  brand: string | null;
  weightG: number | null;
  imageUrl: string | null;
};

type Props = {
  initialGear: PersonalGear[];
};

type FormState = {
  name: string;
  category: string;
  brand: string;
  weight: string;
  note: string;
};

const emptyForm = (): FormState => ({
  name: "",
  category: GEAR_CATEGORIES[0],
  brand: "",
  weight: "",
  note: "",
});

function gearMetaLine(item: PersonalGear) {
  return [item.brand, formatWeightG(item.weightG), item.note]
    .filter(Boolean)
    .join(" · ");
}

export function GearManager({ initialGear }: Props) {
  const router = useRouter();
  const [gear, setGear] = useState(initialGear);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  const categoryStats = useMemo(() => getCategoryStats(gear), [gear]);

  const filteredGear = useMemo(() => {
    if (categoryFilter === "all") return gear;
    return gear.filter((g) => g.category === categoryFilter);
  }, [gear, categoryFilter]);

  const grouped = useMemo(
    () => groupGearByCategory(filteredGear),
    [filteredGear],
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setImageUrl(null);
    setInitialImageUrl(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(item: PersonalGear) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand ?? "",
      weight: item.weightG ? String(item.weightG) : "",
      note: item.note ?? "",
    });
    setImageUrl(item.imageUrl);
    setInitialImageUrl(item.imageUrl);
    setShowForm(true);
    setError("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
    setImageUrl(null);
    setInitialImageUrl(null);
    setError("");
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("请填写装备名称");
      return;
    }

    setLoading(true);
    setError("");
    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      category: form.category,
      brand: form.brand.trim() || undefined,
      weightG: parseWeightGInput(form.weight),
      note: form.note.trim() || undefined,
    };
    if (imageUrl) {
      payload.imageUrl = imageUrl;
    } else if (editingId && initialImageUrl) {
      payload.imageUrl = null;
    }

    try {
      if (editingId) {
        const res = await fetch(`/api/gear/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "更新失败");
        setGear((prev) =>
          prev.map((g) => (g.id === editingId ? data.gear : g)),
        );
      } else {
        const res = await fetch("/api/gear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "创建失败");
        setGear((prev) => [...prev, data.gear]);
      }
      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  async function deleteGear(item: PersonalGear) {
    const ok = window.confirm(`确定删除「${item.name}」？`);
    if (!ok) return;

    const res = await fetch(`/api/gear/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert((data.error as string) || "删除失败");
      return;
    }
    setGear((prev) => prev.filter((g) => g.id !== item.id));
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-paper">
            个人装备库
          </h1>
          <p className="mt-1 text-sm text-fog">
            共 {gear.length} 件 · {categoryStats.length} 个分类
          </p>
        </div>
        <Button type="button" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" aria-hidden />
          添加装备
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submitForm}
          className="glass space-y-4 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-paper">
              {editingId ? "编辑装备" : "新装备"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="cursor-pointer rounded-lg p-1 text-fog hover:bg-white/50 hover:text-paper"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <GearImageField imageUrl={imageUrl} onChange={setImageUrl} />
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fog">
              名称
            </span>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例如：冲锋衣、登山杖"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fog">
              分类
            </span>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
              className="w-full cursor-pointer rounded-xl border border-[var(--line-subtle)] bg-white/70 px-3 py-2 text-sm text-paper"
            >
              {GEAR_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fog">
              品牌（可选）
            </span>
            <Input
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="例如：Arc'teryx"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fog">
              重量（可选）
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="例如：450"
                className="flex-1"
              />
              <span className="shrink-0 text-sm text-fog">克 (g)</span>
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-fog">
              备注（可选）
            </span>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="规格、适用场景等"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "保存中…" : editingId ? "保存修改" : "加入装备库"}
          </Button>
        </form>
      )}

      {gear.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center">
          <Package
            className="mx-auto h-10 w-10 text-fog"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="mt-3 text-mist">装备库还是空的</p>
          <p className="mt-1 text-sm text-fog">
            添加你常用的冲锋衣、睡袋、头灯等，下次打包直接从库里选
          </p>
          <Button type="button" onClick={openCreate} className="mt-5">
            添加第一件装备
          </Button>
        </div>
      ) : (
        <>
          {categoryStats.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${
                  categoryFilter === "all"
                    ? "bg-forest font-medium text-white"
                    : "bg-white/50 text-fog hover:text-paper"
                }`}
              >
                全部 {gear.length}
              </button>
              {categoryStats.map((stat) => (
                <button
                  key={stat.category}
                  type="button"
                  onClick={() => setCategoryFilter(stat.category)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors ${
                    categoryFilter === stat.category
                      ? "bg-forest font-medium text-white"
                      : "bg-white/50 text-fog hover:text-paper"
                  }`}
                >
                  {stat.category} {stat.count}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {grouped.map(({ category, items }) => (
              <section key={category} className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between border-b border-[var(--line-subtle)] pb-3">
                  <h2 className="font-display text-base font-semibold text-paper">
                    {category}
                  </h2>
                  <span className="rounded-full bg-meadow/80 px-2.5 py-0.5 text-xs font-medium text-forest">
                    {items.length} 件
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-[var(--line-subtle)] bg-white/50 px-3 py-2.5"
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg border border-[var(--line-subtle)] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-meadow/60 text-fog">
                          <Package className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-paper">{item.name}</p>
                        {gearMetaLine(item) && (
                          <p className="mt-0.5 text-xs text-fog">
                            {gearMetaLine(item)}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="cursor-pointer rounded-lg p-2 text-fog hover:bg-white/80 hover:text-paper"
                          aria-label={`编辑 ${item.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteGear(item)}
                          className="cursor-pointer rounded-lg p-2 text-fog hover:bg-red-50 hover:text-red-600"
                          aria-label={`删除 ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
