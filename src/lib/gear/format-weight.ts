/** 将克数格式化为可读重量，如 450g、1.2kg */
export function formatWeightG(weightG: number | null | undefined): string | null {
  if (weightG == null || weightG <= 0) return null;
  if (weightG >= 1000) {
    const kg = weightG / 1000;
    const rounded = kg % 1 === 0 ? kg.toFixed(0) : kg.toFixed(1);
    return `${rounded}kg`;
  }
  return `${weightG}g`;
}

export function parseWeightGInput(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const n = parseInt(trimmed, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return n;
}
