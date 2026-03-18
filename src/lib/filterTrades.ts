import type { Trade } from "@/lib/trades";

export function filterTradesByDateRange(
  trades: Trade[],
  from: Date | undefined,
  to: Date | undefined
): Trade[] {
  if (!from && !to) return trades;
  return trades.filter((t) => {
    const d = new Date(t.date);
    if (from && d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
    if (to && d > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
    return true;
  });
}
