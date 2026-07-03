import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { calculateMonthlySurplus } from "@/lib/savings/engine";
import { HeroCard } from "@/components/dashboard/hero-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryDonut, type CategorySlice } from "@/components/dashboard/category-donut";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OTROS_COLOR = "#64748b";
const MAX_SLICES = 6;

function monthRange(year: number, month: number) {
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

export default async function DashboardPage() {
  const userId = await requireUserId();

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month);

  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = prevDate.getUTCMonth() + 1;

  const expensesWhere = {
    userId,
    amount: { lt: 0 },
    financialAccount: { isSavings: false },
  };

  const [monthByCategory, balanceAgg, currentSurplus, prevSurplus, savingsAgg] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { ...expensesWhere, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      // Saldo actual: suma de los saldos sincronizados (cuentas Fintoc).
      prisma.financialAccount.aggregate({
        where: { userId, status: "ACTIVE" },
        _sum: { balance: true },
      }),
      calculateMonthlySurplus(prisma, { userId, year, month }),
      calculateMonthlySurplus(prisma, { userId, year: prevYear, month: prevMonth }),
      prisma.savingsGoal.aggregate({ where: { userId }, _sum: { currentAmount: true } }),
    ]);

  const categoryIds = [
    ...new Set(
      monthByCategory.map((row) => row.categoryId).filter((id): id is string => Boolean(id)),
    ),
  ];
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const monthSlices = buildSlices(monthByCategory, categoryById);
  const totalExpenses = monthSlices.reduce((acc, s) => acc + s.value, 0);
  const currentBalance = Number(balanceAgg._sum.balance ?? 0);

  const savingsTotal = Number(savingsAgg._sum.currentAmount ?? 0);
  const monthLabel = start.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-3">
      <HeroCard
        monthLabel={monthLabel}
        currentBalance={currentBalance}
        monthExpenses={totalExpenses}
        deltaVsPrev={currentSurplus - prevSurplus}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Excedente del mes"
          amount={Math.max(currentSurplus, 0)}
          variant="gradient"
          hint="Ingresos − gastos"
        />
        <StatTile label="Ahorro acumulado" amount={savingsTotal} hint="Metas de ahorro" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonut data={monthSlices} />
        </CardContent>
      </Card>
    </div>
  );
}
