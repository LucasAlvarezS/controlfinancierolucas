import { formatCLP } from "@/lib/format";

export function HeroCard({
  monthLabel,
  monthExpenses,
  prevMonthToDateExpenses,
}: {
  monthLabel: string;
  monthExpenses: number;
  prevMonthToDateExpenses: number;
}) {
  const delta = monthExpenses - prevMonthToDateExpenses;
  const spendingMore = delta > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-4 text-white shadow-lg">
      <div className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-12 -left-6 size-36 rounded-full bg-white/5" />
      <div className="relative">
        <p className="text-sm/5 text-white/70 capitalize">{monthLabel}</p>
        <p className="mt-1 text-xs text-white/70">Gasto del mes</p>
        <p className="mt-0.5 text-3xl font-semibold tracking-tight">
          {formatCLP(monthExpenses)}
        </p>
        <p className="mt-2 text-xs text-white/80">
          {spendingMore ? "▲" : "▼"} {formatCLP(Math.abs(delta))}{" "}
          {spendingMore ? "más" : "menos"} que a esta altura del mes pasado
        </p>
      </div>
    </div>
  );
}
