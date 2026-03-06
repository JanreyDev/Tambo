"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAccentColor } from "@/hooks/use-theme-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize accent color CSS variables on mount
  useAccentColor();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6">{children}</main>
        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-[11px] text-muted-foreground/60 flex items-center justify-between">
          <span>Copyright @ 2015-2026 All Rights Reserved | Developed and Maintained by PrimeX Ventures Inc.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            v5.0.0-alpha
          </span>
        </footer>
      </div>
    </div>
  );
}
