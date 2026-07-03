"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { contributeToGoal } from "@/lib/savings/engine";

const createGoalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.coerce.number().positive(),
  targetDate: z.coerce.date().optional(),
});

export async function createSavingsGoal(input: z.input<typeof createGoalSchema>) {
  const userId = await requireUserId();
  const data = createGoalSchema.parse(input);

  await prisma.savingsGoal.create({
    data: { userId, ...data },
  });

  revalidatePath("/savings");
}

export async function contributeManualToGoal(goalId: string, amount: number) {
  const userId = await requireUserId();
  await prisma.savingsGoal.findFirstOrThrow({ where: { id: goalId, userId } });

  await contributeToGoal(prisma, { goalId, amount, source: "MANUAL" });
  revalidatePath("/savings");
}

export async function assignSurplusToGoal(goalId: string, amount: number) {
  const userId = await requireUserId();
  await prisma.savingsGoal.findFirstOrThrow({ where: { id: goalId, userId } });

  await contributeToGoal(prisma, { goalId, amount, source: "AUTO_SURPLUS_SUGGESTION" });
  revalidatePath("/savings");
}

export async function deleteSavingsGoal(goalId: string) {
  const userId = await requireUserId();
  await prisma.savingsGoal.deleteMany({ where: { id: goalId, userId } });
  revalidatePath("/savings");
}
