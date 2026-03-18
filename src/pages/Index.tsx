import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { getTrades, calculateStats, getEquityCurve, getSessionStats, exportTradesToCSV, saveTrades, type Trade } from "@/lib/trades";
import { filterTradesByDateRange } from "@/lib/filterTrades";
import { StatCard } from "@/components/StatCard";
import { EquityChart } from "@/components/EquityChart";
import { SessionChart } from "@/components/SessionChart";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { AddTradeForm } from "@/components/AddTradeForm";
import { TradeHistory } from "@/components/TradeHistory";
import { TradeCalendar } from "@/components/TradeCalendar";
import { TiltAlert } from "@/components/TiltAlert";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { BarChart3, PlusCircle, LayoutDashboard, Calendar, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "dashboard" | "add-trade" | "analytics" | "calendar";

const EXPORT_INTERVAL_KEY = "fx_export_trade_count";

function getLastExportCount(): number {
  return parseInt(localStorage.getItem(EXPORT_INTERVAL_KEY) || "0", 10);
}

function setLastExportCount(count: number) {
  localStorage.setItem(EXPORT_INTERVAL_KEY, String(count));
}

function triggerAutoExport(trades: Trade[]) {
  const csv = exportTradesToCSV(trades);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fx-log-auto-backup-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Index() {
  const [trades, setTrades] = useState<Trade[]>(getTrades());
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Date range filter state
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const filteredTrades = useMemo(
    () => filterTradesByDateRange(trades, dateFrom, dateTo),
    [trades, dateFrom, dateTo]
  );

  const stats = calculateStats(filteredTrades);
  const equityData = getEquityCurve(filteredTrades);
  const sessionStats = getSessionStats(filteredTrades);

  // Auto-export every 5 trading days
  useEffect(() => {
    if (trades.length === 0) return;
    // Count unique trading days
    const uniqueDays = new Set(trades.map((t) => t.date)).size;
    const lastCount = getLastExportCount();

    if (uniqueDays > 0 && uniqueDays >= lastCount + 5) {
      // Auto-download
      triggerAutoExport(trades);
      setLastExportCount(uniqueDays);
      toast.success(`Auto-backup: ${uniqueDays} trading days reached! CSV downloaded.`, {
        description: "Your trade data has been automatically exported.",
        duration: 6000,
      });
    }
  }, [trades]);

  const handleTradesUpdate = useCallback((updated: Trade[]) => {
    setTrades(updated);
    setActiveTab("dashboard");
  }, []);

  const handleExport = () => {
    const csv = exportTradesToCSV(trades);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fx-log-trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split("\n");
        if (lines.length < 2) throw new Error("Empty file");
        const imported: Trade[] = lines.slice(1).map((line) => {
          const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,))/g) || [];
          const clean = (i: number) => (cols[i] || "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
          return {
            id: Date.now() + Math.random(),
            timestamp: new Date(clean(0)).getTime() || Date.now(),
            date: clean(0),
            pair: clean(1),
            session: clean(2),
            pnl: parseFloat(clean(3)) || 0,
            rr: parseFloat(clean(4)) || 0,
            discipline: clean(5) === "yes" ? "yes" : "no",
            setupGrade: (["A", "B", "C"].includes(clean(6)) ? clean(6) : undefined) as Trade["setupGrade"],
            emotion: (["Calm", "Fear", "Greed", "FOMO", "Revenge"].includes(clean(7)) ? clean(7) : undefined) as Trade["emotion"],
            confidence: parseInt(clean(8)) || undefined,
            notes: clean(9) || undefined,
          };
        });
        const merged = [...trades, ...imported];
        saveTrades(merged);
        setTrades(merged);
        toast.success(`Imported ${imported.length} trades`);
      } catch {
        toast.error("Failed to parse CSV file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDateChange = (from: Date | undefined, to: Date | undefined) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "add-trade", label: "Add Trade", icon: <PlusCircle className="h-4 w-4" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "calendar", label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  ];

  const showDateFilter = activeTab === "analytics" || activeTab === "calendar" || activeTab === "dashboard";

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        {/* Header */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            FX-LOG<span className="text-primary">.</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="tabular-nums text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Discipline: {stats.disciplineScore.toFixed(0)}%
            </div>
            {trades.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" />
              Import
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </div>
        </header>

        {/* Tilt Alert */}
        {stats.isTilted && <TiltAlert />}

        {/* Tab Navigation */}
        <nav className="mb-4 inline-flex gap-1 rounded-lg bg-muted p-1">
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

        {/* Date Range Filter */}
        {showDateFilter && (
          <div className="mb-6">
            <DateRangeFilter from={dateFrom} to={dateTo} onChange={handleDateChange} />
          </div>
        )}

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="animate-fade-in space-y-6">
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

            <div>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Trades</h3>
              <TradeHistory trades={filteredTrades} onDelete={setTrades} />
            </div>
          </div>
        )}

        {/* Add Trade */}
        {activeTab === "add-trade" && (
          <AddTradeForm onTradeAdded={handleTradesUpdate} />
        )}

        {/* Analytics */}
        {activeTab === "analytics" && (
          <AdvancedAnalytics trades={filteredTrades} stats={stats} />
        )}

        {/* Calendar */}
        {activeTab === "calendar" && (
          <TradeCalendar trades={filteredTrades} />
        )}
      </div>
    </div>
  );
}
