import { useMemo } from "react";
import type { Trade } from "@/lib/trades";
import { getCalendarData } from "@/lib/trades";

interface Props {
  trades: Trade[];
}

export function TradeCalendar({ trades }: Props) {
  const calendarData = useMemo(() => getCalendarData(trades), [trades]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = today.toLocaleString("default", { month: "long", year: "numeric" });

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getDateKey = (day: number) => new Date(year, month, day).toLocaleDateString();

  return (
    <div className="animate-fade-in rounded-lg border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{monthName}</h3>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const key = getDateKey(day);
          const data = calendarData[key];
          const isToday = day === today.getDate();

          return (
            <div
              key={day}
              className={`relative flex flex-col items-center justify-center rounded-md p-2 text-xs transition-colors ${
                isToday ? "ring-2 ring-primary" : ""
              } ${
                data
                  ? data.pnl >= 0
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="font-semibold">{day}</span>
              {data && (
                <span className="mt-0.5 text-[10px] font-bold tabular-nums">
                  {data.pnl >= 0 ? "+" : ""}{data.pnl.toFixed(0)}
                </span>
              )}
              {data && (
                <span className="text-[9px] text-muted-foreground">{data.count}t</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
