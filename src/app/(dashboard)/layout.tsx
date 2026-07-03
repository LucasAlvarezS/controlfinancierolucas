import { TopNav, BottomNav } from "@/components/dashboard/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconWallet } from "@tabler/icons-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-gradient-hero text-white">
              <IconWallet size={18} stroke={1.5} />
            </span>
            <span className="text-sm font-semibold">Control Financiero</span>
          </div>
          <div className="flex items-center gap-1">
            <TopNav />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
