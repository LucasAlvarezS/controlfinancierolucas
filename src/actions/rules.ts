"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { categorizeWithRules } from "@/lib/categorization/engine";

const ruleInputSchema = z.object({
  matchType: z.enum(["CONTAINS", "EQUALS", "REGEX"]),
  pattern: z.string().min(1),
  categoryId: z.string().min(1),
  priority: z.number().optional(),
});

export async function createUserRule(input: z.infer<typeof ruleInputSchema>) {
  const userId = await requireUserId();
  const data = ruleInputSchema.parse(input);

  const rule = await prisma.categorizationRule.create({
    data: { ...data, userId, source: "USER_DEFINED", priority: data.priority ?? 10 },
  });

  // Aplica la regla nueva al historial sin categoría (no pisa categorías ya
  // asignadas; para eso está la corrección por comercio en transactions.ts).
  const uncategorized = await prisma.transaction.findMany({
    where: { userId, categoryId: null, merchantNormalized: { not: null } },
    select: { id: true, merchantNormalized: true },
  });
  const matchedIds = uncategorized
    .filter((tx) => categorizeWithRules([rule], tx.merchantNormalized!) !== null)
    .map((tx) => tx.id);

  if (matchedIds.length) {
    await prisma.transaction.updateMany({
      where: { id: { in: matchedIds } },
      data: { categoryId: rule.categoryId },
    });
  }

  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export async function deleteRule(ruleId: string) {
  const userId = await requireUserId();
  await prisma.categorizationRule.deleteMany({
    where: { id: ruleId, userId, source: { not: "SYSTEM_DEFAULT" } },
  });
  revalidatePath("/categories");
}
