export function DemoBanner() {
  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 backdrop-blur-sm">
      <strong>演示生成</strong>：该行程当前使用规则模板生成（已保存为 demoMode）。
      如果你已经在 <code className="rounded bg-amber-100/80 px-1">.env</code> 配置了{" "}
      <code className="rounded bg-amber-100/80 px-1">DEEPSEEK_API_KEY</code>，请依次点击
      「解析路线」与「生成装备清单」重新生成，即可启用 AI 思考模式。
    </div>
  );
}
