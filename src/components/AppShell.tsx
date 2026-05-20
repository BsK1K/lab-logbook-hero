import { Link } from "@tanstack/react-router";
import { Monitor } from "lucide-react";
import { DesktopNav, MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-20 md:pb-0">
      <header
        className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          >
            <span className="rounded-md bg-primary/10 p-1.5 text-primary">
              <Monitor className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-base sm:text-lg">Sala de Informática</span>
          </Link>
          <DesktopNav />
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
