import { ZodError } from "zod";
import {
  createPersonalGearSchema,
  updatePersonalGearSchema,
} from "@/lib/schemas/gear";

function normalizeRaw(body: unknown): unknown {
  if (typeof body !== "object" || body === null) return body;
  const b = { ...(body as Record<string, unknown>) };
  if (b.imageUrl === "") b.imageUrl = null;
  if (b.brand === "") delete b.brand;
  if (b.note === "") delete b.note;
  return b;
}

export function parseCreateGearBody(body: unknown) {
  return createPersonalGearSchema.parse(normalizeRaw(body));
}

export function parseUpdateGearBody(body: unknown) {
  return updatePersonalGearSchema.parse(normalizeRaw(body));
}

export function formatGearParseError(e: unknown): string {
  if (e instanceof ZodError) {
    return e.issues.map((i) => i.message).join("；") || "数据格式错误";
  }
  if (e instanceof Error) return e.message;
  return "操作失败";
}
