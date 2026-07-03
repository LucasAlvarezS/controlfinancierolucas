"use client";

import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, CATEGORY_ICON_SLUGS } from "@/lib/category-style";
import { CategoryIcon } from "@/components/categories/category-icon";

export function CategoryStylePicker({
  icon,
  color,
  onIconChange,
  onColorChange,
}: {
  icon: string;
  color: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Color">
        {CATEGORY_COLORS.map((swatch) => (
          <button
            key={swatch}
            type="button"
            role="radio"
            aria-checked={color === swatch}
            aria-label={`Color ${swatch}`}
            onClick={() => onColorChange(swatch)}
            className={cn(
              "size-6 rounded-full border-2 transition-transform",
              color === swatch
                ? "scale-110 border-foreground"
                : "border-transparent hover:scale-105",
            )}
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Ícono">
        {CATEGORY_ICON_SLUGS.map((slug) => (
          <button
            key={slug}
            type="button"
            role="radio"
            aria-checked={icon === slug}
            aria-label={`Ícono ${slug}`}
            onClick={() => onIconChange(slug)}
            className={cn(
              "flex size-8 items-center justify-center rounded-md border transition-colors",
              icon === slug
                ? "border-ring bg-accent"
                : "border-transparent text-muted-foreground hover:bg-accent/60",
            )}
          >
            <CategoryIcon icon={slug} color={icon === slug ? color : undefined} size={18} />
          </button>
        ))}
      </div>
    </div>
  );
}
