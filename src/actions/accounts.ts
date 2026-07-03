"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { syncFinancialAccount } from "@/lib/integrations/sync-orchestrator";

const manualAccountSchema = z.object({
  alias: z.string().min(1),
  institution: z.enum(["MERCADOPAGO", "BANCO_ESTADO", "BANCO_DE_CHILE", "OTHER"]),
  currency: z.string().default("CLP"),
  isSavings: z.boolean().default(false),
});

export async function createManualAccount(input: z.infer<typeof manualAccountSchema>) {
  const userId = await requireUserId();
  const data = manualAccountSchema.parse(input);

  await prisma.financialAccount.create({
    data: {
      userId,
      provider: "MANUAL",
      institution: data.institution,
      alias: data.alias,
      currency: data.currency,
      isSavings: data.isSavings,
      status: "ACTIVE",
    },
  });

  revalidatePath("/accounts");
}

export async function setAccountSavingsFlag(accountId: string, isSavings: boolean) {
  const userId = await requireUserId();
  await prisma.financialAccount.updateMany({
    where: { id: accountId, userId },
    data: { isSavings },
  });
  revalidatePath("/accounts");
  revalidatePath("/savings");
}

export async function disconnectAccount(accountId: string) {
  const userId = await requireUserId();
  // Verifica pertenencia antes de tocar la credencial (evita IDOR).
  const account = await prisma.financialAccount.findFirstOrThrow({
    where: { id: accountId, userId },
  });
  await prisma.financialAccount.update({
    where: { id: account.id },
    data: { status: "DISCONNECTED" },
  });
  await prisma.integrationCredential.deleteMany({
    where: { financialAccountId: account.id },
  });
  revalidatePath("/accounts");
}

export async function syncAccountNow(accountId: string): Promise<{ error?: string }> {
  const userId = await requireUserId();
  const account = await prisma.financialAccount.findFirstOrThrow({
    where: { id: accountId, userId },
  });

  if (account.status === "DISCONNECTED") {
    return { error: "La cuenta está desconectada. Volvé a conectarla desde “Conectar cuenta”." };
  }

  try {
    await syncFinancialAccount(account.id);
  } catch (error) {
    // El detalle queda en el log del servidor; al cliente va un mensaje genérico.
    console.error(`Error sincronizando cuenta ${account.id}:`, error);
    return {
      error: "No se pudo sincronizar la cuenta. Probá de nuevo o volvé a conectarla.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/");
  return {};
}
