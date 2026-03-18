import { useMemo, useState } from "react";
import type { Trade } from "@/lib/trades";
import { getCalendarData } from "@/lib/trades";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  trades: Trade[];
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function MiniMonth({ year, month, calendarData, todayKey }: {
  year: number;
  month: number;
  calendarData: Record<string, { pnl: number; count: number }>;
  todayKey: string;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateKey = (day: number) => {
    const d = new Date(year, month, day);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Monthly totals
  let monthPnl = 0;
  let monthTrades = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const data = calendarData[getDateKey(d)];
    if (data) {
      monthPnl += data.pnl;
      monthTrades += data.count;
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-card-foreground">{MONTH_NAMES[month]}</h4>
        {monthTrades > 0 && (
          <span className={`text-[10px] font-bold tabular-nums ${monthPnl >= 0 ? "text-success" : "text-destructive"}`}>
            {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(0)}
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-px text-center">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className="text-[9px] font-semibold text-muted-foreground py-0.5">{d}</div>
        ))}
        {days.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-6" />;
          const key = getDateKey(day);
          const data = calendarData[key];
          const isToday = key === todayKey;

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center rounded h-6 w-full text-[10px] transition-colors ${
                isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-card" : ""
              } ${
                data
                  ? data.pnl >= 0
                    ? "bg-success/20 text-success font-bold"
                    : "bg-destructive/20 text-destructive font-bold"
                  : "text-muted-foreground"
              }`}
              title={data ? `${data.count} trade${data.count > 1 ? "s" : ""}: ${data.pnl >= 0 ? "+" : ""}$${data.pnl.toFixed(2)}` : undefined}
            >
              {day}
            </div>
          );
        })}
      </div>
      {monthTrades > 0 && (
        <div className="mt-1.5 text-[9px] text-muted-foreground text-center">{monthTrades} trade{monthTrades !== 1 ? "s" : ""}</div>
      )}
    </div>
  );
}

export function TradeCalendar({ trades }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarData = useMemo(() => {
    // Convert date format for lookup - normalize to YYYY-MM-DD
    const raw = getCalendarData(trades);
    const normalized: Record<string, { pnl: number; count: number }> = {};
    Object.entries(raw).forEach(([dateStr, data]) => {
      // Try to parse and normalize the date key
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        if (!normalized[key]) normalized[key] = { pnl: 0, count: 0 };
        normalized[key].pnl += data.pnl;
        normalized[key].count += data.count;
      } else {
        // Already might be in right format or another one
        normalized[dateStr] = data;
      }
    });
    return normalized;
  }, [trades]);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Year summary
  let yearPnl = 0;
  let yearTrades = 0;
  Object.entries(calendarData).forEach(([key, data]) => {
    if (key.startsWith(String(viewYear))) {
      yearPnl += data.pnl;
      yearTrades += data.count;
    }
  });

  return (
    <div className="animate-fade-in space-y-4">
      {/* Year header */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
        <Button variant="ghost" size="icon" onClick={() => setViewYear(y => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-extrabold tracking-tight text-card-foreground">{viewYear}</h3>
          {yearTrades > 0 && (
            <div className="flex items-center gap-3 justify-center mt-1">
              <span className="text-xs text-muted-foreground">{yearTrades} trades</span>
              <span className={`text-sm font-bold tabular-nums ${yearPnl >= 0 ? "text-success" : "text-destructive"}`}>
                {yearPnl >= 0 ? "+" : ""}${yearPnl.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setViewYear(y => y + 1)} disabled={viewYear >= today.getFullYear()}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 12-month grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <MiniMonth key={i} year={viewYear} month={i} calendarData={calendarData} todayKey={todayKey} />
        ))}
      </div>
    </div>
  );
}
