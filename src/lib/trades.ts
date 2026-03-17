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

export const PAIRS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "NZDUSD", "USDCHF", "XAUUSD", "BTCUSD"];
export const SESSIONS = ["London", "New York", "Asian"];
export const SETUP_GRADES = ["A", "B", "C"] as const;
export const EMOTIONS = ["Calm", "Fear", "Greed", "FOMO", "Revenge"] as const;
