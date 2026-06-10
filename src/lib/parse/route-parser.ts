import { chatJson, isLlmConfigured } from "@/lib/llm/client";
import {
  parsedRouteSchema,
  type ParsedRoute,
} from "@/lib/schemas/route";
import { parseRouteDemo } from "./demo-parser";

const PARSE_SYSTEM = `你是户外路线分析助手。根据用户的自然语言行程描述，输出严格 JSON（不要 markdown）。
字段：title, region, days, season(春|夏|秋|冬|未知), difficulty(休闲|初级|中级|高级|极限|未知),
activityType(一日徒步|多日徒步|登山|高海拔|越野跑|露营|未知), groupSize, maxAltitudeM,
hasSnow, hasWaterCrossing, overnightCamping, lightweight, highlights(字符串数组)。
合理推断缺失信息，中文 title 简短概括行程。`;

export type ParseRouteResult = {
  route: ParsedRoute;
  demoMode: boolean;
  reasoning?: string;
  aiError?: string;
};

export async function parseRouteDescription(
  description: string,
): Promise<ParseRouteResult> {
  if (!isLlmConfigured()) {
    return {
      route: parseRouteDemo(description),
      demoMode: true,
      aiError: "DEEPSEEK_API_KEY 未配置",
    };
  }

  try {
    const { data, reasoning } = await chatJson<unknown>(
      PARSE_SYSTEM,
      description,
    );
    const route = parsedRouteSchema.parse(data);
    return { route, demoMode: false, reasoning };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI 解析失败";
    console.error("[parseRouteDescription]", message);
    return {
      route: parseRouteDemo(description),
      demoMode: true,
      aiError: message,
    };
  }
}
