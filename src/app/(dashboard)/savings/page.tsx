import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { calculateMonthlySurplus } from "@/lib/savings/engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateGoalDialog } from "@/components/savings/create-goal-dialog";
import { GoalCard } from "@/components/savings/goal-card";
import { AssignSurplusForm } from "@/components/savings/assign-surplus-form";

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function SavingsPage() {
  const userId = await requireUserId();
  const now = new Date();

  const [goals, savingsAccounts, surplus] = await Promise.all([
    prisma.savingsGoal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.financialAccount.findMany({ where: { userId, isSavings: true } }),
    calculateMonthlySurplus(prisma, {
      userId,
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    }),
  ]);

  const savingsAccountBalances = await Promise.all(
    savingsAccounts.map(async (account) => {
      const result = await prisma.transaction.aggregate({
        where: { financialAccountId: account.id },
        _sum: { amount: true },
      });
      return { account, balance: Number(result._sum.amount ?? 0) };
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Ahorro</h1>
        <CreateGoalDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Excedente sugerido del mes</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-2xl font-semibold">{formatCLP(Math.max(surplus, 0))}</p>
          <AssignSurplusForm
            surplus={Math.max(surplus, 0)}
            goals={goals.map((g) => ({ id: g.id, name: g.name }))}
          />
        </CardContent>
      </Card>

      {savingsAccountBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuentas de ahorro</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {savingsAccountBalances.map(({ account, balance }) => (
              <div key={account.id} className="flex items-center justify-between text-sm">
                <span>{account.alias}</span>
                <span className="font-medium">{formatCLP(balance)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={{
              id: goal.id,
              name: goal.name,
              targetAmount: Number(goal.targetAmount),
              currentAmount: Number(goal.currentAmount),
            }}
          />
        ))}
        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground">Todavía no creaste ninguna meta.</p>
        )}
      </div>
    </div>
  );
}
