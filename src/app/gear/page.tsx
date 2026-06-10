import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GearManager } from "@/components/gear-manager";

export default async function GearPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const gear = await prisma.personalGear.findMany({
    where: { userId: session.user.id },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/dashboard"
        className="inline-flex cursor-pointer items-center gap-1 text-sm text-fog transition-colors hover:text-paper"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        返回行程
      </Link>
      <div className="mt-4">
        <GearManager initialGear={gear} />
      </div>
    </div>
  );
}
