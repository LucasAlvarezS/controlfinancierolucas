import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type PeriodType = "gastos" | "ingresos";

/** Navegación de mes (← →) + toggle gastos/ingresos, vía search params. */
export function PeriodSelector({
  monthLabel,
  prevKey,
  nextKey,
  monthKey,
  type,
}: {
  monthLabel: string;
  monthKey: string;
  prevKey: string | null;
  nextKey: string | null;
  type: PeriodType;
}) {
  const arrowClass =
    "flex size-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-accent";
  const disabledArrowClass =
    "flex size-8 items-center justify-center rounded-full border text-muted-foreground/30";

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        {prevKey ? (
          <Link href={`/?month=${prevKey}&type=${type}`} className={arrowClass} aria-label="Mes anterior">
            <IconChevronLeft size={16} stroke={1.75} />
          </Link>
        ) : (
          <span className={disabledArrowClass}>
            <IconChevronLeft size={16} stroke={1.75} />
          </span>
        )}
        <span className="min-w-28 text-center text-sm font-medium capitalize">{monthLabel}</span>
        {nextKey ? (
          <Link href={`/?month=${nextKey}&type=${type}`} className={arrowClass} aria-label="Mes siguiente">
            <IconChevronRight size={16} stroke={1.75} />
          </Link>
        ) : (
          <span className={disabledArrowClass}>
            <IconChevronRight size={16} stroke={1.75} />
          </span>
        )}
      </div>

      <div className="flex rounded-full border p-0.5 text-xs">
        {(["gastos", "ingresos"] as const).map((option) => (
          <Link
            key={option}
            href={`/?month=${monthKey}&type=${option}`}
            className={cn(
              "rounded-full px-3 py-1.5 capitalize transition-colors",
              type === option
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option}
          </Link>
        ))}
      </div>
    </div>
  );
}
