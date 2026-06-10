import { chatJson, isLlmConfigured } from "@/lib/llm/client";
import {
  checklistGenerationSchema,
  type ChecklistGeneration,
  type ParsedRoute,
} from "@/lib/schemas/route";
import { generateGearFromRules } from "@/lib/rules/gear-rules";

const GENERATE_SYSTEM = `你是专业户外装备顾问。根据结构化路线信息生成装备清单，输出严格 JSON：
{
  "analysisNotes": "路线与装备策略分析（中文）",
  "riskNotes": "风险与注意事项（中文，含海拔/天气/地形）",
  "items": [{"name":"","category":"","priority":"必需|建议|可选","reason":"","isShared":false}],
  "assignments": [{"roleLabel":"领队|队员|摄影|后勤","memberName":"","itemNames":[]}]
}
分类使用：服装层、鞋袜、背负、导航通讯、安全急救、餐饮、露营、个人护理、证件杂物。
安全类必需项不可省略；结合季节、海拔、露营、冰雪、人数做个性化推荐。`;

export async function generateChecklist(
  route: ParsedRoute,
  rawDescription: string,
  weatherSummary?: string,
): Promise<{
  data: ChecklistGeneration;
  demoMode: boolean;
  reasoning?: string;
  aiError?: string;
}> {
  const rulesBase = generateGearFromRules(route);

  if (!isLlmConfigured()) {
    let riskNotes = rulesBase.riskNotes;
    if (weatherSummary) {
      riskNotes = `${weatherSummary}\n\n${riskNotes}`;
    }
    return {
      data: { ...rulesBase, riskNotes },
      demoMode: true,
      aiError: "DEEPSEEK_API_KEY 未配置",
    };
  }

  try {
    const userPrompt = JSON.stringify(
      { route, rawDescription, weatherSummary },
      null,
      2,
    );
    const { data: raw, reasoning } = await chatJson<unknown>(
      GENERATE_SYSTEM,
      userPrompt,
    );
    const ai = checklistGenerationSchema.parse(raw);
    const merged = mergeWithRules(ai, rulesBase);
    return { data: merged, demoMode: false, reasoning };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI 生成失败";
    console.error("[generateChecklist]", message);
    return { data: rulesBase, demoMode: true, aiError: message };
  }
}

function mergeWithRules(
  ai: ChecklistGeneration,
  rules: ChecklistGeneration,
): ChecklistGeneration {
  const requiredFromRules = rules.items.filter((i) => i.priority === "必需");
  const map = new Map<string, ChecklistGeneration["items"][number]>();
  for (const item of [...ai.items, ...requiredFromRules]) {
    const existing = map.get(item.name);
    if (!existing || item.priority === "必需") {
      map.set(item.name, item);
    }
  }
  return {
    analysisNotes: ai.analysisNotes || rules.analysisNotes,
    riskNotes: [ai.riskNotes, rules.riskNotes].filter(Boolean).join("\n\n"),
    items: Array.from(map.values()),
    assignments: ai.assignments.length ? ai.assignments : rules.assignments,
  };
}
