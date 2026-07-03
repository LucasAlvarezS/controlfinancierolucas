"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCLP } from "@/lib/format";

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

export function CategoryDonut({
  data,
  variant = "donut",
}: {
  data: CategorySlice[];
  variant?: "donut" | "pie";
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const isPie = variant === "pie";

  if (total === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay movimientos en este período.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={isPie ? 0 : 46}
              outerRadius={68}
              paddingAngle={isPie ? 1 : 2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {!isPie && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[11px] text-muted-foreground">Total</span>
            <span className="text-sm font-semibold">{formatCLP(total)}</span>
          </div>
        )}
      </div>

      <ul className="flex w-full flex-col gap-1.5">
        {isPie && (
          <li className="flex items-center justify-between gap-2 border-b pb-2 text-sm">
            <span className="text-muted-foreground">Total del período</span>
            <span className="font-semibold tabular-nums">{formatCLP(total)}</span>
          </li>
        )}
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-2">
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              {slice.name}
            </span>
            <span className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{formatCLP(slice.value)}</span>
              <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round((slice.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
