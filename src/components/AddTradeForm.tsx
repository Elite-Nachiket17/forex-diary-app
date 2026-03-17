import { useState } from "react";
import { addTrade, PAIRS, SESSIONS, type Trade } from "@/lib/trades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  onTradeAdded: (trades: Trade[]) => void;
}

export function AddTradeForm({ onTradeAdded }: Props) {
  const [pair, setPair] = useState(PAIRS[0]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [pnl, setPnl] = useState("");
  const [rr, setRr] = useState("");
  const [discipline, setDiscipline] = useState<"yes" | "no">("yes");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnl || !rr) return;

    const trades = addTrade({
      date: new Date().toLocaleDateString(),
      pair,
      session,
      pnl: parseFloat(pnl),
      rr: parseFloat(rr),
      discipline,
    });

    onTradeAdded(trades);
    setPnl("");
    setRr("");
  };

  return (
    <div className="mx-auto max-w-xl animate-fade-in rounded-lg border border-border bg-card p-8 shadow-sm">
      <h2 className="mb-6 text-lg font-bold text-card-foreground">Log New Position</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Pair</Label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAIRS.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Session</Label>
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Result ($)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="e.g. 500 or -200"
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>R:R Achieved</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 2.5"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Discipline Kept?</Label>
          <Select value={discipline} onValueChange={(v: "yes" | "no") => setDiscipline(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes — Followed Plan</SelectItem>
              <SelectItem value="no">No — FOMO / Early Exit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" className="w-full">
          Save Trade
        </Button>
      </form>
    </div>
  );
}
