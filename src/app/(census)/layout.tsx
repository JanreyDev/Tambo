"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, ClipboardList, Wifi, WifiOff, CloudUpload } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAccentColor } from "@/hooks/use-theme-store";
import { getPendingCount, syncPendingSubmissions } from "@/lib/census-offline";
import { api } from "@/lib/api";

// SSR-safe online status hook
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
function getOnlineSnapshot() { return navigator.onLine; }
function getOnlineServerSnapshot() { return true; }

export default function CensusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAccentColor();

  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  // Poll pending count
  useEffect(() => {
    const check = () => getPendingCount().then(setPendingCount).catch(() => {});
    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || pendingCount === 0 || syncing) return;
    const timer = setTimeout(() => {
      setSyncing(true);
      syncPendingSubmissions(
        (payload) => api.residents.create(payload as Record<string, string>),
      ).then(({ synced }) => {
        if (synced > 0) setPendingCount((c) => Math.max(0, c - synced));
      }).catch(() => {}).finally(() => setSyncing(false));
    }, 2000); // 2s delay to let connection stabilize
    return () => clearTimeout(timer);
  }, [isOnline, pendingCount, syncing]);

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
      {/* Connection status bar */}
      {!isOnline && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-amber-500 text-white text-xs font-bold">
          <WifiOff className="h-3.5 w-3.5" />
          <span>OFFLINE — Data will be saved and synced when signal returns</span>
        </div>
      )}
      {isOnline && pendingCount > 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold">
          {syncing ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing {pendingCount} pending record{pendingCount > 1 ? "s" : ""}...</>
          ) : (
            <><CloudUpload className="h-3.5 w-3.5" /> {pendingCount} record{pendingCount > 1 ? "s" : ""} waiting to sync</>
          )}
        </div>
      )}

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
        <div className="flex items-center gap-1.5">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${isOnline ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? "Online" : "Offline"}
          </div>
          <button
            onClick={() => { if (window.confirm("Sign out of Census Mode?")) logout(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px]"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden min-[360px]:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto census-mobile-view">
        {children}
      </main>
    </div>
  );
}
