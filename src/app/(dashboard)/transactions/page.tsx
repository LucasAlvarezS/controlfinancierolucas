import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { formatCLP } from "@/lib/format";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { CategorySelectCell } from "@/components/transactions/category-select-cell";
import { CategoryIcon } from "@/components/categories/category-icon";
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
import { IconChevronDown, IconFilter } from "@tabler/icons-react";

const SOURCE_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  MERCADOPAGO: "Mercado Pago",
  FINTOC: "Banco",
};

interface Filters {
  accountId?: string;
  categoryId?: string;
  from?: string;
  to?: string;
}

interface Option {
  id: string;
  label: string;
}

/** Campos del formulario de filtros; idPrefix evita ids duplicados entre la
 * versión móvil y la de escritorio. */
function FilterFields({
  idPrefix,
  params,
  accountOptions,
  categoryOptions,
}: {
  idPrefix: string;
  params: Filters;
  accountOptions: Option[];
  categoryOptions: Option[];
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-accountId`}>Banco / cuenta</Label>
        <LabeledValueSelect
          id={`${idPrefix}-accountId`}
          name="accountId"
          defaultValue={params.accountId}
          placeholder="Todas"
          options={accountOptions}
          className="w-44"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-categoryId`}>Categoría</Label>
        <LabeledValueSelect
          id={`${idPrefix}-categoryId`}
          name="categoryId"
          defaultValue={params.categoryId}
          placeholder="Todas"
          options={categoryOptions}
          className="w-44"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-from`}>Desde</Label>
        <Input id={`${idPrefix}-from`} name="from" type="date" defaultValue={params.from} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-to`}>Hasta</Label>
        <Input id={`${idPrefix}-to`} name="to" type="date" defaultValue={params.to} />
      </div>
      <Button type="submit" variant="secondary">
        Filtrar
      </Button>
    </>
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Filters>;
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
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const hasActiveFilters = Boolean(
    params.accountId || params.categoryId || params.from || params.to,
  );

  // Agrupación por día para la vista móvil (transactions ya viene ordenado desc).
  const dayGroups: { key: string; label: string; items: typeof transactions }[] = [];
  for (const tx of transactions) {
    const key = tx.date.toISOString().slice(0, 10);
    let group = dayGroups[dayGroups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: tx.date.toLocaleDateString("es-CL", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        items: [],
      };
      dayGroups.push(group);
    }
    group.items.push(tx);
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Movimientos</h1>
        <AddTransactionDialog accounts={accountOptions} categories={categoryOptions} />
      </div>

      {/* Filtros: colapsables en móvil, siempre visibles en desktop */}
      <details className="group rounded-lg border md:hidden" open={hasActiveFilters}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <IconFilter size={16} stroke={1.5} />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-[10px]">
                activos
              </Badge>
            )}
          </span>
          <IconChevronDown
            size={16}
            stroke={1.5}
            className="transition-transform group-open:rotate-180"
          />
        </summary>
        <form className="flex flex-wrap items-end gap-3 border-t px-4 py-3" method="get">
          <FilterFields
            idPrefix="m"
            params={params}
            accountOptions={accountOptions}
            categoryOptions={categoryOptions}
          />
        </form>
      </details>
      <form
        className="hidden flex-wrap items-end gap-3 rounded-lg border p-4 md:flex"
        method="get"
      >
        <FilterFields
          idPrefix="d"
          params={params}
          accountOptions={accountOptions}
          categoryOptions={categoryOptions}
        />
      </form>

      {/* Vista móvil: lista agrupada por día */}
      <div className="flex flex-col gap-4 md:hidden">
        {dayGroups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2">
            <h2 className="text-xs font-medium text-muted-foreground capitalize">
              {group.label}
            </h2>
            <div className="flex flex-col gap-2">
              {group.items.map((tx) => {
                const category = tx.categoryId ? categoryById.get(tx.categoryId) : undefined;
                return (
                  <div key={tx.id} className="flex flex-col gap-2 rounded-xl border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
                          <CategoryIcon
                            icon={category?.icon}
                            color={category?.color}
                            size={18}
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{tx.description}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {tx.financialAccount.alias} ·{" "}
                            {SOURCE_LABEL[tx.source] ?? tx.source}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          Number(tx.amount) < 0 ? "text-foreground" : "text-primary"
                        }`}
                      >
                        {formatCLP(Number(tx.amount))}
                      </p>
                    </div>
                    <CategorySelectCell
                      transactionId={tx.id}
                      categoryId={tx.categoryId}
                      categories={categoryOptions}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}
        {transactions.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay transacciones con estos filtros.
          </p>
        )}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
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
