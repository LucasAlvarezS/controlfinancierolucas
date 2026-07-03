"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const ruleInputSchema = z.object({
  matchType: z.enum(["CONTAINS", "EQUALS", "REGEX"]),
  pattern: z.string().min(1),
  categoryId: z.string().min(1),
  priority: z.number().optional(),
});

export async function createUserRule(input: z.infer<typeof ruleInputSchema>) {
  const userId = await requireUserId();
  const data = ruleInputSchema.parse(input);

  await prisma.categorizationRule.create({
    data: { ...data, userId, source: "USER_DEFINED", priority: data.priority ?? 10 },
  });

  revalidatePath("/categories");
}

export async function deleteRule(ruleId: string) {
  const userId = await requireUserId();
  await prisma.categorizationRule.deleteMany({
    where: { id: ruleId, userId, source: { not: "SYSTEM_DEFAULT" } },
  });
  revalidatePath("/categories");
}
