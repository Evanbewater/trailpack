import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getTripForUser } from "@/lib/trips/persistence";
import { ExportActions } from "@/components/export-actions";

type Props = { params: Promise<{ id: string }> };

function buildMarkdown(
  title: string,
  description: string,
  items: { name: string; category: string; priority: string; checked: boolean }[],
  riskNotes: string | null,
): string {
  const lines = [
    `# ${title}`,
    "",
    "## 行程描述",
    description,
    "",
  ];
  if (riskNotes) {
    lines.push("## 风险提示", riskNotes, "");
  }
  lines.push("## 装备清单", "");
  const byCat = items.reduce<Record<string, typeof items>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});
  for (const [cat, catItems] of Object.entries(byCat)) {
    lines.push(`### ${cat}`, "");
    for (const item of catItems) {
      const box = item.checked ? "x" : " ";
      lines.push(`- [${box}] **${item.name}** (${item.priority})`);
    }
    lines.push("");
  }
  lines.push("---", "*由 Trailpack 生成 · 仅供参考*");
  return lines.join("\n");
}

export default async function ExportPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const trip = await getTripForUser(id, session.user.id);
  if (!trip) notFound();

  const checklist = trip.checklists[0];
  if (!checklist) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="glass rounded-2xl p-8 text-center text-fog">
          请先生成清单
          <Link
            href={`/trips/${id}`}
            className="mt-4 block cursor-pointer font-medium text-primary hover:text-dawn-bright"
          >
            返回行程
          </Link>
        </div>
      </div>
    );
  }

  const markdown = buildMarkdown(
    trip.title,
    trip.rawDescription,
    checklist.items,
    trip.riskNotes,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/trips/${id}`}
        className="inline-flex cursor-pointer items-center gap-1 text-sm text-fog transition-colors hover:text-paper"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        返回行程
      </Link>
      <div className="glass mt-4 rounded-2xl p-6">
        <h1 className="font-display text-2xl font-bold text-paper">导出清单</h1>
        <ExportActions markdown={markdown} />
        <pre className="mt-6 overflow-x-auto rounded-xl border border-[var(--line-subtle)] bg-white/50 p-4 text-xs whitespace-pre-wrap text-mist backdrop-blur-sm">
          {markdown}
        </pre>
      </div>
    </div>
  );
}
