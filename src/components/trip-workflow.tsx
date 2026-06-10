"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function TripWorkflow({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"parse" | "generate" | null>(null);
  const [error, setError] = useState("");

  async function runParse() {
    setLoading("parse");
    setError("");
    const res = await fetch(`/api/trips/${tripId}/parse`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      setError("解析失败");
      return;
    }
    router.refresh();
  }

  async function runGenerate() {
    setLoading("generate");
    setError("");
    const res = await fetch(`/api/trips/${tripId}/generate`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      setError("生成失败");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={runParse}
        disabled={loading !== null}
      >
        {loading === "parse" ? "解析中…" : "1. 解析路线"}
      </Button>
      <Button onClick={runGenerate} disabled={loading !== null}>
        {loading === "generate" ? "生成中…" : "2. 生成装备清单"}
      </Button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </div>
  );
}
