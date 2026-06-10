"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  imageUrl: string | null;
  onChange: (url: string | null) => void;
};

export function GearImageField({ imageUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/gear/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "上传失败");
      onChange(data.imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-fog">
        装备图片（可选）
      </span>
      {imageUrl ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="装备预览"
            className="h-28 w-28 rounded-xl border border-[var(--line-subtle)] object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 cursor-pointer rounded-full bg-canopy p-1 text-white shadow-sm"
            aria-label="移除图片"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line-subtle)] bg-white/50 text-fog transition-colors hover:border-forest hover:text-paper disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-6 w-6" aria-hidden />
          )}
          <span className="text-xs">{uploading ? "上传中" : "添加图片"}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {!imageUrl && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          选择图片
        </Button>
      )}
      <p className="mt-1 text-xs text-fog">JPG / PNG / WebP，最大 5MB</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
