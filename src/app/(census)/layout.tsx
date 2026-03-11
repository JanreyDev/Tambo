"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Users, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAccentColor } from "@/hooks/use-theme-store";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { APP_VERSION_LABEL } from "@/lib/version";

export default function CensusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAccentColor();

  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { isMobile, isLoading: mobileLoading } = useIsMobile();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Tablet+ users should use the full dashboard
  useEffect(() => {
    if (!mobileLoading && !isMobile && isAuthenticated) {
      router.replace("/dashboard/residents");
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

  const barangayName = user?.barangay?.name || "Barangay";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-border glass-header">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-primary)" }}>
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">Census Mode</p>
            <p className="text-[10px] text-muted-foreground truncate">{barangayName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground hidden min-[400px]:block">{APP_VERSION_LABEL}</span>
          <button
            onClick={() => logout()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto census-mobile-view">
        {children}
      </main>

      {/* Bottom status bar */}
      <footer className="border-t border-border px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/60">
          <Users className="h-3 w-3" />
          <span>House-to-House Registration</span>
          <span className="mx-1">|</span>
          <span>kapitan.ph</span>
        </div>
      </footer>
    </div>
  );
}
