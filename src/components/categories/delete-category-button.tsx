"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { IconTrash } from "@tabler/icons-react";
import { deleteCategory } from "@/actions/categories";

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="icon"
      variant="ghost"
      disabled={isPending}
      onClick={() => startTransition(() => deleteCategory(categoryId))}
    >
      <IconTrash size={14} stroke={1.5} />
    </Button>
  );
}
