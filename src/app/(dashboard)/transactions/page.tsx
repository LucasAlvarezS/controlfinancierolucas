import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { CategorySelectCell } from "@/components/transactions/category-select-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LabeledValueSelect } from "@/components/ui/labeled-value-select";

function formatCLP(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  MERCADOPAGO: "Mercado Pago",
  FINTOC: "Banco",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountId?: string;
    categoryId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const [accounts, categories] = await Promise.all([
    prisma.financialAccount.findMany({ where: { userId }, orderBy: { alias: "asc" } }),
    prisma.category.findMany({
      where: { OR: [{ userId }, { isDefault: true }] },
      orderBy: { name: "asc" },
    }),
  ]);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      ...(params.accountId ? { financialAccountId: params.accountId } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.from || params.to
        ? {
            date: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
    },
    include: { financialAccount: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  const accountOptions = accounts.map((a) => ({ id: a.id, label: a.alias }));
  const categoryOptions = categories.map((c) => ({
    id: c.id,
    label: c.name,
    icon: c.icon,
    color: c.color,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Transacciones</h1>
        <AddTransactionDialog accounts={accountOptions} categories={categoryOptions} />
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border p-4" method="get">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountId">Banco / cuenta</Label>
          <LabeledValueSelect
            id="accountId"
            name="accountId"
            defaultValue={params.accountId}
            placeholder="Todas"
            options={accountOptions}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="categoryId">Categoría</Label>
          <LabeledValueSelect
            id="categoryId"
            name="categoryId"
            defaultValue={params.categoryId}
            placeholder="Todas"
            options={categoryOptions}
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">Desde</Label>
          <Input id="from" name="from" type="date" defaultValue={params.from} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">Hasta</Label>
          <Input id="to" name="to" type="date" defaultValue={params.to} />
        </div>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {tx.date.toLocaleDateString("es-CL")}
                </TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell className="text-sm">{tx.financialAccount.alias}</TableCell>
                <TableCell className="min-w-40">
                  <CategorySelectCell
                    transactionId={tx.id}
                    categoryId={tx.categoryId}
                    categories={categoryOptions}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{SOURCE_LABEL[tx.source] ?? tx.source}</Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    Number(tx.amount) < 0 ? "text-foreground" : "text-primary"
                  }`}
                >
                  {formatCLP(Number(tx.amount))}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No hay transacciones con estos filtros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
