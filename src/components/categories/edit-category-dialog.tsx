"use client";

import { useState, useTransition } from "react";
import { IconPencil } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from "@/lib/category-style";
import { CategoryStylePicker } from "@/components/categories/category-style-picker";
import { updateCategory } from "@/actions/categories";

export function EditCategoryDialog({
  categoryId,
  name,
  initialIcon,
  initialColor,
}: {
  categoryId: string;
  name: string;
  initialIcon: string | null;
  initialColor: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [icon, setIcon] = useState(initialIcon ?? DEFAULT_CATEGORY_ICON);
  const [color, setColor] = useState(initialColor ?? DEFAULT_CATEGORY_COLOR);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" variant="ghost" />}>
        <IconPencil size={14} stroke={1.5} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar “{name}”</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <CategoryStylePicker
            icon={icon}
            color={color}
            onIconChange={setIcon}
            onColorChange={setColor}
          />
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await updateCategory(categoryId, { icon, color });
                setOpen(false);
              })
            }
          >
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
