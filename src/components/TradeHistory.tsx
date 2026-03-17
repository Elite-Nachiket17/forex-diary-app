import { useState } from "react";
import { Trade, deleteTrade } from "@/lib/trades";
import { Trash2, ChevronDown, ChevronUp, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  trades: Trade[];
  onDelete: (trades: Trade[]) => void;
}

const emotionEmoji: Record<string, string> = {
  Calm: "😌", Fear: "😨", Greed: "🤑", FOMO: "😰", Revenge: "😤",
};

export function TradeHistory({ trades, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
              <th className="px-4 py-3 font-semibold text-center">Grade</th>
              <th className="px-4 py-3 font-semibold text-center">Emotion</th>
              <th className="px-4 py-3 font-semibold text-right">R:R</th>
              <th className="px-4 py-3 font-semibold text-right">P&L</th>
              <th className="px-4 py-3 font-semibold text-center">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {[...trades].reverse().map((t) => (
              <>
                <tr
                  key={t.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                >
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{t.date}</td>
                  <td className="px-4 py-3 font-bold">{t.pair}</td>
                  <td className="px-4 py-3">{t.session}</td>
                  <td className="px-4 py-3 text-center">
                    {t.setupGrade && (
                      <Badge variant={t.setupGrade === "A" ? "default" : "secondary"} className="text-xs">
                        {t.setupGrade}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.emotion && <span title={t.emotion}>{emotionEmoji[t.emotion] || t.emotion}</span>}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-right">{t.rr}R</td>
                  <td className={`px-4 py-3 tabular-nums text-right font-bold ${t.pnl >= 0 ? "text-success" : "text-destructive"}`}>
                    {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={t.pnl >= 0 ? "default" : "destructive"} className="text-xs">
                      {t.pnl >= 0 ? "WIN" : "LOSS"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    {(t.notes || t.screenshot) && (
                      expandedId === t.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    {t.screenshot && <Image className="h-3 w-3 text-muted-foreground" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                {expandedId === t.id && (t.notes || t.screenshot || t.confidence) && (
                  <tr key={`${t.id}-detail`} className="border-b border-border bg-muted/30">
                    <td colSpan={9} className="px-6 py-4">
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-2">
                        {t.confidence && <span>Confidence: <strong className="text-foreground">{t.confidence}/10</strong></span>}
                        {t.setupGrade && <span>Setup: <strong className="text-foreground">{t.setupGrade}</strong></span>}
                        {t.emotion && <span>Emotion: <strong className="text-foreground">{t.emotion}</strong></span>}
                      </div>
                      {t.notes && <p className="text-sm text-card-foreground mb-2">{t.notes}</p>}
                      {t.screenshot && (
                        <img src={t.screenshot} alt="Trade screenshot" className="rounded-md border border-border max-h-64 object-contain" />
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
