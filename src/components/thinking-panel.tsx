"use client";

import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type Props = {
  title: string;
  reasoning: string;
  defaultOpen?: boolean;
};

export function ThinkingPanel({
  title,
  reasoning,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-forest/20 bg-forest/5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors duration-200 hover:bg-forest/5"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-forest">
          <Brain className="h-4 w-4" aria-hidden />
          {title}
        </span>
        <span className="flex items-center gap-1 text-xs text-fog">
          {open ? (
            <>
              收起 <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            </>
          ) : (
            <>
              展开 <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-forest/15 px-4 py-3">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-mist">
            {reasoning}
          </p>
        </div>
      )}
    </section>
  );
}
