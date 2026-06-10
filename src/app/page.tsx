import Link from "next/link";
import {
  Backpack,
  Brain,
  CloudSun,
  Footprints,
  Map,
  Mountain,
  Sun,
  Tent,
  TreePine,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const EXAMPLES = [
  "川西四姑娘山二峰冲顶，2天1夜，11月，有雪线，3人轻装",
  "雨崩冰湖一日游，夏季，5人常规徒步",
  "武功山2日露营穿越，秋季，重装",
];

const WORKFLOW = [
  {
    label: "描述路线",
    detail: "说说去哪、几天、什么季节，口语即可",
    Icon: Footprints,
  },
  {
    label: "解析条件",
    detail: "读懂海拔、雪线、露营与轻装需求",
    Icon: Mountain,
  },
  {
    label: "生成清单",
    detail: "分类列出装备，勾选打包，支持分工",
    Icon: Backpack,
  },
];

const FEATURES = [
  {
    t: "路线解析",
    d: "天数、海拔、季节、冰雪与露营，山野条件一次读懂",
    Icon: TreePine,
  },
  {
    t: "智能清单",
    d: "AI 思考 + 规则引擎，高海拔到露营都有参考",
    Icon: CloudSun,
  },
  {
    t: "分工导出",
    d: "领队队员各背什么，勾选进度，一键导出",
    Icon: Tent,
  },
];

export default async function HomePage() {
  const session = await auth();
  const newTripBase = session?.user ? "/trips/new" : "/register";

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
      {/* Hero — 路牌 + 日照玻璃 */}
      <section className="landing-animate glass glass-sun relative overflow-hidden rounded-2xl p-6 sm:p-8">
        <div className="mountain-deco" aria-hidden />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <span className="badge-pill">
              <Sun className="h-3.5 w-3.5 text-golden" aria-hidden />
              晴天出行 · 装备清单
            </span>
            <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-tight text-paper sm:text-4xl lg:text-[2.65rem]">
              进山前，
              <br />
              把<span className="text-golden">装备</span>理清楚
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-mist">
              用一句话描述路线，系统读懂山野条件并生成装备清单。勾选、分工、导出，出发前一次搞定。
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {session?.user ? (
                <>
                  <Link href="/trips/new" className="cursor-pointer">
                    <Button size="lg" className="btn-cta rounded-xl px-8">
                      开始规划
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="cursor-pointer">
                    <Button variant="secondary" size="lg" className="rounded-xl">
                      我的行程
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="cursor-pointer">
                    <Button size="lg" className="btn-cta rounded-xl px-8">
                      免费开始
                    </Button>
                  </Link>
                  <Link href="/login" className="cursor-pointer">
                    <Button variant="secondary" size="lg" className="rounded-xl">
                      登录
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <aside
            className="trail-sign w-full lg:w-52"
            aria-label="路线解析示例"
          >
            <p className="trail-sign-label">示例路线</p>
            <p className="trail-sign-elev mt-2">5300</p>
            <p className="text-sm font-medium text-bark">海拔 · 米</p>
            <div className="mt-4 space-y-2 border-t border-[var(--line-subtle)] pt-4">
              {[
                ["天数", "2天1夜"],
                ["季节", "11月"],
                ["条件", "雪线 · 轻装"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-fog">{k}</span>
                  <span className="font-medium text-paper">{v}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* 三步流程 — 真实顺序，路标式标记 */}
      <section
        className="landing-animate landing-animate-delay-1 mt-5 grid gap-4 sm:grid-cols-3"
        aria-label="使用流程"
      >
        {WORKFLOW.map((step, i) => (
          <article key={step.label} className="step-card">
            <div className="flex items-center justify-between">
              <step.Icon className="h-5 w-5 text-forest" aria-hidden />
              <span className="step-marker">步骤 {i + 1}</span>
            </div>
            <h2 className="mt-3 font-display text-lg font-semibold text-paper">
              {step.label}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fog">{step.detail}</p>
          </article>
        ))}
      </section>

      <section className="landing-animate landing-animate-delay-2 glass mt-5 rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-paper">
              试试这样说
            </h2>
            <p className="mt-1 text-sm text-fog">点选真实路线，进入新建行程</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-lg bg-meadow/80 px-2.5 py-1 text-xs font-medium text-forest sm:inline-flex">
            <Map className="h-3.5 w-3.5" aria-hidden />
            3 条路线
          </span>
        </div>
        <ul className="mt-5 space-y-2.5">
          {EXAMPLES.map((ex) => (
            <li key={ex}>
              <Link
                href={`${newTripBase}?example=${encodeURIComponent(ex)}`}
                className="example-pill group"
              >
                <span>「{ex}」</span>
                <span className="shrink-0 text-sm font-semibold text-golden group-hover:text-[var(--golden-light)]">
                  试用
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-animate landing-animate-delay-3 mt-5 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.t} className="feature-card">
            <div className="feature-icon" aria-hidden>
              <f.Icon className="h-5 w-5" strokeWidth={2} />
            </div>
            <h3 className="mt-4 font-display text-base">{f.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fog">{f.d}</p>
          </article>
        ))}
      </section>

      <section className="glass-subtle mt-5 flex items-center gap-3 rounded-2xl p-4">
        <Brain className="h-5 w-5 shrink-0 text-forest" aria-hidden />
        <p className="text-sm text-mist">
          支持 DeepSeek 思考模式解析路线；未配置 API Key 时，自动使用规则模板演示。
        </p>
      </section>
    </div>
  );
}
