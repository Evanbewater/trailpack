"use client";

import { Button } from "@/components/ui/button";

export function ExportActions({ markdown }: { markdown: string }) {
  function copy() {
    void navigator.clipboard.writeText(markdown);
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trailpack-checklist.md";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-4 flex gap-2">
      <Button variant="secondary" size="sm" onClick={copy}>
        复制 Markdown
      </Button>
      <Button variant="secondary" size="sm" onClick={download}>
        下载 .md
      </Button>
    </div>
  );
}
