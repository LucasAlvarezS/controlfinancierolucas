"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { CATEGORY_ICON_SLUGS } from "@/lib/category-style";

const categoryInputSchema = z.object({
  name: z.string().min(1),
  icon: z
    .string()
    .refine(
      (slug) => (CATEGORY_ICON_SLUGS as readonly string[]).includes(slug),
      "Ícono desconocido",
    )
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Color inválido")
    .optional(),
  parentId: z.string().optional(),
});

export async function createCategory(input: z.infer<typeof categoryInputSchema>) {
  const userId = await requireUserId();
  const data = categoryInputSchema.parse(input);

  await prisma.category.create({
    data: { ...data, userId, isDefault: false },
  });

  revalidatePath("/categories");
}

export async function updateCategory(
  categoryId: string,
  input: Partial<z.infer<typeof categoryInputSchema>>,
) {
  const userId = await requireUserId();

  await prisma.category.updateMany({
    where: { id: categoryId, userId, isDefault: false },
    data: input,
  });

  revalidatePath("/categories");
}

export async function deleteCategory(categoryId: string) {
  const userId = await requireUserId();
  await prisma.category.deleteMany({ where: { id: categoryId, userId, isDefault: false } });
  revalidatePath("/categories");
}
