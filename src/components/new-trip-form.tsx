"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const PLACEHOLDER =
  "例如：川西四姑娘山二峰冲顶，2天1夜，11月，有雪线，3人轻装";

const EXAMPLE_TRIP =
  "川西四姑娘山二峰冲顶，2天1夜，11月，有雪线，3人轻装";

const LONG_TIMEOUT = 120_000;

type StepKey = "create" | "parse" | "generate";
type StepStatus = "pending" | "active" | "done" | "fail";

type Step = {
  key: StepKey;
  label: string;
  status: StepStatus;
};

const STEP_DEFS: Omit<Step, "status">[] = [
  { key: "create", label: "创建行程" },
  { key: "parse", label: "解析路线" },
  { key: "generate", label: "生成装备清单" },
];

function initSteps(): Step[] {
  return STEP_DEFS.map((s) => ({ ...s, status: "pending" }));
}

async function fetchWithTimeout(url: string, init?: RequestInit) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LONG_TIMEOUT);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function readError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return (data.error as string) || fallback;
  } catch {
    return fallback;
  }
}

export function NewTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [description, setDescription] = useState("");
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState("");
  const [tripId, setTripId] = useState("");
  const [steps, setSteps] = useState(initSteps);
  const stepsRef = useRef(steps);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  useEffect(() => {
    const example = searchParams.get("example");
    if (example) {
      setDescription(decodeURIComponent(example));
    }
  }, [searchParams]);

  function updateSteps(updater: (prev: Step[]) => Step[]) {
    setSteps((prev) => {
      const next = updater(prev);
      stepsRef.current = next;
      return next;
    });
  }

  function setStep(key: StepKey, status: StepStatus) {
    updateSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, status } : s)),
    );
  }

  async function runStep(key: StepKey, fn: () => Promise<void>) {
    setStep(key, "active");
    try {
      await fn();
      setStep(key, "done");
      return true;
    } catch (e) {
      setStep(key, "fail");
      setError(e instanceof Error ? e.message : "步骤失败");
      setFailed(true);
      return false;
    }
  }

  function maybeRedirect(id: string) {
    if (stepsRef.current.every((s) => s.status === "done")) {
      router.push(`/trips/${id}`);
    }
  }

  async function submit() {
    const desc = description.trim();
    if (desc.length < 4) {
      setError("描述至少 4 个字符");
      return;
    }

    setRunning(true);
    setStarted(true);
    setFailed(false);
    setError("");
    updateSteps(() => initSteps());

    let currentTripId = tripId;

    try {
      if (!currentTripId) {
        const ok = await runStep("create", async () => {
          const res = await fetchWithTimeout("/api/trips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: desc }),
          });
          if (!res.ok) {
            throw new Error(await readError(res, "创建失败，请检查描述长度"));
          }
          const { trip } = await res.json();
          currentTripId = trip.id;
          setTripId(trip.id);
        });
        if (!ok) return;
      }

      const parseOk = await runStep("parse", async () => {
        const res = await fetchWithTimeout(
          `/api/trips/${currentTripId}/parse`,
          { method: "POST" },
        );
        if (!res.ok) {
          throw new Error(await readError(res, "路线解析失败"));
        }
      });
      if (!parseOk) return;

      const genOk = await runStep("generate", async () => {
        const res = await fetchWithTimeout(
          `/api/trips/${currentTripId}/generate`,
          { method: "POST" },
        );
        if (!res.ok) {
          throw new Error(await readError(res, "清单生成失败"));
        }
      });
      if (!genOk) return;

      router.push(`/trips/${currentTripId}`);
    } finally {
      setRunning(false);
    }
  }

  async function retryStep(key: StepKey) {
    if (!tripId && key !== "create") return;

    setRunning(true);
    setError("");
    setFailed(false);

    const desc = description.trim();
    let currentTripId = tripId;

    try {
      if (key === "create") {
        const ok = await runStep("create", async () => {
          const res = await fetchWithTimeout("/api/trips", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rawDescription: desc }),
          });
          if (!res.ok) {
            throw new Error(await readError(res, "创建失败"));
          }
          const { trip } = await res.json();
          currentTripId = trip.id;
          setTripId(trip.id);
        });
        if (!ok) return;
      } else if (key === "parse") {
        const ok = await runStep("parse", async () => {
          const res = await fetchWithTimeout(
            `/api/trips/${currentTripId}/parse`,
            { method: "POST" },
          );
          if (!res.ok) {
            throw new Error(await readError(res, "路线解析失败"));
          }
        });
        if (!ok) return;
      } else if (key === "generate") {
        const ok = await runStep("generate", async () => {
          const res = await fetchWithTimeout(
            `/api/trips/${currentTripId}/generate`,
            { method: "POST" },
          );
          if (!res.ok) {
            throw new Error(await readError(res, "清单生成失败"));
          }
        });
        if (!ok) return;
      }

      maybeRedirect(currentTripId);
    } finally {
      setRunning(false);
    }
  }

  const stepDotClass = (status: StepStatus) => {
    if (status === "done") return "bg-forest text-white";
    if (status === "active") return "bg-golden text-canopy animate-pulse";
    if (status === "fail") return "bg-red-500 text-white";
    return "bg-white/60 text-fog border border-[var(--line-subtle)]";
  };

  return (
    <div className="space-y-4">
      <Textarea
        rows={6}
        placeholder={PLACEHOLDER}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        minLength={4}
        disabled={running}
      />

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={running}
        onClick={() => setDescription(EXAMPLE_TRIP)}
      >
        用示例填充
      </Button>

      {started && (
        <div className="glass-subtle space-y-3 rounded-xl p-4">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stepDotClass(step.status)}`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-paper">{step.label}</span>
              {step.status === "fail" && (
                <button
                  type="button"
                  onClick={() => retryStep(step.key)}
                  disabled={running}
                  className="cursor-pointer text-sm font-medium text-golden hover:text-[var(--golden-light)] disabled:opacity-50"
                >
                  重试
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button
        type="button"
        disabled={running}
        className="w-full sm:w-auto"
        onClick={submit}
      >
        {running ? "处理中…" : "创建并生成清单"}
      </Button>

      {tripId && failed && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(`/trips/${tripId}`)}
        >
          查看已创建行程
        </Button>
      )}

      <p className="text-xs text-fog">
        将自动执行路线解析与装备生成（演示模式或 AI 模式取决于环境配置）。AI
        步骤最长等待 120 秒。
      </p>
    </div>
  );
}
