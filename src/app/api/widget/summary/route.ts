import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { timingSafeEqualString } from "@/lib/encryption";
import { calculateMonthlySurplus } from "@/lib/savings/engine";

// Resumen para el widget del iPhone (Scriptable). Autentica por secret
// dedicado; si WIDGET_SECRET no está configurado se rechaza todo.
function isAuthorized(request: NextRequest): boolean {
  const header = request.headers.get("authorization");
  const expected = process.env.WIDGET_SECRET;
  if (!expected || !header) return false;
  return timingSafeEqualString(header, `Bearer ${expected}`);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // App de un solo usuario.
  const user = await prisma.user.findFirst();
  if (!user) {
    return NextResponse.json({ error: "no user" }, { status: 404 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [accounts, savingsAgg, expensesAgg, surplus] = await Promise.all([
    prisma.financialAccount.findMany({
      where: { userId: user.id, status: { not: "DISCONNECTED" } },
      orderBy: { alias: "asc" },
    }),
    prisma.savingsGoal.aggregate({ where: { userId: user.id }, _sum: { currentAmount: true } }),
    prisma.transaction.aggregate({
      where: {
        userId: user.id,
        date: { gte: start, lt: end },
        amount: { lt: 0 },
        financialAccount: { isSavings: false },
      },
      _sum: { amount: true },
    }),
    calculateMonthlySurplus(prisma, { userId: user.id, year, month }),
  ]);

  return NextResponse.json({
    accounts: accounts.map((account) => ({
      alias: account.alias,
      institution: account.institution,
      balance: account.balance === null ? null : Number(account.balance),
      balanceUpdatedAt: account.balanceUpdatedAt,
    })),
    savingsTotal: Number(savingsAgg._sum.currentAmount ?? 0),
    monthExpenses: Math.abs(Number(expensesAgg._sum.amount ?? 0)),
    surplus,
    generatedAt: now.toISOString(),
  });
}
