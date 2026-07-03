"use client";

import { useTheme } from "next-themes";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark") ? "light" : "dark",
        )
      }
    >
      <IconMoon size={18} stroke={1.5} className="block dark:hidden" />
      <IconSun size={18} stroke={1.5} className="hidden dark:block" />
    </Button>
  );
}
