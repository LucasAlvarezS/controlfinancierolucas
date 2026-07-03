import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { AccountActions } from "@/components/accounts/account-actions";

const PROVIDER_LABEL: Record<string, string> = {
  MANUAL: "Manual",
  MERCADOPAGO: "Mercado Pago",
  FINTOC: "Sincronizado vía Fintoc",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  ACTIVE: "default",
  ERROR: "destructive",
  DISCONNECTED: "secondary",
};

export default async function AccountsPage() {
  const userId = await requireUserId();
  const accounts = await prisma.financialAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cuentas</h1>
        <Button
          nativeButton={false}
          render={<Link href="/accounts/new" />}
          className="gap-2"
        >
          <IconPlus size={16} stroke={1.5} />
          Conectar cuenta
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{account.alias}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {PROVIDER_LABEL[account.provider] ?? account.provider}
                  {account.isSavings ? " · Cuenta de ahorro" : ""}
                </p>
              </div>
              <Badge variant={STATUS_VARIANT[account.status]}>{account.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Última sincronización:{" "}
                {account.lastSyncedAt
                  ? account.lastSyncedAt.toLocaleString("es-CL")
                  : "nunca"}
              </p>
              <AccountActions
                accountId={account.id}
                isSavings={account.isSavings}
                canSync={account.provider !== "MANUAL" && account.status !== "DISCONNECTED"}
              />
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no conectaste ninguna cuenta.
          </p>
        )}
      </div>
    </div>
  );
}
