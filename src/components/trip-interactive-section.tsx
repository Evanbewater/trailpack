"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DemoBanner } from "@/components/demo-banner";
import { ThinkingPanel } from "@/components/thinking-panel";

type Props = {
  tripId: string;
  initialDemoMode: boolean;
  initialParseReasoning?: string | null;
  initialGenerateReasoning?: string | null;
};

type WorkflowResponse = {
  demoMode?: boolean;
  reasoning?: string | null;
  aiError?: string | null;
  error?: string;
  message?: string;
};

export function TripInteractiveSection({
  tripId,
  initialDemoMode,
  initialParseReasoning,
  initialGenerateReasoning,
}: Props) {
  const router = useRouter();
  const inFlight = useRef(false);

  const [demoMode, setDemoMode] = useState(initialDemoMode);
  const [parseReasoning, setParseReasoning] = useState(
    initialParseReasoning ?? null,
  );
  const [generateReasoning, setGenerateReasoning] = useState(
    initialGenerateReasoning ?? null,
  );
  const [loading, setLoading] = useState<"parse" | "generate" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const runAction = useCallback(
    async (action: "parse" | "generate") => {
      if (inFlight.current) return;
      inFlight.current = true;
      setLoading(action);
      setError("");
      setStatus(
        action === "parse"
          ? "正在调用 DeepSeek 解析路线…"
          : "正在调用 DeepSeek 生成装备清单…",
      );

      try {
        const res = await fetch(`/api/trips/${tripId}/${action}`, {
          method: "POST",
        });
        const data = (await res.json()) as WorkflowResponse;

        if (!res.ok) {
          throw new Error(data.error ?? data.message ?? "请求失败");
        }

        if (action === "parse") {
          setParseReasoning(data.reasoning ?? null);
          setDemoMode(Boolean(data.demoMode));
          if (data.demoMode) {
            setStatus("解析完成（演示模式）");
            if (data.aiError) setError(`AI 未生效：${data.aiError}`);
          } else if (data.reasoning) {
            setStatus("解析完成，已获取模型思考过程");
          } else {
            setStatus("解析完成（AI 已生效，但本次未返回思考内容）");
          }
        } else {
          setGenerateReasoning(data.reasoning ?? null);
          setDemoMode(Boolean(data.demoMode));
          if (data.demoMode) {
            setStatus("清单已生成（演示模式）");
            if (data.aiError) setError(`AI 未生效：${data.aiError}`);
          } else if (data.reasoning) {
            setStatus("清单已生成，已获取模型思考过程");
          } else {
            setStatus("清单已生成（AI 已生效，但本次未返回思考内容）");
          }
        }

        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "操作失败";
        setError(msg);
        setStatus("");
      } finally {
        setLoading(null);
        inFlight.current = false;
      }
    },
    [tripId, router],
  );

  const busy = loading !== null;

  return (
    <div className="space-y-4">
      {demoMode && <DemoBanner />}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => runAction("parse")}
          disabled={busy}
        >
          {loading === "parse" ? "解析中…" : "1. 解析路线"}
        </Button>
        <Button onClick={() => runAction("generate")} disabled={busy}>
          {loading === "generate" ? "生成中…" : "2. 生成装备清单"}
        </Button>
        {!demoMode && (
          <span className="rounded-full bg-forest/15 px-2 py-0.5 text-xs font-medium text-forest-dark">
            AI 模式
          </span>
        )}
      </div>

      {status && <p className="text-sm text-fog">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {parseReasoning && (
        <ThinkingPanel
          title="路线解析 · 模型思考过程"
          reasoning={parseReasoning}
          defaultOpen
        />
      )}

      {generateReasoning && (
        <ThinkingPanel
          title="装备生成 · 模型思考过程"
          reasoning={generateReasoning}
          defaultOpen
        />
      )}
    </div>
  );
}
