import type { PrismaClient } from "@prisma/client";

/**
 * Excedente del mes = ingresos - gastos de las cuentas que no son de ahorro
 * (evita contar como "excedente" el dinero que ya está en la cuenta de ahorro).
 * Asume la convención: monto positivo = ingreso, monto negativo = gasto.
 */
export async function calculateMonthlySurplus(
  prisma: PrismaClient,
  params: { userId: string; year: number; month: number },
): Promise<number> {
  const start = new Date(Date.UTC(params.year, params.month - 1, 1));
  const end = new Date(Date.UTC(params.year, params.month, 1));

  const result = await prisma.transaction.aggregate({
    where: {
      userId: params.userId,
      date: { gte: start, lt: end },
      financialAccount: { isSavings: false },
    },
    _sum: { amount: true },
  });

  return Number(result._sum.amount ?? 0);
}

/**
 * Asigna un aporte a una meta de ahorro y actualiza su monto acumulado.
 */
export async function contributeToGoal(
  prisma: PrismaClient,
  params: {
    goalId: string;
    amount: number;
    source: "MANUAL" | "TRANSACTION_LINK" | "AUTO_SURPLUS_SUGGESTION";
    transactionId?: string;
  },
) {
  return prisma.$transaction([
    prisma.savingsContribution.create({
      data: {
        goalId: params.goalId,
        amount: params.amount,
        source: params.source,
        transactionId: params.transactionId,
      },
    }),
    prisma.savingsGoal.update({
      where: { id: params.goalId },
      data: { currentAmount: { increment: params.amount } },
    }),
  ]);
}
