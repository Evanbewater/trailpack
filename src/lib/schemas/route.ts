import { z } from "zod";

export const parsedRouteSchema = z.object({
  title: z.string(),
  region: z.string().optional(),
  days: z.number().int().positive().optional(),
  season: z.enum(["春", "夏", "秋", "冬", "未知"]).default("未知"),
  difficulty: z.enum(["休闲", "初级", "中级", "高级", "极限", "未知"]).default("未知"),
  activityType: z
    .enum(["一日徒步", "多日徒步", "登山", "高海拔", "越野跑", "露营", "未知"])
    .default("未知"),
  groupSize: z.number().int().positive().optional(),
  maxAltitudeM: z.number().int().nonnegative().optional(),
  hasSnow: z.boolean().default(false),
  hasWaterCrossing: z.boolean().default(false),
  overnightCamping: z.boolean().default(false),
  lightweight: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
});

export type ParsedRoute = z.infer<typeof parsedRouteSchema>;

export const checklistItemSchema = z.object({
  name: z.string(),
  category: z.string(),
  priority: z.enum(["必需", "建议", "可选"]),
  reason: z.string().optional(),
  isShared: z.boolean().default(false),
});

export const checklistGenerationSchema = z.object({
  analysisNotes: z.string(),
  riskNotes: z.string(),
  items: z.array(checklistItemSchema),
  assignments: z
    .array(
      z.object({
        roleLabel: z.string(),
        memberName: z.string().optional(),
        itemNames: z.array(z.string()),
      }),
    )
    .default([]),
});

export type ChecklistGeneration = z.infer<typeof checklistGenerationSchema>;

export const GEAR_CATEGORIES = [
  "服装层",
  "鞋袜",
  "背负",
  "导航通讯",
  "安全急救",
  "餐饮",
  "露营",
  "个人护理",
  "证件杂物",
] as const;
