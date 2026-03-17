import { useState, useCallback } from "react";
import { getTrades, calculateStats, getEquityCurve, getPairStats, getSessionStats, type Trade } from "@/lib/trades";
import { StatCard } from "@/components/StatCard";
import { EquityChart } from "@/components/EquityChart";
import { SessionChart } from "@/components/SessionChart";
import { PairPerformance } from "@/components/PairPerformance";
import { AddTradeForm } from "@/components/AddTradeForm";
import { TradeHistory } from "@/components/TradeHistory";
import { TiltAlert } from "@/components/TiltAlert";
import { BarChart3, PlusCircle, LayoutDashboard } from "lucide-react";

type Tab = "dashboard" | "add-trade" | "analytics";

export default function Index() {
  const [trades, setTrades] = useState<Trade[]>(getTrades());
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const stats = calculateStats(trades);
  const equityData = getEquityCurve(trades);
  const pairStats = getPairStats(trades);
  const sessionStats = getSessionStats(trades);

  const handleTradesUpdate = useCallback((updated: Trade[]) => {
    setTrades(updated);
    setActiveTab("dashboard");
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "add-trade", label: "Add Trade", icon: <PlusCircle className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            FX-LOG<span className="text-primary">.</span>
          </h1>
          <div className="tabular-nums text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Discipline: {stats.disciplineScore.toFixed(0)}%
          </div>
        </header>

        {/* Tilt Alert */}
        {stats.isTilted && <TiltAlert />}

        {/* Tab Navigation */}
        <nav className="mb-6 inline-flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard
                label="Total Profit"
                value={`$${stats.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                colorClass={stats.totalProfit >= 0 ? "text-success" : "text-destructive"}
              />
              <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
              <StatCard label="Expectancy" value={`$${stats.expectancy.toFixed(2)}`} />
              <StatCard label="Max Drawdown" value={`$${stats.maxDrawdown.toLocaleString()}`} colorClass="text-destructive" />
              <StatCard label="Avg R:R" value={stats.avgRR.toFixed(2)} />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Equity Curve</h3>
                <EquityChart data={equityData} />
              </div>
              <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Volume by Session</h3>
                <SessionChart data={sessionStats} />
              </div>
            </div>

            {/* Recent Trades */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Trades</h3>
              <TradeHistory trades={trades} onDelete={setTrades} />
            </div>
          </div>
        )}

        {/* Add Trade */}
        {activeTab === "add-trade" && (
          <AddTradeForm onTradeAdded={handleTradesUpdate} />
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <div className="animate-fade-in space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Total Trades" value={String(stats.totalTrades)} />
              <StatCard label="Wins" value={String(stats.wins)} colorClass="text-success" />
              <StatCard label="Losses" value={String(stats.losses)} colorClass="text-destructive" />
            </div>

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

            {/* Pair table */}
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
        )}
      </div>
    </div>
  );
}
