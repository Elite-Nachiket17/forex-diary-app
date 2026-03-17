import { Trade, deleteTrade } from "@/lib/trades";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  trades: Trade[];
  onDelete: (trades: Trade[]) => void;
}

export function TradeHistory({ trades, onDelete }: Props) {
  if (trades.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground text-sm">
        No trades logged yet.
      </div>
    );
  }

  const handleDelete = (id: number) => {
    const updated = deleteTrade(id);
    onDelete(updated);
  };

  return (
    <div className="animate-fade-in overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Pair</th>
              <th className="px-4 py-3 font-semibold">Session</th>
              <th className="px-4 py-3 font-semibold text-right">R:R</th>
              <th className="px-4 py-3 font-semibold text-right">P&L</th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {[...trades].reverse().map((t) => (
              <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 tabular-nums text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3 font-bold">{t.pair}</td>
                <td className="px-4 py-3">{t.session}</td>
                <td className="px-4 py-3 tabular-nums text-right">{t.rr}R</td>
                <td className={`px-4 py-3 tabular-nums text-right font-bold ${t.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                  {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={t.pnl >= 0 ? "default" : "destructive"} className="text-xs">
                    {t.pnl >= 0 ? "WIN" : "LOSS"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
