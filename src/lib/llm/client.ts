export function isLlmConfigured(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim());
}

export function isThinkingEnabled(): boolean {
  const model = getDeepSeekModel();
  if (model.includes("reasoner")) return true;
  return process.env.DEEPSEEK_THINKING_ENABLED === "true";
}

export function getDeepSeekModel(): string {
  if (process.env.DEEPSEEK_MODEL?.trim()) {
    return process.env.DEEPSEEK_MODEL.trim();
  }
  return process.env.DEEPSEEK_THINKING_ENABLED === "true"
    ? "deepseek-reasoner"
    : "deepseek-chat";
}

export type LlmJsonResult<T> = {
  data: T;
  reasoning?: string;
};

type ChatMessage = {
  role: string;
  content?: string;
  reasoning_content?: string;
};

function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) {
      return JSON.parse(fence[1].trim()) as T;
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error("Failed to parse JSON from LLM response");
  }
}

function buildRequestBody(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  thinking: boolean,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };

  if (thinking) {
    const effort = process.env.DEEPSEEK_REASONING_EFFORT?.trim();
    if (effort === "high" || effort === "max") {
      body.reasoning_effort = effort;
    }
    // deepseek-reasoner / reasoning models 需要显式开启 thinking，
    // 否则可能拿不到 reasoning_content（导致页面“思考面板”为空）。
    body.thinking = { type: "enabled" };
    body.response_format = { type: "json_object" };
  } else {
    body.response_format = { type: "json_object" };
    body.temperature = 0.3;
  }

  return body;
}

export async function chatJson<T>(
  systemPrompt: string,
  userPrompt: string,
): Promise<LlmJsonResult<T>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = getDeepSeekModel();
  const thinking = isThinkingEnabled();

  const jsonHint = thinking
    ? "\n\n最终回答必须是合法 JSON 对象，不要包含 markdown 代码块或其它说明文字。"
    : "";
  const system = systemPrompt + jsonHint;

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildRequestBody(system, userPrompt, model, thinking)),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    choices?: {
      message?: ChatMessage;
    }[];
  };

  const message = data.choices?.[0]?.message;
  const content = message?.content;
  if (!content) throw new Error("Empty LLM response");

  return {
    data: extractJson<T>(content),
    reasoning: message?.reasoning_content?.trim() || undefined,
  };
}
