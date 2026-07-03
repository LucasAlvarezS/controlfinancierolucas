import { formatCLP } from "@/lib/format";

export function HeroCard({
  monthLabel,
  totalExpenses,
  deltaVsPrev,
}: {
  monthLabel: string;
  totalExpenses: number;
  deltaVsPrev: number;
}) {
  const up = deltaVsPrev > 0;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-white shadow-lg">
      <div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 size-36 rounded-full bg-white/5" />
      <div className="relative">
        <p className="text-sm/5 text-white/70 capitalize">{monthLabel}</p>
        <p className="mt-1 text-xs text-white/70">Gasto total del mes</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">{formatCLP(totalExpenses)}</p>
        <p className="mt-3 text-xs text-white/80">
          {up ? "▲" : "▼"} {formatCLP(Math.abs(deltaVsPrev))} vs. mes anterior
        </p>
      </div>
    </div>
  );
}
