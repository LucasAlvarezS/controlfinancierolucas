"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_CATEGORY_COLOR, DEFAULT_CATEGORY_ICON } from "@/lib/category-style";
import { CategoryStylePicker } from "@/components/categories/category-style-picker";
import { createCategory } from "@/actions/categories";

export function AddCategoryForm() {
  const [isPending, startTransition] = useTransition();
  const [icon, setIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [color, setColor] = useState(DEFAULT_CATEGORY_COLOR);

  return (
    <form
      className="flex flex-col gap-3"
      action={(formData) => {
        startTransition(async () => {
          await createCategory({
            name: String(formData.get("name")),
            icon,
            color,
          });
        });
      }}
    >
      <div className="flex flex-wrap items-end gap-2">
        <Input name="name" placeholder="Nueva categoría" required className="w-56" />
        <Button type="submit" disabled={isPending} size="sm">
          Agregar
        </Button>
      </div>
      <CategoryStylePicker
        icon={icon}
        color={color}
        onIconChange={setIcon}
        onColorChange={setColor}
      />
    </form>
  );
}
