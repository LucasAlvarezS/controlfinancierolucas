"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryIcon } from "@/components/categories/category-icon";
import { updateTransactionCategory } from "@/actions/transactions";

interface Option {
  id: string;
  label: string;
  icon?: string | null;
  color?: string | null;
}

export function CategorySelectCell({
  transactionId,
  categoryId,
  categories,
}: {
  transactionId: string;
  categoryId: string | null;
  categories: Option[];
}) {
  const [isPending, startTransition] = useTransition();
  const optionById = new Map(categories.map((c) => [c.id, c]));

  return (
    <Select
      value={categoryId ?? undefined}
      disabled={isPending}
      onValueChange={(value) => {
        if (typeof value !== "string") return;
        startTransition(async () => {
          await updateTransactionCategory({ transactionId, categoryId: value });
        });
      }}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder="Sin categoría">
          {(value) => {
            const option = typeof value === "string" ? optionById.get(value) : undefined;
            if (!option) return undefined;
            return (
              <>
                <CategoryIcon icon={option.icon} color={option.color} size={15} />
                {option.label}
              </>
            );
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <CategoryIcon icon={category.icon} color={category.color} size={15} />
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
