import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  from: Date | undefined;
  to: Date | undefined;
  onChange: (from: Date | undefined, to: Date | undefined) => void;
}

export function DateRangeFilter({ from, to, onChange }: Props) {
  const [pickingFrom, setPickingFrom] = useState(false);
  const [pickingTo, setPickingTo] = useState(false);

  const hasFilter = from || to;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={pickingFrom} onOpenChange={setPickingFrom}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 text-xs",
              !from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {from ? format(from, "MMM d, yyyy") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={from}
            onSelect={(d) => { onChange(d, to); setPickingFrom(false); }}
            disabled={(d) => (to ? d > to : false) || d > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">→</span>

      <Popover open={pickingTo} onOpenChange={setPickingTo}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 text-xs",
              !to && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {to ? format(to, "MMM d, yyyy") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={to}
            onSelect={(d) => { onChange(from, d); setPickingTo(false); }}
            disabled={(d) => (from ? d < from : false) || d > new Date()}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>

      {hasFilter && (
        <Button variant="ghost" size="sm" onClick={() => onChange(undefined, undefined)} className="gap-1 text-xs text-muted-foreground">
          <X className="h-3 w-3" /> Clear
        </Button>
      )}
    </div>
  );
}
