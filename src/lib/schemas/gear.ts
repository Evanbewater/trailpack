import { z } from "zod";
import { GEAR_CATEGORIES } from "@/lib/schemas/route";

export const gearCategorySchema = z.enum(GEAR_CATEGORIES);

export const createPersonalGearSchema = z.object({
  name: z.string().min(1).max(100),
  category: gearCategorySchema,
  note: z.string().max(500).optional(),
  brand: z.string().max(100).optional(),
  weightG: z.number().int().positive().max(500000).optional(),
  imageUrl: z
    .union([
      z
        .string()
        .max(2048)
        .refine(
          (v) => v.startsWith("/uploads/gear/") || v.startsWith("https://"),
          "无效图片路径",
        ),
      z.null(),
    ])
    .optional(),
});

export const updatePersonalGearSchema = createPersonalGearSchema.partial();

export const addChecklistItemsSchema = z.object({
  personalGearIds: z.array(z.string().min(1)).min(1).max(50),
});
