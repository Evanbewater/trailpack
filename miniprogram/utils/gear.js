const { GEAR_CATEGORIES } = require("./constants");
const { API_BASE } = require("./config");

function groupByCategory(gear) {
  const map = {};
  (gear || []).forEach((item) => {
    const cat = item.category || "其他";
    if (!map[cat]) map[cat] = [];
    map[cat].push(item);
  });

  const ordered = [];
  GEAR_CATEGORIES.forEach((cat) => {
    if (map[cat] && map[cat].length) {
      ordered.push({ category: cat, items: map[cat], count: map[cat].length });
      delete map[cat];
    }
  });
  Object.keys(map).forEach((cat) => {
    if (map[cat].length) {
      ordered.push({ category: cat, items: map[cat], count: map[cat].length });
    }
  });
  return ordered;
}

function getCategoryStats(gear) {
  const counts = {};
  (gear || []).forEach((item) => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return GEAR_CATEGORIES.filter((c) => counts[c] > 0).map((category) => ({
    category,
    count: counts[category],
  }));
}

function formatWeightG(weightG) {
  if (!weightG || weightG <= 0) return "";
  if (weightG >= 1000) {
    const kg = weightG / 1000;
    const rounded = kg % 1 === 0 ? String(kg) : kg.toFixed(1);
    return rounded + "kg";
  }
  return weightG + "g";
}

function gearMetaLine(item) {
  return [item.brand, formatWeightG(item.weightG), item.note]
    .filter(Boolean)
    .join(" · ");
}

function parseWeightGInput(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return undefined;
  const n = parseInt(trimmed, 10);
  if (isNaN(n) || n <= 0) return undefined;
  return n;
}

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http")) return imageUrl;
  return `${API_BASE}${imageUrl}`;
}

function enrichGear(gear) {
  return (gear || []).map((item) => ({
    ...item,
    metaLine: gearMetaLine(item),
    imageFullUrl: resolveImageUrl(item.imageUrl),
  }));
}

module.exports = {
  groupByCategory,
  getCategoryStats,
  formatWeightG,
  gearMetaLine,
  parseWeightGInput,
  resolveImageUrl,
  enrichGear,
};
