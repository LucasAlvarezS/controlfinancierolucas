"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconArrowsExchange,
  IconBuildingBank,
  IconCategory,
  IconPigMoney,
  type TablerIcon,
} from "@tabler/icons-react";

interface NavItem {
  href: string;
  label: string;
  icon: TablerIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Resumen", icon: IconLayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: IconArrowsExchange },
  { href: "/accounts", label: "Cuentas", icon: IconBuildingBank },
  { href: "/savings", label: "Ahorro", icon: IconPigMoney },
  { href: "/categories", label: "Categorías", icon: IconCategory },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Nav horizontal para desktop (md+). */
export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="hidden gap-1 md:flex">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              active
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"
            }`}
          >
            <Icon size={18} stroke={1.5} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar fija para mobile. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] transition-colors ${
                  active ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                <Icon size={22} stroke={active ? 2 : 1.5} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
