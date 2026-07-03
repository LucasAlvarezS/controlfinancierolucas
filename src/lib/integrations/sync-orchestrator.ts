import { prisma } from "@/lib/prisma";
import { decrypt, encrypt } from "@/lib/encryption";
import { categorizeTransaction, normalizeMerchant } from "@/lib/categorization/engine";
import { getProvider } from "./registry";
import type { CredentialTokens } from "./provider.interface";

function tokensFromCredential(credential: {
  accessTokenEncrypted: string | null;
  refreshTokenEncrypted: string | null;
  linkTokenEncrypted: string | null;
  expiresAt: Date | null;
  scopes: string | null;
}): CredentialTokens {
  return {
    accessToken: credential.accessTokenEncrypted
      ? decrypt(credential.accessTokenEncrypted)
      : undefined,
    refreshToken: credential.refreshTokenEncrypted
      ? decrypt(credential.refreshTokenEncrypted)
      : undefined,
    linkToken: credential.linkTokenEncrypted ? decrypt(credential.linkTokenEncrypted) : undefined,
    expiresAt: credential.expiresAt ?? undefined,
    scopes: credential.scopes ?? undefined,
  };
}

export async function syncFinancialAccount(financialAccountId: string): Promise<number> {
  const account = await prisma.financialAccount.findUniqueOrThrow({
    where: { id: financialAccountId },
    include: { credential: true },
  });

  if (!account.credential || !account.externalId) {
    throw new Error(`La cuenta ${financialAccountId} no tiene credencial/externalId`);
  }

  const syncLog = await prisma.syncLog.create({
    data: { financialAccountId: account.id, provider: account.provider },
  });

  try {
    const provider = getProvider(account.provider);
    let tokens = tokensFromCredential(account.credential);

    const refreshed = await provider.refreshTokensIfNeeded(tokens);
    if (refreshed !== tokens) {
      tokens = refreshed;
      await prisma.integrationCredential.update({
        where: { financialAccountId: account.id },
        data: {
          accessTokenEncrypted: tokens.accessToken ? encrypt(tokens.accessToken) : null,
          refreshTokenEncrypted: tokens.refreshToken ? encrypt(tokens.refreshToken) : null,
          expiresAt: tokens.expiresAt,
          scopes: tokens.scopes,
        },
      });
    }

    const movements = await provider.syncMovements(
      tokens,
      account.externalId,
      account.lastSyncedAt,
    );

    let imported = 0;
    for (const movement of movements) {
      const merchantNormalized = movement.merchantRaw
        ? normalizeMerchant(movement.merchantRaw)
        : normalizeMerchant(movement.description);

      const categoryId = await categorizeTransaction(prisma, {
        userId: account.userId,
        merchantNormalized,
      });

      const result = await prisma.transaction.upsert({
        where: {
          financialAccountId_externalId: {
            financialAccountId: account.id,
            externalId: movement.externalId,
          },
        },
        update: {},
        create: {
          financialAccountId: account.id,
          userId: account.userId,
          externalId: movement.externalId,
          amount: movement.amount,
          currency: movement.currency,
          description: movement.description,
          merchantRaw: movement.merchantRaw,
          merchantNormalized,
          date: movement.date,
          categoryId: categoryId ?? undefined,
          source: account.provider,
          rawPayload: movement.raw as never,
        },
      });

      if (result) imported += 1;
    }

    // El saldo es best-effort: si el proveedor no lo expone o falla la
    // consulta, el sync de movimientos sigue siendo válido.
    let balanceData: { balance: number; balanceUpdatedAt: Date } | undefined;
    try {
      const discovered = await provider.listAccounts(tokens);
      const match = discovered.find((d) => d.externalId === account.externalId);
      if (match?.balance != null) {
        balanceData = { balance: match.balance, balanceUpdatedAt: new Date() };
      }
    } catch {
      // sin saldo esta vuelta
    }

    await prisma.financialAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date(), status: "ACTIVE", ...balanceData },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: { finishedAt: new Date(), status: "SUCCESS", itemsImported: imported },
    });

    return imported;
  } catch (error) {
    await prisma.financialAccount.update({
      where: { id: account.id },
      data: { status: "ERROR" },
    });
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        finishedAt: new Date(),
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

export async function syncAllAccountsForProvider(
  provider: "MERCADOPAGO" | "FINTOC",
): Promise<{ accountId: string; imported?: number; error?: string }[]> {
  const accounts = await prisma.financialAccount.findMany({
    where: { provider, status: { not: "DISCONNECTED" } },
  });

  const results = [];
  for (const account of accounts) {
    try {
      const imported = await syncFinancialAccount(account.id);
      results.push({ accountId: account.id, imported });
    } catch (error) {
      results.push({
        accountId: account.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return results;
}
