import { useState, useRef } from "react";
import { format } from "date-fns";
import { addTrade, PAIRS, SESSIONS, SETUP_GRADES, EMOTIONS, type Trade } from "@/lib/trades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ImagePlus, X, CalendarIcon } from "lucide-react";

interface Props {
  onTradeAdded: (trades: Trade[]) => void;
}

export function AddTradeForm({ onTradeAdded }: Props) {
  const [pair, setPair] = useState(PAIRS[0]);
  const [session, setSession] = useState(SESSIONS[0]);
  const [pnl, setPnl] = useState("");
  const [rr, setRr] = useState("");
  const [discipline, setDiscipline] = useState<"yes" | "no">("yes");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<string | undefined>();
  const [setupGrade, setSetupGrade] = useState<"A" | "B" | "C">("A");
  const [emotion, setEmotion] = useState<Trade["emotion"]>("Calm");
  const [confidence, setConfidence] = useState(5);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

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
      notes: notes || undefined,
      screenshot,
      setupGrade,
      emotion,
      confidence,
    });

    onTradeAdded(trades);
    setPnl("");
    setRr("");
    setNotes("");
    setScreenshot(undefined);
    setConfidence(5);
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
            <Input type="number" step="0.01" placeholder="e.g. 500 or -200" value={pnl} onChange={(e) => setPnl(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>R:R Achieved</Label>
            <Input type="number" step="0.1" placeholder="e.g. 2.5" value={rr} onChange={(e) => setRr(e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Setup Quality</Label>
            <Select value={setupGrade} onValueChange={(v: "A" | "B" | "C") => setSetupGrade(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SETUP_GRADES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g === "A" ? "A+ — Textbook" : g === "B" ? "B — Decent" : "C — Weak"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Emotion</Label>
            <Select value={emotion} onValueChange={(v: Trade["emotion"]) => setEmotion(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMOTIONS.map((em) => (
                  <SelectItem key={em} value={em}>{em}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Discipline</Label>
            <Select value={discipline} onValueChange={(v: "yes" | "no") => setDiscipline(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Confidence Score</Label>
            <span className="text-sm font-bold text-primary tabular-nums">{confidence}/10</span>
          </div>
          <Slider value={[confidence]} onValueChange={(v) => setConfidence(v[0])} min={1} max={10} step={1} className="py-2" />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Trade Notes</Label>
          <Textarea placeholder="What did you observe? What was your thesis?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </div>

        {/* Screenshot */}
        <div className="space-y-2">
          <Label>Screenshot</Label>
          <input type="file" accept="image/*" ref={fileRef} onChange={handleScreenshot} className="hidden" />
          {screenshot ? (
            <div className="relative">
              <img src={screenshot} alt="Trade screenshot" className="w-full rounded-md border border-border object-contain max-h-48" />
              <button type="button" onClick={() => setScreenshot(undefined)} className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:opacity-80">
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              Attach Chart Screenshot
            </Button>
          )}
        </div>

        <Button type="submit" className="w-full">Save Trade</Button>
      </form>
    </div>
  );
}
