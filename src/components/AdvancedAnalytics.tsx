import { useMemo } from "react";
import type { Trade } from "@/lib/trades";
import { getAdvancedStats, getPairStats, getSessionStats } from "@/lib/trades";
import { StatCard } from "@/components/StatCard";
import { PairPerformance } from "@/components/PairPerformance";
import { SessionChart } from "@/components/SessionChart";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp, TrendingDown, Flame, Target, Brain, Shield } from "lucide-react";

interface Props {
  trades: Trade[];
  stats: { totalTrades: number; wins: number; losses: number };
}

function MiniStatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className={color || "text-primary"}>{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className={`text-xl font-bold tabular-nums ${color || "text-card-foreground"}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: { label: string; count: number; winRate: number; pnl: number }[] }) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="px-4 py-2 text-left font-semibold text-xs">Category</th>
            <th className="px-4 py-2 text-right font-semibold text-xs">Trades</th>
            <th className="px-4 py-2 text-right font-semibold text-xs">Win%</th>
            <th className="px-4 py-2 text-right font-semibold text-xs">P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.label} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 font-semibold">{r.label}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{r.count}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{r.winRate.toFixed(1)}%</td>
              <td className={`px-4 py-2.5 text-right tabular-nums font-bold ${r.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdvancedAnalytics({ trades, stats }: Props) {
  const advanced = useMemo(() => getAdvancedStats(trades), [trades]);
  const pairStats = useMemo(() => getPairStats(trades), [trades]);
  const sessionStats = useMemo(() => getSessionStats(trades), [trades]);

  if (!advanced) {
    return <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">No trade data for analysis.</div>;
  }

  const streakText = advanced.currentStreak > 0
    ? `${advanced.currentStreak}W streak`
    : advanced.currentStreak < 0
    ? `${Math.abs(advanced.currentStreak)}L streak`
    : "No streak";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total Trades" value={String(stats.totalTrades)} />
        <StatCard label="Wins" value={String(stats.wins)} colorClass="text-success" />
        <StatCard label="Losses" value={String(stats.losses)} colorClass="text-destructive" />
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStatCard
          icon={<Target className="h-4 w-4" />}
          label="Profit Factor"
          value={advanced.profitFactor.toFixed(2)}
          sub={advanced.profitFactor >= 1.5 ? "Strong edge" : advanced.profitFactor >= 1 ? "Marginal" : "Negative edge"}
          color={advanced.profitFactor >= 1.5 ? "text-success" : advanced.profitFactor >= 1 ? "text-warning" : "text-destructive"}
        />
        <MiniStatCard
          icon={<Flame className="h-4 w-4" />}
          label="Current Streak"
          value={streakText}
          sub={`Best: ${advanced.maxWinStreak}W | Worst: ${advanced.maxLoseStreak}L`}
          color={advanced.currentStreak > 0 ? "text-success" : advanced.currentStreak < 0 ? "text-destructive" : undefined}
        />
        <MiniStatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg Win"
          value={`$${advanced.avgWin.toFixed(2)}`}
          sub={`Best day: $${advanced.bestDay.pnl.toFixed(2)}`}
          color="text-success"
        />
        <MiniStatCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Avg Loss"
          value={`$${advanced.avgLoss.toFixed(2)}`}
          sub={`Worst day: $${advanced.worstDay.pnl.toFixed(2)}`}
          color="text-destructive"
        />
      </div>

      {/* Discipline Comparison */}
      <div className="grid gap-3 sm:grid-cols-2">
        <MiniStatCard
          icon={<Shield className="h-4 w-4" />}
          label="Disciplined Trades"
          value={`${advanced.disciplineBreakdown.disciplined.count} trades`}
          sub={`Win: ${advanced.disciplineBreakdown.disciplined.winRate.toFixed(1)}% | P&L: $${advanced.disciplineBreakdown.disciplined.pnl.toFixed(2)}`}
          color="text-success"
        />
        <MiniStatCard
          icon={<Brain className="h-4 w-4" />}
          label="Undisciplined Trades"
          value={`${advanced.disciplineBreakdown.undisciplined.count} trades`}
          sub={`Win: ${advanced.disciplineBreakdown.undisciplined.winRate.toFixed(1)}% | P&L: $${advanced.disciplineBreakdown.undisciplined.pnl.toFixed(2)}`}
          color="text-destructive"
        />
      </div>

      {/* Monthly P&L Chart */}
      {advanced.monthlyPnl.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Monthly P&L</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={advanced.monthlyPnl} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "hsl(var(--card-foreground))",
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "P&L"]}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {advanced.monthlyPnl.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">P&L by Pair</h3>
          <PairPerformance data={pairStats} />
        </div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Session Breakdown</h3>
          <SessionChart data={sessionStats} />
        </div>
      </div>

      {/* Emotion, Grade & Closing Type breakdown tables */}
      <div className="grid gap-6 lg:grid-cols-3">
        <BreakdownTable
          title="Performance by Emotion"
          rows={advanced.emotionStats.map(e => ({ label: e.emotion, count: e.count, winRate: e.winRate, pnl: e.pnl }))}
        />
        <BreakdownTable
          title="Performance by Setup Grade"
          rows={advanced.gradeStats.map(g => ({ label: g.grade, count: g.count, winRate: g.winRate, pnl: g.pnl }))}
        />
        <BreakdownTable
          title="Performance by Closing Type"
          rows={advanced.closingTypeStats.map(c => ({ label: c.type, count: c.count, winRate: c.winRate, pnl: c.pnl }))}
        />
      </div>

      {/* Pair stats table */}
      {pairStats.length > 0 && (
        <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="px-4 py-3 font-semibold">Pair</th>
                <th className="px-4 py-3 font-semibold text-right">Trades</th>
                <th className="px-4 py-3 font-semibold text-right">Win Rate</th>
                <th className="px-4 py-3 font-semibold text-right">P&L</th>
              </tr>
            </thead>
            <tbody>
              {pairStats.map((p) => (
                <tr key={p.pair} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-bold">{p.pair}</td>
                  <td className="px-4 py-3 tabular-nums text-right">{p.trades}</td>
                  <td className="px-4 py-3 tabular-nums text-right">{p.winRate.toFixed(1)}%</td>
                  <td className={`px-4 py-3 tabular-nums text-right font-bold ${p.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {p.pnl >= 0 ? "+" : ""}${p.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
