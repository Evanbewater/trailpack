import type { ParsedRoute } from "@/lib/schemas/route";
import type { ChecklistGeneration } from "@/lib/schemas/route";

type GearItem = ChecklistGeneration["items"][number];

function item(
  name: string,
  category: string,
  priority: GearItem["priority"],
  reason?: string,
  isShared = false,
): GearItem {
  return { name, category, priority, reason, isShared };
}

const BASE: GearItem[] = [
  item("徒步鞋/登山鞋", "鞋袜", "必需", "路况与负重匹配"),
  item("排汗速干内衣", "服装层", "必需"),
  item("中层保暖（抓绒/薄羽绒）", "服装层", "建议"),
  item("防风防水硬壳", "服装层", "必需", "山区天气多变"),
  item("速干裤/软壳裤", "服装层", "必需"),
  item("登山袜（备一双）", "鞋袜", "建议"),
  item("遮阳帽/保暖帽", "服装层", "建议"),
  item("墨镜", "个人护理", "建议", "高海拔紫外线强"),
  item("头灯+备用电池", "安全急救", "必需", "延误或摸黑下撤"),
  item("登山杖", "安全急救", "建议", "节省膝盖"),
  item("双肩包（容量匹配天数）", "背负", "必需"),
  item("雨衣/雨披", "服装层", "必需"),
  item("保温水壶/水袋", "餐饮", "必需"),
  item("路餐与电解质", "餐饮", "必需"),
  item("急救包（创可贴、绷带、消毒）", "安全急救", "必需"),
  item("个人常用药", "安全急救", "建议"),
  item("防晒霜", "个人护理", "建议"),
  item("充电宝", "导航通讯", "建议"),
  item("离线地图/轨迹（手机+备份）", "导航通讯", "必需"),
  item("身份证/现金", "证件杂物", "必需"),
];

const CAMP: GearItem[] = [
  item("帐篷", "露营", "必需", "过夜", true),
  item("睡袋（温标匹配环境）", "露营", "必需", "过夜", true),
  item("防潮垫", "露营", "必需", "过夜", true),
  item("炉具+气罐", "餐饮", "建议", "热食与 morale", true),
  item("头灯营地模式", "露营", "建议"),
];

const SNOW: GearItem[] = [
  item("冰爪", "安全急救", "必需", "冰雪路段"),
  item("雪套", "鞋袜", "建议", "深雪防灌鞋"),
  item("手套（防水保暖）", "服装层", "必需"),
];

const HIGH_ALT: GearItem[] = [
  item("厚羽绒服/厚保暖层", "服装层", "必需", "高海拔低温"),
  item("保温手套", "服装层", "必需"),
  item("高反药物（遵医嘱）", "安全急救", "建议"),
  item("血氧仪（可选）", "安全急救", "可选"),
];

const CLIMB: GearItem[] = [
  item("头盔", "安全急救", "建议", "落石或技术路段"),
  item("安全带+主锁（技术线）", "安全急救", "可选", "视路线要求"),
];

const SHARED: GearItem[] = [
  item("团队急救包扩充版", "安全急救", "建议", "公共物资", true),
  item("卫星电话/对讲机", "导航通讯", "可选", "无人区建议", true),
  item("营地绳/晾衣绳", "露营", "可选", undefined, true),
];

export function generateGearFromRules(route: ParsedRoute): ChecklistGeneration {
  const items: GearItem[] = [...BASE];

  if (route.overnightCamping || route.activityType === "露营") {
    items.push(...CAMP);
  }
  if (route.hasSnow || route.season === "冬") {
    items.push(...SNOW);
  }
  if (
    route.activityType === "高海拔" ||
    (route.maxAltitudeM && route.maxAltitudeM >= 3500)
  ) {
    items.push(...HIGH_ALT);
  }
  if (route.activityType === "登山") {
    items.push(...CLIMB);
  }
  if (route.groupSize && route.groupSize >= 2) {
    items.push(...SHARED);
  }
  if (route.lightweight) {
    items.push(
      item("轻量化背包", "背负", "建议", "轻装策略"),
      item("精简冗余衣物", "服装层", "建议", "控制重量"),
    );
  }
  if (route.hasWaterCrossing) {
    items.push(item("备用干爽袜子", "鞋袜", "必需", "涉水后更换"));
  }

  const deduped = dedupeItems(items);

  const riskParts: string[] = [
    "本清单由规则模板生成（演示模式）。配置 DEEPSEEK_API_KEY 后可启用 AI 个性化推荐。",
  ];
  if (route.maxAltitudeM && route.maxAltitudeM >= 3000) {
    riskParts.push(`海拔约 ${route.maxAltitudeM}m：注意高反，循序渐进，携带保暖层。`);
  }
  if (route.hasSnow) riskParts.push("存在冰雪路段：评估冰爪使用时机，注意滑坠。");
  if (route.season === "冬") riskParts.push("冬季：缩短暴露时间，关注风寒与日照窗口。");

  const groupSize = route.groupSize ?? 3;
  const assignments = buildAssignments(deduped, groupSize);

  return {
    analysisNotes: buildAnalysis(route),
    riskNotes: riskParts.join("\n"),
    items: deduped,
    assignments,
  };
}

function dedupeItems(items: GearItem[]): GearItem[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = i.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildAnalysis(route: ParsedRoute): string {
  const parts = [
    `活动类型：${route.activityType}`,
    route.region ? `区域：${route.region}` : null,
    route.days ? `天数：${route.days} 天` : null,
    route.season !== "未知" ? `季节：${route.season}` : null,
    route.difficulty !== "未知" ? `难度：${route.difficulty}` : null,
    route.groupSize ? `人数：${route.groupSize} 人` : null,
  ].filter(Boolean);
  if (route.highlights.length) {
    parts.push(`要点：${route.highlights.join("；")}`);
  }
  return parts.join(" · ");
}

function buildAssignments(
  items: GearItem[],
  groupSize: number,
): ChecklistGeneration["assignments"] {
  const sharedNames = items.filter((i) => i.isShared).map((i) => i.name);
  const personalNames = items.filter((i) => !i.isShared).map((i) => i.name);

  const leaderShared = sharedNames.slice(0, Math.ceil(sharedNames.length / 2));
  const member2Shared = sharedNames.slice(leaderShared.length);

  return [
    {
      roleLabel: "领队",
      memberName: "队员 A",
      itemNames: [
        ...leaderShared,
        ...personalNames.slice(0, Math.ceil(personalNames.length / groupSize)),
      ],
    },
    {
      roleLabel: "队员",
      memberName: "队员 B",
      itemNames: [
        ...member2Shared,
        ...personalNames.slice(
          Math.ceil(personalNames.length / groupSize),
          Math.ceil((personalNames.length * 2) / groupSize),
        ),
      ],
    },
    ...(groupSize > 2
      ? [
          {
            roleLabel: "队员",
            memberName: "队员 C+",
            itemNames: personalNames.slice(
              Math.ceil((personalNames.length * 2) / groupSize),
            ),
          },
        ]
      : []),
  ];
}
