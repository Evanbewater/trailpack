import { Suspense } from "react";
import { NewTripForm } from "@/components/new-trip-form";

export default function NewTripPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-paper">新建行程</h1>
        <p className="mt-2 text-sm text-fog">
          用自然语言描述你的路线、季节、人数与特殊路况。
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <p className="text-sm text-fog">加载中…</p>
            }
          >
            <NewTripForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
