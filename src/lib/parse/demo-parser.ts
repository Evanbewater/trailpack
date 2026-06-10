import type { ParsedRoute } from "@/lib/schemas/route";

const MONTH_SEASON: Record<number, ParsedRoute["season"]> = {
  1: "冬",
  2: "冬",
  3: "春",
  4: "春",
  5: "春",
  6: "夏",
  7: "夏",
  8: "夏",
  9: "秋",
  10: "秋",
  11: "秋",
  12: "冬",
};

export function parseRouteDemo(description: string): ParsedRoute {
  const text = description.trim();
  const lower = text.toLowerCase();

  let days: number | undefined;
  const dayMatch = text.match(/(\d+)\s*天/);
  if (dayMatch) days = parseInt(dayMatch[1], 10);

  let groupSize: number | undefined;
  const peopleMatch = text.match(/(\d+)\s*人/);
  if (peopleMatch) groupSize = parseInt(peopleMatch[1], 10);

  let maxAltitudeM: number | undefined;
  const altMatch =
    text.match(/(\d{3,4})\s*m/i) ?? text.match(/海拔[约]?\s*(\d{3,4})/);
  if (altMatch) maxAltitudeM = parseInt(altMatch[1], 10);
  if (/四姑娘|贡嘎|珠峰|6000|5000|高海拔|雪山/.test(text)) {
    maxAltitudeM = maxAltitudeM ?? 4500;
  }

  let season: ParsedRoute["season"] = "未知";
  const monthMatch = text.match(/(\d{1,2})\s*月/);
  if (monthMatch) {
    season = MONTH_SEASON[parseInt(monthMatch[1], 10)] ?? "未知";
  } else if (/春天|春季/.test(text)) season = "春";
  else if (/夏天|夏季/.test(text)) season = "夏";
  else if (/秋天|秋季/.test(text)) season = "秋";
  else if (/冬天|冬季|雪季/.test(text)) season = "冬";

  let activityType: ParsedRoute["activityType"] = "一日徒步";
  if (/露营|营地|帐篷/.test(text)) activityType = "露营";
  else if (days && days > 1) activityType = "多日徒步";
  if (/登山|冲顶|技术攀登|攀岩/.test(text)) activityType = "登山";
  if (/高海拔|雪山|冰川/.test(text)) activityType = "高海拔";
  if (/越野跑|trail run/i.test(lower)) activityType = "越野跑";

  let difficulty: ParsedRoute["difficulty"] = "中级";
  if (/休闲|入门|新手|轻松/.test(text)) difficulty = "初级";
  if (/困难|硬核|极限|技术型/.test(text)) difficulty = "高级";

  const hasSnow = /雪|冰雪|冰爪|雪地/.test(text);
  const hasWaterCrossing = /涉水|溪流|过河/.test(text);
  const overnightCamping =
    /露营|扎营|帐篷|过夜/.test(text) || (days !== undefined && days > 1);
  const lightweight = /轻装|UL|超轻/.test(text);

  const regionMatch = text.match(
    /([\u4e00-\u9fa5]{2,8}(?:山|峰|湖|谷|沟|岛|坡|顶|村|镇|县|州|川|滇|藏|疆|蒙|桂|黔|湘|鄂|赣|闽|浙|苏|皖|鲁|豫|冀|晋|陕|甘|青|宁|辽|吉|黑|粤|港|澳|台|地区|国家公园|森林公园))/,
  );
  const region = regionMatch?.[1];

  const title =
    text.length > 32 ? `${text.slice(0, 30)}…` : text || "未命名行程";

  const highlights: string[] = [];
  if (hasSnow) highlights.push("可能遇雪/冰雪路段");
  if (maxAltitudeM && maxAltitudeM >= 3500) highlights.push("高海拔需防高反");
  if (overnightCamping) highlights.push("含露营过夜");
  if (lightweight) highlights.push("轻装策略");

  return {
    title,
    region,
    days,
    season,
    difficulty,
    activityType,
    groupSize,
    maxAltitudeM,
    hasSnow,
    hasWaterCrossing,
    overnightCamping,
    lightweight,
    highlights,
  };
}
