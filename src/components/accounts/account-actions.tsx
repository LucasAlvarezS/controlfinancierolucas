"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconPigMoney, IconPlugOff } from "@tabler/icons-react";
import {
  disconnectAccount,
  setAccountSavingsFlag,
  syncAccountNow,
} from "@/actions/accounts";

export function AccountActions({
  accountId,
  isSavings,
  canSync,
}: {
  accountId: string;
  isSavings: boolean;
  canSync: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [syncError, setSyncError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
      {canSync && (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          className="gap-1.5"
          onClick={() =>
            startTransition(async () => {
              const result = await syncAccountNow(accountId);
              setSyncError(result.error ?? null);
            })
          }
        >
          <IconRefresh size={14} stroke={1.5} />
          Sincronizar ahora
        </Button>
      )}
      <Button
        size="sm"
        variant={isSavings ? "default" : "outline"}
        disabled={isPending}
        className="gap-1.5"
        onClick={() => startTransition(() => setAccountSavingsFlag(accountId, !isSavings))}
      >
        <IconPigMoney size={14} stroke={1.5} />
        {isSavings ? "Es cuenta de ahorro" : "Marcar como ahorro"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="gap-1.5 text-muted-foreground"
        onClick={() => startTransition(() => disconnectAccount(accountId))}
      >
        <IconPlugOff size={14} stroke={1.5} />
        Desconectar
      </Button>
      </div>
      {syncError && <p className="text-xs text-destructive">{syncError}</p>}
    </div>
  );
}
