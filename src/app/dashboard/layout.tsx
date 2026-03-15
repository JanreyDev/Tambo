"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAccentColor } from "@/hooks/use-theme-store";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { APP_VERSION_LABEL } from "@/lib/version";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAccentColor();

  const { isLoading, isAuthenticated, user } = useAuth();
  const { isMobile, isLoading: mobileLoading } = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Phone users -> census mode (residents-only mobile interface)
  useEffect(() => {
    if (!mobileLoading && isMobile && isAuthenticated) {
      router.replace("/census");
    }
  }, [mobileLoading, isMobile, isAuthenticated, router]);

  if (isLoading || mobileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-x-hidden">
      {/* Ambient background orbs for glass depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[10%] right-[15%] w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.04]" style={{ background: "var(--accent-primary)" }} />
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.03]" style={{ background: "var(--accent-ring)" }} />
      </div>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header />
        {user?.barangay && !user.barangay.setup_complete && (
          <div className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-600 flex-1">
              Complete your barangay setup before using the system.
            </p>
            <Link href="/dashboard/settings"
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">
              Go to Settings
            </Link>
          </div>
        )}
        <main className="flex-1 p-6">{children}</main>
        {/* Footer */}
        <footer className="border-t border-border px-6 py-3 text-[11px] text-muted-foreground/60 flex items-center justify-between">
          <span>Copyright @ 2015-2026 All Rights Reserved | Developed and Maintained by PrimeX Ventures Inc.</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {APP_VERSION_LABEL}
          </span>
        </footer>
      </div>
    </div>
  );
}
