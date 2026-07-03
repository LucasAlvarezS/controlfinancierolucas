import { formatCLP } from "@/lib/format";

export function StatTile({
  label,
  amount,
  variant = "plain",
  hint,
}: {
  label: string;
  amount: number;
  variant?: "plain" | "gradient";
  hint?: string;
}) {
  const gradient = variant === "gradient";
  return (
    <div
      className={`rounded-2xl p-4 shadow-sm ${
        gradient
          ? "bg-gradient-tile text-white"
          : "border border-border bg-card text-card-foreground"
      }`}
    >
      <p className={`text-xs ${gradient ? "text-white/75" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{formatCLP(amount)}</p>
      {hint && (
        <p className={`mt-0.5 text-[11px] ${gradient ? "text-white/70" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
