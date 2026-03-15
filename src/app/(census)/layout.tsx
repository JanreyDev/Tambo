"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAccentColor } from "@/hooks/use-theme-store";

export default function CensusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAccentColor();

  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
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
      {/* Top bar -- compact, Tanga-Proof: big touch targets, clear labels */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2.5 border-b border-border glass-header">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--accent-primary)" }}>
            <ClipboardList className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground truncate">Census Mode</p>
            <p className="text-[10px] text-muted-foreground truncate">{barangayName}</p>
          </div>
        </div>
        <button
          onClick={() => { if (window.confirm("Sign out of Census Mode?")) logout(); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden min-[360px]:inline">Exit</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto census-mobile-view">
        {children}
      </main>
    </div>
  );
}
