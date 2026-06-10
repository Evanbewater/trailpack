import { GEAR_CATEGORIES } from "@/lib/schemas/route";

export type GearLike = { category: string };

export function groupGearByCategory<T extends GearLike>(
  gear: T[],
): { category: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  for (const item of gear) {
    const cat = item.category || "其他";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }

  const ordered: { category: string; items: T[] }[] = [];
  for (const cat of GEAR_CATEGORIES) {
    const items = map.get(cat);
    if (items?.length) ordered.push({ category: cat, items });
    map.delete(cat);
  }
  for (const [category, items] of map) {
    if (items.length) ordered.push({ category, items });
  }
  return ordered;
}

export function getCategoryStats<T extends GearLike>(
  gear: T[],
): { category: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const item of gear) {
    counts[item.category] = (counts[item.category] || 0) + 1;
  }
  return GEAR_CATEGORIES.filter((c) => counts[c] > 0).map((category) => ({
    category,
    count: counts[category],
  }));
}
