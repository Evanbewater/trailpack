"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { ParsedRoute } from "@/lib/schemas/route";
import {
  ACTIVITY_TYPES,
  DIFFICULTIES,
  SEASONS,
} from "@/lib/constants/route-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  tripId: string;
  initialParsed: ParsedRoute;
};

function Flag({ label }: { label: string }) {
  return (
    <span className="rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200/80">
      {label}
    </span>
  );
}

export function TripRouteSection({ tripId, initialParsed }: Props) {
  const router = useRouter();
  const [parsed, setParsed] = useState(initialParsed);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(initialParsed);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function cancelEdit() {
    setForm(parsed);
    setEditMode(false);
    setError("");
    setStatus("");
  }

  async function saveRoute() {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedRoute: form }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data.error as string) || "保存失败");
      }
      setParsed(form);
      setEditMode(false);
      setStatus("路线已保存，可点击「生成装备清单」应用新参数");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const flags = [
    parsed.hasSnow && "有雪",
    parsed.overnightCamping && "露营",
    parsed.lightweight && "轻装",
    parsed.hasWaterCrossing && "涉水",
  ].filter(Boolean) as string[];

  return (
    <section className="glass mt-5 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-primary">路线解析</h2>
        <button
          type="button"
          onClick={() => (editMode ? cancelEdit() : setEditMode(true))}
          className="cursor-pointer text-sm font-semibold text-golden hover:text-[var(--golden-light)]"
        >
          {editMode ? "取消" : "编辑"}
        </button>
      </div>

      {!editMode ? (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-fog">类型</dt>
              <dd className="font-medium text-paper">{parsed.activityType}</dd>
            </div>
            <div>
              <dt className="text-fog">季节</dt>
              <dd className="font-medium text-paper">{parsed.season}</dd>
            </div>
            <div>
              <dt className="text-fog">难度</dt>
              <dd className="font-medium text-paper">{parsed.difficulty}</dd>
            </div>
            {parsed.region && (
              <div>
                <dt className="text-fog">地区</dt>
                <dd className="font-medium text-paper">{parsed.region}</dd>
              </div>
            )}
            {parsed.days != null && (
              <div>
                <dt className="text-fog">天数</dt>
                <dd className="font-medium text-paper">{parsed.days} 天</dd>
              </div>
            )}
            {parsed.groupSize != null && (
              <div>
                <dt className="text-fog">人数</dt>
                <dd className="font-medium text-paper">{parsed.groupSize} 人</dd>
              </div>
            )}
            {parsed.maxAltitudeM != null && (
              <div>
                <dt className="text-fog">海拔</dt>
                <dd className="font-medium text-paper">
                  约 {parsed.maxAltitudeM} m
                </dd>
              </div>
            )}
          </dl>
          {flags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {flags.map((f) => (
                <Flag key={f} label={f} />
              ))}
            </div>
          )}
          {parsed.highlights.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-sm text-mist">
              {parsed.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="mt-4 space-y-3">
          <Field label="标题">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="地区">
            <Input
              value={form.region ?? ""}
              onChange={(e) =>
                setForm({ ...form, region: e.target.value || undefined })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="天数">
              <Input
                type="number"
                min={1}
                value={form.days ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    days: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </Field>
            <Field label="人数">
              <Input
                type="number"
                min={1}
                value={form.groupSize ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    groupSize: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </Field>
            <Field label="海拔 (m)">
              <Input
                type="number"
                min={0}
                value={form.maxAltitudeM ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxAltitudeM: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </Field>
          </div>
          <Field label="活动类型">
            <Select
              value={form.activityType}
              options={ACTIVITY_TYPES}
              onChange={(v) =>
                setForm({ ...form, activityType: v as ParsedRoute["activityType"] })
              }
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="季节">
              <Select
                value={form.season}
                options={SEASONS}
                onChange={(v) =>
                  setForm({ ...form, season: v as ParsedRoute["season"] })
                }
              />
            </Field>
            <Field label="难度">
              <Select
                value={form.difficulty}
                options={DIFFICULTIES}
                onChange={(v) =>
                  setForm({
                    ...form,
                    difficulty: v as ParsedRoute["difficulty"],
                  })
                }
              />
            </Field>
          </div>
          <div className="space-y-2 pt-1">
            <Toggle
              label="有雪 / 冰雪"
              checked={form.hasSnow}
              onChange={(hasSnow) => setForm({ ...form, hasSnow })}
            />
            <Toggle
              label="露营过夜"
              checked={form.overnightCamping}
              onChange={(overnightCamping) =>
                setForm({ ...form, overnightCamping })
              }
            />
            <Toggle
              label="轻装"
              checked={form.lightweight}
              onChange={(lightweight) => setForm({ ...form, lightweight })}
            />
            <Toggle
              label="涉水"
              checked={form.hasWaterCrossing}
              onChange={(hasWaterCrossing) =>
                setForm({ ...form, hasWaterCrossing })
              }
            />
          </div>
          <Button
            type="button"
            onClick={saveRoute}
            disabled={saving}
            className="mt-2 w-full sm:w-auto"
          >
            {saving ? "保存中…" : "保存并用于下次生成"}
          </Button>
        </div>
      )}

      {status && <p className="mt-3 text-sm text-forest">{status}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-fog">{label}</span>
      {children}
    </label>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full cursor-pointer rounded-xl border border-[var(--line-subtle)] bg-white/70 px-3 py-2 text-sm text-paper backdrop-blur-sm focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/20"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-white/40 px-3 py-2">
      <span className="text-sm text-paper">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 cursor-pointer accent-[var(--cta)]"
      />
    </label>
  );
}
