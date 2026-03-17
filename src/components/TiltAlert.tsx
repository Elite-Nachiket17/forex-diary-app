import { AlertTriangle } from "lucide-react";

export function TiltAlert() {
  return (
    <div className="animate-fade-in mb-6 flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <span>TILT WARNING: 3 consecutive losses detected. Step away from the terminal.</span>
    </div>
  );
}
