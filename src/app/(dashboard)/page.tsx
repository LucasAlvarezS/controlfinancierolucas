import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { HeroCard } from "@/components/dashboard/hero-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { PeriodSelector, type PeriodType } from "@/components/dashboard/period-selector";
import { CategoryDonut, type CategorySlice } from "@/components/dashboard/category-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OTROS_COLOR = "#64748b";
const MAX_SLICES = 6;

// Navegación disponible desde junio 2026 (pedido del usuario: no cargar
// todo el historial de 12 meses de MP en el dashboard).
const MIN_YEAR = 2026;
const MIN_MONTH = 6;

interface YearMonth {
  year: number;
  month: number; // 1-12
}

function monthKey({ year, month }: YearMonth): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function parseMonthKey(key: string | undefined): YearMonth | null {
  if (!key || !/^\d{4}-\d{2}$/.test(key)) return null;
  const [year, month] = key.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function compareYearMonth(a: YearMonth, b: YearMonth): number {
  return a.year * 12 + a.month - (b.year * 12 + b.month);
}

function shiftMonth({ year, month }: YearMonth, delta: number): YearMonth {
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
}

function monthRange({ year, month }: YearMonth) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

interface CategoryRow {
  categoryId: string | null;
  _sum: { amount: { toString(): string } | null };
}

/** Convierte filas de groupBy por categoría en slices (top 6 + "Otros"). */
function buildSlices(
  rows: CategoryRow[],
  categoryById: Map<string, { name: string; color: string | null }>,
): CategorySlice[] {
  const all = rows
    .map((row) => ({
      name: row.categoryId
        ? categoryById.get(row.categoryId)?.name ?? "Sin categoría"
        : "Sin categoría",
      color: (row.categoryId ? categoryById.get(row.categoryId)?.color : null) ?? OTROS_COLOR,
      value: Math.abs(Number(row._sum.amount ?? 0)),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  if (all.length <= MAX_SLICES) return all;

  const top = all.slice(0, MAX_SLICES);
  const rest = all.slice(MAX_SLICES).reduce((acc, s) => acc + s.value, 0);
  return [...top, { name: "Otros", color: OTROS_COLOR, value: rest }];
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const now = new Date();
  const current: YearMonth = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const min: YearMonth = { year: MIN_YEAR, month: MIN_MONTH };

  // Mes seleccionado, acotado entre junio 2026 y el mes actual.
  let selected = parseMonthKey(params.month) ?? current;
  if (compareYearMonth(selected, min) < 0) selected = min;
  if (compareYearMonth(selected, current) > 0) selected = current;
  const isCurrentMonth = compareYearMonth(selected, current) === 0;

  const type: PeriodType = params.type === "ingresos" ? "ingresos" : "gastos";

  const { start, end } = monthRange(selected);
  const prev = shiftMonth(selected, -1);
  const { start: prevStart, end: prevEnd } = monthRange(prev);

  // Comparación del hero: mes en curso vs mismo tiempo transcurrido del mes
  // anterior; mes pasado vs su mes anterior completo.
  const prevCutoff = isCurrentMonth
    ? new Date(Math.min(prevStart.getTime() + (now.getTime() - start.getTime()), prevEnd.getTime()))
    : prevEnd;

  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const expensesWhere = {
    userId,
    amount: { lt: 0 },
    financialAccount: { isSavings: false },
  };
  // La vista de ingresos incluye todas las cuentas (también las de ahorro):
  // una transferencia recibida en la cuenta de ahorro sigue siendo un ingreso.
  const donutWhere =
    type === "gastos"
      ? { ...expensesWhere, date: { gte: start, lt: end } }
      : { userId, amount: { gt: 0 }, date: { gte: start, lt: end } };

  const [byCategory, monthExpensesAgg, prevExpensesAgg, todayAgg, savingsAgg] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: donutWhere,
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...expensesWhere, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...expensesWhere, date: { gte: prevStart, lt: prevCutoff } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...expensesWhere, date: { gte: todayStart } },
        _sum: { amount: true },
      }),
      prisma.savingsGoal.aggregate({ where: { userId }, _sum: { currentAmount: true } }),
    ]);

  const categoryIds = [
    ...new Set(byCategory.map((row) => row.categoryId).filter((id): id is string => Boolean(id))),
  ];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const slices = buildSlices(byCategory, categoryById);
  const monthExpenses = Math.abs(Number(monthExpensesAgg._sum.amount ?? 0));
  const comparisonExpenses = Math.abs(Number(prevExpensesAgg._sum.amount ?? 0));
  const todayExpenses = Math.abs(Number(todayAgg._sum.amount ?? 0));
  const savingsTotal = Number(savingsAgg._sum.currentAmount ?? 0);

  const monthLabel = start.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  const prevMonthName = prevStart.toLocaleDateString("es-CL", { month: "long" });
  const comparisonSuffix = isCurrentMonth
    ? "que a esta altura del mes pasado"
    : `que en ${prevMonthName}`;

  const prevKey = compareYearMonth(selected, min) > 0 ? monthKey(prev) : null;
  const nextKey = isCurrentMonth ? null : monthKey(shiftMonth(selected, 1));

  return (
    <div className="flex flex-col gap-3">
      <PeriodSelector
        monthLabel={start.toLocaleDateString("es-CL", { month: "long", year: "2-digit" })}
        monthKey={monthKey(selected)}
        prevKey={prevKey}
        nextKey={nextKey}
        type={type}
      />

      <HeroCard
        monthLabel={monthLabel}
        monthExpenses={monthExpenses}
        comparisonExpenses={comparisonExpenses}
        comparisonSuffix={comparisonSuffix}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Gasto de hoy"
          amount={todayExpenses}
          variant="gradient"
          hint="Movimientos de hoy"
        />
        <StatTile label="Ahorro acumulado" amount={savingsTotal} hint="Metas de ahorro" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {type === "gastos" ? "Gasto por categoría" : "Ingresos por categoría"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonut data={slices} />
        </CardContent>
      </Card>
    </div>
  );
}
