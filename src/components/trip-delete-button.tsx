"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tripId: string;
  tripTitle: string;
  redirectTo?: string;
  variant?: "button" | "icon";
  className?: string;
};

export function TripDeleteButton({
  tripId,
  tripTitle,
  redirectTo = "/dashboard",
  variant = "button",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(
      `确定删除「${tripTitle}」？\n此操作不可恢复，关联的清单也会一并删除。`,
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data.error as string) || "删除失败");
      }
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "删除失败");
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        aria-label={`删除 ${tripTitle}`}
        className={`cursor-pointer rounded-lg p-2 text-fog transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ${className}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className={`gap-1.5 ${className}`}
    >
      <Trash2 className="h-3.5 w-3.5" aria-hidden />
      {loading ? "删除中…" : "删除行程"}
    </Button>
  );
}
