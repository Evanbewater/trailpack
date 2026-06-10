"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tripId: string;
};

export function TripShareLink({ tripId }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/trips/${tripId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={copyLink}
      className="gap-1.5"
    >
      <Link2 className="h-3.5 w-3.5" aria-hidden />
      {copied ? "已复制链接" : "复制链接"}
    </Button>
  );
}
