"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { categorizeTransaction, learnFromCorrection, normalizeMerchant } from "@/lib/categorization/engine";

const createManualTransactionSchema = z.object({
  financialAccountId: z.string().min(1),
  amount: z.coerce.number().refine((n) => n !== 0, "El monto no puede ser 0"),
  description: z.string().min(1),
  date: z.coerce.date(),
  categoryId: z.string().optional(),
});

export async function createManualTransaction(input: {
  financialAccountId: string;
  amount: number;
  description: string;
  date: string | Date;
  categoryId?: string;
}) {
  const userId = await requireUserId();
  const data = createManualTransactionSchema.parse(input);

  const account = await prisma.financialAccount.findFirstOrThrow({
    where: { id: data.financialAccountId, userId },
  });

  const merchantNormalized = normalizeMerchant(data.description);
  const categoryId =
    data.categoryId ??
    (await categorizeTransaction(prisma, { userId, merchantNormalized })) ??
    undefined;

  await prisma.transaction.create({
    data: {
      financialAccountId: account.id,
      userId,
      amount: data.amount,
      currency: account.currency,
      description: data.description,
      merchantRaw: data.description,
      merchantNormalized,
      date: data.date,
      categoryId,
      source: "MANUAL",
    },
  });

  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function updateTransactionCategory(input: {
  transactionId: string;
  categoryId: string;
}) {
  const userId = await requireUserId();

  const transaction = await prisma.transaction.findFirstOrThrow({
    where: { id: input.transactionId, userId },
  });

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { categoryId: input.categoryId },
  });

  if (transaction.merchantNormalized) {
    // Aprende la corrección (futuros imports) y la aplica a todo el
    // historial del mismo comercio: mismo comercio, misma categoría.
    await learnFromCorrection(prisma, {
      userId,
      merchantNormalized: transaction.merchantNormalized,
      categoryId: input.categoryId,
    });

    await prisma.transaction.updateMany({
      where: { userId, merchantNormalized: transaction.merchantNormalized },
      data: { categoryId: input.categoryId },
    });
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/categories");
}

export async function deleteTransaction(transactionId: string) {
  const userId = await requireUserId();
  await prisma.transaction.deleteMany({ where: { id: transactionId, userId } });
  revalidatePath("/transactions");
  revalidatePath("/");
}
