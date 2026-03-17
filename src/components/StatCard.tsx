interface StatCardProps {
  label: string;
  value: string;
  colorClass?: string;
}

export function StatCard({ label, value, colorClass }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`tabular-nums text-2xl font-bold ${colorClass || "text-card-foreground"}`}>
        {value}
      </div>
    </div>
  );
}
