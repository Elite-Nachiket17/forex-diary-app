export interface Trade {
  id: number;
  date: string;
  pair: string;
  session: string;
  pnl: number;
  rr: number;
  discipline: "yes" | "no";
  timestamp: number;
  notes?: string;
  screenshot?: string;
  setupGrade?: "A" | "B" | "C";
  emotion?: "Calm" | "Fear" | "Greed" | "FOMO" | "Revenge";
  confidence?: number;
  closingType?: "SL" | "TP" | "Trailing SL" | "Manual";
}

const STORAGE_KEY = "fx_trades";

export function getTrades(): Trade[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveTrades(trades: Trade[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}

export function addTrade(trade: Omit<Trade, "id" | "timestamp">): Trade[] {
  const trades = getTrades();
  const newTrade: Trade = {
    ...trade,
    id: Date.now(),
    timestamp: Date.now(),
  };
  trades.push(newTrade);
  saveTrades(trades);
  return trades;
}

export function deleteTrade(id: number): Trade[] {
  const trades = getTrades().filter((t) => t.id !== id);
  saveTrades(trades);
  return trades;
}

export interface TradeStats {
  totalProfit: number;
  winRate: number;
  expectancy: number;
  maxDrawdown: number;
  avgRR: number;
  totalTrades: number;
  wins: number;
  losses: number;
  disciplineScore: number;
  isTilted: boolean;
}

export function calculateStats(trades: Trade[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalProfit: 0, winRate: 0, expectancy: 0, maxDrawdown: 0,
      avgRR: 0, totalTrades: 0, wins: 0, losses: 0, disciplineScore: 100, isTilted: false,
    };
  }

  const totalProfit = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0).length;
  const losses = trades.length - wins;
  const winRate = (wins / trades.length) * 100;

  const winValues = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
  const lossValues = trades.filter((t) => t.pnl <= 0).map((t) => Math.abs(t.pnl));
  const avgWin = winValues.length ? winValues.reduce((a, b) => a + b, 0) / winValues.length : 0;
  const avgLoss = lossValues.length ? lossValues.reduce((a, b) => a + b, 0) / lossValues.length : 0;
  const expectancy = (wins / trades.length) * avgWin - ((trades.length - wins) / trades.length) * avgLoss;

  let peak = 0, equity = 0, maxDD = 0;
  trades.forEach((t) => {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
  });

  const avgRR = trades.reduce((s, t) => s + t.rr, 0) / trades.length;
  const discTrades = trades.filter((t) => t.discipline === "yes").length;
  const disciplineScore = (discTrades / trades.length) * 100;

  const isTilted = trades.length >= 3 && trades.slice(-3).every((t) => t.pnl < 0);

  return {
    totalProfit, winRate, expectancy, maxDrawdown: maxDD,
    avgRR, totalTrades: trades.length, wins, losses, disciplineScore, isTilted,
  };
}

export function getEquityCurve(trades: Trade[]): { trade: string; equity: number }[] {
  let equity = 0;
  return trades.map((t, i) => {
    equity += t.pnl;
    return { trade: `T${i + 1}`, equity };
  });
}

export interface PairStats {
  pair: string;
  trades: number;
  pnl: number;
  winRate: number;
}

export function getPairStats(trades: Trade[]): PairStats[] {
  const map: Record<string, Trade[]> = {};
  trades.forEach((t) => {
    if (!map[t.pair]) map[t.pair] = [];
    map[t.pair].push(t);
  });
  return Object.entries(map).map(([pair, ts]) => ({
    pair,
    trades: ts.length,
    pnl: ts.reduce((s, t) => s + t.pnl, 0),
    winRate: (ts.filter((t) => t.pnl > 0).length / ts.length) * 100,
  }));
}

export function getSessionStats(trades: Trade[]): { session: string; count: number; pnl: number }[] {
  const map: Record<string, { count: number; pnl: number }> = {};
  trades.forEach((t) => {
    if (!map[t.session]) map[t.session] = { count: 0, pnl: 0 };
    map[t.session].count++;
    map[t.session].pnl += t.pnl;
  });
  return Object.entries(map).map(([session, data]) => ({ session, ...data }));
}

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = ["Date", "Pair", "Session", "P&L", "R:R", "Discipline", "Setup Grade", "Emotion", "Confidence", "Notes"];
  const rows = trades.map((t) => [
    t.date,
    t.pair,
    t.session,
    t.pnl.toFixed(2),
    t.rr.toString(),
    t.discipline,
    t.setupGrade || "",
    t.emotion || "",
    t.confidence?.toString() || "",
    `"${(t.notes || "").replace(/"/g, '""')}"`,
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

export function getCalendarData(trades: Trade[]): Record<string, { pnl: number; count: number }> {
  const map: Record<string, { pnl: number; count: number }> = {};
  trades.forEach((t) => {
    if (!map[t.date]) map[t.date] = { pnl: 0, count: 0 };
    map[t.date].pnl += t.pnl;
    map[t.date].count++;
  });
  return map;
}

export function getAdvancedStats(trades: Trade[]) {
  if (trades.length === 0) return null;

  // Profit Factor
  const grossProfit = trades.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? grossProfit || 0 : grossProfit / grossLoss;

  // Streaks
  let currentStreak = 0, maxWinStreak = 0, maxLoseStreak = 0, tempWin = 0, tempLose = 0;
  trades.forEach(t => {
    if (t.pnl > 0) { tempWin++; tempLose = 0; maxWinStreak = Math.max(maxWinStreak, tempWin); }
    else { tempLose++; tempWin = 0; maxLoseStreak = Math.max(maxLoseStreak, tempLose); }
  });
  const last = trades[trades.length - 1];
  if (last) {
    let dir = last.pnl > 0 ? 1 : -1;
    currentStreak = 0;
    for (let i = trades.length - 1; i >= 0; i--) {
      if ((trades[i].pnl > 0 ? 1 : -1) === dir) currentStreak++;
      else break;
    }
    currentStreak *= dir;
  }

  // Best / Worst day
  const dailyPnl: Record<string, number> = {};
  trades.forEach(t => { dailyPnl[t.date] = (dailyPnl[t.date] || 0) + t.pnl; });
  const dailyEntries = Object.entries(dailyPnl);
  const bestDay = dailyEntries.reduce((a, b) => b[1] > a[1] ? b : a, ["", -Infinity]);
  const worstDay = dailyEntries.reduce((a, b) => b[1] < a[1] ? b : a, ["", Infinity]);

  // Avg win / avg loss
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;

  // Weekly P&L
  const weeklyPnl: Record<string, number> = {};
  trades.forEach(t => {
    const d = new Date(t.date);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());
    const key = startOfWeek.toISOString().slice(0, 10);
    weeklyPnl[key] = (weeklyPnl[key] || 0) + t.pnl;
  });

  // Monthly P&L
  const monthlyPnl: Record<string, number> = {};
  trades.forEach(t => {
    const key = t.date.slice(0, 7); // YYYY-MM
    monthlyPnl[key] = (monthlyPnl[key] || 0) + t.pnl;
  });

  // Emotion breakdown
  const emotionStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  trades.forEach(t => {
    const e = t.emotion || "Unknown";
    if (!emotionStats[e]) emotionStats[e] = { count: 0, pnl: 0, wins: 0 };
    emotionStats[e].count++;
    emotionStats[e].pnl += t.pnl;
    if (t.pnl > 0) emotionStats[e].wins++;
  });

  // Setup grade breakdown
  const gradeStats: Record<string, { count: number; pnl: number; wins: number }> = {};
  trades.forEach(t => {
    const g = t.setupGrade || "Ungraded";
    if (!gradeStats[g]) gradeStats[g] = { count: 0, pnl: 0, wins: 0 };
    gradeStats[g].count++;
    gradeStats[g].pnl += t.pnl;
    if (t.pnl > 0) gradeStats[g].wins++;
  });

  // Discipline breakdown
  const discYes = trades.filter(t => t.discipline === "yes");
  const discNo = trades.filter(t => t.discipline === "no");
  const disciplineBreakdown = {
    disciplined: { count: discYes.length, pnl: discYes.reduce((s, t) => s + t.pnl, 0), winRate: discYes.length ? (discYes.filter(t => t.pnl > 0).length / discYes.length) * 100 : 0 },
    undisciplined: { count: discNo.length, pnl: discNo.reduce((s, t) => s + t.pnl, 0), winRate: discNo.length ? (discNo.filter(t => t.pnl > 0).length / discNo.length) * 100 : 0 },
  };

  return {
    profitFactor,
    maxWinStreak,
    maxLoseStreak,
    currentStreak,
    bestDay: { date: bestDay[0], pnl: bestDay[1] as number },
    worstDay: { date: worstDay[0], pnl: worstDay[1] as number },
    avgWin,
    avgLoss,
    weeklyPnl: Object.entries(weeklyPnl).map(([week, pnl]) => ({ week, pnl })).sort((a, b) => a.week.localeCompare(b.week)),
    monthlyPnl: Object.entries(monthlyPnl).map(([month, pnl]) => ({ month, pnl })).sort((a, b) => a.month.localeCompare(b.month)),
    emotionStats: Object.entries(emotionStats).map(([emotion, d]) => ({ emotion, ...d, winRate: (d.wins / d.count) * 100 })),
    gradeStats: Object.entries(gradeStats).map(([grade, d]) => ({ grade, ...d, winRate: (d.wins / d.count) * 100 })),
    disciplineBreakdown,
  };
}

export const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF", "XAUUSD", "BTCUSD"];
export const SESSIONS = ["London", "New York", "Asian"];
export const SETUP_GRADES = ["A", "B", "C"] as const;
export const EMOTIONS = ["Calm", "Fear", "Greed", "FOMO", "Revenge"] as const;
export const CLOSING_TYPES = ["SL", "TP", "Trailing SL", "Manual"] as const;
