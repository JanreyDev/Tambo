"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { format } from "date-fns";
import { LogOut, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionPulse } from "./connection-pulse";
import { useFounderAuth } from "@/contexts/founder-auth-context";

interface HeaderBarProps {
  systemStatus: "connected" | "error" | "warning";
  onToggleMabini: () => void;
  isMabiniOpen: boolean;
}

// SSR-safe mounted detection using useSyncExternalStore
const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function HeaderBar({
  systemStatus,
  onToggleMabini,
  isMabiniOpen,
}: HeaderBarProps) {
  const mounted = useMounted();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const { logout } = useFounderAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-card-border bg-background/95 px-6 backdrop-blur-sm">
      {/* Left: Logo + Title */}
      <div className="flex items-center gap-3">
        <Zap className="h-5 w-5 text-accent" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">PRIMEX</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
            Command Center
          </span>
        </div>
      </div>

      {/* Center: Time + Date */}
      <div className="hidden text-center md:block">
        {mounted && (
          <>
            <span className="font-metrics text-sm font-bold text-foreground">
              {format(currentTime, "HH:mm:ss")}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {format(currentTime, "EEEE, MMMM d, yyyy")} PHT
            </span>
          </>
        )}
      </div>

      {/* Right: Status + Mabini + Sign Out */}
      <div className="flex items-center gap-4">
        <ConnectionPulse
          status={systemStatus}
          label={systemStatus === "connected" ? "All Systems" : "Alert"}
          size="sm"
        />

        <button
          onClick={onToggleMabini}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            isMabiniOpen
              ? "bg-accent text-white"
              : "bg-surface-elevated text-muted-foreground hover:bg-accent/20 hover:text-accent",
          )}
          aria-label="Toggle Mabini AI assistant"
          aria-expanded={isMabiniOpen}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask Mabini
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-red-950/50 hover:text-red-400"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </header>
  );
}
